import { createHash } from "node:crypto";
import http, { type IncomingHttpHeaders } from "node:http";
import https from "node:https";
import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

const REMOTE_ASSET_DIR = "remote-assets";
const IMPORTED_ASSET_DIR = "imported-assets";
const CONTENT_ASSET_DIR = "content-assets";
const MAX_REMOTE_REDIRECTS = 5;
const MAX_REMOTE_ASSET_BYTES = 20 * 1024 * 1024;
const MAX_REMOTE_DOWNLOAD_ATTEMPTS = 3;
const INSECURE_TLS_HOSTS = new Set(["www.woodfishhhh.xyz", "woodfishhhh.xyz"]);
const LOCAL_MIRROR_HOSTS = new Set(["www.woodfishhhh.xyz", "woodfishhhh.xyz"]);
const LOCAL_MIRROR_ENV = "VUECUBEBLOG_LOCAL_ASSET_MIRROR_DIRS";
const DEFAULT_LOCAL_MIRROR_DIRS = [
  path.resolve(process.cwd(), "../Blog/public/images"),
  path.resolve(process.cwd(), "../Blog/images"),
  path.resolve(process.cwd(), "../Blog/source/images"),
  path.resolve(process.cwd(), "../3Dblog/public/images"),
  path.resolve(process.cwd(), "../3Dblog/content/source/blog/source/images"),
];
const insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false });
let localMirrorAssetIndexPromise: Promise<Map<string, string[]>> | null = null;
let localMirrorAssetIndexKey = "";

type RemoteAssetDownload = {
  bytes: Buffer;
  contentType: string;
  finalUrl: string;
};

export interface LegacySlugSource {
  slug: string;
  title: string;
  date: string;
  rawMarkdown: string;
}

export interface CanonicalSlugOptions {
  title: string;
  date: string;
  rawMarkdown: string;
  sourceRelativePath: string;
  legacyIndex: ReadonlyMap<string, string>;
}

export interface CanonicalSlugResult {
  canonicalSlug: string;
  aliases: string[];
}

export interface RewriteMarkdownAssetOptions {
  sourceFilePath: string;
  canonicalSlug: string;
  publicDir: string;
  siteBasePath?: string;
}

export interface RewriteMarkdownAssetResult {
  markdown: string;
  warnings: string[];
}

export interface ResolveAssetReferenceOptions {
  sourceFilePath: string;
  publicDir: string;
  siteBasePath?: string;
  canonicalSlug?: string;
}

export function buildLegacySlugIndex(entries: readonly LegacySlugSource[]): Map<string, string> {
  const index = new Map<string, string>();

  for (const entry of entries) {
    index.set(buildContentFingerprint(entry.title, entry.date, entry.rawMarkdown), entry.slug);
  }

  return index;
}

export function resolveCanonicalSlug(options: CanonicalSlugOptions): CanonicalSlugResult {
  const fingerprint = buildContentFingerprint(options.title, options.date, options.rawMarkdown);
  const legacySlug = options.legacyIndex.get(fingerprint);
  const sourceStem = path.basename(options.sourceRelativePath, path.extname(options.sourceRelativePath));

  if (legacySlug) {
    return {
      canonicalSlug: legacySlug,
      aliases: uniqueStrings([sourceStem]),
    };
  }

  const asciiStem = slugifyAsciiStem(sourceStem) || slugifyAsciiStem(options.title) || "post";
  const shortHash = sha1(options.sourceRelativePath).slice(0, 8);

  return {
    canonicalSlug: `${asciiStem}-${shortHash}`,
    aliases: uniqueStrings([sourceStem]),
  };
}

export function normalizeMarkdownBody(rawMarkdown: string, title: string): string {
  const parsed = matter(rawMarkdown);
  const body = parsed.content.trimStart();
  const match = body.match(/^#\s+(.+?)\r?\n+/);

  if (!match) {
    return body.trim();
  }

  if (match[1].trim() !== title.trim()) {
    return body.trim();
  }

  return body.slice(match[0].length).trim();
}

export async function rewriteMarkdownAssetPaths(
  markdown: string,
  options: RewriteMarkdownAssetOptions,
): Promise<RewriteMarkdownAssetResult> {
  const warnings: string[] = [];
  let nextMarkdown = markdown;

  const markdownImageMatches = Array.from(markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g));

  for (const match of markdownImageMatches) {
    const rawReference = match[1];
    const matchedExpression = match[0];
    const originalReference = rawReference.trim();

    if (shouldSkipAssetReference(originalReference)) {
      continue;
    }

    const rewrittenUrl = await resolveAssetReference(originalReference, options);

    if (!rewrittenUrl) {
      if (shouldRemoveUnresolvedLocalAsset(originalReference)) {
        warnings.push(`Removed unresolved local image: ${originalReference}`);
        nextMarkdown = removeMatchedImageExpression(nextMarkdown, matchedExpression);
        continue;
      }

      warnings.push(`Failed to localize remote asset: ${originalReference}`);
      continue;
    }

    nextMarkdown = replaceMarkdownImageReference(
      nextMarkdown,
      matchedExpression,
      rawReference,
      originalReference,
      rewrittenUrl,
    );
  }

  const htmlImageMatches = Array.from(
    nextMarkdown.matchAll(/<img\b[^>]*?\bsrc=(["'])([^"']+)\1[^>]*>/gi),
  );

  for (const match of htmlImageMatches) {
    const matchedExpression = match[0];
    const originalReference = match[2]?.trim() ?? "";

    if (shouldSkipAssetReference(originalReference)) {
      continue;
    }

    const rewrittenUrl = await resolveAssetReference(originalReference, options);
    if (!rewrittenUrl) {
      if (shouldRemoveUnresolvedLocalAsset(originalReference)) {
        warnings.push(`Removed unresolved local image: ${originalReference}`);
        nextMarkdown = removeMatchedImageExpression(nextMarkdown, matchedExpression);
        continue;
      }

      warnings.push(`Failed to localize remote asset: ${originalReference}`);
      continue;
    }

    nextMarkdown = replaceHtmlImageReference(nextMarkdown, matchedExpression, originalReference, rewrittenUrl);
  }

  return {
    markdown: nextMarkdown,
    warnings,
  };
}

export async function resolveAssetReference(
  reference: string,
  options: ResolveAssetReferenceOptions,
): Promise<string | null> {
  const originalReference = reference.trim();

  if (!originalReference || shouldSkipAssetReference(originalReference)) {
    return null;
  }

  const sourceDir = path.dirname(options.sourceFilePath);

  if (isRemoteAssetReference(originalReference)) {
    return localizeRemoteAsset(originalReference, options.publicDir, options.siteBasePath);
  }

  if (originalReference.startsWith("/")) {
    const rootedAbsolutePath = path.resolve(sourceDir, originalReference);
    if (await fileExists(rootedAbsolutePath)) {
      return copyAbsoluteAsset(rootedAbsolutePath, options.publicDir, options.siteBasePath);
    }

    return toSitePublicUrl(originalReference, options.siteBasePath);
  }

  const resolvedPath = path.isAbsolute(originalReference)
    ? originalReference
    : path.resolve(sourceDir, originalReference);

  if (!(await fileExists(resolvedPath))) {
    return null;
  }

  if (path.isAbsolute(originalReference)) {
    return copyAbsoluteAsset(resolvedPath, options.publicDir, options.siteBasePath);
  }

  if (!options.canonicalSlug) {
    return null;
  }

  return copyRelativeAsset(
    resolvedPath,
    originalReference,
    options.publicDir,
    options.canonicalSlug,
    options.siteBasePath,
  );
}

function replaceMarkdownImageReference(
  markdown: string,
  matchedExpression: string,
  rawReference: string,
  originalReference: string,
  rewrittenReference: string,
) {
  const escapedRawReference = escapeRegExp(rawReference);
  const rewrittenExpression = matchedExpression.replace(
    new RegExp(`\\(${escapedRawReference}\\)`),
    `(${rewrittenReference})`,
  );

  if (rewrittenExpression !== matchedExpression) {
    return markdown.replace(matchedExpression, rewrittenExpression);
  }

  return markdown.replace(`(${originalReference})`, `(${rewrittenReference})`);
}

function removeMatchedImageExpression(markdown: string, matchedExpression: string) {
  return markdown.replace(matchedExpression, "");
}

function replaceHtmlImageReference(markdown: string, matchedExpression: string, originalReference: string, rewrittenReference: string) {
  const escapedReference = escapeRegExp(originalReference);
  const rewrittenExpression = matchedExpression.replace(new RegExp(escapedReference, "g"), rewrittenReference);
  return markdown.replace(matchedExpression, rewrittenExpression);
}

function buildContentFingerprint(title: string, date: string, rawMarkdown: string) {
  return sha1(`${title}\n${date}\n${normalizeMarkdownBody(rawMarkdown, title)}`);
}

function slugifyAsciiStem(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function sha1(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldSkipAssetReference(reference: string) {
  return (
    reference.startsWith("//") ||
    reference.startsWith("data:") ||
    reference.startsWith("mailto:") ||
    reference.startsWith("tel:") ||
    reference.startsWith("#")
  );
}

async function fileExists(filePath: string) {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
}

async function copyRelativeAsset(
  resolvedPath: string,
  originalReference: string,
  publicDir: string,
  canonicalSlug: string,
  siteBasePath?: string,
) {
  const safeRelativePath = toSafeRelativeAssetPath(originalReference);
  const targetPath = path.join(publicDir, CONTENT_ASSET_DIR, canonicalSlug, ...safeRelativePath.split("/"));

  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(resolvedPath, targetPath);

  return toPublicAssetUrl(siteBasePath, CONTENT_ASSET_DIR, canonicalSlug, safeRelativePath);
}

async function copyAbsoluteAsset(resolvedPath: string, publicDir: string, siteBasePath?: string) {
  const extension = path.extname(resolvedPath) || ".bin";
  const assetFileName = `${sha1(resolvedPath)}${extension}`;
  const targetPath = path.join(publicDir, IMPORTED_ASSET_DIR, assetFileName);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(resolvedPath, targetPath);

  return toPublicAssetUrl(siteBasePath, IMPORTED_ASSET_DIR, assetFileName);
}

function toSafeRelativeAssetPath(originalReference: string) {
  const normalized = originalReference
    .replaceAll("\\", "/")
    .split(/[?#]/)[0] ?? "";
  const segments = normalized.split("/");
  const safeSegments: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      safeSegments.push("__up__");
      continue;
    }

    safeSegments.push(segment);
  }

  return safeSegments.join("/");
}

function isRemoteAssetReference(reference: string) {
  try {
    const url = new URL(reference);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function shouldRemoveUnresolvedLocalAsset(reference: string) {
  return !isRemoteAssetReference(reference);
}

export async function localizeRemoteAsset(
  reference: string,
  publicDir: string,
  siteBasePath?: string,
): Promise<string | null> {
  if (!isRemoteAssetReference(reference)) {
    return null;
  }

  const parsed = new URL(reference);
  const knownExtension = getPathExtensionFromUrl(reference);
  const baseName = sha1(reference);

  const existingAssetFileName = await findExistingLocalizedRemoteAssetFileName(publicDir, baseName, knownExtension);
  if (existingAssetFileName) {
    return toPublicAssetUrl(siteBasePath, REMOTE_ASSET_DIR, existingAssetFileName);
  }

  if (LOCAL_MIRROR_HOSTS.has(parsed.hostname)) {
    const mirroredAsset = await localizeAssetFromLocalMirror(reference, publicDir, knownExtension, siteBasePath);
    if (mirroredAsset) {
      return mirroredAsset;
    }
  }

  const downloaded = await downloadRemoteAsset(reference);
  if (!downloaded) {
    const mirroredAsset = await localizeAssetFromLocalMirror(reference, publicDir, knownExtension, siteBasePath);
    if (mirroredAsset) {
      return mirroredAsset;
    }
    return null;
  }

  const finalExtension =
    knownExtension || getPathExtensionFromUrl(downloaded.finalUrl) || extensionFromContentType(downloaded.contentType);
  const assetFileName = `${baseName}${finalExtension || ".bin"}`;
  const targetPath = path.join(publicDir, REMOTE_ASSET_DIR, assetFileName);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, downloaded.bytes);

  return toPublicAssetUrl(siteBasePath, REMOTE_ASSET_DIR, assetFileName);
}

async function localizeAssetFromLocalMirror(
  reference: string,
  publicDir: string,
  knownExtension: string,
  siteBasePath?: string,
): Promise<string | null> {
  const sourcePath = await resolveLocalMirrorSource(reference);
  if (!sourcePath) {
    return null;
  }

  const extension = knownExtension || path.extname(sourcePath).toLowerCase();
  const safeExtension = /^[.][a-z0-9]{1,8}$/i.test(extension) ? extension : ".bin";
  const targetFileName = `${sha1(reference)}${safeExtension}`;
  const targetPath = path.join(publicDir, REMOTE_ASSET_DIR, targetFileName);

  if (await fileExists(targetPath)) {
    return toPublicAssetUrl(siteBasePath, REMOTE_ASSET_DIR, targetFileName);
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);

  return toPublicAssetUrl(siteBasePath, REMOTE_ASSET_DIR, targetFileName);
}

async function findExistingLocalizedRemoteAssetFileName(
  publicDir: string,
  baseName: string,
  knownExtension: string,
) {
  const remoteAssetsRoot = path.join(publicDir, REMOTE_ASSET_DIR);

  if (knownExtension) {
    const exactFileName = `${baseName}${knownExtension}`;
    const exactPath = path.join(remoteAssetsRoot, exactFileName);
    if (await fileExists(exactPath)) {
      return exactFileName;
    }
  }

  let entries: { name: string; isFile: () => boolean }[];
  try {
    entries = await readdir(remoteAssetsRoot, { withFileTypes: true });
  } catch {
    return null;
  }

  const prefix = `${baseName}.`;
  const matchedEntry = entries.find((entry) => entry.isFile() && entry.name.startsWith(prefix));
  return matchedEntry?.name ?? null;
}

export function toSitePublicUrl(reference: string, siteBasePath?: string) {
  if (!reference) {
    return "";
  }

  if (
    shouldSkipAssetReference(reference) ||
    reference.startsWith("//") ||
    isRemoteAssetReference(reference) ||
    !reference.startsWith("/")
  ) {
    return reference;
  }

  return toPublicAssetUrl(siteBasePath, reference);
}

function normalizeSiteBasePath(siteBasePath?: string) {
  if (!siteBasePath) {
    return "/";
  }

  const trimmed = siteBasePath.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function toPublicAssetUrl(siteBasePath: string | undefined, ...segments: string[]) {
  const normalizedBase = normalizeSiteBasePath(siteBasePath);
  const normalizedPath = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
    .filter((segment) => segment.length > 0)
    .join("/");

  if (!normalizedPath) {
    return normalizedBase;
  }

  return normalizedBase === "/" ? `/${normalizedPath}` : `${normalizedBase}${normalizedPath}`;
}

async function resolveLocalMirrorSource(reference: string): Promise<string | null> {
  const fileName = getFileNameFromUrl(reference);
  if (!fileName) {
    return null;
  }

  const index = await getLocalMirrorAssetIndex();
  const candidates = index.get(fileName.toLowerCase()) ?? [];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getFileNameFromUrl(reference: string) {
  try {
    const url = new URL(reference);
    const basename = path.basename(decodeURIComponent(url.pathname));
    return basename.trim();
  } catch {
    return "";
  }
}

async function getLocalMirrorAssetIndex() {
  const directories = getLocalMirrorDirectories();
  const indexKey = directories.join("|");

  if (!localMirrorAssetIndexPromise || localMirrorAssetIndexKey !== indexKey) {
    localMirrorAssetIndexKey = indexKey;
    localMirrorAssetIndexPromise = buildLocalMirrorAssetIndex(directories);
  }

  return localMirrorAssetIndexPromise;
}

function getLocalMirrorDirectories() {
  const fromEnv = parseLocalMirrorEnv(process.env[LOCAL_MIRROR_ENV]);
  return uniquePaths([...fromEnv, ...DEFAULT_LOCAL_MIRROR_DIRS]);
}

function parseLocalMirrorEnv(raw: string | undefined) {
  if (!raw) {
    return [];
  }

  return raw
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => path.resolve(item));
}

function uniquePaths(paths: string[]) {
  return Array.from(new Set(paths.map((item) => path.resolve(item))));
}

async function buildLocalMirrorAssetIndex(directories: string[]) {
  const index = new Map<string, string[]>();

  for (const directory of directories) {
    if (!(await directoryExists(directory))) {
      continue;
    }

    await indexDirectoryAssets(directory, index);
  }

  return index;
}

async function indexDirectoryAssets(directory: string, index: Map<string, string[]>) {
  let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const resolvedPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await indexDirectoryAssets(resolvedPath, index);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const key = entry.name.toLowerCase();
    if (!index.has(key)) {
      index.set(key, [resolvedPath]);
      continue;
    }

    index.get(key)!.push(resolvedPath);
  }
}

async function directoryExists(directoryPath: string) {
  try {
    const fileStat = await stat(directoryPath);
    return fileStat.isDirectory();
  } catch {
    return false;
  }
}

async function downloadRemoteAsset(
  initialUrl: string,
  redirectCount = 0,
  attempt = 1,
): Promise<RemoteAssetDownload | null> {
  if (redirectCount > MAX_REMOTE_REDIRECTS) {
    return null;
  }

  const parsedUrl = new URL(initialUrl);
  const response = await requestRemoteAsset(parsedUrl);
  const statusCode = response.statusCode;

  if (
    [301, 302, 303, 307, 308].includes(statusCode) &&
    typeof response.headers.location === "string"
  ) {
    const nextUrl = new URL(response.headers.location, parsedUrl).toString();
    return downloadRemoteAsset(nextUrl, redirectCount + 1);
  }

  if (statusCode < 200 || statusCode >= 300) {
    if (attempt < MAX_REMOTE_DOWNLOAD_ATTEMPTS && shouldRetryRemoteAssetDownload(statusCode)) {
      await waitBeforeRetry(attempt);
      return downloadRemoteAsset(initialUrl, redirectCount, attempt + 1);
    }

    return null;
  }

  return {
    bytes: response.body,
    contentType: contentTypeFromHeaders(response.headers),
    finalUrl: parsedUrl.toString(),
  };
}

function shouldRetryRemoteAssetDownload(statusCode: number) {
  return statusCode === 0 || statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

async function waitBeforeRetry(attempt: number) {
  await new Promise((resolve) => setTimeout(resolve, attempt * 400));
}

async function requestRemoteAsset(url: URL) {
  return new Promise<{ statusCode: number; headers: IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
    const useHttps = url.protocol === "https:";
    const client = useHttps ? https : http;
    const request = client.get(
      url,
      {
        agent: useHttps && INSECURE_TLS_HOSTS.has(url.hostname) ? insecureHttpsAgent : undefined,
        headers: {
          "accept": "*/*",
          "user-agent": "VueCubeBlog-Asset-Localizer/1.0",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_REMOTE_ASSET_BYTES) {
            request.destroy(new Error(`Remote asset too large: ${url.toString()}`));
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );

    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error(`Remote asset timeout: ${url.toString()}`));
    });
  }).catch(() => ({
    statusCode: 0,
    headers: {} as IncomingHttpHeaders,
    body: Buffer.alloc(0),
  }));
}

function contentTypeFromHeaders(headers: IncomingHttpHeaders) {
  const contentType = headers["content-type"];
  if (typeof contentType !== "string") {
    return "";
  }
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function getPathExtensionFromUrl(urlText: string) {
  try {
    const parsed = new URL(urlText);
    const extension = path.extname(decodeURIComponent(parsed.pathname)).toLowerCase();
    return /^[.][a-z0-9]{1,8}$/i.test(extension) ? extension : "";
  } catch {
    return "";
  }
}

function extensionFromContentType(contentType: string) {
  if (contentType === "image/png") return ".png";
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  if (contentType === "image/svg+xml") return ".svg";
  if (contentType === "image/avif") return ".avif";
  return "";
}

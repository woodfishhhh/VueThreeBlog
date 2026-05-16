import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { collectMarkdownFiles, type UrlClass, type UrlFinding, scanImageUrls } from "./report.js";

export type MigrationMode = "dry-run" | "write";

export interface MigrateImagesOptions {
  contentRoot: string;
  endpoint?: string;
  token?: string;
  source?: string;
  includeExternal?: boolean;
  manifestPath?: string;
  mode: MigrationMode;
  resolveUrl?: (sourceUrl: string, findingKind: UrlClass) => Promise<string>;
}

export interface MigrationEntry {
  from: string;
  kind: UrlClass;
  occurrences: number;
  status: "planned" | "migrated" | "failed";
  to: string | null;
  error: string | null;
}

export interface MigrationFileChange {
  file: string;
  replacements: number;
}

export interface MigrationResult {
  entries: MigrationEntry[];
  filesChanged: MigrationFileChange[];
  manifestPath: string;
  summary: {
    mode: MigrationMode;
    candidateCount: number;
    totalOccurrences: number;
    migratedCount: number;
    failedCount: number;
    changedFileCount: number;
    replacements: number;
  };
}

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\(([^)]+)\)/g;
const HTML_IMAGE_PATTERN = /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;

export async function migrateImages(options: MigrateImagesOptions): Promise<MigrationResult> {
  const findings = await scanImageUrls(options.contentRoot);
  const candidateKinds = options.includeExternal ? new Set<UrlClass>(["legacy-woodfish", "external"]) : new Set<UrlClass>(["legacy-woodfish"]);
  const candidates = findings.filter((item) => candidateKinds.has(item.kind));
  const grouped = groupByUrl(candidates);

  const entries: MigrationEntry[] = [];
  const replacementMap = new Map<string, string>();

  for (const [sourceUrl, group] of grouped.entries()) {
    const kind = group[0]?.kind ?? "external";
    if (options.mode === "dry-run") {
      entries.push({
        error: null,
        from: sourceUrl,
        kind,
        occurrences: group.length,
        status: "planned",
        to: null,
      });
      continue;
    }

    try {
      const migratedUrl = options.resolveUrl
        ? await options.resolveUrl(sourceUrl, kind)
        : await uploadRemoteImage({
            endpoint: options.endpoint,
            source: options.source ?? "migration",
            token: options.token,
            url: sourceUrl,
          });
      replacementMap.set(sourceUrl, migratedUrl);
      entries.push({
        error: null,
        from: sourceUrl,
        kind,
        occurrences: group.length,
        status: "migrated",
        to: migratedUrl,
      });
    } catch (error) {
      entries.push({
        error: formatError(error),
        from: sourceUrl,
        kind,
        occurrences: group.length,
        status: "failed",
        to: null,
      });
    }
  }

  const filesChanged: MigrationFileChange[] = [];
  if (options.mode === "write" && replacementMap.size > 0) {
    const markdownFiles = await collectMarkdownFiles(options.contentRoot);
    for (const file of markdownFiles) {
      const content = await readFile(file, "utf8");
      const rewritten = rewriteImageUrls(content, replacementMap);
      if (rewritten.replacements > 0) {
        await writeFile(file, rewritten.content, "utf8");
        filesChanged.push({
          file,
          replacements: rewritten.replacements,
        });
      }
    }
  }

  const manifestPath = path.resolve(options.manifestPath ?? path.join("docs", "muyu-image-migration-manifest.json"));
  const payload = {
    createdAt: new Date().toISOString(),
    mode: options.mode,
    contentRoot: path.resolve(options.contentRoot),
    entries,
    filesChanged,
  };
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const summary = {
    candidateCount: entries.length,
    changedFileCount: filesChanged.length,
    failedCount: entries.filter((item) => item.status === "failed").length,
    migratedCount: entries.filter((item) => item.status === "migrated").length,
    mode: options.mode,
    replacements: filesChanged.reduce((acc, item) => acc + item.replacements, 0),
    totalOccurrences: entries.reduce((acc, item) => acc + item.occurrences, 0),
  };

  return {
    entries,
    filesChanged,
    manifestPath,
    summary,
  };
}

export function rewriteImageUrls(content: string, replacements: ReadonlyMap<string, string>) {
  let replaced = 0;

  let next = content.replace(MARKDOWN_IMAGE_PATTERN, (fullMatch, rawUrl: string) => {
    const resolved = replacements.get(rawUrl.trim());
    if (!resolved) {
      return fullMatch;
    }
    replaced += 1;
    return fullMatch.replace(rawUrl, resolved);
  });

  next = next.replace(HTML_IMAGE_PATTERN, (_full, prefix: string, rawUrl: string, suffix: string) => {
    const resolved = replacements.get(rawUrl.trim());
    if (!resolved) {
      return `${prefix}${rawUrl}${suffix}`;
    }
    replaced += 1;
    return `${prefix}${resolved}${suffix}`;
  });

  return {
    content: next,
    replacements: replaced,
  };
}

function groupByUrl(items: UrlFinding[]) {
  const grouped = new Map<string, UrlFinding[]>();
  for (const item of items) {
    const found = grouped.get(item.url);
    if (found) {
      found.push(item);
      continue;
    }
    grouped.set(item.url, [item]);
  }
  return grouped;
}

async function uploadRemoteImage(options: {
  endpoint?: string;
  source: string;
  token?: string;
  url: string;
}) {
  if (!options.endpoint || !/^https?:\/\//i.test(options.endpoint)) {
    throw new Error("missing valid --endpoint for write mode");
  }
  if (!options.token) {
    throw new Error("missing --token for write mode");
  }

  const remoteResponse = await fetch(options.url);
  if (!remoteResponse.ok) {
    throw new Error(`failed to download source url (HTTP ${remoteResponse.status})`);
  }
  const mime = normalizeMime(remoteResponse.headers.get("content-type"));
  if (!mime.startsWith("image/")) {
    throw new Error(`source is not an image (${mime})`);
  }

  const bytes = Buffer.from(await remoteResponse.arrayBuffer());
  const fileName = guessFileName(options.url, mime);
  const form = new FormData();
  form.set("file", new File([bytes], fileName, { type: mime }));
  form.set("source", options.source);

  const uploadUrl = `${options.endpoint.replace(/\/+$/g, "")}/api/upload`;
  const uploadResponse = await fetch(uploadUrl, {
    body: form,
    headers: {
      Authorization: `Bearer ${options.token}`,
    },
    method: "POST",
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`upload failed (HTTP ${uploadResponse.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await uploadResponse.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("upload response missing url");
  }
  return payload.url;
}

function normalizeMime(input: string | null) {
  return (input ?? "application/octet-stream").split(";")[0].trim().toLowerCase();
}

function guessFileName(inputUrl: string, mime: string) {
  try {
    const parsed = new URL(inputUrl);
    const base = path.posix.basename(parsed.pathname);
    const clean = decodeURIComponent(base || "").trim();
    if (!clean || clean === "/" || clean === ".") {
      return `migrated${mimeToExt(mime)}`;
    }
    if (path.posix.extname(clean)) {
      return clean;
    }
    return `${clean}${mimeToExt(mime)}`;
  } catch {
    return `migrated${mimeToExt(mime)}`;
  }
}

function mimeToExt(mime: string) {
  const map: Record<string, string> = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
  };
  return map[mime] ?? ".img";
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

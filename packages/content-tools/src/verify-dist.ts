import { access, readFile } from "node:fs/promises";
import path from "node:path";

export interface DistPathVerification {
  basePath: string;
  assetRefs: string[];
  manifestRefs: string[];
}

export function normalizeDeployBasePath(value: string | undefined): string {
  if (!value || value.trim() === "" || value.trim() === "/") {
    return "/";
  }

  const trimmed = value.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function verifyIndexHtmlPaths(html: string, basePath = "/newBlog/"): DistPathVerification {
  const normalizedBase = normalizeDeployBasePath(basePath);
  const refs = Array.from(html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)).map(
    (match) => match[1] ?? "",
  );

  const assetRefs = refs.filter((ref) => ref.includes("/assets/"));
  const manifestRefs = refs.filter((ref) => ref.endsWith("manifest.webmanifest"));

  if (assetRefs.length === 0) {
    throw new Error("dist/index.html has no asset references");
  }

  if (normalizedBase !== "/") {
    const rootScopedRefs = refs.filter(
      (ref) =>
        ref.startsWith("/assets/") || ref === "/registerSW.js" || ref === "/manifest.webmanifest",
    );

    if (rootScopedRefs.length > 0) {
      throw new Error(
        `dist/index.html contains root-scoped refs for subpath deploy: ${rootScopedRefs.join(", ")}`,
      );
    }
  }

  const wrongAssetRefs = assetRefs.filter((ref) => !ref.startsWith(`${normalizedBase}assets/`));
  if (wrongAssetRefs.length > 0) {
    throw new Error(
      `dist/index.html asset refs do not use ${normalizedBase}: ${wrongAssetRefs.join(", ")}`,
    );
  }

  if (!manifestRefs.includes(`${normalizedBase}manifest.webmanifest`)) {
    throw new Error(`dist/index.html does not reference ${normalizedBase}manifest.webmanifest`);
  }

  return {
    basePath: normalizedBase,
    assetRefs,
    manifestRefs,
  };
}

export async function verifyDist(distDir: string, basePath = "/newBlog/") {
  await Promise.all([
    access(path.join(distDir, "index.html")),
    access(path.join(distDir, "sw.js")),
    access(path.join(distDir, "manifest.webmanifest")),
    access(path.join(distDir, "assets")),
  ]);

  const html = await readFile(path.join(distDir, "index.html"), "utf8");
  return verifyIndexHtmlPaths(html, basePath);
}

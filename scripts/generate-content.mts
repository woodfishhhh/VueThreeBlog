import { mkdir, readdir, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSiteContent } from "./content/build-site-content";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDir, "..");
const sourceProjectRoot = projectRoot;
const generatedRoot = path.join(projectRoot, "src", "generated");
const generatedPostsRoot = path.join(generatedRoot, "posts");
const publicRoot = path.join(projectRoot, "public");
const siteBasePath = process.env.VITE_BASE_PATH;

async function main() {
  await mkdir(generatedRoot, { recursive: true });
  await rm(generatedPostsRoot, { recursive: true, force: true });
  await mkdir(generatedPostsRoot, { recursive: true });
  await rm(path.join(publicRoot, "content-assets"), { recursive: true, force: true });
  await rm(path.join(publicRoot, "imported-assets"), { recursive: true, force: true });
  await mkdir(path.join(publicRoot, "remote-assets"), { recursive: true });

  const siteContent = await buildSiteContent({
    sourceProjectRoot,
    targetPublicDir: publicRoot,
    siteBasePath,
  });

  // Emit post-index.json into public/ so the runtime can fetch() it without
  // pulling the entire payload into a JS chunk. The Vite PWA service worker
  // already caches `/post-index.*\.json` with NetworkFirst.
  await writeJson(path.join(publicRoot, "post-index.json"), siteContent.postIndex);
  // Remove any stale copy that may still live under src/generated.
  await rm(path.join(generatedRoot, "post-index.json"), { force: true });
  await writeJson(path.join(generatedRoot, "author.json"), siteContent.author);
  await writeJson(path.join(generatedRoot, "friends.json"), siteContent.friendLinks);

  for (const [slug, article] of Object.entries(siteContent.postsBySlug)) {
    await writeJson(path.join(generatedPostsRoot, `${slug}.json`), article);
  }

  await pruneUnusedRemoteAssets(publicRoot, siteContent);

  console.log(`Generated ${siteContent.postIndex.length} posts into ${generatedRoot}`);
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function pruneUnusedRemoteAssets(publicRoot: string, siteContent: unknown) {
  const remoteAssetsRoot = path.join(publicRoot, "remote-assets");
  const referencedAssets = collectReferencedRemoteAssetFileNames(siteContent);
  const entries = await readdir(remoteAssetsRoot, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && !referencedAssets.has(entry.name))
      .map((entry) => unlink(path.join(remoteAssetsRoot, entry.name))),
  );
}

function collectReferencedRemoteAssetFileNames(siteContent: unknown) {
  const referencedAssets = new Set<string>();
  const serializedContent = JSON.stringify(siteContent);

  for (const match of serializedContent.matchAll(/remote-assets\/([A-Za-z0-9._-]+)/g)) {
    const fileName = match[1];
    if (fileName) {
      referencedAssets.add(fileName);
    }
  }

  return referencedAssets;
}

await main();

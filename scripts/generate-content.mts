import { mkdir, rm, writeFile } from "node:fs/promises";
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

async function main() {
  await mkdir(generatedRoot, { recursive: true });
  await rm(generatedPostsRoot, { recursive: true, force: true });
  await mkdir(generatedPostsRoot, { recursive: true });
  await rm(path.join(publicRoot, "content-assets"), { recursive: true, force: true });
  await rm(path.join(publicRoot, "imported-assets"), { recursive: true, force: true });

  const siteContent = await buildSiteContent({
    sourceProjectRoot,
    targetPublicDir: publicRoot,
  });

  await writeJson(path.join(generatedRoot, "post-index.json"), siteContent.postIndex);
  await writeJson(path.join(generatedRoot, "author.json"), siteContent.author);
  await writeJson(path.join(generatedRoot, "friends.json"), siteContent.friendLinks);

  for (const [slug, article] of Object.entries(siteContent.postsBySlug)) {
    await writeJson(path.join(generatedPostsRoot, `${slug}.json`), article);
  }

  console.log(`Generated ${siteContent.postIndex.length} posts into ${generatedRoot}`);
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

await main();

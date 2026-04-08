import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatBytes, optimizeImageAssets } from "./image-optimizer-core";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDir, "..");
const publicRoot = path.join(projectRoot, "public");

async function main() {
  const summary = await optimizeImageAssets([
    path.join(publicRoot, "remote-assets"),
    path.join(publicRoot, "imported-assets"),
    path.join(publicRoot, "content-assets"),
  ]);

  console.log(
    [
      `[images] scanned=${summary.scannedCount}`,
      `optimized=${summary.optimizedCount}`,
      `skipped=${summary.skippedCount}`,
      `failed=${summary.failedCount}`,
      `saved=${formatBytes(summary.savedBytes)}`,
    ].join(" "),
  );

  for (const result of summary.results.filter((entry) => entry.status === "failed")) {
    console.warn(`[images] failed ${result.filePath}: ${result.errorMessage}`);
  }
}

await main();

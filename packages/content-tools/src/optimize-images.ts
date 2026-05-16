import path from "node:path";

import { formatBytes, optimizeImageAssets } from "./image-optimizer-core.js";
import { resolveBlogPaths, type BlogPathOverrides } from "./paths.js";

export interface OptimizeImagesOptions extends BlogPathOverrides {}

export interface OptimizeImagesResult {
  failed: Array<{ errorMessage?: string; filePath: string }>;
  summaryLine: string;
}

export async function optimizeImages(options: OptimizeImagesOptions = {}): Promise<OptimizeImagesResult> {
  const paths = resolveBlogPaths(options);
  const summary = await optimizeImageAssets([
    path.join(paths.publicRoot, "remote-assets"),
    path.join(paths.publicRoot, "imported-assets"),
    path.join(paths.publicRoot, "content-assets"),
  ]);

  return {
    failed: summary.results
      .filter((entry) => entry.status === "failed")
      .map((entry) => ({ errorMessage: entry.errorMessage, filePath: entry.filePath })),
    summaryLine: [
      `[images] scanned=${summary.scannedCount}`,
      `optimized=${summary.optimizedCount}`,
      `skipped=${summary.skippedCount}`,
      `failed=${summary.failedCount}`,
      `saved=${formatBytes(summary.savedBytes)}`,
    ].join(" "),
  };
}

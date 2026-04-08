import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SUPPORTED_RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MIN_BYTES_TO_PROCESS = 16 * 1024;

export type OptimizeImageAssetStatus = "optimized" | "skipped" | "failed";

export interface OptimizeImageAssetResult {
  filePath: string;
  status: OptimizeImageAssetStatus;
  beforeBytes: number;
  afterBytes: number;
  savedBytes: number;
  reason?: "unsupported-format" | "below-threshold" | "not-smaller" | "error";
  errorMessage?: string;
}

export interface OptimizeImageBatchSummary {
  scannedCount: number;
  optimizedCount: number;
  skippedCount: number;
  failedCount: number;
  savedBytes: number;
  results: OptimizeImageAssetResult[];
}

export function isOptimizableImageAsset(filePath: string) {
  return SUPPORTED_RASTER_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export async function collectImageAssetFiles(rootDir: string): Promise<string[]> {
  try {
    const rootStat = await stat(rootDir);
    if (!rootStat.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const resolvedPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(resolvedPath);
        continue;
      }

      if (entry.isFile()) {
        files.push(resolvedPath);
      }
    }
  }

  await walk(rootDir);

  return files.sort((left, right) => left.localeCompare(right));
}

export async function optimizeImageAsset(filePath: string): Promise<OptimizeImageAssetResult> {
  const extension = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_RASTER_EXTENSIONS.has(extension)) {
    return {
      filePath,
      status: "skipped",
      beforeBytes: 0,
      afterBytes: 0,
      savedBytes: 0,
      reason: "unsupported-format",
    };
  }

  const originalBuffer = await readFile(filePath);
  const beforeBytes = originalBuffer.byteLength;

  if (beforeBytes < MIN_BYTES_TO_PROCESS) {
    return {
      filePath,
      status: "skipped",
      beforeBytes,
      afterBytes: beforeBytes,
      savedBytes: 0,
      reason: "below-threshold",
    };
  }

  try {
    const optimizedBuffer = await createOptimizedBuffer(originalBuffer, extension);
    const afterBytes = optimizedBuffer.byteLength;

    if (afterBytes >= beforeBytes) {
      return {
        filePath,
        status: "skipped",
        beforeBytes,
        afterBytes: beforeBytes,
        savedBytes: 0,
        reason: "not-smaller",
      };
    }

    await writeFile(filePath, optimizedBuffer);

    return {
      filePath,
      status: "optimized",
      beforeBytes,
      afterBytes,
      savedBytes: beforeBytes - afterBytes,
    };
  } catch (error) {
    return {
      filePath,
      status: "failed",
      beforeBytes,
      afterBytes: beforeBytes,
      savedBytes: 0,
      reason: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function optimizeImageAssets(rootDirs: string[]): Promise<OptimizeImageBatchSummary> {
  const targetFiles = (
    await Promise.all(rootDirs.map((rootDir) => collectImageAssetFiles(rootDir)))
  ).flat();

  const results = await Promise.all(targetFiles.map((filePath) => optimizeImageAsset(filePath)));

  return {
    scannedCount: results.length,
    optimizedCount: results.filter((result) => result.status === "optimized").length,
    skippedCount: results.filter((result) => result.status === "skipped").length,
    failedCount: results.filter((result) => result.status === "failed").length,
    savedBytes: results.reduce((total, result) => total + result.savedBytes, 0),
    results,
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function createOptimizedBuffer(source: Buffer, extension: string) {
  const image = sharp(source, { animated: false, limitInputPixels: false }).rotate();

  if (extension === ".png") {
    return image
      .png({
        compressionLevel: 9,
        palette: true,
        effort: 10,
        quality: 90,
      })
      .toBuffer();
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return image
      .jpeg({
        quality: 82,
        mozjpeg: true,
      })
      .toBuffer();
  }

  return image
    .webp({
      quality: 80,
      effort: 6,
    })
    .toBuffer();
}

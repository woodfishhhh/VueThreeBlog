import crypto from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildMarkdownImage, buildPublicImageUrl, type ImageVariantKind } from "@woodfish-nest/shared";
import sharp from "sharp";

import type { AppEnv } from "./env.js";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export interface StoredImageVariant {
  kind: ImageVariantKind;
  mime: string;
  relativePath: string;
  publicUrl: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
}

export interface StoredImageResult {
  id: string;
  displayName: string;
  width: number;
  height: number;
  sizeBytes: number;
  mime: string;
  hash: string;
  url: string;
  originalUrl: string;
  thumbnailUrl: string | null;
  markdown: string;
  createdAt: string;
  defaultVariant: "webp" | "original";
  originalExt: string;
  variants: StoredImageVariant[];
}

export interface UploadableFile {
  file: File;
  displayName?: string;
}

export async function storeUploadedFile(
  env: AppEnv,
  input: UploadableFile,
): Promise<StoredImageResult> {
  const { file } = input;
  const displayName = sanitizeDisplayName(input.displayName || file.name || "upload");
  const rawBytes = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectMime(rawBytes);
  if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) {
    throw new Error("UPLOAD_UNSUPPORTED_TYPE");
  }

  if (detectedMime === "image/svg+xml") {
    throw new Error("UPLOAD_UNSUPPORTED_TYPE");
  }

  const hash = crypto.createHash("sha256").update(rawBytes).digest("hex");
  const id = `img_${hash.slice(0, 16)}`;
  const now = new Date();
  const createdAt = now.toISOString();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  const originalExt = mimeToExt(detectedMime);
  const originalRelativePath = path.join("original", year, month, `${hash}.${originalExt}`).replace(/\\/g, "/");
  const originalAbsPath = resolveUnderRoot(env.imageRoot, originalRelativePath);
  await mkdir(path.dirname(originalAbsPath), { recursive: true });
  await writeFile(originalAbsPath, rawBytes);

  const variants: StoredImageVariant[] = [];
  const sharpInput = sharp(rawBytes, { animated: detectedMime === "image/gif" });
  const metadata = await sharpInput.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const originalUrl = buildPublicImageUrl(env.publicBaseUrl, originalRelativePath);
  variants.push({
    kind: "original",
    mime: detectedMime,
    relativePath: originalRelativePath,
    publicUrl: originalUrl,
    width: width || null,
    height: height || null,
    sizeBytes: rawBytes.byteLength,
  });

  let defaultVariant: "webp" | "original" = "original";
  let url = originalUrl;
  let thumbnailUrl: string | null = null;

  try {
    if (detectedMime !== "image/gif") {
      const webpBuffer = await sharp(rawBytes).webp({ quality: env.webpQuality }).toBuffer();
      const webpRelativePath = path.join("webp", year, month, `${hash}.webp`).replace(/\\/g, "/");
      const webpAbsPath = resolveUnderRoot(env.imageRoot, webpRelativePath);
      await mkdir(path.dirname(webpAbsPath), { recursive: true });
      await writeFile(webpAbsPath, webpBuffer);

      const webpMeta = await sharp(webpBuffer).metadata();
      const webpUrl = buildPublicImageUrl(env.publicBaseUrl, webpRelativePath);
      variants.push({
        kind: "webp",
        mime: "image/webp",
        relativePath: webpRelativePath,
        publicUrl: webpUrl,
        width: webpMeta.width ?? width ?? null,
        height: webpMeta.height ?? height ?? null,
        sizeBytes: webpBuffer.byteLength,
      });

      const thumbBuffer = await sharp(webpBuffer).resize({ width: 640, withoutEnlargement: true }).toBuffer();
      const thumbRelativePath = path.join("thumbs", year, month, `${hash}.webp`).replace(/\\/g, "/");
      const thumbAbsPath = resolveUnderRoot(env.imageRoot, thumbRelativePath);
      await mkdir(path.dirname(thumbAbsPath), { recursive: true });
      await writeFile(thumbAbsPath, thumbBuffer);
      const thumbMeta = await sharp(thumbBuffer).metadata();
      const thumbUrl = buildPublicImageUrl(env.publicBaseUrl, thumbRelativePath);
      thumbnailUrl = thumbUrl;
      variants.push({
        kind: "thumb",
        mime: "image/webp",
        relativePath: thumbRelativePath,
        publicUrl: thumbUrl,
        width: thumbMeta.width ?? null,
        height: thumbMeta.height ?? null,
        sizeBytes: thumbBuffer.byteLength,
      });

      defaultVariant = "webp";
      url = webpUrl;
    }
  } catch (error) {
    await rm(originalAbsPath, { force: true });
    throw error;
  }

  return {
    id,
    displayName,
    width,
    height,
    sizeBytes: rawBytes.byteLength,
    mime: detectedMime,
    hash,
    url,
    originalUrl,
    thumbnailUrl,
    markdown: buildMarkdownImage(url, displayName),
    createdAt,
    defaultVariant,
    originalExt,
    variants,
  };
}

export function sanitizeDisplayName(input: string) {
  const trimmed = input.trim().replace(/[\\/<>:"|?*\u0000-\u001F]/g, "_");
  return trimmed.length > 0 ? trimmed.slice(0, 240) : "upload";
}

function resolveUnderRoot(root: string, relativePath: string) {
  const finalPath = path.resolve(root, relativePath);
  const normalizedRoot = path.resolve(root);
  if (!finalPath.startsWith(normalizedRoot)) {
    throw new Error("UPLOAD_INVALID_PATH");
  }
  return finalPath;
}

function mimeToExt(mime: string) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

function detectMime(buffer: Buffer): string | null {
  if (buffer.length < 12) {
    return null;
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return "image/jpeg";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "image/gif";
  }
  return null;
}

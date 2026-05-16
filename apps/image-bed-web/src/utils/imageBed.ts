import type { ImageRecord, ImageVariantKind } from "@woodfish-nest/shared";

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export function getImageVariant(image: ImageRecord, kind: ImageVariantKind) {
  return image.variants.find((variant) => variant.kind === kind) ?? null;
}

export function getImageDisplayUrl(image: ImageRecord) {
  return getImageVariant(image, image.defaultVariant)?.publicUrl ?? image.variants[0]?.publicUrl ?? "";
}

export function getImageThumbUrl(image: ImageRecord) {
  return getImageVariant(image, "thumb")?.publicUrl ?? getImageDisplayUrl(image);
}

export function getImageMarkdown(image: ImageRecord) {
  return `![${image.altText || image.displayName}](${getImageDisplayUrl(image)})`;
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

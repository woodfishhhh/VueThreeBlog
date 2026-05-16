function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function joinPublicBaseUrl(baseUrl: string, relativePath: string) {
  const normalizedBase = baseUrl.trim().replace(/\/+$/g, "");
  const normalizedPath = trimSlashes(relativePath);
  if (normalizedPath.length === 0) {
    return normalizedBase;
  }

  return `${normalizedBase}/${normalizedPath}`;
}

export function buildPublicImageUrl(baseUrl: string, relativePath: string) {
  return joinPublicBaseUrl(baseUrl, `o/${trimSlashes(relativePath)}`);
}

export function buildMarkdownImage(url: string, altText = "") {
  const safeAlt = altText.replace(/\]/g, "\\]");
  return `![${safeAlt}](${url})`;
}

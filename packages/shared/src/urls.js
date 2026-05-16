function trimSlashes(value) {
    return value.replace(/^\/+|\/+$/g, "");
}
export function joinPublicBaseUrl(baseUrl, relativePath) {
    const normalizedBase = baseUrl.trim().replace(/\/+$/g, "");
    const normalizedPath = trimSlashes(relativePath);
    if (normalizedPath.length === 0) {
        return normalizedBase;
    }
    return `${normalizedBase}/${normalizedPath}`;
}
export function buildPublicImageUrl(baseUrl, relativePath) {
    return joinPublicBaseUrl(baseUrl, `o/${trimSlashes(relativePath)}`);
}
export function buildMarkdownImage(url, altText = "") {
    const safeAlt = altText.replace(/\]/g, "\\]");
    return `![${safeAlt}](${url})`;
}

import { describe, expect, it } from "vitest";

import { buildMarkdownImage, buildPublicImageUrl, joinPublicBaseUrl } from "../src/urls";

describe("url helpers", () => {
  it("joins base url and path without duplicate slashes", () => {
    expect(joinPublicBaseUrl("https://img.woodfish.site/", "/o/webp/2026/05/a.webp")).toBe(
      "https://img.woodfish.site/o/webp/2026/05/a.webp",
    );
    expect(joinPublicBaseUrl("https://img.woodfish.site", "o/webp/2026/05/a.webp")).toBe(
      "https://img.woodfish.site/o/webp/2026/05/a.webp",
    );
  });

  it("builds public image urls under /o", () => {
    expect(buildPublicImageUrl("https://img.woodfish.site/", "webp/2026/05/a.webp")).toBe(
      "https://img.woodfish.site/o/webp/2026/05/a.webp",
    );
    expect(buildPublicImageUrl("https://img.woodfish.site", "/original/2026/05/a.png")).toBe(
      "https://img.woodfish.site/o/original/2026/05/a.png",
    );
  });

  it("builds markdown image text and escapes alt text bracket", () => {
    expect(buildMarkdownImage("https://img.woodfish.site/o/webp/2026/05/a.webp", "hero [01]")).toBe(
      "![hero [01\\]](https://img.woodfish.site/o/webp/2026/05/a.webp)",
    );
  });
});

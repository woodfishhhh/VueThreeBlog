import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { migrateImages, rewriteImageUrls } from "../src/migrate.js";

let tempRoot = "";

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { force: true, recursive: true });
    tempRoot = "";
  }
});

describe("migrate tools", () => {
  it("rewrites markdown and html image urls", () => {
    const source = `![legacy](https://www.woodfishhhh.xyz/images/a.png)
<img src="https://cdn.example.com/pic.png" />
`;
    const replacementMap = new Map<string, string>([
      ["https://www.woodfishhhh.xyz/images/a.png", "https://img.woodfish.site/o/webp/a.webp"],
      ["https://cdn.example.com/pic.png", "https://img.woodfish.site/o/webp/b.webp"],
    ]);

    const rewritten = rewriteImageUrls(source, replacementMap);
    expect(rewritten.replacements).toBe(2);
    expect(rewritten.content).toContain("https://img.woodfish.site/o/webp/a.webp");
    expect(rewritten.content).toContain("https://img.woodfish.site/o/webp/b.webp");
  });

  it("generates dry-run manifest without writing files", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "content-migrate-"));
    const postDir = path.join(tempRoot, "posts", "a");
    await mkdir(postDir, { recursive: true });
    const markdownFile = path.join(postDir, "index.md");
    const originalContent = `![legacy](https://www.woodfishhhh.xyz/images/a.png)\n`;
    await writeFile(markdownFile, originalContent, "utf8");

    const manifestPath = path.join(tempRoot, "manifest-dry.json");
    const result = await migrateImages({
      contentRoot: tempRoot,
      manifestPath,
      mode: "dry-run",
    });

    expect(result.summary.mode).toBe("dry-run");
    expect(result.summary.candidateCount).toBe(1);
    expect(result.summary.totalOccurrences).toBe(1);
    expect(result.summary.changedFileCount).toBe(0);
    expect(result.summary.replacements).toBe(0);

    const afterContent = await readFile(markdownFile, "utf8");
    expect(afterContent).toBe(originalContent);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { entries: Array<{ status: string }> };
    expect(manifest.entries[0]?.status).toBe("planned");
  });

  it("writes replacements and manifest in write mode", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "content-migrate-"));
    const postDir = path.join(tempRoot, "posts", "a");
    await mkdir(postDir, { recursive: true });
    const markdownFile = path.join(postDir, "index.md");
    await writeFile(
      markdownFile,
      `![legacy](https://www.woodfishhhh.xyz/images/a.png)
<img src="https://cdn.example.com/pic.png" />
`,
      "utf8",
    );

    const manifestPath = path.join(tempRoot, "manifest-write.json");
    const result = await migrateImages({
      contentRoot: tempRoot,
      includeExternal: true,
      manifestPath,
      mode: "write",
      resolveUrl: async (sourceUrl) => {
        if (sourceUrl.includes("woodfishhhh")) {
          return "https://img.woodfish.site/o/webp/legacy.webp";
        }
        return "https://img.woodfish.site/o/webp/external.webp";
      },
    });

    expect(result.summary.mode).toBe("write");
    expect(result.summary.candidateCount).toBe(2);
    expect(result.summary.failedCount).toBe(0);
    expect(result.summary.migratedCount).toBe(2);
    expect(result.summary.changedFileCount).toBe(1);
    expect(result.summary.replacements).toBe(2);

    const afterContent = await readFile(markdownFile, "utf8");
    expect(afterContent).toContain("https://img.woodfish.site/o/webp/legacy.webp");
    expect(afterContent).toContain("https://img.woodfish.site/o/webp/external.webp");
  });
});

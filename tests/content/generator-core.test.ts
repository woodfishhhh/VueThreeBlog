import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { describe, expect, it } from "vitest";

import {
  buildLegacySlugIndex,
  normalizeMarkdownBody,
  resolveCanonicalSlug,
  rewriteMarkdownAssetPaths,
} from "../../scripts/content/generator-core";

describe("generator-core", () => {
  it("reuses a legacy English slug when title, date, and normalized body match", () => {
    const rawMarkdown = `---\ntitle: "AJAX 基础入门教程"\ndate: 2025-12-20 12:00:04\n---\n\n# AJAX 基础入门教程\n\n## 核心概念\n\n内容段落。`;
    const legacyIndex = buildLegacySlugIndex([
      {
        slug: "ajax-basics-intro",
        title: "AJAX 基础入门教程",
        date: "2025-12-20 12:00:04",
        rawMarkdown,
      },
    ]);

    const result = resolveCanonicalSlug({
      title: "AJAX 基础入门教程",
      date: "2025-12-20 12:00:04",
      rawMarkdown,
      sourceRelativePath: "前端/AJAX 基础入门教程.md",
      legacyIndex,
    });

    expect(result.canonicalSlug).toBe("ajax-basics-intro");
    expect(result.aliases).toContain("AJAX 基础入门教程");
  });

  it("falls back to an ASCII stem plus short hash when there is no legacy slug", () => {
    const result = resolveCanonicalSlug({
      title: "全中文标题",
      date: "2026-01-01 08:00:00",
      rawMarkdown: "---\ntitle: 全中文标题\n---\n\n# 全中文标题\n\n正文",
      sourceRelativePath: "题解/全中文标题.md",
      legacyIndex: new Map(),
    });

    expect(result.canonicalSlug).toMatch(/^post-[a-f0-9]{8}$/);
    expect(result.aliases).toContain("全中文标题");
  });

  it("removes a duplicated first-level title heading from the markdown body", () => {
    const rawMarkdown = "# C++ STL 到 JavaScript：常用数据结构映射速查\n\n## 小节\n\n正文内容";

    expect(normalizeMarkdownBody(rawMarkdown, "C++ STL 到 JavaScript：常用数据结构映射速查")).toBe(
      "## 小节\n\n正文内容",
    );
  });

  it("copies relative and absolute local assets into static folders and rewrites the markdown", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "vuecubeblog-generator-"));
    const sourceDir = path.join(tempRoot, "source", "前端");
    const publicDir = path.join(tempRoot, "public");
    const localAssetDir = path.join(sourceDir, "images");
    const absoluteAssetDir = path.join(path.parse(tempRoot).root, "tmp", path.basename(tempRoot), "absolute");
    const absoluteAssetPath = path.join(absoluteAssetDir, "system.png");
    const absoluteMarkdownPath = path.posix.join("/tmp", path.basename(tempRoot), "absolute", "system.png");

    await mkdir(localAssetDir, { recursive: true });
    await mkdir(absoluteAssetDir, { recursive: true });
    await writeFile(path.join(localAssetDir, "demo.png"), "relative-image");
    await writeFile(absoluteAssetPath, "absolute-image");

    const sourceFilePath = path.join(sourceDir, "AJAX 学习笔记（Day 01）：入门.md");
    const markdown = [
      "![relative](images/demo.png)",
      `![absolute](${absoluteMarkdownPath})`,
    ].join("\n\n");

    const result = await rewriteMarkdownAssetPaths(markdown, {
      sourceFilePath,
      canonicalSlug: "ajax-day-01",
      publicDir,
    });

    expect(result.markdown).toContain("/content-assets/ajax-day-01/images/demo.png");
    expect(result.markdown).toMatch(/\/imported-assets\/[a-f0-9]{40}\.png/);
    expect(result.warnings).toHaveLength(0);

    expect(
      await readFile(path.join(publicDir, "content-assets", "ajax-day-01", "images", "demo.png"), "utf8"),
    ).toBe("relative-image");

    const importedAssetMatch = result.markdown.match(/\/imported-assets\/([a-f0-9]{40}\.png)/);
    expect(importedAssetMatch).not.toBeNull();
    expect(await readFile(path.join(publicDir, "imported-assets", importedAssetMatch![1]), "utf8")).toBe(
      "absolute-image",
    );
  });

  it("downloads remote markdown images into local static assets", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "vuecubeblog-generator-remote-"));
    const sourceDir = path.join(tempRoot, "source");
    const publicDir = path.join(tempRoot, "public");
    const sourceFilePath = path.join(sourceDir, "Remote 图片测试.md");
    const remoteBytes = Buffer.from("remote-image-bytes");

    await mkdir(sourceDir, { recursive: true });

    const server = createServer((req, res) => {
      if (req.url?.startsWith("/avatar.png")) {
        res.writeHead(200, { "content-type": "image/png" });
        res.end(remoteBytes);
        return;
      }

      res.writeHead(404);
      res.end("not-found");
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const remoteUrl = `http://127.0.0.1:${port}/avatar.png`;

    try {
      const result = await rewriteMarkdownAssetPaths(`![remote](${remoteUrl})`, {
        sourceFilePath,
        canonicalSlug: "remote-image-test",
        publicDir,
      });

      expect(result.warnings).toHaveLength(0);
      const match = result.markdown.match(/\/remote-assets\/([a-f0-9]{40}\.[a-z0-9]+)/i);
      expect(match).not.toBeNull();

      const savedAsset = await readFile(path.join(publicDir, "remote-assets", match![1]));
      expect(Buffer.compare(savedAsset, remoteBytes)).toBe(0);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });

  it("falls back to local mirror assets for blocked remote hosts", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "vuecubeblog-generator-mirror-"));
    const sourceDir = path.join(tempRoot, "source");
    const publicDir = path.join(tempRoot, "public");
    const mirrorDir = path.join(tempRoot, "mirror-images");
    const sourceFilePath = path.join(sourceDir, "Mirror 图片测试.md");
    const mirrorFileName = "fallback-avatar.png";
    const mirrorBytes = Buffer.from("mirror-avatar-bytes");
    const remoteUrl = `https://www.woodfishhhh.xyz/images/${mirrorFileName}?_t=1`;
    const originalMirrorEnv = process.env.VUECUBEBLOG_LOCAL_ASSET_MIRROR_DIRS;

    await mkdir(sourceDir, { recursive: true });
    await mkdir(mirrorDir, { recursive: true });
    await writeFile(path.join(mirrorDir, mirrorFileName), mirrorBytes);
    process.env.VUECUBEBLOG_LOCAL_ASSET_MIRROR_DIRS = mirrorDir;

    try {
      const result = await rewriteMarkdownAssetPaths(`![remote](${remoteUrl})`, {
        sourceFilePath,
        canonicalSlug: "mirror-image-test",
        publicDir,
      });

      expect(result.warnings).toHaveLength(0);
      const match = result.markdown.match(/\/remote-assets\/([a-f0-9]{40}\.[a-z0-9]+)/i);
      expect(match).not.toBeNull();

      const localizedBytes = await readFile(path.join(publicDir, "remote-assets", match![1]));
      expect(Buffer.compare(localizedBytes, mirrorBytes)).toBe(0);
    } finally {
      if (typeof originalMirrorEnv === "string") {
        process.env.VUECUBEBLOG_LOCAL_ASSET_MIRROR_DIRS = originalMirrorEnv;
      } else {
        delete process.env.VUECUBEBLOG_LOCAL_ASSET_MIRROR_DIRS;
      }
    }
  });
});

import { createServer } from "node:http";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSiteContent } from "../../scripts/content/build-site-content";

describe("build-site-content", () => {
  it("builds post index, article payloads, author data, and friend links from the legacy source project", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "vuecubeblog-build-"));
    const sourceRoot = path.join(tempRoot, "3Dblog");
    const myblogDir = path.join(sourceRoot, "content", "source", "myblog", "前端");
    const legacyPostDir = path.join(sourceRoot, "content", "posts", "ajax-basics-intro");
    const aboutPath = path.join(sourceRoot, "content", "source", "blog", "source", "_data", "about.yml");
    const linkPath = path.join(sourceRoot, "content", "source", "blog", "source", "_data", "link.yml");
    const configPath = path.join(sourceRoot, "content", "source", "blog", "_config.yml");
    const publicDir = path.join(sourceRoot, "public", "asset");

    await mkdir(myblogDir, { recursive: true });
    await mkdir(legacyPostDir, { recursive: true });
    await mkdir(path.dirname(aboutPath), { recursive: true });
    await mkdir(path.dirname(linkPath), { recursive: true });
    await mkdir(path.dirname(configPath), { recursive: true });
    await mkdir(publicDir, { recursive: true });

    const remoteAvatarBytes = Buffer.from("friend-avatar-binary");
    const avatarServer = createServer((req, res) => {
      if (req.url?.startsWith("/friend-avatar.png")) {
        res.writeHead(200, { "content-type": "image/png" });
        res.end(remoteAvatarBytes);
        return;
      }

      res.writeHead(404);
      res.end("not-found");
    });

    await new Promise<void>((resolve) => {
      avatarServer.listen(0, "127.0.0.1", () => resolve());
    });

    const serverAddress = avatarServer.address();
    const avatarPort = typeof serverAddress === "object" && serverAddress ? serverAddress.port : 0;
    const remoteAvatarUrl = `http://127.0.0.1:${avatarPort}/friend-avatar.png`;

    const rawMarkdown = [
      "---",
      'title: "AJAX 基础入门教程"',
      "date: 2025-12-20 12:00:04",
      "tags:",
      '  - "AJAX基础"',
      '  - "axios"',
      "categories:",
      '  - "前端开发"',
      "---",
      "",
      "# AJAX 基础入门教程",
      "",
      "这是文章摘要第一段。",
      "",
      "## 核心概念",
      "",
      "![Local](/asset/image.png)",
      "",
      "```js",
      "console.log('demo')",
      "```",
    ].join("\n");

    await writeFile(path.join(myblogDir, "AJAX 基础入门教程.md"), rawMarkdown);
    await writeFile(path.join(legacyPostDir, "index.md"), rawMarkdown);
    await writeFile(path.join(publicDir, "image.png"), "asset-image");
    await writeFile(
      aboutPath,
      [
        "contentinfo:",
        "  name: 木鱼",
        "  title: 学生 / 创作者",
        "  slogan: 源于热爱，去感受",
        "  sup: 你好，很高兴认识你",
        "authorinfo:",
        "  image: /asset/image.png",
        "skills:",
        "  tags:",
        "    - title: Vue",
        "      color: '#42b883'",
        "      img: /asset/image.png",
      ].join("\n"),
    );
    try {
      await writeFile(
        linkPath,
        [
          "links:",
          "  - class_name: 友情链接",
          "    link_list:",
          "      - name: Fomalhaut",
          "        link: https://fomal.cc/",
          `        avatar: ${remoteAvatarUrl}`,
          "        descr: 我的博客从这里学的",
        ].join("\n"),
      );
      await writeFile(configPath, "author: woodfish\nsubtitle: HOLA,this is woodfish!\n");

      const targetPublicDir = path.join(tempRoot, "generated-public");
      const result = await buildSiteContent({
        sourceProjectRoot: sourceRoot,
        targetPublicDir,
      });

      expect(result.postIndex).toHaveLength(1);
      expect(result.postIndex[0]?.canonicalSlug).toBe("ajax-basics-intro");
      expect(result.postIndex[0]?.aliases).toContain("AJAX 基础入门教程");
      expect(result.postsBySlug["ajax-basics-intro"]?.html).toContain('id="核心概念"');
      expect(result.postsBySlug["ajax-basics-intro"]?.toc).toEqual([
        {
          id: "核心概念",
          level: 2,
          text: "核心概念",
        },
      ]);
      expect(result.author.name).toBe("木鱼");
      expect(result.author.postsCount).toBe(1);
      expect(result.friendLinks[0]?.name).toBe("Fomalhaut");
      expect(result.friendLinks[0]?.avatar).toMatch(/^\/remote-assets\/[a-f0-9]{40}\.[a-z0-9]+$/);
    } finally {
      await new Promise<void>((resolve, reject) => {
        avatarServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});

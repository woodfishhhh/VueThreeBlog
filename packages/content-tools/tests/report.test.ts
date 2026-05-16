import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { classifyUrl, scanImageUrls, summarizeFindings } from "../src/report.js";

let tempRoot = "";

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { force: true, recursive: true });
    tempRoot = "";
  }
});

describe("report tools", () => {
  it("classifies URL hosts", () => {
    expect(classifyUrl("../images/a.png").kind).toBe("local-path");
    expect(classifyUrl("https://www.woodfishhhh.xyz/images/a.png").kind).toBe("legacy-woodfish");
    expect(classifyUrl("https://img.woodfish.site/o/webp/a.webp").kind).toBe("muyu");
    expect(classifyUrl("https://example.com/a.png").kind).toBe("external");
  });

  it("scans markdown files and summarizes categories", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "content-tools-"));
    const postDir = path.join(tempRoot, "posts", "a");
    await mkdir(postDir, { recursive: true });
    await writeFile(
      path.join(postDir, "index.md"),
      `![local](../images/a.png)
![legacy](https://www.woodfishhhh.xyz/images/a.png)
![muyu](https://img.woodfish.site/o/webp/a.webp)
<img src=\"https://cdn.example.com/test.png\" />
`,
      "utf8",
    );

    const findings = await scanImageUrls(tempRoot);
    const summary = summarizeFindings(findings);
    expect(summary.total).toBe(4);
    expect(summary.localPath).toBe(1);
    expect(summary.legacyWoodfish).toBe(1);
    expect(summary.muyu).toBe(1);
    expect(summary.external).toBe(1);
  });
});

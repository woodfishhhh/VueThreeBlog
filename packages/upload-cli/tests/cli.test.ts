import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { readConfig, resolveConfigPath } from "../src/config.js";
import { runCli } from "../src/cli.js";

let tempRoot = "";

afterEach(async () => {
  vi.restoreAllMocks();
  if (tempRoot) {
    await rm(tempRoot, { force: true, recursive: true });
    tempRoot = "";
  }
  delete process.env.MUYU_UPLOAD_CONFIG;
});

describe("muyu-upload cli", () => {
  it("writes endpoint and token config", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "muyu-cli-"));
    process.env.MUYU_UPLOAD_CONFIG = path.join(tempRoot, "config.json");

    expect(await runCli(["config", "set", "endpoint", "https://img.woodfish.site"])).toBe(0);
    expect(await runCli(["config", "set", "token", "muyu_1234567890"])).toBe(0);

    const configPath = resolveConfigPath();
    const cfg = await readConfig(configPath);
    expect(cfg.endpoint).toBe("https://img.woodfish.site");
    expect(cfg.token).toBe("muyu_1234567890");
  });

  it("uploads files and prints URL lines in input order", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "muyu-cli-"));
    process.env.MUYU_UPLOAD_CONFIG = path.join(tempRoot, "config.json");

    await runCli(["config", "set", "endpoint", "https://img.woodfish.site"]);
    await runCli(["config", "set", "token", "muyu_token_abcdefgh"]);

    const firstFile = path.join(tempRoot, "a.png");
    const secondFile = path.join(tempRoot, "b.png");
    await writeFile(firstFile, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    await writeFile(secondFile, Buffer.from([0xff, 0xd8, 0xff, 0x00]));

    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        call += 1;
        const body =
          call === 1
            ? {
                id: "img_1",
                displayName: "a.png",
                width: 1,
                height: 1,
                sizeBytes: 4,
                mime: "image/png",
                hash: "h1",
                url: "https://img.woodfish.site/o/webp/1.webp",
                originalUrl: "https://img.woodfish.site/o/original/1.png",
                thumbnailUrl: null,
                markdown: "![a](https://img.woodfish.site/o/webp/1.webp)",
                createdAt: "2026-01-01T00:00:00.000Z",
                defaultVariant: "webp",
              }
            : {
                id: "img_2",
                displayName: "b.png",
                width: 1,
                height: 1,
                sizeBytes: 4,
                mime: "image/jpeg",
                hash: "h2",
                url: "https://img.woodfish.site/o/webp/2.webp",
                originalUrl: "https://img.woodfish.site/o/original/2.jpg",
                thumbnailUrl: null,
                markdown: "![b](https://img.woodfish.site/o/webp/2.webp)",
                createdAt: "2026-01-01T00:00:00.000Z",
                defaultVariant: "webp",
              };
        return new Response(JSON.stringify(body), {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        });
      }),
    );

    const stdoutChunks: string[] = [];
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
      stdoutChunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return true;
    });

    const code = await runCli(["upload", firstFile, secondFile, "--quiet"]);
    stdoutSpy.mockRestore();

    expect(code).toBe(0);
    expect(stdoutChunks.join("")).toContain("https://img.woodfish.site/o/webp/1.webp");
    expect(stdoutChunks.join("")).toContain("https://img.woodfish.site/o/webp/2.webp");
    const lines = stdoutChunks
      .join("")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    expect(lines).toEqual([
      "https://img.woodfish.site/o/webp/1.webp",
      "https://img.woodfish.site/o/webp/2.webp",
    ]);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PluginOption } from "vite-plus";
import { describe, expect, it } from "vite-plus/test";

import { createVitePlugins, normalizeBase } from "../../scripts/vite-config-helpers";
import viteConfig from "../../vite.config";

function collectPluginNames(plugins: PluginOption[]): string[] {
  return plugins.flatMap((plugin) => {
    if (!plugin) {
      return [];
    }

    if (Array.isArray(plugin)) {
      return collectPluginNames(plugin);
    }

    return typeof plugin === "object" && "name" in plugin ? [plugin.name] : [];
  });
}

describe("normalizeBase", () => {
  it("keeps deploy base paths slash-scoped for Vite and PWA", () => {
    expect(normalizeBase(undefined)).toBe("/");
    expect(normalizeBase("")).toBe("/");
    expect(normalizeBase("newBlog")).toBe("/newBlog/");
    expect(normalizeBase("/newBlog")).toBe("/newBlog/");
  });
});

describe("createVitePlugins", () => {
  it("enables the Vue productivity plugin stack", () => {
    const names = collectPluginNames(createVitePlugins({ base: "/", analyze: false }));

    expect(names).toEqual(
      expect.arrayContaining([
        "vite:vue",
        "unplugin-auto-import",
        "unplugin-vue-components",
        "vite-plugin-vue-devtools",
        "vite-plugin-inspect",
      ]),
    );
  });

  it("marks inspector plugins as serve-only while keeping build plugins enabled", () => {
    const plugins = createVitePlugins({ base: "/newBlog/", analyze: true });
    const names = collectPluginNames(plugins);

    expect(names).toContain("vite-plugin-compression");
    expect(names).toContain("vite-plugin-pwa");
    expect(names).toContain("visualizer");
    expect(JSON.stringify(plugins)).toContain('"apply":"serve"');
  });
});

describe("Vite plugin dependencies", () => {
  it("uses Vite+ package aliases and the maintained compression2 package", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { devDependencies: Record<string, string> };

    expect(packageJson.devDependencies.vite).toMatch(/^npm:@voidzero-dev\/vite-plus-core@/);
    expect(packageJson.devDependencies.vitest).toMatch(/^npm:@voidzero-dev\/vite-plus-test@/);
    expect(packageJson.devDependencies).toHaveProperty("vite-plus");
    expect(packageJson.devDependencies).toHaveProperty("vite-plugin-compression2");
    expect(packageJson.devDependencies).not.toHaveProperty("vite-plugin-compression");
  });
});

describe("Vite+ task graph", () => {
  it("uses cached Vite Task entries for agent-oriented workflows", () => {
    const config = viteConfig as {
      lint?: { options?: { typeCheck?: boolean } };
      run?: {
        cache?: boolean;
        tasks?: Record<string, { command: string; dependsOn?: string[]; output?: string[] }>;
      };
    };

    expect(config.lint?.options?.typeCheck).toBe(true);
    expect(config.run?.cache).toBe(true);
    expect(config.run?.tasks?.["app:build"]?.dependsOn).toContain("vue:typecheck");
    expect(config.run?.tasks?.["app:build"]?.output).toContain("dist/**");
    expect(config.run?.tasks?.["dist:verify"]?.command).toContain(
      "node --import tsx scripts/verify-dist.mts",
    );
    expect(config.run?.tasks?.["agent:full"]?.command).toContain("agent:static");
    expect(config.run?.tasks?.["content:index"]?.output).toEqual(
      expect.arrayContaining(["src/generated/**", "public/content-assets/**"]),
    );
  });
});

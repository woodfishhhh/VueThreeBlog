import { resolve } from "node:path";

import { defineConfig } from "vite-plus";

import { createVitePlugins, normalizeBase } from "./scripts/vite-config-helpers.ts";

const base = normalizeBase(process.env.VITE_BASE_PATH);

export default defineConfig({
  base,
  plugins: createVitePlugins({
    base,
    analyze: process.env.ANALYZE === "true",
  }),
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/build/")) {
            return "three-core";
          }

          if (id.includes("/node_modules/three/examples/jsm/controls/")) {
            return "three-addons";
          }

          if (
            id.includes("/node_modules/vue/") ||
            id.includes("/node_modules/vue-router/") ||
            id.includes("/node_modules/pinia/")
          ) {
            return "vue-vendor";
          }

          if (
            id.includes("/node_modules/highlight.js/") ||
            id.includes("/node_modules/markdown-it/") ||
            id.includes("/node_modules/markdown-it-anchor/") ||
            id.includes("/node_modules/github-slugger/")
          ) {
            return "content-vendor";
          }
        },
      },
    },
  },
  esbuild: process.env.NODE_ENV === "production" ? { drop: ["console", "debugger"] } : undefined,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
  lint: {
    ignorePatterns: [
      "dist/**",
      "node_modules/**",
      "public/**",
      "content/**",
      "src/generated/**",
      "src/auto-imports.d.ts",
      "src/components.d.ts",
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: [
      "dist/**",
      "node_modules/**",
      "public/**",
      "content/**",
      "src/generated/**",
      "src/auto-imports.d.ts",
      "src/components.d.ts",
    ],
    singleQuote: false,
    semi: true,
    sortPackageJson: true,
  },
  run: {
    enablePrePostScripts: true,
    cache: true,
    tasks: {
      "app:analyze": {
        command: "cross-env ANALYZE=true vp run app:build",
      },
      "app:build": {
        command: "vp build",
        dependsOn: ["vue:typecheck"],
        env: ["ANALYZE", "NODE_ENV", "VITE_BASE_PATH"],
        input: [
          "index.html",
          "package.json",
          "tsconfig.json",
          "vite.config.ts",
          "scripts/vite-config-helpers.ts",
          "src/**",
          "public/**",
          "!dist/**",
        ],
        output: ["dist/**"],
      },
      "agent:dist": {
        command:
          "cross-env VITE_BASE_PATH=/newBlog/ vp run app:build && cross-env VITE_BASE_PATH=/newBlog/ tsx scripts/verify-dist.mts",
      },
      "agent:fast": {
        command: "vp run check:quick && vp run test:unit",
      },
      "agent:fix": {
        command: "vp check --fix && vp run vue:typecheck",
      },
      "agent:full": {
        command: "vp run agent:static && vp run agent:test && vp run agent:dist",
      },
      "agent:inspect": {
        command: "vp dev --host 127.0.0.1 --open /__inspect/",
      },
      "agent:preview": {
        command: "vp preview --host 127.0.0.1",
      },
      "agent:static": {
        command: "vp run check:static && vp run vue:typecheck",
      },
      "agent:test": {
        command: "vp run test:unit",
      },
      "check:quick": {
        command: "vp check --no-fmt --no-error-on-unmatched-pattern",
        input: [{ auto: true }],
      },
      "check:static": {
        command: "vp check",
        input: [{ auto: true }],
      },
      "content:generate": {
        command: "vp run content:index && vp run images:optimize",
      },
      "content:generate:ci": {
        command: "vp run content:index:ci",
      },
      "content:index": {
        command: "tsx scripts/generate-content.mts",
        input: ["content/**", "package.json", "scripts/content/**", "scripts/generate-content.mts"],
        output: [
          "src/generated/**",
          "public/content-assets/**",
          "public/imported-assets/**",
          "public/remote-assets/**",
        ],
      },
      "content:index:ci": {
        command: "tsx scripts/generate-content.mts --reuse-assets",
        input: [{ auto: true }],
        output: ["src/generated/**"],
      },
      "deploy:build": {
        command:
          "vp run content:generate:ci && cross-env VITE_BASE_PATH=/newBlog/ vp run app:build && cross-env VITE_BASE_PATH=/newBlog/ tsx scripts/verify-dist.mts",
      },
      "dist:verify": {
        command: "tsx scripts/verify-dist.mts",
        untrackedEnv: ["DIST_DIR", "VITE_BASE_PATH"],
      },
      "e2e:test": {
        command: "playwright test",
        input: [{ auto: true }],
        output: ["test-results/**", "playwright-report/**"],
      },
      "images:optimize": {
        command: "tsx scripts/optimize-images.mts",
        input: [{ auto: true }],
        output: ["public/imported-assets/**", "public/remote-assets/**"],
      },
      "test:unit": {
        command: "vp test",
        input: [{ auto: true }],
      },
      "vue:typecheck": {
        command: "vue-tsc --noEmit",
        input: [
          "package.json",
          "tsconfig.json",
          "vite.config.ts",
          "scripts/**",
          "src/**",
          "tests/**",
        ],
      },
    },
  },
  staged: {
    "*.{js,ts,tsx,vue}": "vp check --fix",
    "*.{json,md,css}": "vp fmt --write",
  },
});

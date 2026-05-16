import { defineConfig } from "vite-plus";

// Repo-level Vite+ config used by git staged hooks after the monorepo move.
// Build/test/runtime config lives under apps/blog/vite.config.ts.
export default defineConfig({
  lint: {
    ignorePatterns: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
      ".tmp/**",
      ".omx/**",
      "docs/superpowers/**",
      "apps/**/dist/**",
      "packages/**/dist/**",
      "server/__pycache__/**",
      "tests/server/__pycache__/**",
    ],
    options: {
      typeAware: false,
      typeCheck: false,
    },
  },
  fmt: {
    ignorePatterns: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
      ".tmp/**",
      ".omx/**",
      "docs/superpowers/**",
      "apps/**/dist/**",
      "packages/**/dist/**",
      "server/__pycache__/**",
      "tests/server/__pycache__/**",
    ],
    singleQuote: false,
    semi: true,
    sortPackageJson: true,
  },
  staged: {
    "*.{js,cjs,mjs,ts,tsx,vue}": "vp check --fix",
    "*.{json,md,css,yml,yaml}": "vp fmt --write",
  },
});

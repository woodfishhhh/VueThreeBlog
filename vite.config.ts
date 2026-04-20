import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

function normalizeBase(value: string | undefined) {
  if (!value) {
    return "/";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE_PATH),
  plugins: [
    vue(),
    tailwindcss(),
    // 构建分析：运行 ANALYZE=true npm run build 会自动打开可视化报告
    process.env.ANALYZE === "true" ? visualizer({ filename: "dist/stats.html", open: true }) : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/build/")) {
            return "three-core";
          }

          if (id.includes("/node_modules/three/examples/jsm/controls/")) {
          return "three-addons";
        }

        if (id.includes("/node_modules/three/examples/")) {
          return "three-examples-unused";
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
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});

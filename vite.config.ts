import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
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

          if (id.includes("/node_modules/three/examples/")) {
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
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});

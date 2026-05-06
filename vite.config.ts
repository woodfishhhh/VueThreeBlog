import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

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

const base = normalizeBase(process.env.VITE_BASE_PATH);

/*
 * ============================================================
 *  Gzip / Brotli 预压缩
 * ============================================================
 * 构建完成后自动生成 .gz 压缩文件（.br 在 Node 兼容性问题，暂时禁用）。
 * nginx 配置示例（放在 server {} 块里）：
 *
 *   gzip on;
 *   gzip_types text/plain application/javascript application/json text/css;
 *   gzip_min_length 1000;
 *
 *   # Brotli（需要 nginx 安装了 brotli 模块）：
 *   brotli on;
 *   brotli_types text/plain application/javascript application/json text/css;
 *
 * 效果：nginx 直接返回 .gz / .br 文件给支持的浏览器，传输量减少 ~70-80%。
 */

const compressionPlugins = [
  viteCompression({
    algorithm: "gzip",
    ext: ".gz",
    threshold: 1024,
  }),
];

/*
 * ============================================================
 *  PWA / Service Worker
 * ============================================================
 * Service Worker = 运行在浏览器后台的脚本，可以拦截网络请求、缓存资源。
 * 相当于给你的网站加了一层"本地代理"。
 *
 * 缓存策略：
 * - 静态资源（JS/CSS/图片）：CacheFirst（优先读缓存）
 * - 文章列表 JSON：NetworkFirst（优先网络，失败读缓存）
 * - Google Fonts：StaleWhileRevalidate（返回缓存同时更新）
 *
 * 效果：
 * - 二次访问秒开（静态资源从缓存读取）
 * - 离线可用（地铁、电梯里网站也能打开）
 * - 后台更新（用户下次访问就是新版本）
 */
const pwaPlugin = VitePWA({
  registerType: "autoUpdate",
  base,
  injectRegister: "auto",
  manifest: {
    name: "WOODFISH Blog",
    short_name: "WOODFISH",
    description: "WOODFISH | Vue-powered immersive 3D blog experience",
    theme_color: "#050510",
    background_color: "#050510",
    display: "standalone",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,jpg,webp,ico,woff,woff2}"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts-cache",
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "gstatic-fonts-cache",
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /\/content\/.*\.(png|jpg|jpeg|webp|gif|svg)/i,
        handler: "CacheFirst",
        options: {
          cacheName: "content-images-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /\/post-index.*\.json/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "post-index-cache",
          expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
    ],
  },
});

export default defineConfig({
  base,
  plugins: [
    vue(),
    tailwindcss(),
    ...compressionPlugins,
    pwaPlugin,
    process.env.ANALYZE === "true"
      ? visualizer({ filename: "dist/stats.html", open: true })
      : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
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
  esbuild:
    process.env.NODE_ENV === "production"
      ? { drop: ["console", "debugger"] }
      : undefined,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});

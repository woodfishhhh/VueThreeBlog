import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { visualizer } from "rollup-plugin-visualizer";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import type { Plugin, PluginOption } from "vite-plus";
import { compression } from "vite-plugin-compression2";
import Inspect from "vite-plugin-inspect";
import { VitePWA } from "vite-plugin-pwa";
import VueDevTools from "vite-plugin-vue-devtools";

export interface CreateVitePluginsOptions {
  base: string;
  analyze: boolean;
}

export function normalizeBase(value: string | undefined) {
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

function createCompressionPlugins(): PluginOption[] {
  return [
    compression({
      algorithms: ["gzip"],
      threshold: 1024,
    }),
  ];
}

function createPwaPlugin(base: string): PluginOption {
  return VitePWA({
    registerType: "autoUpdate",
    base,
    scope: base,
    injectRegister: false,
    manifest: {
      name: "WOODFISH Blog",
      short_name: "WOODFISH",
      description: "WOODFISH | Vue-powered immersive 3D blog experience",
      theme_color: "#050510",
      background_color: "#050510",
      start_url: base,
      scope: base,
      display: "standalone",
      icons: [
        {
          src: "favicon.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
    },
    workbox: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      navigateFallback: `${base}index.html`,
      globPatterns: ["**/*.{js,css,svg,png,jpg,webp,ico,woff,woff2}"],
      navigateFallbackDenylist: [/^\/api\//i],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === "navigate",
          handler: "NetworkFirst",
          options: {
            cacheName: "page-shell-cache",
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 5 },
          },
        },
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
}

function applyServeOnly(plugin: PluginOption): PluginOption {
  if (!plugin) {
    return plugin;
  }

  if (Array.isArray(plugin)) {
    return plugin.map(applyServeOnly);
  }

  if (plugin instanceof Promise) {
    return plugin.then(applyServeOnly);
  }

  return {
    ...(plugin as Plugin),
    apply: "serve",
  };
}

export function createVitePlugins({ base, analyze }: CreateVitePluginsOptions): PluginOption[] {
  return [
    applyServeOnly(VueDevTools()),
    vue(),
    tailwindcss(),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        {
          pinia: ["acceptHMRUpdate", "createPinia", "defineStore", "storeToRefs"],
        },
      ],
      dirs: ["src/composables", "src/stores"],
      dts: "src/auto-imports.d.ts",
      dtsMode: "overwrite",
      viteOptimizeDeps: true,
    }),
    Components({
      dirs: ["src/components"],
      dts: "src/components.d.ts",
      deep: true,
      directoryAsNamespace: false,
    }),
    ...createCompressionPlugins(),
    createPwaPlugin(base),
    applyServeOnly(Inspect()),
    analyze ? visualizer({ filename: "dist/stats.html", open: true }) : null,
  ].filter(Boolean);
}

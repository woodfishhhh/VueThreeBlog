<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";

import AuthorPanel from "@/components/home/AuthorPanel.vue";
import FriendPanel from "@/components/home/FriendPanel.vue";
import PostPanel from "@/components/home/PostPanel.vue";
import ReadingOverlay from "@/components/home/ReadingOverlay.vue";
import SlideController from "@/components/home/SlideController.vue";
import WorksPanel from "@/components/home/WorksPanel.vue";
import SiteNav from "@/components/layout/SiteNav.vue";
import { useHomePanels } from "@/composables/useHomePanels";
import { useTheme } from "@/composables/useTheme";
import { useSiteStore } from "@/stores/site";

// ─────────────────────────────────────────────────────────────────────────────
// Three.js 场景懒加载
//
// 为什么用 defineAsyncComponent？
// Three.js + OrbitControls + GSAP 约 1MB+。
// 之前是静态 import，意味着即使访问 /posts/xxx（完全不需要 3D）也要下载这些代码。
//
// 改成异步 import 后：
// - 首页 / 依然会自动加载（HomeView 挂载时就加载）
// - /posts/xxx 不会加载任何 Three.js 代码
// - 等效减少 ~1MB 的 JS 执行时间
// ─────────────────────────────────────────────────────────────────────────────
const ThreeSceneCanvas = defineAsyncComponent(
  () => import("@/components/scene/ThreeSceneCanvas.vue"),
);

const siteStore = useSiteStore();
const { theme } = useTheme();
const currentMode = computed(() => siteStore.mode);
const { posts, author, friendLinks, works, isPostsLoading, isAuthorLoading, isFriendLinksLoading } =
  useHomePanels(currentMode);

const homeHint = computed(() => siteStore.mode === "home" && !siteStore.isFocusing);
const focusHint = computed(() => siteStore.isFocusing);
const focusHintTarget = computed(() => (theme.value === "day" ? "莫比乌斯带" : "超立方体"));
</script>

<template>
  <main
    data-home-stage
    class="relative min-h-screen overflow-hidden bg-[var(--stage-bg)] text-[var(--stage-fg)]"
  >
    <SiteNav />

    <div class="fixed inset-0 z-0 h-full w-full">
      <ThreeSceneCanvas />
    </div>

    <SlideController>
      <div class="pointer-events-none fixed inset-0 z-10 flex h-full w-full">
        <Transition name="home-hint" mode="out-in">
          <div
            v-if="homeHint"
            class="pointer-events-auto absolute bottom-8 flex w-full justify-center"
          >
            <div class="animate-bounce text-sm tracking-widest text-[var(--stage-hint)] opacity-70">
              点击{{ focusHintTarget }}进行探索
            </div>
          </div>
        </Transition>

        <Transition name="focus-hint" mode="out-in">
          <div
            v-if="focusHint"
            class="pointer-events-auto absolute bottom-8 flex w-full justify-center"
          >
            <button
              class="animate-bounce cursor-pointer text-sm tracking-widest text-[var(--stage-hint)] transition-colors hover:text-[var(--stage-fg)]"
              type="button"
              @click="siteStore.exitFocus()"
            >
              沉浸模式（{{ focusHintTarget }}），点此返回
            </button>
          </div>
        </Transition>

        <div
          v-if="siteStore.mode === 'home'"
          data-panel-layer="home"
          data-panel-active="true"
          class="pointer-events-none absolute inset-0"
        />

        <div
          v-if="siteStore.mode === 'blog'"
          data-panel-layer="blog"
          data-panel-active="true"
          data-testid="blog-panel-overlay"
          class="stage-panel-gradient stage-panel-gradient--blog pointer-events-auto absolute inset-0 h-full w-full overflow-y-auto overscroll-contain p-4 pt-20 sm:p-6 sm:pt-24 md:p-8 md:pt-24 md:pl-16 lg:p-10 lg:pt-24 lg:pl-20"
        >
          <div class="flex min-h-full w-full flex-col justify-start">
            <PostPanel v-if="posts.length > 0" :posts="posts" />
            <div
              v-else
              class="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-6 py-7 text-[var(--stage-hint)]"
            >
              <div class="text-[11px] uppercase tracking-[0.36em] text-[var(--stage-hint)]">
                {{ isPostsLoading ? "Loading archive" : "Archive standby" }}
              </div>
              <p class="mt-4 w-full text-xs sm:text-sm max-w-md leading-7 text-[var(--stage-hint)]">
                {{
                  isPostsLoading
                    ? "正在按需装载文章目录，马上就能进入阅读。"
                    : "文章目录会在你进入 Blog 面板时即时载入。"
                }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="siteStore.mode === 'author'"
          data-panel-layer="author"
          data-panel-active="true"
          class="pointer-events-auto absolute inset-0"
        >
          <div class="flex h-full w-full items-center justify-center">
            <AuthorPanel v-if="author" :author="author" />
            <div
              v-else
              class="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-6 py-7 text-[var(--stage-hint)]"
            >
              <div class="text-[11px] uppercase tracking-[0.36em] text-[var(--stage-hint)]">
                {{ isAuthorLoading ? "Loading profile" : "Profile standby" }}
              </div>
              <p class="mt-4 max-w-md text-sm leading-7 text-[var(--stage-hint)]">
                {{
                  isAuthorLoading
                    ? "作者资料正在按需同步，面板即将展开。"
                    : "作者资料会在你进入 Author 面板时即时载入。"
                }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="siteStore.mode === 'friend'"
          data-panel-layer="friend"
          data-panel-active="true"
          class="stage-panel-gradient stage-panel-gradient--friend pointer-events-auto absolute inset-0 overflow-hidden"
        >
          <FriendPanel v-if="friendLinks.length > 0" :links="friendLinks" />
          <div
            v-else
            class="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-6 py-7 text-[var(--stage-hint)]"
          >
            <div class="text-[11px] uppercase tracking-[0.36em] text-[var(--stage-hint)]">
              {{ isFriendLinksLoading ? "Loading network" : "Network standby" }}
            </div>
            <p class="mt-4 max-w-md text-sm leading-7 text-[var(--stage-hint)]">
              {{
                isFriendLinksLoading
                  ? "友情链接正在按需接入，稍后会完整出现。"
                  : "友情链接会在你进入 Friend 面板时即时载入。"
              }}
            </p>
          </div>
        </div>

        <div
          v-if="siteStore.mode === 'works'"
          data-panel-layer="works"
          data-panel-active="true"
          class="stage-panel-gradient--works pointer-events-none absolute inset-0"
        >
          <WorksPanel :works="works" />
        </div>
      </div>

      <ReadingOverlay />
    </SlideController>
  </main>
</template>

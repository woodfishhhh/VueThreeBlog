<script setup lang="ts">
  import { computed } from "vue";

  import AuthorPanel from "@/components/home/AuthorPanel.vue";
  import FriendPanel from "@/components/home/FriendPanel.vue";
  import PostPanel from "@/components/home/PostPanel.vue";
  import ReadingOverlay from "@/components/home/ReadingOverlay.vue";
  import SlideController from "@/components/home/SlideController.vue";
  import WorksPanel from "@/components/home/WorksPanel.vue";
  import SiteNav from "@/components/layout/SiteNav.vue";
  import { useHomePanels } from "@/composables/useHomePanels";
  import ThreeSceneCanvas from "@/components/scene/ThreeSceneCanvas.vue";
  import { useSiteStore } from "@/stores/site";

  const siteStore = useSiteStore();
  const currentMode = computed(() => siteStore.mode);
  const { posts, author, friendLinks, works, isPostsLoading, isAuthorLoading, isFriendLinksLoading } = useHomePanels(
    currentMode,
  );

  const homeHint = computed(() => siteStore.mode === "home" && !siteStore.isFocusing);
  const focusHint = computed(() => siteStore.isFocusing);
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[#050510] text-white">
    <SiteNav />

    <div class="fixed inset-0 z-0 h-full w-full">
      <ThreeSceneCanvas />
    </div>

    <SlideController>
      <div class="pointer-events-none fixed inset-0 z-10 flex h-full w-full">
        <Transition name="home-hint" mode="out-in">
          <div v-if="homeHint" class="pointer-events-auto absolute bottom-8 flex w-full justify-center">
            <div class="animate-bounce text-sm tracking-widest text-gray-500 opacity-70"> 点击超立方体进行探索 </div>
          </div>
        </Transition>

        <Transition name="focus-hint" mode="out-in">
          <div v-if="focusHint" class="pointer-events-auto absolute bottom-8 flex w-full justify-center">
            <button
              class="animate-bounce cursor-pointer text-sm tracking-widest text-white/50 transition-colors hover:text-white"
              type="button" @click="siteStore.exitFocus()">
              沉浸模式，点此返回
            </button>
          </div>
        </Transition>

        <Transition name="blog-panel" mode="out-in">
          <div v-if="siteStore.mode === 'blog'"
            class="pointer-events-auto absolute bottom-0 left-0 h-[65vh] w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 pt-10 md:top-0 md:h-screen md:w-1/2 md:bg-gradient-to-r md:from-black/95 md:via-black/40 md:p-10 md:pl-20">
            <div class="flex h-full w-full flex-col justify-center">
              <PostPanel v-if="posts.length > 0" :posts="posts" />
              <div v-else class="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-7 text-white/60">
                <div class="text-[11px] uppercase tracking-[0.36em] text-white/35">
                  {{ isPostsLoading ? "Loading archive" : "Archive standby" }}
                </div>
                <p class="mt-4 max-w-md text-sm leading-7 text-white/60">
                  {{ isPostsLoading ? "正在按需装载文章目录，马上就能进入阅读。" : "文章目录会在你进入 Blog 面板时即时载入。" }}
                </p>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="author-panel" mode="out-in">
          <div v-if="siteStore.mode === 'author'"
            class="pointer-events-auto absolute bottom-0 right-0 h-[68vh] w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 pt-10 md:top-0 md:h-screen md:w-1/2 md:bg-gradient-to-l md:from-black/95 md:via-black/40 md:p-10 md:pr-20">
            <div class="flex h-full w-full items-center justify-center">
              <AuthorPanel v-if="author" :author="author" />
              <div v-else class="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-7 text-white/60">
                <div class="text-[11px] uppercase tracking-[0.36em] text-white/35">
                  {{ isAuthorLoading ? "Loading profile" : "Profile standby" }}
                </div>
                <p class="mt-4 max-w-md text-sm leading-7 text-white/60">
                  {{ isAuthorLoading ? "作者资料正在按需同步，面板即将展开。" : "作者资料会在你进入 Author 面板时即时载入。" }}
                </p>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="friend-panel" mode="out-in">
          <div v-if="siteStore.mode === 'friend'"
            class="pointer-events-auto absolute bottom-0 left-0 h-[62vh] w-full bg-gradient-to-t from-black/95 via-black/85 to-transparent p-6 md:h-[58vh] md:p-10">
            <FriendPanel v-if="friendLinks.length > 0" :links="friendLinks" />
            <div v-else class="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-7 text-white/60">
              <div class="text-[11px] uppercase tracking-[0.36em] text-white/35">
                {{ isFriendLinksLoading ? "Loading network" : "Network standby" }}
              </div>
              <p class="mt-4 max-w-md text-sm leading-7 text-white/60">
                {{ isFriendLinksLoading ? "友情链接正在按需接入，稍后会完整出现。" : "友情链接会在你进入 Friend 面板时即时载入。" }}
              </p>
            </div>
          </div>
        </Transition>

        <Transition name="works-panel" mode="out-in">
          <div
            v-if="siteStore.mode === 'works'"
            class="pointer-events-auto absolute bottom-0 left-0 h-[68vh] w-full bg-gradient-to-t from-black/95 via-black/85 to-transparent p-6 md:h-[62vh] md:p-10"
          >
            <WorksPanel :works="works" />
          </div>
        </Transition>
      </div>

      <ReadingOverlay />
    </SlideController>
  </main>
</template>

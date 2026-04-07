<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";

import ArticleContent from "@/components/article/ArticleContent.vue";
import { loadPostArticle } from "@/content/posts";
import { useSiteStore } from "@/stores/site";
import type { PostArticle } from "@/types/content";

const siteStore = useSiteStore();
const article = shallowRef<PostArticle | null>(null);
const isLoading = shallowRef(false);
const scrollContainerRef = shallowRef<HTMLElement | null>(null);

const activeSlug = computed(() => siteStore.activePostSlug);
const isOpen = computed(() => siteStore.mode === "reading" && !!activeSlug.value);

watch(
  activeSlug,
  async (slug) => {
    if (!slug) {
      article.value = null;
      return;
    }

    isLoading.value = true;
    article.value = await loadPostArticle(slug);
    isLoading.value = false;
  },
  { immediate: true },
);

function handleClose() {
  siteStore.closeReading();
}

function handleEsc(event: KeyboardEvent) {
  if (event.key === "Escape" && isOpen.value) {
    handleClose();
  }
}

onMounted(() => window.addEventListener("keydown", handleEsc));
onBeforeUnmount(() => window.removeEventListener("keydown", handleEsc));
</script>

<template>
  <Transition name="fade-slide">
    <div
      v-if="isOpen"
      ref="scrollContainerRef"
      class="article-overlay-scroll-root fixed inset-0 z-50 overflow-y-auto bg-[rgba(5,5,16,0.34)] p-6 backdrop-blur-sm md:p-20"
    >
      <button
        class="fixed right-8 top-8 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/50 transition-all hover:border-white/40 hover:text-white"
        type="button"
        @click="handleClose"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div v-if="isLoading" class="article-page__status mt-20">Loading article…</div>
      <ArticleContent
        v-else-if="article"
        :article="article"
        :overlay="true"
        :scroll-container="scrollContainerRef"
        class="mx-auto mt-20 max-w-5xl pb-20"
      />
      <div v-else class="article-page__status article-page__status--empty mt-20">
        <p class="article-page__status-label">Article not found</p>
        <p class="article-page__status-text">The requested post is unavailable in generated content.</p>
      </div>
    </div>
  </Transition>
</template>

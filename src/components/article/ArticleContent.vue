<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";

  import type { PostArticle } from "@/types/content";
  import ArticleToc from "./ArticleToc.vue";

  const props = withDefaults(
    defineProps<{
      article: PostArticle;
      overlay?: boolean;
      scrollContainer?: HTMLElement | null;
    }>(),
    {
      overlay: false,
      scrollContainer: null,
    }
  );

  const readProgress = ref(0);

  const eyebrowLabel = computed(() =>
    props.overlay ? "Immersive reading" : "Curated article"
  );

  const metadataItems = computed(() => [
    { label: "Published", value: props.article.publishedLabel },
    { label: "Category", value: props.article.categories[0] ?? "Notes" },
    {
      label: "Tags",
      value: props.article.tags.slice(0, 3).join(" / ") || "No tags",
    },
  ]);

  function updateReadProgress() {
    const container = props.scrollContainer;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    readProgress.value = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  }

  watch(
    () => props.scrollContainer,
    (newContainer, oldContainer) => {
      if (oldContainer) {
        oldContainer.removeEventListener("scroll", updateReadProgress);
      }
      if (newContainer) {
        newContainer.addEventListener("scroll", updateReadProgress);
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    if (props.scrollContainer) {
      props.scrollContainer.addEventListener("scroll", updateReadProgress);
    }
  });

  onUnmounted(() => {
    if (props.scrollContainer) {
      props.scrollContainer.removeEventListener("scroll", updateReadProgress);
    }
  });
</script>

<template>
  <article :aria-labelledby="`article-title-${props.article.canonicalSlug}`"
    :class="['w-full mx-auto', { 'article-view--overlay': props.overlay }]">
    <!-- 阅读进度条 -->
    <div v-if="props.overlay" class="article-progress">
      <div class="article-progress__bar" :style="{ width: `${readProgress}%` }"></div>
    </div>

    <div class="flex flex-col lg:flex-row gap-12 relative w-full items-start">
      <!-- MAIN CONTENT COLUMN -->
      <div class="w-full lg:w-[calc(100%-280px)] xl:w-[calc(100%-320px)] relative shrink-0">
        <header class="mb-12 md:mb-16 border-b border-white/10 pb-8">
          <div class="flex flex-col gap-4 mb-6">
            <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-medium">{{ eyebrowLabel }}</p>
            <h1 :id="`article-title-${props.article.canonicalSlug}`"
              class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
              {{ props.article.title }}
            </h1>
          </div>

          <div class="flex flex-col gap-6">
            <p class="text-lg md:text-xl text-white/60 leading-relaxed font-light">{{ props.article.excerpt }}</p>
            <div aria-label="Article metadata" class="flex flex-wrap gap-3">
              <span v-for="item in metadataItems" :key="item.label"
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                <span class="text-[0.65rem] uppercase tracking-wider text-white/40">{{ item.label }}</span>
                <span class="text-sm font-medium text-white/90">{{ item.value }}</span>
              </span>
            </div>
          </div>
        </header>

        <div :aria-label="`${props.article.title} content`"
          class="prose prose-invert prose-lg md:prose-xl max-w-none prose-pre:bg-[#0a0d16]/80 prose-pre:border prose-pre:border-white/5 prose-pre:shadow-2xl prose-pre:backdrop-blur-sm prose-blockquote:border-l-[#7ea8ff] prose-blockquote:bg-[#7ea8ff]/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-a:text-[#7ea8ff] prose-a:font-medium prose-a:no-underline hover:prose-a:underline hover:prose-a:underline-offset-4 prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10 prose-img:mx-auto prose-strong:text-white prose-p:text-white/80 prose-headings:text-white/95"
          id="article-container" role="region" tabindex="-1" v-html="props.article.html" />
      </div>

      <!-- TOC SIDEBAR -->
      <div
        class="hidden lg:block w-[240px] xl:w-[280px] shrink-0 sticky top-32 self-start max-h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar">
        <ArticleToc :items="props.article.toc" />
      </div>
    </div>
  </article>
</template>

<style scoped>
  .article-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    z-index: 100;
  }

  .article-progress__bar {
    height: 100%;
    background: linear-gradient(90deg, #7ea8ff, #ffc554);
    transition: width 100ms ease-out;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
  }
</style>

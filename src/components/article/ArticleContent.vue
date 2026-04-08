<script setup lang="ts">
import { computed, toRef, useTemplateRef } from "vue";

import { useArticleReading } from "@/composables/useArticleReading";
import type { PostArticle } from "@/types/content";
import ArticleHero from "./ArticleHero.vue";
import ArticleProse from "./ArticleProse.vue";
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
  },
);

const contentRoot = useTemplateRef<HTMLElement>("contentRoot");
const tocItems = computed(() => props.article.toc);
const { activeId, jumpToHeading, readProgress } = useArticleReading({
  contentRoot,
  scrollContainer: toRef(props, "scrollContainer"),
  tocItems,
});
const progressStyle = computed(() => ({ width: `${Math.round(Math.max(0, Math.min(100, readProgress.value)))}%` }));
</script>

<template>
  <article :aria-labelledby="`article-title-${props.article.canonicalSlug}`" :class="['article-view', { 'article-view--overlay': props.overlay }]">
    <div class="article-progress" :class="{ 'article-progress--overlay': props.overlay }">
      <div class="article-progress__bar" data-testid="article-progress-bar" :style="progressStyle" />
    </div>

    <div class="article-view__layout">
      <div class="article-view__column">
        <ArticleHero :article="props.article" :overlay="props.overlay" />

        <div ref="contentRoot" class="article-view__content">
          <ArticleProse :article="props.article" />
        </div>
      </div>

      <div v-if="tocItems.length > 0" class="article-view__rail">
        <ArticleToc :items="tocItems" :active-id="activeId" @jump="jumpToHeading" />
      </div>
    </div>
  </article>
</template>

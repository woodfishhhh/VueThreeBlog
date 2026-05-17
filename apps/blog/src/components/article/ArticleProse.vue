<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";

import type { PostArticle } from "@/types/content";

defineProps<{
  article: PostArticle;
}>();

const containerRef = useTemplateRef<HTMLElement>("proseContainer");

onMounted(() => {
  const el = containerRef.value;
  if (!el) return;

  const scrollRoot = el.closest<HTMLElement>("[style*='overflow'], .article-page");
  if (!scrollRoot || scrollRoot === document.documentElement) return;

  for (const img of el.querySelectorAll<HTMLImageElement>("img[loading='lazy']")) {
    img.removeAttribute("loading");
  }
});
</script>

<template>
  <section class="article-prose-shell">
    <div
      id="article-container"
      ref="proseContainer"
      class="article-markdown article-prose"
      data-testid="article-prose"
      role="region"
      tabindex="-1"
      v-html="article.html"
    />
  </section>
</template>

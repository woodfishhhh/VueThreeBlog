<script setup lang="ts">
import type { PostArticle } from "@/types/content";

defineProps<{
  article: PostArticle;
}>();
</script>

<template>
  <section class="article-prose-shell">
    <div
      id="article-container"
      class="article-markdown article-prose"
      data-testid="article-prose"
      role="region"
      tabindex="-1"
      v-html="article.html"
    />
  </section>
</template>

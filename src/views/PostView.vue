<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from "vue";
import { useRoute, type LocationQueryValue } from "vue-router";

import ArticleContent from "@/components/article/ArticleContent.vue";
import { loadPostArticle, resolvePostSlug } from "@/content/posts";
import { sanitizeSlug } from "@/utils/input-validator";
import type { PostArticle } from "@/types/content";

const route = useRoute();
const pageRoot = useTemplateRef<HTMLElement>("pageRoot");
const article = shallowRef<PostArticle | null>(null);
const isLoading = shallowRef(true);
const resolvedSlug = shallowRef("");
const blogReturnQuery = computed(() => {
  const nextQuery: Record<string, string> = {};

  for (const key of ["q", "type", "category", "tag", "sort"] as const) {
    const value = readQueryValue(route.query[key]);
    if (value) {
      nextQuery[key] = value;
    }
  }

  return nextQuery;
});
const hasBlogReturnContext = computed(() => Object.keys(blogReturnQuery.value).length > 0);
const backLinkTarget = computed(() =>
  hasBlogReturnContext.value
    ? { name: "blog", query: blogReturnQuery.value }
    : { name: "home" },
);
const backLinkLabel = computed(() => (hasBlogReturnContext.value ? "Back to Blog" : "Back Home"));

let requestToken = 0;

// slug 校验：先 sanitize 再用，防止超长或含控制字符的 slug 引发问题
const incomingSlug = computed(() => sanitizeSlug(String(route.params.slug ?? "")));

watch(
  incomingSlug,
  async (slug) => {
    const currentToken = ++requestToken;

    isLoading.value = true;
    article.value = null;
    resolvedSlug.value = "";

    const [canonicalSlug, nextArticle] = slug
      ? await Promise.all([resolvePostSlug(slug), loadPostArticle(slug)])
      : [null, null];
    if (currentToken !== requestToken) {
      return;
    }

    resolvedSlug.value = canonicalSlug ?? "";
    article.value = nextArticle;
    document.title = nextArticle ? `${nextArticle.title} | WOODFISH` : "Article not found | WOODFISH";

    if (pageRoot.value) {
      pageRoot.value.scrollTop = 0;
    }

    isLoading.value = false;
  },
  { immediate: true },
);

function readQueryValue(value: LocationQueryValue | LocationQueryValue[]) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}
</script>

<template>
  <main ref="pageRoot" class="article-page">
    <div class="article-page__ambient article-page__ambient--left" />
    <div class="article-page__ambient article-page__ambient--right" />

    <div class="article-page__nav-shell">
      <RouterLink class="article-page__nav-link" :to="backLinkTarget">
        <svg class="article-page__nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="m12 19-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
          <path d="M19 12H5" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
        </svg>
        <span>{{ backLinkLabel }}</span>
      </RouterLink>

      <span v-if="resolvedSlug" class="article-page__nav-meta">/ posts / {{ resolvedSlug }}</span>
    </div>

    <div v-if="isLoading" class="article-page__status" data-testid="post-view-loading">
      <p class="article-page__status-label">Decoding article signal</p>
      <p class="article-page__status-text">Pulling the latest generated content and aligning the reading surface.</p>
    </div>

    <div v-else-if="!article" class="article-page__status article-page__status--empty" data-testid="post-view-not-found">
      <p class="article-page__status-label">Article not found</p>
      <p class="article-page__status-text">The requested route does not map to an available post in this generated archive.</p>
    </div>

    <div v-else class="article-page__article" data-testid="post-view-article">
      <ArticleContent :article="article" :scroll-container="pageRoot" />
    </div>
  </main>
</template>

<script setup lang="ts">
import type { LocationQueryRaw } from "vue-router";

import type { PostSummary } from "@/types/content";

const props = defineProps<{
  post: PostSummary;
  blogQuery: LocationQueryRaw;
}>();
</script>

<template>
  <RouterLink
    data-testid="blog-result-card"
    :to="{ name: 'post', params: { slug: props.post.canonicalSlug }, query: props.blogQuery }"
    class="group block rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-cyan-300/35 hover:bg-white/[0.06]"
  >
    <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
      <span>{{ props.post.publishedLabel }}</span>
      <span class="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-cyan-100">
        {{ props.post.type }}
      </span>
      <span>{{ props.post.readingMinutes }} min read</span>
    </div>

    <h3 class="mt-4 text-2xl font-semibold text-white transition-colors group-hover:text-cyan-100">
      {{ props.post.title }}
    </h3>

    <p class="mt-3 text-sm leading-7 text-white/65">
      {{ props.post.excerpt }}
    </p>

    <div class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="category in props.post.categories"
        :key="category"
        class="rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-xs text-blue-100/90"
      >
        {{ category }}
      </span>
      <span
        v-for="tag in props.post.tags.slice(0, 3)"
        :key="tag"
        class="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/65"
      >
        #{{ tag }}
      </span>
    </div>
  </RouterLink>
</template>

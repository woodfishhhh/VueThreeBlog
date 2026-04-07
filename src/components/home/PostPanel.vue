<script setup lang="ts">
  import type { PostSummary } from "@/types/content";

  const props = defineProps<{
    posts: PostSummary[];
  }>();
</script>

<template>
  <div class="space-y-8 text-left">
    <h2 class="mb-8 border-b border-white/20 pb-2 text-3xl font-light text-white">Recent Posts</h2>
    <div id="post-list-container" class="max-h-[60vh] space-y-6 overflow-y-auto pr-4">
      <RouterLink v-for="post in props.posts" :key="post.canonicalSlug"
        :to="{ name: 'post', params: { slug: post.canonicalSlug } }"
        class="group block cursor-pointer rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-white/10 hover:bg-white/[0.03] active:bg-white/[0.05]">
        <div class="mb-1 text-xs text-blue-400">{{ post.publishedLabel }}</div>
        <h3 class="mb-2 text-xl font-bold text-gray-100 transition-colors group-hover:text-blue-300">
          {{ post.title }}
        </h3>
        <p class="line-clamp-2 text-sm text-gray-400">{{ post.excerpt }}</p>
      </RouterLink>
    </div>
  </div>
</template>

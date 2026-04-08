<script setup lang="ts">
import { computed } from "vue";

import {
  buildBlogFacets,
  filterBlogPosts,
  sortBlogPosts,
} from "@/content/blog-hub";
import BlogFilterRail from "@/components/home/blog/BlogFilterRail.vue";
import BlogResults from "@/components/home/blog/BlogResults.vue";
import BlogSearchBar from "@/components/home/blog/BlogSearchBar.vue";
import { useBlogQueryState } from "@/composables/useBlogQueryState";
import type { PostSummary } from "@/types/content";

const props = defineProps<{
  posts: PostSummary[];
}>();

const {
  searchQuery,
  selectedType,
  selectedCategory,
  selectedTag,
  sortKey,
  filters,
  activeQuery,
  hasActiveFilters,
  clearFilters,
} = useBlogQueryState();

const facets = computed(() => buildBlogFacets(props.posts));
const filteredPosts = computed(() => filterBlogPosts(props.posts, filters.value));
const sortedPosts = computed(() => sortBlogPosts(filteredPosts.value, sortKey.value));

function toggleType(value: string) {
  selectedType.value = selectedType.value === value ? "" : value;
}

function toggleCategory(value: string) {
  selectedCategory.value = selectedCategory.value === value ? "" : value;
}

function toggleTag(value: string) {
  selectedTag.value = selectedTag.value === value ? "" : value;
}
</script>

<template>
  <div class="space-y-6 pb-10 text-left">
    <BlogSearchBar
      :query="searchQuery"
      :total-count="props.posts.length"
      :result-count="sortedPosts.length"
      :has-active-filters="hasActiveFilters"
      @update:query="searchQuery = $event"
      @clear="clearFilters"
    />

    <div class="grid gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.95fr)] 2xl:items-start">
      <div class="min-w-0">
        <BlogResults :posts="sortedPosts" :blog-query="activeQuery" />
      </div>

      <div class="self-start 2xl:sticky 2xl:top-6">
        <BlogFilterRail
          :types="facets.types"
          :categories="facets.categories"
          :tags="facets.tags"
          :selected-type="selectedType"
          :selected-category="selectedCategory"
          :selected-tag="selectedTag"
          :sort="sortKey"
          @toggle:type="toggleType"
          @toggle:category="toggleCategory"
          @toggle:tag="toggleTag"
          @update:sort="sortKey = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlogFacet, BlogSortKey } from "@/content/blog-hub";

const props = defineProps<{
  types: BlogFacet[];
  categories: BlogFacet[];
  tags: BlogFacet[];
  selectedType: string;
  selectedCategory: string;
  selectedTag: string;
  sort: BlogSortKey;
}>();

const emit = defineEmits<{
  "toggle:type": [value: string];
  "toggle:category": [value: string];
  "toggle:tag": [value: string];
  "update:sort": [value: BlogSortKey];
}>();

const sortOptions: { value: BlogSortKey; label: string }[] = [
  { value: "latest", label: "最新优先" },
  { value: "oldest", label: "最早优先" },
  { value: "reading-time", label: "阅读时长" },
  { value: "alphabetical", label: "标题字母序" },
];
</script>

<template>
  <aside class="space-y-4 rounded-[32px] border border-white/12 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
    <div>
      <div class="text-[11px] uppercase tracking-[0.32em] text-cyan-200/60">Explore</div>
      <h3 class="mt-2 text-xl font-light text-white">筛选轨道</h3>
    </div>

    <section class="space-y-3">
      <div class="text-xs uppercase tracking-[0.24em] text-white/40">Sort</div>
      <label class="block">
        <span class="sr-only">排序方式</span>
        <select
          data-testid="blog-sort-select"
          class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
          :value="props.sort"
          @change="emit('update:sort', ($event.target as HTMLSelectElement).value as BlogSortKey)"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </section>

    <section class="space-y-3">
      <div class="text-xs uppercase tracking-[0.24em] text-white/40">Type</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="facet in props.types"
          :key="facet.value"
          :data-testid="`blog-filter-type-${facet.value}`"
          type="button"
          class="rounded-full border px-3 py-2 text-sm transition-colors"
          :class="props.selectedType === facet.value
            ? 'border-cyan-300/70 bg-cyan-400/10 text-cyan-100'
            : 'border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white'"
          :aria-pressed="props.selectedType === facet.value"
          @click="emit('toggle:type', facet.value)"
        >
          {{ facet.value }} · {{ facet.count }}
        </button>
      </div>
    </section>

    <section class="space-y-3">
      <div class="text-xs uppercase tracking-[0.24em] text-white/40">Category</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="facet in props.categories"
          :key="facet.value"
          :data-testid="`blog-filter-category-${facet.value}`"
          type="button"
          class="rounded-full border px-3 py-2 text-sm transition-colors"
          :class="props.selectedCategory === facet.value
            ? 'border-blue-300/70 bg-blue-400/10 text-blue-100'
            : 'border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white'"
          :aria-pressed="props.selectedCategory === facet.value"
          @click="emit('toggle:category', facet.value)"
        >
          {{ facet.value }} · {{ facet.count }}
        </button>
      </div>
    </section>

    <section class="space-y-3">
      <div class="text-xs uppercase tracking-[0.24em] text-white/40">Tag</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="facet in props.tags"
          :key="facet.value"
          :data-testid="`blog-filter-tag-${facet.value}`"
          type="button"
          class="rounded-full border px-3 py-2 text-sm transition-colors"
          :class="props.selectedTag === facet.value
            ? 'border-fuchsia-300/70 bg-fuchsia-400/10 text-fuchsia-100'
            : 'border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white'"
          :aria-pressed="props.selectedTag === facet.value"
          @click="emit('toggle:tag', facet.value)"
        >
          #{{ facet.value }} · {{ facet.count }}
        </button>
      </div>
    </section>
  </aside>
</template>

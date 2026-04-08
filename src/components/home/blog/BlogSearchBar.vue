<script setup lang="ts">
const props = defineProps<{
  query: string;
  totalCount: number;
  resultCount: number;
  hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
  "update:query": [value: string];
  clear: [];
}>();
</script>

<template>
  <section class="rounded-[32px] border border-white/12 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-2">
        <div class="text-[11px] uppercase tracking-[0.36em] text-cyan-200/65">Blog Navigator</div>
        <h2 class="text-3xl font-light text-white">Content Hub</h2>
        <p class="max-w-2xl text-sm leading-7 text-white/60">
          搜索标题、摘要、类型与标签，长查询会自动下探正文索引。
        </p>
      </div>

      <div class="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
        <div>{{ props.resultCount }} / {{ props.totalCount }} posts</div>
        <div class="mt-1 text-xs text-white/45">
          {{ props.hasActiveFilters ? "当前结果已按筛选器收窄。" : "当前显示完整内容索引。" }}
        </div>
      </div>
    </div>

    <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      <label class="flex-1">
        <span class="sr-only">搜索博客内容</span>
        <input
          data-testid="blog-search-input"
          :value="props.query"
          type="search"
          placeholder="搜索标题、标签、分类或正文关键字"
          class="w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-cyan-300/60"
          @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <button
        data-testid="blog-clear-filters"
        type="button"
        class="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75 transition-colors hover:border-cyan-300/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!props.hasActiveFilters"
        @click="emit('clear')"
      >
        清空筛选
      </button>
    </div>
  </section>
</template>

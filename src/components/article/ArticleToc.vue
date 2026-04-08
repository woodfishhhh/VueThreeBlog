<script setup lang="ts">
import type { TocItem } from "@/types/content";

const props = withDefaults(
  defineProps<{
    items: TocItem[];
    activeId?: string;
  }>(),
  {
    activeId: "",
  },
);

const emit = defineEmits<{
  jump: [id: string];
}>();

function handleJump(id: string) {
  emit("jump", id);
}
</script>

<template>
  <aside v-if="props.items.length > 0" class="article-toc" data-testid="article-toc" aria-label="Article table of contents">
    <div class="article-toc__card">
      <div class="article-toc__head" data-testid="article-toc-header">
        <div class="article-toc__title">Table of Contents</div>
        <div class="article-toc__meta">{{ props.items.length }} sections</div>
      </div>
      <div class="article-toc__scroll" data-testid="article-toc-scroll">
        <div class="article-toc__items">
        <button
          v-for="item in props.items"
          :key="item.id"
          :aria-current="props.activeId === item.id ? 'location' : undefined"
          :class="[
            'article-toc__item',
            `article-toc__item--level-${item.level}`,
            { 'is-active': props.activeId === item.id },
          ]"
          :data-toc-id="item.id"
          data-testid="article-toc-item"
          type="button"
          @click="handleJump(item.id)"
        >
          {{ item.text }}
        </button>
        </div>
      </div>
    </div>
  </aside>
</template>

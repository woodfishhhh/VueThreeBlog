<script setup lang="ts">
import { shallowRef } from "vue";

import type { TocItem } from "@/types/content";

const props = defineProps<{
  items: TocItem[];
}>();

const activeId = shallowRef(props.items[0]?.id ?? "");

function handleJump(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  activeId.value = id;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <aside v-if="props.items.length > 0" aria-label="文章目录" class="article-toc">
    <div class="article-toc__card">
      <div class="article-toc__title">文章目录</div>
      <div class="article-toc__items">
        <button
          v-for="item in props.items"
          :key="item.id"
          :class="[
            'article-toc__item',
            `article-toc__item--level-${item.level}`,
            { 'is-active': activeId === item.id },
          ]"
          type="button"
          @click="handleJump(item.id)"
        >
          {{ item.text }}
        </button>
      </div>
    </div>
  </aside>
</template>

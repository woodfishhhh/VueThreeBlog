<script setup lang="ts">
import { computed } from "vue";

import type { WorkProjectData } from "@/types/content";

import WorkActionLinks from "./WorkActionLinks.vue";

const props = defineProps<{
  works: WorkProjectData[];
}>();

const caseItems = computed(() =>
  props.works.map((work, index) => ({
    work,
    orderLabel: String(index + 1).padStart(2, "0"),
  })),
);
</script>

<template>
  <section class="works-case" data-testid="works-view-case">
    <div class="works-case__list">
      <article
        v-for="item in caseItems"
        :key="item.work.slug"
        class="works-case__item"
        data-testid="works-item"
      >
        <div class="works-case__meta">
          <span class="works-case__index">{{ item.orderLabel }}</span>
          <span class="works-case__kind">{{ item.work.kind }}</span>
        </div>
        <div class="works-case__content">
          <h3>{{ item.work.name }}</h3>
          <p>{{ item.work.description }}</p>
        </div>
        <WorkActionLinks :work="item.work" />
      </article>
    </div>
  </section>
</template>

<style scoped>
.works-case {
  display: grid;
  min-height: 100%;
  gap: 1rem;
}

.works-case__item {
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface-1) 82%, transparent);
  backdrop-filter: saturate(145%) blur(14px);
  -webkit-backdrop-filter: saturate(145%) blur(14px);
}

.works-case__index,
.works-case__kind {
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.works-case__index {
  color: var(--stage-hint);
}

.works-case__content p {
  margin: 0.8rem 0 0;
  color: var(--stage-hint);
  line-height: 1.75;
}

.works-case__list {
  display: grid;
  gap: 0.7rem;
}

.works-case__item {
  display: grid;
  grid-template-columns: minmax(5.6rem, auto) minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  border-radius: 22px;
  padding: 0.72rem 0.85rem;
  transition:
    border-color 180ms ease,
    transform 180ms ease;
}

.works-case__item:hover {
  border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  transform: translateY(-2px);
}

.works-case__meta {
  display: grid;
  gap: 0.45rem;
}

.works-case__kind {
  justify-self: start;
  border: 1px solid color-mix(in srgb, var(--accent) 26%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  padding: 0.35rem 0.55rem;
  color: var(--accent);
}

.works-case__content h3 {
  margin: 0;
  color: var(--stage-fg);
  font-size: clamp(1.35rem, 2vw, 1.95rem);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.05;
}

.works-case__content p {
  max-width: 42rem;
  font-size: 0.9rem;
}

:global(:root[data-theme="day"]) .works-case__item {
  background: rgba(250, 248, 241, 0.76);
}

@media (max-width: 1023px) {
  .works-case {
    align-content: start;
  }

  .works-case__item {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    border-radius: 20px;
  }
}
</style>

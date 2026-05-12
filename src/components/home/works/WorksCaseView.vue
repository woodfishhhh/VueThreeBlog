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
    <div class="works-case__hero">
      <div class="works-case__intro">
        <div class="works-case__eyebrow">Case Mode</div>
        <h3>Build Log</h3>
        <p>按项目快速阅读：用途、气质、入口和仓库，移动端默认使用这一版。</p>
      </div>

      <div class="works-case__preview" aria-hidden="true">
        <div class="works-case__preview-bar" />
        <div class="works-case__preview-body">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>

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

.works-case__hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(17rem, 1.1fr);
  gap: 1rem;
  align-items: stretch;
}

.works-case__intro,
.works-case__preview,
.works-case__item {
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface-1) 82%, transparent);
  backdrop-filter: saturate(145%) blur(14px);
  -webkit-backdrop-filter: saturate(145%) blur(14px);
}

.works-case__intro {
  display: grid;
  align-content: end;
  min-height: 8.4rem;
  border-radius: 24px;
  padding: clamp(1.15rem, 2vw, 1.6rem);
}

.works-case__eyebrow,
.works-case__index,
.works-case__kind {
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.works-case__eyebrow,
.works-case__index {
  color: var(--stage-hint);
}

.works-case__intro h3 {
  margin: 0.75rem 0 0;
  color: var(--stage-fg);
  font-size: clamp(2.2rem, 4vw, 3.35rem);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 0.95;
}

.works-case__intro p,
.works-case__content p {
  margin: 0.8rem 0 0;
  color: var(--stage-hint);
  line-height: 1.75;
}

.works-case__intro p {
  max-width: 27rem;
  font-size: 0.92rem;
}

.works-case__preview {
  overflow: hidden;
  min-height: 8.4rem;
  border-radius: 24px;
}

.works-case__preview-bar {
  height: 2rem;
  border-bottom: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--stage-fg) 6%, transparent);
}

.works-case__preview-body {
  display: grid;
  gap: 0.7rem;
  padding: clamp(1.2rem, 2vw, 1.65rem);
}

.works-case__preview-body span {
  height: 0.62rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--stage-fg) 15%, transparent);
}

.works-case__preview-body span:nth-child(2) {
  width: 74%;
}

.works-case__preview-body span:nth-child(3) {
  width: 46%;
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

:global(:root[data-theme="day"]) .works-case__intro,
:global(:root[data-theme="day"]) .works-case__preview,
:global(:root[data-theme="day"]) .works-case__item {
  background: rgba(250, 248, 241, 0.76);
}

@media (max-width: 1023px) {
  .works-case {
    align-content: start;
  }

  .works-case__hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .works-case__preview {
    display: none;
  }

  .works-case__item {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    border-radius: 20px;
  }
}
</style>

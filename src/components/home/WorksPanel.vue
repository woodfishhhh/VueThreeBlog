<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from "vue";

import WorksCaseView from "@/components/home/works/WorksCaseView.vue";
import WorksViewToggle from "@/components/home/works/WorksViewToggle.vue";
import { useSiteStore } from "@/stores/site";
import type { WorkProjectData } from "@/types/content";

defineProps<{
  works: WorkProjectData[];
}>();

const largeViewportQuery = "(min-width: 1024px)";
const isLargeViewport = shallowRef(resolveIsLargeViewport());
const store = useSiteStore();

let mediaQueryList: MediaQueryList | null = null;

const isDesktopOrbit = computed(
  () => isLargeViewport.value && store.worksViewMode === "orbit",
);
const showCaseView = computed(
  () => !isLargeViewport.value || store.worksViewMode === "case",
);
const panelDescription = computed(() =>
  isDesktopOrbit.value
    ? "作品卡片已进入 WebGL 轨道。按住卡片拖向中心，松手打开 Live 站点。"
    : "移动端使用项目列表：快速查看用途、入口和仓库。",
);

function resolveIsLargeViewport() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }

  return window.matchMedia(largeViewportQuery).matches;
}

function handleMediaChange(event: MediaQueryListEvent) {
  isLargeViewport.value = event.matches;
}

onMounted(() => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return;
  }

  mediaQueryList = window.matchMedia(largeViewportQuery);
  isLargeViewport.value = mediaQueryList.matches;

  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", handleMediaChange);
    return;
  }

  mediaQueryList.addListener(handleMediaChange);
});

onUnmounted(() => {
  if (!mediaQueryList) {
    return;
  }

  if (typeof mediaQueryList.removeEventListener === "function") {
    mediaQueryList.removeEventListener("change", handleMediaChange);
    return;
  }

  mediaQueryList.removeListener(handleMediaChange);
});
</script>

<template>
  <div class="works-panel">
    <div class="works-panel__header">
      <div class="works-panel__title">
        <div class="works-panel__eyebrow">Portfolio Matrix</div>
        <h2>Selected Works</h2>
        <p>{{ panelDescription }}</p>
      </div>
      <WorksViewToggle
        v-if="isLargeViewport"
        :model-value="store.worksViewMode"
        class="works-panel__toggle"
        @update:model-value="store.setWorksViewMode"
      />
    </div>

    <ul v-if="isDesktopOrbit" class="works-panel__a11y-links" aria-label="作品链接">
      <li v-for="work in works" :key="work.slug">
        <a :href="work.liveUrl" rel="noreferrer noopener" tabindex="-1" target="_blank">
          {{ work.name }}
        </a>
        <a :href="work.githubUrl" rel="noreferrer noopener" tabindex="-1" target="_blank">
          {{ work.name }} GitHub
        </a>
      </li>
    </ul>

    <div v-if="showCaseView" class="works-panel__body">
      <WorksCaseView :works="works" />
    </div>
  </div>
</template>

<style scoped>
.works-panel {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  text-align: left;
  pointer-events: none;
}

.works-panel__header {
  display: flex;
  flex: none;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  pointer-events: none;
  padding: clamp(5rem, 8vh, 6rem) clamp(1.25rem, 3vw, 2.5rem) 0;
}

.works-panel__title {
  min-width: 0;
}

.works-panel__toggle {
  pointer-events: auto;
}

.works-panel__eyebrow {
  color: var(--stage-hint);
  font-size: 0.68rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
}

.works-panel__title h2 {
  margin: 0.75rem 0 0;
  color: var(--stage-fg);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 300;
  letter-spacing: 0;
  line-height: 1;
}

.works-panel__title p {
  max-width: 37rem;
  margin: 0.9rem 0 0;
  color: var(--stage-hint);
  font-size: 0.92rem;
  line-height: 1.8;
}

.works-panel__body {
  min-height: 0;
  flex: 1;
  overflow: auto;
  pointer-events: auto;
}

.works-panel__a11y-links {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 1023px) {
  .works-panel {
    overflow-y: auto;
    pointer-events: auto;
  }

  .works-panel__header {
    display: block;
    pointer-events: auto;
    padding: 5rem 1.25rem 0;
  }

  .works-panel__title h2 {
    font-size: clamp(1.9rem, 11vw, 3.2rem);
  }

  .works-panel__title p {
    font-size: 0.88rem;
  }

  .works-panel__body {
    overflow-y: visible;
    padding: 1rem 1.25rem 4rem;
  }
}
</style>

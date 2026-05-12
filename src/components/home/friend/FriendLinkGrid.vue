<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import type { ComponentPublicInstance } from "vue";

import FriendLinkCard from "@/components/home/friend/FriendLinkCard.vue";
import type { FriendLinkData } from "@/types/content";

const props = defineProps<{
  links: FriendLinkData[];
}>();

interface FriendCardLayout {
  id: string;
  link: FriendLinkData;
  minHeight: number;
  rotateDeg: number;
  weight: number;
}

const layoutCards = shallowRef<FriendCardLayout[]>([]);
const scrollerRef = shallowRef<HTMLElement | null>(null);
const segmentElements = shallowRef<Array<HTMLElement | null>>([]);

const waterfallColumns = computed(() => splitIntoColumns(layoutCards.value));
const loopSegments = [
  { id: "before", label: "clone-before", ariaHidden: true },
  { id: "main", label: "main", ariaHidden: false },
  { id: "after", label: "clone-after", ariaHidden: true },
] as const;

let isRecentering = false;
let resetFrame = 0;
let releaseFrame = 0;
let resizeObserver: ResizeObserver | undefined;

watch(
  () => props.links,
  async () => {
    layoutCards.value = createCardLayout(props.links);
    await nextTick();
    scheduleLoopReset();
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof ResizeObserver === "function" && scrollerRef.value) {
    resizeObserver = new ResizeObserver(() => scheduleLoopReset());
    resizeObserver.observe(scrollerRef.value);
  }

  scheduleLoopReset();
});

onBeforeUnmount(() => {
  if (resetFrame) {
    window.cancelAnimationFrame(resetFrame);
  }

  if (releaseFrame) {
    window.cancelAnimationFrame(releaseFrame);
  }

  resizeObserver?.disconnect();
});

function createCardLayout(links: FriendLinkData[]) {
  return shuffleLinks(links).map((link, index) => {
    const descriptionLength = link.descr?.length ?? 0;
    const randomBucket = Math.floor(Math.random() * 3);
    const baseHeight = 230 + Math.min(Math.floor(descriptionLength / 14), 7) * 12;

    return {
      id: `${link.name}-${link.link}-${index}`,
      link,
      minHeight: baseHeight + randomBucket * 18,
      rotateDeg: Number(((Math.random() - 0.5) * 4.8).toFixed(2)),
      weight: baseHeight + randomBucket * 18,
    };
  });
}

function shuffleLinks(links: FriendLinkData[]) {
  const shuffled = [...links];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function splitIntoColumns(cards: FriendCardLayout[]) {
  const columns: FriendCardLayout[][] = [[], []];
  const heights = [0, 0];

  cards.forEach((card) => {
    const targetColumn = heights[0] <= heights[1] ? 0 : 1;
    columns[targetColumn].push(card);
    heights[targetColumn] += card.weight;
  });

  return columns;
}

function setSegmentRef(
  element: Element | ComponentPublicInstance | null,
  index: number,
) {
  segmentElements.value[index] = element instanceof HTMLElement ? element : null;
}

function getSegmentDistance() {
  const firstSegment = segmentElements.value[0];
  const middleSegment = segmentElements.value[1];

  if (!firstSegment || !middleSegment) {
    return 0;
  }

  return middleSegment.offsetTop - firstSegment.offsetTop;
}

function scheduleLoopReset() {
  if (typeof window === "undefined") {
    return;
  }

  if (resetFrame) {
    window.cancelAnimationFrame(resetFrame);
  }

  resetFrame = window.requestAnimationFrame(() => {
    resetFrame = 0;
    resetLoopPosition();
  });
}

function resetLoopPosition() {
  const scroller = scrollerRef.value;
  const distance = getSegmentDistance();

  if (!scroller || distance <= 0 || scroller.scrollHeight <= scroller.clientHeight) {
    return;
  }

  isRecentering = true;
  scroller.scrollTop = distance;
  releaseRecenteringLock();
}

function releaseRecenteringLock() {
  if (releaseFrame) {
    window.cancelAnimationFrame(releaseFrame);
  }

  releaseFrame = window.requestAnimationFrame(() => {
    releaseFrame = 0;
    isRecentering = false;
  });
}

function handleLoopScroll() {
  if (isRecentering) {
    return;
  }

  const scroller = scrollerRef.value;
  const distance = getSegmentDistance();

  if (!scroller || distance <= 0) {
    return;
  }

  const lowerLimit = distance * 0.45;
  const upperLimit = distance * 1.55;

  if (scroller.scrollTop < lowerLimit) {
    isRecentering = true;
    scroller.scrollTop += distance;
    releaseRecenteringLock();
    return;
  }

  if (scroller.scrollTop > upperLimit) {
    isRecentering = true;
    scroller.scrollTop -= distance;
    releaseRecenteringLock();
  }
}
</script>

<template>
  <div
    id="friend-links-container"
    ref="scrollerRef"
    data-testid="friend-loop-scroller"
    class="friend-loop-scroller"
    @scroll="handleLoopScroll"
  >
    <div class="friend-loop-stack">
      <section
        v-for="(segment, segmentIndex) in loopSegments"
        :key="segment.id"
        :ref="(element) => setSegmentRef(element, segmentIndex)"
        :aria-hidden="segment.ariaHidden ? 'true' : undefined"
        :data-segment="segment.label"
        data-testid="friend-loop-segment"
        class="friend-loop-segment"
      >
        <TransitionGroup
          v-for="(column, columnIndex) in waterfallColumns"
          :key="`${segment.id}-${columnIndex}`"
          name="friend-card-list"
          tag="div"
          class="friend-waterfall-column"
        >
          <FriendLinkCard
            v-for="card in column"
            :key="`${segment.id}-${card.id}`"
            :link="card.link"
            :focusable="!segment.ariaHidden"
            :min-height="card.minHeight"
            :rotate-deg="card.rotateDeg"
          />
        </TransitionGroup>
      </section>
    </div>
  </div>
</template>

<style scoped>
.friend-loop-scroller {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.35rem 0.65rem 1.8rem;
  scroll-behavior: auto;
  scrollbar-width: none;
}

.friend-loop-scroller::-webkit-scrollbar {
  display: none;
}

.friend-loop-stack {
  display: grid;
  gap: 1.25rem;
}

.friend-loop-segment {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.05rem;
  padding-block: 0.35rem;
}

.friend-waterfall-column {
  display: grid;
  align-content: start;
  gap: 1.05rem;
}

.friend-card-list-enter-active,
.friend-card-list-leave-active,
.friend-card-list-move {
  transition:
    opacity 260ms ease,
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.friend-card-list-enter-from,
.friend-card-list-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

@media (min-width: 768px) {
  .friend-loop-scroller {
    padding: 0.5rem 0.9rem 2.2rem;
  }

  .friend-loop-segment {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1.25rem;
  }

  .friend-waterfall-column {
    gap: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .friend-loop-scroller {
    scroll-behavior: auto;
  }

  .friend-card-list-enter-active,
  .friend-card-list-leave-active,
  .friend-card-list-move {
    transition: none;
  }
}
</style>

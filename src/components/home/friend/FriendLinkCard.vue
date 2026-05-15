<script setup lang="ts">
import { computed, shallowRef } from "vue";

import type { FriendLinkData } from "@/types/content";

const props = withDefaults(
  defineProps<{
    link: FriendLinkData;
    focusable?: boolean;
    rotateDeg?: number;
  }>(),
  {
    focusable: true,
    rotateDeg: 0,
  },
);

const avatarBroken = shallowRef(false);

const domain = computed(() => {
  try {
    return new URL(props.link.link).hostname.replace(/^www\./, "");
  } catch {
    return props.link.link.replace(/^https?:\/\//, "").split(/[/?#]/)[0] || props.link.link;
  }
});

const cardStyle = computed<Record<string, string>>(() => ({
  "--card-rotate": `${props.rotateDeg}deg`,
}));
</script>

<template>
  <a
    data-testid="friend-link-card"
    :href="props.link.link"
    :style="cardStyle"
    :tabindex="props.focusable ? undefined : -1"
    class="friend-link-card group"
    rel="noreferrer noopener"
    target="_blank"
  >
    <div class="friend-link-card__pin" aria-hidden="true" />
    <div class="friend-link-card__inner">
      <div class="flex items-start gap-4">
        <img
          v-if="props.link.avatar && !avatarBroken"
          :alt="props.link.name"
          :src="props.link.avatar"
          class="h-16 w-16 shrink-0 rounded-[8px] border border-[var(--border-subtle)] object-cover shadow-[0_10px_28px_rgba(34,24,12,0.2)]"
          loading="lazy"
          @error="avatarBroken = true"
        />
        <div
          v-else
          class="h-16 w-16 shrink-0 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-soft)]"
        />

        <div class="min-w-0 flex-1">
          <h3 class="truncate text-xl font-semibold text-[var(--stage-fg)]">
            {{ props.link.name }}
          </h3>
          <p class="mt-2 truncate text-[12px] text-[var(--stage-hint-strong)]">
            {{ domain }}
          </p>
        </div>
      </div>

      <p class="friend-link-card__description mt-6 text-[15px] leading-7 text-[var(--stage-hint)]">
        {{ props.link.descr || "新的博客坐标，等待下一次相遇。" }}
      </p>
    </div>
  </a>
</template>

<style scoped>
.friend-link-card {
  position: relative;
  display: block;
  overflow: hidden;
  border: 1px solid rgba(76, 61, 43, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 253, 246, 0.85), rgba(250, 245, 232, 0.72)),
    var(--surface-soft);
  color: var(--stage-fg);
  box-shadow: 0 24px 52px rgba(37, 28, 16, 0.16);
  transform: rotateZ(var(--card-rotate));
  transition:
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 220ms ease;
  contain: layout style paint;
}

.friend-link-card:hover {
  border-color: rgba(53, 88, 204, 0.28);
  box-shadow: 0 30px 64px rgba(37, 28, 16, 0.22);
  transform: rotateZ(var(--card-rotate)) translateY(-6px);
}

.friend-link-card__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
}

.friend-link-card__description {
  overflow-wrap: anywhere;
}

.friend-link-card__pin {
  position: absolute;
  top: 0.7rem;
  left: 50%;
  z-index: 2;
  height: 0.6rem;
  width: 0.6rem;
  border-radius: 999px;
  background: rgba(155, 101, 24, 0.42);
  box-shadow: 0 2px 8px rgba(37, 28, 16, 0.24);
  transform: translateX(-50%);
}

:root[data-theme="night"] .friend-link-card {
  border-color: var(--border-subtle);
  background:
    linear-gradient(135deg, rgba(22, 28, 48, 0.72), rgba(12, 16, 32, 0.58)), var(--surface-soft);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

:root[data-theme="night"] .friend-link-card:hover {
  border-color: rgba(138, 178, 255, 0.3);
  box-shadow: 0 30px 78px rgba(0, 0, 0, 0.34);
}

:root[data-theme="night"] .friend-link-card__pin {
  background: rgba(138, 178, 255, 0.44);
}

@media (pointer: coarse), (prefers-reduced-motion: reduce) {
  .friend-link-card,
  .friend-link-card:hover {
    transform: none;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease;
  }
}
</style>

<script setup lang="ts">
import { shallowRef } from "vue";

import FriendLinkApplicationForm from "@/components/home/friend/FriendLinkApplicationForm.vue";
import FriendLinkGrid from "@/components/home/friend/FriendLinkGrid.vue";
import type { FriendLinkData } from "@/types/content";

const props = defineProps<{
  links: FriendLinkData[];
}>();

const isMobileApplicationOpen = shallowRef(false);

function openMobileApplication() {
  isMobileApplicationOpen.value = true;
}

function closeMobileApplication() {
  isMobileApplicationOpen.value = false;
}

function visitRandomFriend() {
  if (props.links.length === 0) {
    return;
  }

  const target = props.links[Math.floor(Math.random() * props.links.length)];
  window.open(target.link, "_blank", "noopener,noreferrer");
}
</script>

<template>
  <section
    data-testid="friend-panel-root"
    class="relative min-h-screen w-full text-[var(--stage-fg)]"
  >
    <section data-testid="friend-panel-application" class="friend-application-pane hidden md:block">
      <FriendLinkApplicationForm />
    </section>

    <section data-testid="friend-panel-grid" class="friend-links-pane">
      <header data-testid="friend-panel-hero" class="friend-links-pane__header">
        <div>
          <div class="text-[11px] tracking-[0.22em] text-[var(--stage-hint)]">邻居星球</div>
          <h2 class="mt-2 text-3xl sm:text-4xl font-light text-[var(--stage-fg)] md:text-5xl">
            友链
          </h2>
        </div>
        <div class="friend-links-pane__actions">
          <button
            data-testid="friend-random-visit"
            class="friend-links-pane__random"
            type="button"
            @click="visitRandomFriend"
          >
            随机访问
          </button>
          <span class="friend-links-pane__count">{{ props.links.length }} 个站点</span>
        </div>
      </header>

      <FriendLinkGrid :links="props.links" />
    </section>

    <button
      data-testid="friend-mobile-drawer-toggle"
      class="friend-mobile-application-trigger md:hidden"
      type="button"
      @click="openMobileApplication"
    >
      提交友链
    </button>

    <Transition name="friend-drawer">
      <div
        v-if="isMobileApplicationOpen"
        data-testid="friend-mobile-drawer"
        class="friend-mobile-drawer md:hidden"
      >
        <button
          class="friend-mobile-drawer__backdrop"
          type="button"
          aria-label="关闭提交友链抽屉"
          @click="closeMobileApplication"
        />
        <section class="friend-mobile-drawer__sheet" aria-label="提交友链">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div class="text-[11px] tracking-[0.18em] text-[var(--stage-hint)]">提交友链</div>
            <button
              data-testid="friend-mobile-drawer-close"
              class="friend-mobile-drawer__close"
              type="button"
              @click="closeMobileApplication"
            >
              关闭
            </button>
          </div>
          <FriendLinkApplicationForm />
        </section>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.friend-application-pane {
  position: fixed;
  top: 15vh;
  bottom: 12vh;
  left: 4vw;
  z-index: 22;
  width: min(28vw, 420px);
  min-width: 320px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.friend-application-pane::-webkit-scrollbar {
  display: none;
}

.friend-links-pane {
  position: fixed;
  top: 5.25rem;
  right: 1rem;
  bottom: 6rem;
  left: 1rem;
  z-index: 21;
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 251, 241, 0.72), rgba(255, 255, 255, 0.48)),
    var(--surface-soft);
  box-shadow: 0 8px 32px rgba(37, 32, 22, 0.12);
}

.friend-links-pane__header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--border-subtle);
  padding: 1.1rem 1.15rem 0.9rem;
}

.friend-links-pane__actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.55rem;
}

.friend-links-pane__random,
.friend-links-pane__count {
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--stage-hint-strong);
}

.friend-links-pane__random {
  background: rgba(255, 255, 255, 0.14);
  transition:
    border-color 180ms ease,
    color 180ms ease,
    background 180ms ease;
}

.friend-links-pane__random:hover {
  border-color: var(--border-strong);
  background: rgba(255, 255, 255, 0.2);
  color: var(--stage-fg);
}

.friend-mobile-application-trigger {
  position: fixed;
  right: 1rem;
  bottom: 1.2rem;
  z-index: 30;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--stage-fg);
  padding: 0.78rem 1.1rem;
  color: var(--stage-bg);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.2);
}

.friend-mobile-drawer {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.friend-mobile-drawer__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.34);
}

.friend-mobile-drawer__sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  max-height: 86vh;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 8px 8px 0 0;
  background: var(--stage-bg);
  padding: 1rem;
  box-shadow: 0 -24px 70px rgba(0, 0, 0, 0.32);
}

.friend-mobile-drawer__close {
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.42rem 0.75rem;
  color: var(--stage-hint-strong);
}

.friend-drawer-enter-active,
.friend-drawer-leave-active {
  transition: opacity 220ms ease;
}

.friend-drawer-enter-active .friend-mobile-drawer__sheet,
.friend-drawer-leave-active .friend-mobile-drawer__sheet {
  transition: transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.friend-drawer-enter-from,
.friend-drawer-leave-to {
  opacity: 0;
}

.friend-drawer-enter-from .friend-mobile-drawer__sheet,
.friend-drawer-leave-to .friend-mobile-drawer__sheet {
  transform: translateY(100%);
}

:root[data-theme="night"] .friend-links-pane {
  background:
    linear-gradient(135deg, rgba(12, 16, 32, 0.58), rgba(8, 12, 24, 0.42)), var(--surface-soft);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
}

:root[data-theme="night"] .friend-links-pane__random {
  background: rgba(8, 12, 24, 0.28);
}

@media (min-width: 768px) {
  .friend-links-pane {
    top: 12vh;
    right: 4vw;
    bottom: 8vh;
    left: auto;
    width: 64vw;
  }

  .friend-links-pane__header {
    padding: 1.25rem 1.45rem 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .friend-drawer-enter-active,
  .friend-drawer-leave-active,
  .friend-drawer-enter-active .friend-mobile-drawer__sheet,
  .friend-drawer-leave-active .friend-mobile-drawer__sheet {
    transition: none;
  }
}
</style>

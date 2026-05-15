<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import { playRouteTransition } from "@/composables/useRouteTransitionOrchestrator";
import { resolveTransitionIntent } from "@/motion/route-transition-intent";
import { useSiteStore, type SiteMode } from "@/stores/site";

interface Snapshot {
  routeName: string | null;
  siteMode: SiteMode;
  activePostSlug: string | null;
}

const route = useRoute();
const siteStore = useSiteStore();

let initialized = false;
let previousSnapshot: Snapshot = {
  routeName: null,
  siteMode: siteStore.mode,
  activePostSlug: siteStore.activePostSlug,
};

onMounted(() => {
  previousSnapshot = {
    routeName: typeof route.name === "string" ? route.name : null,
    siteMode: siteStore.mode,
    activePostSlug: siteStore.activePostSlug,
  };
});

watch(
  () =>
    [
      typeof route.name === "string" ? route.name : null,
      siteStore.mode,
      siteStore.activePostSlug,
    ] as const,
  ([routeName, siteMode, activePostSlug]) => {
    const nextSnapshot: Snapshot = {
      routeName,
      siteMode,
      activePostSlug,
    };

    const intent = resolveTransitionIntent({
      fromRouteName: previousSnapshot.routeName,
      toRouteName: nextSnapshot.routeName,
      fromSiteMode: previousSnapshot.siteMode,
      toSiteMode: nextSnapshot.siteMode,
      fromActivePostSlug: previousSnapshot.activePostSlug,
      toActivePostSlug: nextSnapshot.activePostSlug,
      isInitialNavigation: !initialized,
    });

    previousSnapshot = nextSnapshot;
    initialized = true;

    if (intent.type === "none") return;
    void playRouteTransition({ kind: intent.type, directEntry: intent.directEntry });
  },
  { flush: "post" },
);
</script>

<template>
  <div data-route-shell class="route-transition-shell">
    <div data-transition-scrim class="route-transition-scrim" />
    <div data-transition-blade class="route-transition-blade" />
    <div data-route-stage class="route-transition-stage">
      <RouterView v-slot="{ Component, route: routeView }">
        <component :is="Component" :key="routeView.fullPath" data-route-view />
      </RouterView>
    </div>
  </div>
</template>

<style scoped>
.route-transition-shell {
  position: relative;
  min-height: 100dvh;
}

.route-transition-stage {
  position: relative;
  min-height: 100dvh;
  z-index: 0;
}

.route-transition-scrim {
  position: fixed;
  inset: 0;
  z-index: 120;
  pointer-events: none;
  opacity: 0;
  background: rgba(6, 8, 18, 0.72);
}

.route-transition-blade {
  position: fixed;
  inset: -12% -20%;
  z-index: 121;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    100deg,
    transparent 22%,
    rgba(255, 255, 255, 0.18) 50%,
    transparent 78%
  );
  filter: blur(12px);
}
</style>

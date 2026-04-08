<script setup lang="ts">
import FriendLinkApplicationForm from "@/components/home/friend/FriendLinkApplicationForm.vue";
import FriendLinkGrid from "@/components/home/friend/FriendLinkGrid.vue";
import type { FriendLinkData } from "@/types/content";

defineProps<{
  links: FriendLinkData[];
}>();
</script>

<template>
  <section
    data-testid="friend-panel-root"
    class="relative flex min-h-full w-full flex-col gap-10 px-1 pb-12 pt-2 text-white md:gap-14 md:px-4 md:pb-16"
  >
    <header
      data-testid="friend-panel-hero"
      class="px-1 md:px-2"
    >
      <h2 class="text-4xl font-light tracking-[0.04em] text-white md:text-6xl">Friend Links</h2>
    </header>

    <section data-testid="friend-panel-grid">
      <FriendLinkGrid :links="links" />
    </section>

    <section
      data-testid="friend-panel-application"
      class="rounded-[36px] border border-white/10 bg-white/[0.045] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-md md:px-6 md:py-6"
    >
      <FriendLinkApplicationForm />
    </section>
  </section>
</template>

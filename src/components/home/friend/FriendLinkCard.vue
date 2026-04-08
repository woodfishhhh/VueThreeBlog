<script setup lang="ts">
import { shallowRef } from "vue";

import type { FriendLinkData } from "@/types/content";

const props = defineProps<{
  link: FriendLinkData;
}>();

const avatarBroken = shallowRef(false);
</script>

<template>
  <a
    data-testid="friend-link-card"
    :href="props.link.link"
    class="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.05] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-md transition-all duration-300 hover:border-cyan-200/35 hover:bg-white/[0.09] hover:-translate-y-1"
    rel="noreferrer noopener"
    target="_blank"
  >
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(103,232,249,0.12),_transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div class="relative flex h-full flex-col">
      <div class="flex items-start gap-4">
        <img
          v-if="props.link.avatar && !avatarBroken"
          :alt="props.link.name"
          :src="props.link.avatar"
          class="h-14 w-14 shrink-0 rounded-full border border-white/20 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
          @error="avatarBroken = true"
        />
        <div v-else class="h-14 w-14 shrink-0 rounded-full border border-white/15 bg-white/5" />

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <h3 class="truncate text-lg font-semibold text-white">{{ props.link.name }}</h3>
            <span class="shrink-0 text-[10px] uppercase tracking-[0.26em] text-cyan-100/55">Visit</span>
          </div>
          <p v-if="props.link.className" class="mt-2 text-[11px] uppercase tracking-[0.24em] text-white/35">
            {{ props.link.className }}
          </p>
        </div>
      </div>

      <p class="mt-5 line-clamp-3 text-sm leading-7 text-white/62">
        {{ props.link.descr || "友情链接" }}
      </p>
    </div>
  </a>
</template>

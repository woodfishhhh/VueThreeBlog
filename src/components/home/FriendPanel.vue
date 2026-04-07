<script setup lang="ts">
import { shallowRef } from "vue";

import type { FriendLinkData } from "@/types/content";

const props = defineProps<{
  links: FriendLinkData[];
}>();

const brokenAvatars = shallowRef<Record<string, boolean>>({});

function getAvatarKey(item: FriendLinkData) {
  return `${item.name}-${item.link}`;
}

function markAvatarBroken(item: FriendLinkData) {
  brokenAvatars.value = {
    ...brokenAvatars.value,
    [getAvatarKey(item)]: true,
  };
}
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <h2 class="mb-6 shrink-0 border-b border-white/20 pb-2 text-3xl font-light text-white">Friend Links</h2>
    <div id="friend-links-container" class="min-h-0 flex-1 overflow-y-auto pr-2 pb-10">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          v-for="item in props.links"
          :key="`${item.name}-${item.link}`"
          :href="item.link"
          class="group flex items-start gap-3 rounded-lg border border-white/15 bg-white/5 p-4 transition-colors hover:bg-white/10"
          rel="noreferrer noopener"
          target="_blank"
        >
          <img
            v-if="item.avatar && !brokenAvatars[getAvatarKey(item)]"
            :alt="item.name"
            :src="item.avatar"
            class="h-10 w-10 shrink-0 rounded-full border border-white/20 object-cover"
            @error="markAvatarBroken(item)"
          />
          <div v-else class="h-10 w-10 shrink-0 rounded-full border border-white/20 bg-white/5" />
          <div class="min-w-0">
            <div class="truncate font-semibold text-white transition-colors group-hover:text-blue-300">{{ item.name }}</div>
            <div class="mt-1 line-clamp-2 text-xs text-gray-300">{{ item.descr || '友情链接' }}</div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

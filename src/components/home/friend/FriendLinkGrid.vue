<script setup lang="ts">
import FriendLinkCard from "@/components/home/friend/FriendLinkCard.vue";
import type { FriendLinkData } from "@/types/content";

defineProps<{
  links: FriendLinkData[];
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    <FriendLinkCard v-for="link in links" :key="`${link.name}-${link.link}`" :link="link" />
  </div>
</template>

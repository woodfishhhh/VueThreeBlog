<script setup lang="ts">
import { icons } from "../utils/icons";

const props = defineProps<{
  name: keyof typeof icons;
  size?: number;
  spin?: boolean;
}>();

const path = icons[props.name];
const s = props.size ?? 16;
</script>

<template>
  <svg
    :width="s"
    :height="s"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="{ spinner: spin }"
    :stroke-dasharray="spin ? '32' : undefined"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

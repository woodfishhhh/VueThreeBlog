<script setup lang="ts">
const props = defineProps<{
  total: number | null;
  isLoading: boolean;
  hasError: boolean;
}>();
</script>

<template>
  <div
    v-if="!props.hasError && (props.isLoading || props.total !== null)"
    data-testid="visitor-count-badge"
    class="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--stage-hint)] backdrop-blur-md"
  >
    <span>Visitors</span>
    <span class="text-[var(--stage-fg)]">
      {{ props.isLoading ? "..." : props.total }}
    </span>
  </div>
</template>

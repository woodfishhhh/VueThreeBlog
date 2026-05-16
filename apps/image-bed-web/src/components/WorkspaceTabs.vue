<script setup lang="ts">
import type { TabEntry, TabId } from "../composables/useImageBedAdmin";
import Icon from "./Icon.vue";

const props = defineProps<{
  activeTab: TabId;
  tabs: TabEntry[];
}>();

const emit = defineEmits<{
  change: [tab: TabId];
}>();
</script>

<template>
  <nav class="workspace-tabs" aria-label="图床工作台">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :aria-current="props.activeTab === tab.id ? 'page' : undefined"
      :class="{ active: props.activeTab === tab.id }"
      type="button"
      @click="emit('change', tab.id)"
    >
      <Icon :name="tab.id" :size="16" class="tab-icon" />
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.workspace-tabs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 12px;
  border-right: 1px solid var(--line);
  background: var(--surface);
}

.workspace-tabs button {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  transition: all 120ms ease;
  position: relative;
}

.workspace-tabs button:hover:not(.active) {
  background: rgba(15, 23, 42, 0.04);
  color: var(--muted-strong);
}

.workspace-tabs button.active {
  background: rgba(15, 23, 42, 0.06);
  color: var(--ink);
}

.workspace-tabs button.active::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: var(--ink);
}

.tab-icon {
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 120ms ease;
}

.workspace-tabs button.active .tab-icon {
  opacity: 1;
}

.workspace-tabs button:hover:not(.active) .tab-icon {
  opacity: 0.8;
}

@media (max-width: 820px) {
  .workspace-tabs {
    flex-direction: row;
    overflow-x: auto;
    padding: 8px 12px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .workspace-tabs button {
    width: auto;
    white-space: nowrap;
    padding: 8px 14px;
  }

  .workspace-tabs button.active::before {
    display: none;
  }

  .workspace-tabs button.active {
    background: var(--ink);
    color: #fff;
    border-radius: var(--radius-sm);
  }
}
</style>

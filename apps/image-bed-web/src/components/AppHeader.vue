<script setup lang="ts">
import type { MeResponse } from "@woodfish-nest/shared";
import Icon from "./Icon.vue";

defineProps<{
  endpoint: string;
  me: MeResponse | null;
  notice: string;
}>();

const emit = defineEmits<{
  logout: [];
  refresh: [];
}>();
</script>

<template>
  <header class="app-header">
    <div class="app-header__identity">
      <span class="brand-mark" aria-hidden="true">M</span>
      <div>
        <p class="app-header__label">木鱼图床</p>
        <h1>资源管理</h1>
      </div>
    </div>

    <div class="app-header__meta">
      <p class="app-header__endpoint" :title="endpoint">{{ endpoint }}</p>
      <p v-if="me" class="app-header__user">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        {{ me.displayName }}
        <span class="role-badge" :class="me.role">{{ me.role }}</span>
      </p>
      <div v-if="notice" class="app-header__notice" role="status">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        {{ notice }}
      </div>
    </div>

    <div class="app-header__actions">
      <button type="button" @click="emit('refresh')">
        <Icon name="refresh" :size="13" />
        刷新
      </button>
      <button type="button" @click="emit('logout')">
        <Icon name="logout" :size="13" />
        退出
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.app-header__identity {
  display: flex;
  min-width: 0;
  gap: 10px;
  align-items: center;
}

.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--ink);
  color: #fff;
  font-size: 15px;
  font-weight: 300;
}

.app-header__label,
.app-header__endpoint,
.app-header__user,
.app-header__notice {
  margin: 0;
}

.app-header__label {
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.app-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.app-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  align-items: center;
  min-width: 0;
  color: var(--muted);
  font-size: 12px;
}

.app-header__endpoint {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__user {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--muted-strong);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.role-badge.admin {
  background: var(--ink);
  color: #fff;
}

.app-header__notice {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  animation: notice-pop 200ms ease-out;
}

@keyframes notice-pop {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.app-header__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.app-header__actions button {
  min-height: 32px;
  padding: 6px 12px;
  font-size: 13px;
}

@media (max-width: 820px) {
  .app-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .app-header__meta {
    order: 3;
    width: 100%;
  }

  .app-header__actions {
    margin-left: auto;
  }
}
</style>

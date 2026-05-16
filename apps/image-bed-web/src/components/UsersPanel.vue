<script setup lang="ts">
import type { UserRecord } from "@woodfish-nest/shared";
import Icon from "./Icon.vue";
import { formatDate } from "../utils/imageBed";

defineProps<{
  users: UserRecord[];
}>();

const emit = defineEmits<{
  disable: [id: string];
}>();
</script>

<template>
  <section class="panel users-panel" aria-labelledby="users-title">
    <div class="panel__header">
      <div>
        <p class="panel__kicker">账号</p>
        <h2 id="users-title">用户</h2>
      </div>
      <span class="count-pill">{{ users.length }} 总计</span>
    </div>

    <ul v-if="users.length > 0" class="user-list">
      <li v-for="user in users" :key="user.id" class="user-list__item">
        <div class="user-list__identity">
          <strong>{{ user.displayName }}</strong>
          <span>{{ user.email || user.id }}</span>
        </div>
        <span class="role-pill" :class="user.role">{{ user.role }}</span>
        <span class="user-list__meta">{{ user.tokenCount }} 令牌 · {{ user.imageCount }} 图片</span>
        <span class="user-list__meta">创建于 {{ formatDate(user.createdAt) }}</span>
        <button :disabled="!!user.disabledAt || user.role === 'admin'" type="button" @click="emit('disable', user.id)">
          <Icon v-if="user.disabledAt" name="check" :size="12" />
          <Icon v-else name="ban" :size="12" />
          {{ user.disabledAt ? "已禁用" : "禁用" }}
        </button>
      </li>
    </ul>

    <p v-else class="empty-state">
      <Icon name="user" :size="32" />
      <br/>
      暂无用户
    </p>
  </section>
</template>

<style scoped>
.users-panel {
  gap: 20px;
}

.user-list {
  display: grid;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.user-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) auto minmax(150px, 0.7fr) minmax(150px, 0.8fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color 120ms ease;
}

.user-list__item:hover {
  border-color: var(--line-hover);
}

.user-list__identity {
  display: grid;
  gap: 3px;
}

.user-list__identity strong {
  font-size: 14px;
  font-weight: 600;
}

.user-list__identity span {
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.user-list__meta {
  color: var(--muted);
  font-size: 12px;
}

.role-pill {
  justify-self: start;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--muted-strong);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.role-pill.admin {
  background: var(--ink);
  color: #fff;
}

@media (max-width: 920px) {
  .user-list__item {
    grid-template-columns: 1fr;
  }
}
</style>

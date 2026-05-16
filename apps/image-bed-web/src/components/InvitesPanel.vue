<script setup lang="ts">
import type { InviteRecord } from "@woodfish-nest/shared";
import Icon from "./Icon.vue";
import { formatDate } from "../utils/imageBed";

defineProps<{
  inviteExpiresAt: string;
  inviteMaxUses: number;
  invites: InviteRecord[];
  lastInviteCode: string;
}>();

const emit = defineEmits<{
  copy: [text: string];
  create: [];
  disable: [id: string];
  "update:inviteExpiresAt": [value: string];
  "update:inviteMaxUses": [value: number];
}>();
</script>

<template>
  <section class="panel invites-panel" aria-labelledby="invites-title">
    <div class="panel__header">
      <div>
        <p class="panel__kicker">成员</p>
        <h2 id="invites-title">邀请</h2>
      </div>
      <span class="count-pill">{{ invites.length }} 总计</span>
    </div>

    <form class="invite-form" @submit.prevent="emit('create')">
      <label>
        最大使用次数
        <input
          :value="inviteMaxUses"
          min="1"
          type="number"
          @input="emit('update:inviteMaxUses', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label>
        过期时间
        <input
          :value="inviteExpiresAt"
          type="datetime-local"
          @input="emit('update:inviteExpiresAt', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <button class="primary-action" type="submit">
        <Icon name="plus" :size="13" />
        创建邀请
      </button>
    </form>

    <div v-if="lastInviteCode" class="secret-box">
      <span class="secret-box__label">
        <Icon name="userPlus" :size="13" />
        邀请码
      </span>
      <code>{{ lastInviteCode }}</code>
      <button type="button" @click="emit('copy', lastInviteCode)">
        <Icon name="copy" :size="12" />
        复制
      </button>
    </div>

    <ul v-if="invites.length > 0" class="record-list">
      <li v-for="invite in invites" :key="invite.id" class="record-list__item">
        <div class="record-list__info">
          <strong>{{ invite.id }}</strong>
          <span>{{ invite.usedCount }}/{{ invite.maxUses }} 次使用</span>
        </div>
        <span class="record-list__meta">过期 {{ formatDate(invite.expiresAt) }}</span>
        <button :disabled="!!invite.disabledAt" type="button" @click="emit('disable', invite.id)">
          <Icon v-if="invite.disabledAt" name="check" :size="12" />
          <Icon v-else name="ban" :size="12" />
          {{ invite.disabledAt ? "已禁用" : "禁用" }}
        </button>
      </li>
    </ul>

    <p v-else class="empty-state">
      <Icon name="userPlus" :size="32" />
      <br/>
      暂无邀请
    </p>
  </section>
</template>

<style scoped>
.invites-panel {
  gap: 20px;
}

.invite-form {
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(180px, 260px) auto;
  gap: 14px;
  align-items: end;
  padding: 18px;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.invite-form label {
  display: grid;
  gap: 6px;
  color: var(--muted-strong);
  font-size: 13px;
  font-weight: 600;
}

.secret-box {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--success-bg);
  border: 1px solid rgba(20, 184, 166, 0.15);
}

.secret-box__label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: var(--success);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.secret-box code {
  overflow-wrap: anywhere;
  font-size: 13px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.record-list {
  display: grid;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.record-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 0.6fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color 120ms ease;
}

.record-list__item:hover {
  border-color: var(--line-hover);
}

.record-list__info {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.record-list__info strong {
  font-size: 14px;
  font-weight: 600;
}

.record-list__info span {
  color: var(--muted);
  font-size: 12px;
}

.record-list__meta {
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 780px) {
  .invite-form,
  .record-list__item,
  .secret-box {
    grid-template-columns: 1fr;
  }
}
</style>

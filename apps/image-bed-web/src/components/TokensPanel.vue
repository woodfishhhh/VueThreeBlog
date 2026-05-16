<script setup lang="ts">
import type { TokenRecord, TokenScope } from "@woodfish-nest/shared";
import Icon from "./Icon.vue";
import { formatDate } from "../utils/imageBed";

interface TokenForm {
  name: string;
  expiresAt: string;
  scopes: Set<TokenScope>;
}

defineProps<{
  lastRawToken: string;
  selectableScopes: TokenScope[];
  tokenForm: TokenForm;
  tokens: TokenRecord[];
}>();

const emit = defineEmits<{
  copy: [text: string];
  create: [];
  revoke: [id: string];
  toggleScope: [scope: TokenScope];
}>();

function scopeLabel(scope: TokenScope) {
  const map: Record<string, string> = {
    upload: "上传",
    "images:read": "读取图片",
    "images:delete": "删除图片",
    "tokens:manage": "管理令牌",
    "invites:manage": "管理邀请",
    admin: "管理员",
  };
  return map[scope] ?? scope;
}
</script>

<template>
  <section class="panel tokens-panel" aria-labelledby="tokens-title">
    <div class="panel__header">
      <div>
        <p class="panel__kicker">权限</p>
        <h2 id="tokens-title">令牌</h2>
      </div>
      <span class="count-pill">{{ tokens.length }} 总计</span>
    </div>

    <form class="token-form" @submit.prevent="emit('create')">
      <label>
        名称
        <input v-model="tokenForm.name" placeholder="typora-upload" />
      </label>
      <label>
        过期时间
        <input v-model="tokenForm.expiresAt" type="datetime-local" />
      </label>
      <fieldset>
        <legend>权限范围</legend>
        <label v-for="scope in selectableScopes" :key="scope">
          <input :checked="tokenForm.scopes.has(scope)" type="checkbox" @change="emit('toggleScope', scope)" />
          {{ scopeLabel(scope) }}
        </label>
      </fieldset>
      <button class="primary-action" type="submit">
        <Icon name="plus" :size="13" />
        创建令牌
      </button>
    </form>

    <div v-if="lastRawToken" class="secret-box">
      <span class="secret-box__label">
        <Icon name="lock" :size="13" />
        新令牌
      </span>
      <code>{{ lastRawToken }}</code>
      <button type="button" @click="emit('copy', lastRawToken)">
        <Icon name="copy" :size="12" />
        复制
      </button>
    </div>

    <ul v-if="tokens.length > 0" class="record-list">
      <li v-for="entry in tokens" :key="entry.id" class="record-list__item">
        <div class="record-list__info">
          <strong>{{ entry.name }}</strong>
          <span class="record-list__scopes">
            <span v-for="scope in entry.scopes" :key="scope" class="scope-tag">{{ scopeLabel(scope) }}</span>
          </span>
        </div>
        <span class="record-list__meta">最后使用 {{ formatDate(entry.lastUsedAt) }}</span>
        <span class="record-list__meta">过期 {{ formatDate(entry.expiresAt) }}</span>
        <button :disabled="!!entry.revokedAt" type="button" @click="emit('revoke', entry.id)">
          <Icon v-if="entry.revokedAt" name="check" :size="12" />
          <Icon v-else name="ban" :size="12" />
          {{ entry.revokedAt ? "已撤销" : "撤销" }}
        </button>
      </li>
    </ul>

    <p v-else class="empty-state">
      <Icon name="lock" :size="32" />
      <br/>
      该账号暂无令牌
    </p>
  </section>
</template>

<style scoped>
.tokens-panel {
  gap: 20px;
}

.token-form {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr);
  gap: 14px;
  align-items: end;
  padding: 18px;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.token-form label {
  display: grid;
  gap: 6px;
  color: var(--muted-strong);
  font-size: 13px;
  font-weight: 600;
}

.token-form fieldset {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  gap: 10px 16px;
  min-width: 0;
  padding: 0;
  border: 0;
}

.token-form legend {
  width: 100%;
  margin-bottom: 6px;
  color: var(--muted-strong);
  font-size: 13px;
  font-weight: 600;
}

.token-form fieldset label {
  display: inline-flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.token-form fieldset label:hover {
  border-color: var(--line);
  background: var(--surface-hover);
}

.token-form fieldset label:has(input:checked) {
  border-color: var(--accent);
  background: rgba(20, 184, 166, 0.08);
  color: var(--accent);
}

.scope-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--muted);
  font-size: 11px;
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
  grid-template-columns: minmax(0, 1.4fr) minmax(130px, 0.7fr) minmax(130px, 0.7fr) auto;
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
  gap: 6px;
  min-width: 0;
}

.record-list__info strong {
  font-size: 14px;
  font-weight: 600;
}

.record-list__scopes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.record-list__meta {
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 860px) {
  .token-form,
  .record-list__item,
  .secret-box {
    grid-template-columns: 1fr;
  }
}
</style>

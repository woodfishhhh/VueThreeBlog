<script setup lang="ts">
import type { AuditLogRecord } from "@woodfish-nest/shared";
import Icon from "./Icon.vue";
import { formatDate } from "../utils/imageBed";

defineProps<{
  auditLogs: AuditLogRecord[];
  loading: boolean;
  nextCursor: string | null;
}>();

const emit = defineEmits<{
  loadMore: [];
  reload: [];
}>();
</script>

<template>
  <section class="panel audit-panel" aria-labelledby="audit-title">
    <div class="panel__header">
      <div>
        <p class="panel__kicker">安全</p>
        <h2 id="audit-title">审计日志</h2>
      </div>
      <span class="count-pill">{{ auditLogs.length }} 已加载</span>
    </div>

    <div class="toolbar">
      <button type="button" @click="emit('reload')">
        <Icon name="refresh" :size="13" />
        刷新
      </button>
      <button :disabled="!nextCursor || loading" type="button" @click="emit('loadMore')">
        <Icon v-if="loading" name="spinner" :size="13" spin />
        {{ loading ? "加载中..." : "加载更多" }}
      </button>
    </div>

    <ol v-if="auditLogs.length > 0" class="audit-list">
      <li v-for="entry in auditLogs" :key="entry.id" class="audit-list__item">
        <div class="audit-list__info">
          <strong>{{ entry.action }}</strong>
          <span>{{ entry.targetType }} · {{ entry.targetId }}</span>
        </div>
        <span class="audit-list__meta">{{ formatDate(entry.createdAt) }}</span>
        <span class="audit-list__meta">{{ entry.actorUserId || "系统" }}</span>
        <span class="audit-list__meta">{{ entry.ip || "-" }}</span>
      </li>
    </ol>

    <p v-else class="empty-state">
      <Icon name="file" :size="32" />
      <br/>
      {{ loading ? "正在加载审计日志..." : "暂无审计记录" }}
    </p>
  </section>
</template>

<style scoped>
.audit-panel {
  gap: 20px;
}



.toolbar button {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.audit-list {
  display: grid;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.audit-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 0.8fr) minmax(150px, 0.8fr) minmax(100px, 0.6fr);
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color 120ms ease;
}

.audit-list__item:hover {
  border-color: var(--line-hover);
}

.audit-list__info {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.audit-list__info strong {
  font-size: 13px;
  font-weight: 600;
}

.audit-list__info span {
  color: var(--muted);
  font-size: 11px;
}

.audit-list__meta {
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 860px) {
  .audit-list__item {
    grid-template-columns: 1fr;
  }
}
</style>

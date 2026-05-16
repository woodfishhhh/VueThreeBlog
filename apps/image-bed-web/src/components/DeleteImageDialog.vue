<script setup lang="ts">
import type { ImageRecord } from "@woodfish-nest/shared";
import Icon from "./Icon.vue";
import { getImageThumbUrl } from "../utils/imageBed";

defineProps<{
  deleting: boolean;
  error: string;
  image: ImageRecord;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>

<template>
  <Transition name="dialog">
    <section class="dialog-backdrop" aria-modal="true" role="dialog" @click.self="emit('cancel')">
      <div class="dialog">
        <div class="dialog__header">
          <div class="dialog__icon dialog__icon--danger">
            <Icon name="trash" :size="20" />
          </div>
          <div>
            <p class="panel__kicker">确认</p>
            <h2>删除图片</h2>
          </div>
        </div>
        <img class="dialog__preview" :src="getImageThumbUrl(image)" :alt="image.altText || image.displayName" />
        <p class="dialog__name">{{ image.displayName }}</p>
        <p class="dialog__copy">此操作将隐藏该图片，已复制的链接可能仍可访问。</p>
        <p v-if="error" class="dialog__error">
          <Icon name="errorCircle" :size="14" />
          {{ error }}
</p>
        <div class="dialog__actions">
          <button
            :disabled="deleting"
            class="danger-action"
            type="button"
            @click="emit('confirm')"
          >
            <Icon v-if="deleting" name="spinner" :size="13" spin />
            {{ deleting ? "删除中..." : "删除" }}
          </button>
          <button :disabled="deleting" type="button" @click="emit('cancel')">取消</button>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(28, 25, 23, 0.35);
}

.dialog {
  display: grid;
  width: min(480px, 100%);
  gap: 14px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.dialog__header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dialog__icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border-radius: var(--radius-md);
}

.dialog__icon--danger {
  background: var(--danger-bg);
  color: var(--danger);
}

.dialog h2,
.dialog p {
  margin: 0;
}

.dialog h2 {
  font-size: 18px;
  font-weight: 700;
}

.dialog__preview {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--surface-muted);
}

.dialog__name {
  font-weight: 700;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.dialog__copy {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.dialog__error {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}



.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 180ms ease;
}

.dialog-enter-active .dialog {
  transition: transform 180ms ease, opacity 180ms ease;
}

.dialog-leave-active .dialog {
  transition: transform 140ms ease, opacity 140ms ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

.dialog-leave-to .dialog {
  opacity: 0;
  transform: scale(0.98);
}
</style>

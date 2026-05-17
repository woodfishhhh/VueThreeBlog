<script setup lang="ts">
import { shallowRef, useTemplateRef } from "vue";
import type { UploadItem } from "../composables/useImageBedAdmin";
import { formatBytes } from "../utils/imageBed";
import Icon from "./Icon.vue";

defineProps<{
  stats: {
    done: number;
    failed: number;
    total: number;
    uploading: number;
  };
  uploadQueue: UploadItem[];
}>();

const emit = defineEmits<{
  copy: [text: string];
  retry: [item: UploadItem];
  uploadFiles: [files: File[]];
}>();

const uploadInput = useTemplateRef<HTMLInputElement>("uploadInput");
const dragActive = shallowRef(false);

function emitFiles(files: FileList | null | undefined) {
  if (!files || files.length === 0) {
    return;
  }
  emit("uploadFiles", Array.from(files));
  if (uploadInput.value) {
    uploadInput.value.value = "";
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragActive.value = false;
  emitFiles(event.dataTransfer?.files);
}

function statusLabel(status: UploadItem["status"]) {
  const map: Record<string, string> = {
    pending: "等待中",
    uploading: "上传中",
    done: "已完成",
    failed: "失败",
  };
  return map[status] ?? status;
}
</script>

<template>
  <section class="panel upload-panel" aria-labelledby="upload-title">
    <div class="panel__header">
      <div>
        <p class="panel__kicker">上传</p>
        <h2 id="upload-title">上传图片</h2>
      </div>
      <dl class="metric-row" aria-label="上传队列概览">
        <div>
          <dt>总计</dt>
          <dd>{{ stats.total }}</dd>
        </div>
        <div>
          <dt>完成</dt>
          <dd>{{ stats.done }}</dd>
        </div>
        <div>
          <dt>失败</dt>
          <dd>{{ stats.failed }}</dd>
        </div>
      </dl>
    </div>

    <div
      class="dropzone"
      :class="{ drag: dragActive }"
      @dragenter.prevent="dragActive = true"
      @dragover.prevent="dragActive = true"
      @dragleave="dragActive = false"
      @drop="onDrop"
    >
      <div class="dropzone__content">
        <Icon name="uploadCloud" :size="40" class="dropzone__icon" />
        <strong>拖拽图片到此处</strong>
        <span>支持 PNG、JPEG、WebP 和 GIF 格式</span>
      </div>
      <label class="file-picker">
        <Icon name="file" :size="14" />
        选择文件
        <input ref="uploadInput" type="file" multiple accept="image/*" @change="emitFiles(uploadInput?.files)" />
      </label>
    </div>

    <ol v-if="uploadQueue.length > 0" class="upload-list" aria-label="上传队列">
      <li
        v-for="item in uploadQueue"
        :key="item.id"
        class="upload-list__item"
        :class="item.status"
      >
        <div class="upload-list__main">
          <div class="upload-list__top">
            <Icon :name="item.status === 'pending' ? 'clock' : item.status === 'uploading' ? 'spinner' : item.status === 'done' ? 'check' : 'errorCircle'" :size="14" :spin="item.status === 'uploading'" class="upload-list__status-icon" />
            <span class="upload-list__name">{{ item.name }}</span>
          </div>
          <span class="upload-list__meta">{{ formatBytes(item.sizeBytes) }} · {{ statusLabel(item.status) }}</span>
          <span v-if="item.error" class="upload-list__error">{{ item.error }}</span>
        </div>
        <div class="upload-list__actions">
          <button v-if="item.url" type="button" @click="emit('copy', item.url)">
            <Icon name="copy" :size="12" />
            链接
          </button>
          <button v-if="item.markdown" type="button" @click="emit('copy', item.markdown)">
            <Icon name="markdown" :size="12" />
            Markdown
          </button>
          <button v-if="item.originalUrl" type="button" @click="emit('copy', item.originalUrl)">
            <Icon name="image" :size="12" />
            原图
          </button>
          <button v-if="item.status === 'failed'" type="button" @click="emit('retry', item)" class="retry-btn">
            <Icon name="retry" :size="12" />
            重试
          </button>
        </div>
      </li>
    </ol>

    <p v-else class="empty-state">
      <Icon name="uploadCloud" :size="32" style="opacity:0.3;margin-bottom:8px" />
      <br/>
      拖拽图片到上方区域，或点击按钮选择文件
    </p>
  </section>
</template>

<style scoped>
.upload-panel {
  gap: 20px;
}

.dropzone {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  min-height: 180px;
  padding: 28px;
  border: 2px dashed var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-muted);
  transition: all 180ms ease;
}

.dropzone.drag {
  border-color: var(--muted);
  background: var(--surface);
}

.dropzone__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.dropzone__icon {
  color: var(--muted);
  margin-bottom: 4px;
  transition: color 180ms ease;
}

.dropzone.drag .dropzone__icon {
  color: var(--accent);
}

.dropzone strong,
.dropzone span {
  display: block;
}

.dropzone strong {
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.dropzone span {
  color: var(--muted);
  font-size: 13px;
}

.file-picker {
  position: relative;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 18px;
  border-radius: var(--radius-sm);
  background: var(--ink);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 120ms ease;
  flex-shrink: 0;
}

.file-picker:hover {
  background: #1f2937;
}

.file-picker input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.upload-list {
  display: grid;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.upload-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color 120ms ease;
}

.upload-list__item:hover {
}

.upload-list__item.done {
  border-left: 3px solid var(--success);
}

.upload-list__item.failed {
  border-left: 3px solid var(--danger);
}

.upload-list__item.uploading {
  border-left: 3px solid #f59e0b;
}

.upload-list__top {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 2px;
}

.upload-list__status-icon {
  flex-shrink: 0;
  color: var(--muted);
}

.upload-list__item.done .upload-list__status-icon {
  color: var(--success);
}

.upload-list__item.failed .upload-list__status-icon {
  color: var(--danger);
}

.upload-list__item.uploading .upload-list__status-icon {
  color: #f59e0b;
}

.upload-list__name,
.upload-list__meta,
.upload-list__error {
  display: block;
}

.upload-list__name {
  font-weight: 600;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.upload-list__meta {
  color: var(--muted);
  font-size: 12px;
}

.upload-list__error {
  color: var(--danger);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.upload-list__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.upload-list__actions button {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  font-size: 12px;
}

.upload-list__actions button.retry-btn {
  color: var(--danger);
  border-color: rgba(190, 18, 60, 0.2);
  background: var(--danger-bg);
}

.upload-list__actions button.retry-btn:hover {
  background: #fecdd3;
}

@media (max-width: 720px) {
  .dropzone {
    grid-template-columns: 1fr;
    place-items: center;
    text-align: center;
  }

  .dropzone__content {
    align-items: center;
  }

  .upload-list__item {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .upload-list__actions {
    justify-content: flex-start;
  }
}
</style>

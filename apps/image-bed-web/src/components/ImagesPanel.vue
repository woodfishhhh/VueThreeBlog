<script setup lang="ts">
import type { ImageRecord } from "@woodfish-nest/shared";
import {
  formatBytes,
  formatDate,
  getImageDisplayUrl,
  getImageMarkdown,
  getImageThumbUrl,
} from "../utils/imageBed";
import Icon from "./Icon.vue";

defineProps<{
  deletingImageIds: Set<string>;
  imageNextCursor: string | null;
  images: ImageRecord[];
  loading: boolean;
  stats: {
    count: number;
    totalBytes: number;
  };
}>();

const emit = defineEmits<{
  copy: [text: string];
  delete: [image: ImageRecord];
  loadMore: [];
  open: [url: string | undefined];
  reload: [];
}>();
</script>

<template>
  <section class="panel images-panel" aria-labelledby="images-title">
    <div class="panel__header">
      <div>
        <p class="panel__kicker">图库</p>
        <h2 id="images-title">图片</h2>
      </div>
      <dl class="metric-row" aria-label="图库概览">
        <div>
          <dt>已加载</dt>
          <dd>{{ stats.count }}</dd>
        </div>
        <div>
          <dt>大小</dt>
          <dd>{{ formatBytes(stats.totalBytes) }}</dd>
        </div>
      </dl>
    </div>

    <div class="toolbar">
      <button type="button" @click="emit('reload')">
        <Icon name="refresh" :size="13" />
        刷新
      </button>
      <button :disabled="!imageNextCursor || loading" type="button" @click="emit('loadMore')">
        <Icon v-if="loading" name="spinner" :size="13" spin />
        {{ loading ? "加载中..." : "加载更多" }}
      </button>
    </div>

    <p v-if="loading && images.length === 0" class="empty-state">
      <Icon name="image" :size="32" style="opacity:0.3;margin-bottom:8px" />
      <br/>
      正在加载图片...
    </p>
    <p v-else-if="images.length === 0" class="empty-state">
      <Icon name="image" :size="32" style="opacity:0.3;margin-bottom:8px" />
      <br/>
      暂无图片
    </p>

    <ul v-else class="image-grid" aria-label="图片列表">
      <li v-for="image in images" :key="image.id" class="image-card">
        <button class="image-card__preview" type="button" @click="emit('open', getImageDisplayUrl(image))">
          <img :src="getImageThumbUrl(image)" :alt="image.altText || image.displayName" loading="lazy" />
          <div class="image-card__overlay">
            <Icon name="external" :size="16" />
            查看大图
          </div>
        </button>
        <div class="image-card__body">
          <h3>{{ image.displayName }}</h3>
          <p>{{ image.width }} × {{ image.height }} · {{ formatBytes(image.sizeBytes) }}</p>
          <p>{{ formatDate(image.createdAt) }}</p>
        </div>
        <div class="image-card__actions">
          <button type="button" @click="emit('copy', getImageDisplayUrl(image))">
            <Icon name="copy" :size="12" />
            链接
          </button>
          <button type="button" @click="emit('copy', getImageMarkdown(image))">
            <Icon name="markdown" :size="12" />
            MD
          </button>
          <button type="button" @click="emit('open', getImageDisplayUrl(image))">
            <Icon name="external" :size="12" />
            打开
          </button>
          <button
            :disabled="deletingImageIds.has(image.id)"
            type="button"
            class="delete-btn"
            @click="emit('delete', image)"
          >
            <Icon v-if="deletingImageIds.has(image.id)" name="spinner" :size="12" spin />
            <Icon v-else name="trash" :size="12" />
            {{ deletingImageIds.has(image.id) ? "删除中..." : "删除" }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.images-panel {
  gap: 20px;
}



.toolbar button {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.image-card {
  display: grid;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line-light);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color 150ms ease;
}

.image-card:hover {
  border-color: var(--line-hover);
}

.image-card__preview {
  position: relative;
  display: block;
  width: 100%;
  height: 160px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: var(--surface-muted);
  cursor: pointer;
}

.image-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 200ms ease;
}

.image-card__preview:hover img {
  transform: scale(1.04);
}

.image-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 180ms ease;
  pointer-events: none;
}

.image-card__preview:hover .image-card__overlay {
  opacity: 1;
}

.image-card__body {
  display: grid;
  gap: 3px;
  padding: 12px 12px 6px;
}

.image-card h3,
.image-card p {
  margin: 0;
  overflow-wrap: anywhere;
}

.image-card h3 {
  font-size: 13px;
  font-weight: 600;
}

.image-card p {
  color: var(--muted);
  font-size: 11px;
}

.image-card__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 8px 12px 12px;
}

.image-card__actions button {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
}

.image-card__actions button.delete-btn {
  color: var(--danger);
  border-color: rgba(190, 18, 60, 0.15);
  background: transparent;
}

.image-card__actions button.delete-btn:hover:not(:disabled) {
  background: var(--danger-bg);
  border-color: rgba(190, 18, 60, 0.25);
}
</style>

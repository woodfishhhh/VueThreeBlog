<script setup lang="ts">
import type { WorkProjectData } from "@/types/content";

defineProps<{
  work: WorkProjectData;
  compact?: boolean;
}>();
</script>

<template>
  <div class="work-actions" :class="{ 'work-actions--compact': compact }">
    <a
      :href="work.liveUrl"
      :aria-label="`进入 ${work.name} 网站`"
      class="work-actions__link work-actions__link--live"
      data-kind="live"
      rel="noreferrer noopener"
      target="_blank"
    >
      进入网站
    </a>
    <a
      :href="work.githubUrl"
      :aria-label="`查看 ${work.name} GitHub 仓库`"
      class="work-actions__link work-actions__link--github"
      data-kind="github"
      rel="noreferrer noopener"
      target="_blank"
    >
      <svg
        aria-hidden="true"
        class="work-actions__github-icon"
        data-testid="github-icon"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.72-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.91 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.54.12-3.21 0 0 1.01-.32 3.3 1.23a11.48 11.48 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.67.24 2.9.12 3.21.77.84 1.24 1.91 1.24 3.22 0 4.59-2.8 5.61-5.48 5.91.43.37.82 1.1.82 2.22v3.29c0 .32.21.69.82.58A12 12 0 0 0 12 .5Z"
        />
      </svg>
      GitHub
    </a>
  </div>
</template>

<style scoped>
.work-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.work-actions--compact {
  gap: 0.5rem;
}

.work-actions__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.35rem;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.58rem 0.9rem;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  line-height: 1;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.work-actions--compact .work-actions__link {
  min-height: 2rem;
  padding: 0.48rem 0.7rem;
  font-size: 0.66rem;
}

.work-actions__link:hover {
  transform: translateY(-1px);
}

.work-actions__link--live {
  border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.work-actions__link--live:hover {
  border-color: color-mix(in srgb, var(--accent) 70%, transparent);
  color: var(--stage-fg);
}

.work-actions__link--github {
  gap: 0.45rem;
  color: var(--stage-hint);
  text-transform: uppercase;
}

.work-actions__link--github:hover {
  border-color: var(--border-strong);
  color: var(--stage-fg);
}

.work-actions__github-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex: none;
}
</style>

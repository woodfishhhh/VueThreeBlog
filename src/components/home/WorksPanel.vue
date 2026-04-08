<script setup lang="ts">
import type { WorkProjectData } from "@/types/content";

defineProps<{
  works: WorkProjectData[];
}>();
</script>

<template>
  <div class="flex h-full w-full flex-col text-left">
    <div class="mb-6 flex flex-col gap-3 border-b border-white/15 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div class="text-[11px] uppercase tracking-[0.45em] text-white/35">Portfolio Matrix</div>
        <h2 class="mt-3 text-3xl font-light text-white md:text-4xl">Selected Works</h2>
      </div>
      <p class="max-w-xl text-sm leading-7 text-white/55 md:text-right">
        三个项目共享同一条叙事轨道：主博客、天气工作台和几何实验，共同构成这个博客宇宙的作品入口。
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto pb-8 pr-2">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article
          v-for="work in works"
          :key="work.slug"
          data-testid="works-card"
          class="flex min-h-[230px] flex-col rounded-[22px] border border-white/12 bg-white/[0.04] p-5 transition-colors hover:border-blue-300/35 hover:bg-white/[0.06]"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-[11px] uppercase tracking-[0.34em] text-white/35">{{ work.slug }}</span>
            <span class="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-blue-100">
              {{ work.kind }}
            </span>
          </div>

          <h3 class="mt-6 text-2xl font-medium text-white">{{ work.name }}</h3>
          <p class="mt-3 flex-1 text-sm leading-7 text-white/58">{{ work.description }}</p>

          <div class="mt-6 flex flex-wrap gap-3">
            <a
              :href="work.liveUrl"
              data-kind="live"
              class="inline-flex items-center rounded-full border border-blue-300/30 bg-blue-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-blue-100 transition-colors hover:border-blue-200/55 hover:text-white"
              rel="noreferrer noopener"
              target="_blank"
            >
              Live
            </a>
            <a
              :href="work.githubUrl"
              data-kind="github"
              class="inline-flex items-center rounded-full border border-white/16 bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/76 transition-colors hover:border-white/30 hover:text-white"
              rel="noreferrer noopener"
              target="_blank"
            >
              GitHub
            </a>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

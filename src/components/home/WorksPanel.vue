<script setup lang="ts">
import type { WorkProjectData } from "@/types/content";

defineProps<{
  works: WorkProjectData[];
}>();
</script>

<template>
  <div class="flex h-full w-full flex-col text-left">
    <div class="mb-5 shrink-0 border-b border-white/20 pb-3">
      <div>
        <div class="text-[11px] uppercase tracking-[0.45em] text-white/35">Portfolio Matrix</div>
        <h2 class="mt-3 text-3xl font-light text-white md:text-[2.35rem]">Selected Works</h2>
      </div>
      <p class="mt-3 max-w-3xl text-sm leading-6 text-white/55">
        三个项目共享同一条叙事轨道：主博客、天气工作台和几何实验，共同构成这个博客宇宙的作品入口。
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto pb-6 pr-2">
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <article
          v-for="work in works"
          :key="work.slug"
          data-testid="works-card"
          class="group relative flex min-h-[270px] flex-col overflow-hidden rounded-[26px] border border-white/12 bg-white/[0.05] p-6 transition-colors hover:border-blue-300/35 hover:bg-white/[0.08]"
        >
          <a
            :href="work.liveUrl"
            :aria-label="`进入 ${work.name} 网站`"
            data-kind="card"
            class="absolute inset-0 z-10 rounded-[22px]"
            rel="noreferrer noopener"
            target="_blank"
          />

          <div class="pointer-events-none relative z-0 flex items-center justify-between gap-3">
            <span class="text-[11px] uppercase tracking-[0.34em] text-white/35">{{ work.slug }}</span>
            <span class="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-blue-100">
              {{ work.kind }}
            </span>
          </div>

          <h3 class="pointer-events-none relative z-0 mt-7 text-[1.85rem] font-medium text-white">{{ work.name }}</h3>
          <p class="pointer-events-none relative z-0 mt-3 line-clamp-3 flex-1 text-[15px] leading-7 text-white/58">{{ work.description }}</p>

          <div class="relative z-20 mt-5 flex flex-wrap gap-3">
            <a
              :href="work.liveUrl"
              data-kind="live"
              class="inline-flex items-center rounded-full border border-blue-300/30 bg-blue-300/10 px-4 py-2 text-[12px] tracking-[0.14em] text-blue-100 transition-colors hover:border-blue-200/55 hover:text-white"
              rel="noreferrer noopener"
              target="_blank"
            >
              进入网站
            </a>
            <a
              :href="work.githubUrl"
              data-kind="github"
              class="inline-flex items-center gap-2 rounded-full border border-white/16 bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/76 transition-colors hover:border-white/30 hover:text-white"
              rel="noreferrer noopener"
              target="_blank"
            >
              <svg
                data-testid="github-icon"
                aria-hidden="true"
                class="h-3.5 w-3.5"
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
        </article>
      </div>
    </div>
  </div>
</template>

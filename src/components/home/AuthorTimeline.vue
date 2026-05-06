<script setup lang="ts">
import { computed } from "vue";

import type { AuthorProfileData } from "@/types/content";

const props = defineProps<{
  author: AuthorProfileData;
}>();

const tenyearProgress = computed(() => {
  const start = new Date(props.author.tenyear.start).getTime();
  const end = new Date(props.author.tenyear.end).getTime();
  const now = Date.now();
  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  return progress.toFixed(1);
});

const rewardSum = computed(() =>
  props.author.rewardList.reduce((sum, item) => sum + item.money, 0),
);

const fallbackSkills = [
  { title: "React", color: "", img: "" },
  { title: "Three.js", color: "", img: "" },
  { title: "Next.js", color: "", img: "" },
  { title: "TailwindCSS", color: "", img: "" },
  { title: "WebGL", color: "", img: "" },
  { title: "UI/UX", color: "", img: "" },
  { title: "Framer Motion", color: "", img: "" },
  { title: "TypeScript", color: "", img: "" },
];

const displaySkills = computed(() =>
  props.author.skills.length > 0 ? props.author.skills : fallbackSkills,
);
</script>

<template>
  <!-- 11 大学进度/Tenyear -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      11
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
      {{ props.author.tenyear?.tips || 'Progress' }}
    </h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <p class="text-lg text-white/90">{{ props.author.tenyear?.title }}</p>
      <p class="mt-1 text-xs text-white/40">{{ props.author.tenyear?.text }}</p>
      <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          :style="{ width: `${tenyearProgress}%` }"
        ></div>
      </div>
      <div class="mt-1 flex justify-between text-[10px] text-white/30">
        <span>{{ props.author.tenyear?.start }}</span>
        <span>{{ tenyearProgress }}%</span>
        <span>{{ props.author.tenyear?.end }}</span>
      </div>
    </div>
  </section>

  <!-- 12 技能/Capabilities -->
  <section class="group relative space-y-6">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      12
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">Capabilities</h3>
    <div class="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-6">
      <div
        v-for="skill in displaySkills"
        :key="skill.title"
        class="group/skill flex cursor-pointer flex-col transition-transform duration-500 hover:-translate-y-1"
      >
        <div
          class="mb-3 h-px w-6 bg-white/20 transition-all duration-700 ease-out group-hover/skill:w-full group-hover/skill:bg-white"
        ></div>
        <div class="flex items-center gap-2">
          <img
            v-if="skill.img"
            :alt="skill.title"
            :src="skill.img"
            class="h-4 w-4 object-contain transition-transform duration-500 group-hover/skill:scale-110"
          />
          <span
            class="text-sm font-light tracking-wide text-white/70 transition-colors group-hover/skill:text-white md:text-base"
            >{{ skill.title }}</span
          >
        </div>
      </div>
    </div>
  </section>

  <!-- 13 打赏/Award -->
  <section
    v-if="props.author.award?.enable && props.author.rewardList?.length"
    class="group relative space-y-4"
  >
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      13
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">Support</h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <p class="text-sm text-white/60">{{ props.author.award?.description }}</p>
      <p class="mt-1 text-xs text-white/40">
        {{ props.author.award?.tips.replace('{sum}', String(rewardSum)) }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <div
          v-for="reward in props.author.rewardList"
          :key="reward.name"
          class="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1"
        >
          <i :class="reward.icon" :style="{ color: reward.color }"></i>
          <span class="text-xs text-white/60">{{ reward.name }}</span>
          <span class="text-xs text-white/80">¥{{ reward.money }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 14 Footprints (Tags) -->
  <section class="group relative space-y-6">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      14
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">Footprints</h3>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="tag in props.author.tags"
        :key="tag"
        class="cursor-default rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] font-light uppercase tracking-widest text-white/40 transition-colors duration-500 hover:bg-white hover:text-black md:text-xs"
      >
        {{ tag }}
      </span>
    </div>
  </section>
</template>

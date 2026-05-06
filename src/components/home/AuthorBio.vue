<script setup lang="ts">
import type { AuthorProfileData } from "@/types/content";

const props = defineProps<{
  author: AuthorProfileData;
}>();
</script>

<template>
  <!-- 01 哲学/Slogan -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      01
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">Philosophy</h3>
    <p class="text-xl font-extralight leading-[1.4] text-white/90 md:text-2xl">
      {{ props.author.slogan || "Simplicity is the ultimate sophistication." }}
    </p>
  </section>

  <!-- 02 简介/Biography -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      02
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">Biography</h3>
    <div
      class="border-l border-white/10 py-1 pl-6 text-sm font-light leading-relaxed text-white/60 md:text-base"
    >
      <p>{{ props.author.intro }}</p>
    </div>
  </section>

  <!-- 03 学业/Careers -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      03
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
      {{ props.author.careers?.[0]?.school || 'Career' }}
    </h3>
    <div class="border-t border-white/10 pt-6">
      <div class="flex flex-col gap-4">
        <div
          v-for="career in props.author.careers"
          :key="career.school"
          class="flex items-center gap-3"
        >
          <div class="h-2 w-2 rounded-full" :style="{ backgroundColor: career.color }"></div>
          <div class="flex-1">
            <span class="text-sm text-white/80">{{ career.school }}</span>
            <span class="ml-2 text-xs text-white/40">{{ career.major }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 04 性格/Personalities -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      04
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
      {{ props.author.personalities?.tips || 'Personalities' }}
    </h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <div class="flex items-center gap-4">
        <img
          v-if="props.author.personalities?.image"
          :src="props.author.personalities.image"
          class="h-16 w-16 rounded-lg object-cover"
        />
        <div>
          <p class="text-lg text-white/90" :style="{ color: props.author.personalities?.color }">
            {{ props.author.personalities?.title }}
          </p>
          <p class="text-sm text-white/40">{{ props.author.personalities?.type }}</p>
        </div>
      </div>
      <a
        v-if="props.author.personalities?.typeLink"
        :href="props.author.personalities.typeLink"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-block text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        {{ props.author.personalities?.linkText }}
      </a>
    </div>
  </section>

  <!-- 05 座右铭/Motto -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      05
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
      {{ props.author.motto?.title || 'Motto' }}
    </h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <p class="text-xl font-light text-white/60 md:text-2xl">
        {{ props.author.motto?.prefix }}
        <span class="text-white/90">{{ props.author.motto?.content }}</span>
      </p>
    </div>
  </section>

  <!-- 06 特长/Expertise -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      06
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
      {{ props.author.expertise?.title || 'Expertise' }}
    </h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <p class="text-sm text-white/60">
        {{ props.author.expertise?.prefix }}
        <span class="text-white/90">{{ props.author.expertise?.specialist }}</span>
        {{ props.author.expertise?.content }}
        <span class="text-white/90">{{ props.author.expertise?.level }}</span>
      </p>
    </div>
  </section>

  <!-- 07 游戏/Game -->
  <section v-if="props.author.game?.length" class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      07
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
      {{ props.author.game[0]?.title || 'Game' }}
    </h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <div
        class="relative overflow-hidden rounded-lg"
        :style="{ boxShadow: props.author.game[0]?.box_shadow }"
      >
        <img :src="props.author.game[0]?.img" class="h-32 w-full object-cover" />
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <span class="text-2xl font-bold text-white">{{ props.author.game[0]?.subtitle }}</span>
          <span class="mt-1 text-xs text-white/60">{{ props.author.game[0]?.tips_left }}</span>
          <span class="text-xs text-white/40">{{ props.author.game[0]?.tips_right }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 08 爱好/Likes -->
  <section v-if="props.author.likes?.length" class="group relative space-y-6">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      08
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">Hobbies</h3>

    <template v-for="like in props.author.likes" :key="like.type">
      <div v-if="like.type === 'comic'" class="border-l border-white/10 py-1 pl-6">
        <p class="mb-3 text-sm text-white/60">{{ like.tips }}</p>
        <p class="mb-2 text-lg text-white/90">{{ like.title }}</p>
        <p class="mb-3 text-xs text-white/40">{{ like.subtips }}</p>
        <div class="flex flex-wrap gap-2">
          <a
            v-for="item in like.list"
            :key="item.name"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            class="group relative overflow-hidden rounded"
          >
            <img
              :src="item.cover"
              class="h-16 w-12 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <span
              class="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <span class="text-[10px] text-white">{{ item.name }}</span>
            </span>
          </a>
        </div>
      </div>

      <div
        v-if="like.type === 'like-technology' && like.bg"
        class="border-l border-white/10 py-1 pl-6"
      >
        <p class="mb-2 text-sm text-white/60">{{ like.tips }}</p>
        <p class="text-lg text-white/90">{{ like.title }}</p>
        <p class="text-xs text-white/40">{{ like.subtips }}</p>
        <img :src="like.bg" class="mt-3 h-24 w-full rounded-lg object-cover" />
      </div>

      <div
        v-if="like.type === 'like-music' && like.bg"
        class="border-l border-white/10 py-1 pl-6"
      >
        <p class="mb-2 text-sm text-white/60">{{ like.tips }}</p>
        <p class="text-lg text-white/90">{{ like.title }}</p>
        <p class="text-xs text-white/40">{{ like.subtips }}</p>
        <img :src="like.bg" class="mt-3 h-24 w-full rounded-lg object-cover" />
        <a
          v-if="like.button && like.button_link"
          :href="like.button_link"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-block rounded-full border border-white/20 px-4 py-1.5 text-xs text-white/60 transition-colors hover:border-white/40 hover:text-white/80"
        >
          {{ like.button_text }}
        </a>
      </div>
    </template>
  </section>

  <!-- 09 个人信息/Oneself -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      09
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">About Me</h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-white/40">位置</span>
          <p class="text-white/80">{{ props.author.oneself?.location }}</p>
        </div>
        <div>
          <span class="text-white/40">出生</span>
          <p class="text-white/80">{{ props.author.oneself?.birthYear }}</p>
        </div>
        <div>
          <span class="text-white/40">学校</span>
          <p class="text-white/80">{{ props.author.oneself?.university }}</p>
        </div>
        <div>
          <span class="text-white/40">专业</span>
          <p class="text-white/80">{{ props.author.oneself?.major }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 10 建站原因/Cause -->
  <section class="group relative space-y-4">
    <div
      class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
    >
      10
    </div>
    <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
      {{ props.author.cause?.tip || 'Why Blog' }}
    </h3>
    <div class="border-l border-white/10 py-1 pl-6">
      <p class="text-lg text-white/90">{{ props.author.cause?.title }}</p>
      <p class="mt-1 text-sm text-white/60">{{ props.author.cause?.content }}</p>
    </div>
  </section>
</template>

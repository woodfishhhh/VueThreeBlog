<script setup lang="ts">
import { computed } from "vue";

import type { AuthorProfileData } from "@/types/content";

const props = defineProps<{
  author: AuthorProfileData;
}>();

// 计算大学进度
const tenyearProgress = computed(() => {
  const start = new Date(props.author.tenyear.start).getTime();
  const end = new Date(props.author.tenyear.end).getTime();
  const now = Date.now();
  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  return progress.toFixed(1);
});

// 格式化打赏总额
const rewardSum = computed(() => {
  return props.author.rewardList.reduce((sum, item) => sum + item.money, 0);
});

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
  props.author.skills.length > 0 ? props.author.skills : fallbackSkills
);
</script>

<template>
  <div
    id="author-scroll-container"
    class="modern-scrollbar relative h-full w-full overflow-y-auto px-6 py-16 text-white md:px-10"
  >
    <!-- 动态波浪背景 -->
    <div class="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-screen">
      <svg
        class="absolute left-0 top-[-50%] h-[200%] w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d="M0,30 Q25,10 50,30 T100,30 L100,100 L0,100 Z" fill="none" stroke="#ffffff" stroke-width="0.2">
          <animate
            attributeName="d"
            dur="15s"
            repeatCount="indefinite"
            values="M0,30 Q25,10 50,30 T100,30 L100,100 L0,100 Z;M0,30 Q25,50 50,30 T100,30 L100,100 L0,100 Z;M0,30 Q25,10 50,30 T100,30 L100,100 L0,100 Z"
          />
        </path>
        <path d="M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z" fill="none" stroke="#ffffff" stroke-width="0.2">
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values="M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z;M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z;M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z"
          />
        </path>
      </svg>
    </div>

    <div class="relative z-10 mx-auto flex max-w-[400px] flex-col gap-12 pb-32">
      <!-- 头部：头像、名称、统计、社交链接 -->
      <section class="mt-12 flex flex-col items-center text-center">
        <div
          class="mb-6 h-24 w-24 rounded-full border border-white/10 md:h-32 md:w-32"
        >
          <img
            :alt="props.author.name"
            :src="props.author.avatar || 'https://pic1.imgdb.cn/item/682f3d1658cb8da5c807b704.jpg'"
            class="h-full w-full rounded-full object-cover transition-all duration-700 ease-out md:scale-105"
          />
        </div>

        <h2
          class="mb-2 text-3xl font-bold tracking-tighter uppercase text-white/90 md:text-4xl"
        >
          {{ props.author.name }}
        </h2>
        <p class="mb-8 text-[10px] font-light uppercase tracking-[0.3em] text-white/40">
          {{ props.author.title }}
        </p>

        <!-- 个人标签 -->
        <div class="mb-6 flex flex-wrap justify-center gap-2">
          <span
            v-for="tag in props.author.leftTags"
            :key="tag"
            class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-white/50"
          >
            {{ tag }}
          </span>
          <span
            v-for="tag in props.author.rightTags"
            :key="tag"
            class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-white/50"
          >
            {{ tag }}
          </span>
        </div>

        <!-- 统计数据 -->
        <div
          class="mb-8 flex w-full justify-center gap-8 border-y border-white/5 py-6 md:gap-12"
        >
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl font-light text-white/80">{{
              props.author.postsCount
            }}</span>
            <span class="text-[9px] uppercase tracking-widest text-white/30"
              >Articles</span
            >
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl font-light text-white/80">{{
              props.author.categoriesCount
            }}</span>
            <span class="text-[9px] uppercase tracking-widest text-white/30"
              >Categories</span
            >
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl font-light text-white/80">{{
              props.author.tagsCount
            }}</span>
            <span class="text-[9px] uppercase tracking-widest text-white/30"
              >Tags</span
            >
          </div>
        </div>

        <!-- 社交链接 -->
        <div class="flex flex-wrap justify-center gap-4">
          <a
            class="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-500 hover:bg-white hover:text-black"
            href="https://github.com/woodfishhhh"
            rel="noopener noreferrer"
            target="_blank"
            title="GitHub"
          >
            <svg
              class="h-4 w-4 text-white/50 transition-colors group-hover:text-black"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
              />
            </svg>
          </a>
          <a
            class="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-500 hover:border-[#FB7299] hover:bg-[#FB7299]"
            href="https://space.bilibili.com/359728114"
            rel="noopener noreferrer"
            target="_blank"
            title="Bilibili"
          >
            <svg
              class="h-4 w-4 text-white/50 transition-colors group-hover:text-white"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <rect height="15" rx="2" ry="2" width="20" x="2" y="7" />
              <polyline points="17 2 12 7 7 2" />
            </svg>
          </a>
          <a
            class="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-500 hover:border-[#12B7F5] hover:bg-[#12B7F5]"
            href="https://www.woodfishhhh.xyz/images/af1a055d14e4f7f6eae2886f2865d13.jpg.jpeg?_t=1750312382930"
            rel="noopener noreferrer"
            target="_blank"
            title="QQ"
          >
            <svg
              class="h-4 w-4 text-white/50 transition-colors group-hover:text-white"
              fill="currentColor"
              viewBox="0 0 1024 1024"
            >
              <path
                d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z"
              />
            </svg>
          </a>
          <a
            class="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-500 hover:border-[#07C160] hover:bg-[#07C160]"
            href="https://www.woodfishhhh.xyz/images/f59723db9159310b6056abe8341f5d7.jpg.jpeg?_t=1750312263368"
            rel="noopener noreferrer"
            target="_blank"
            title="WeChat"
          >
            <svg
              class="h-4 w-4 text-white/50 transition-colors group-hover:text-white"
              fill="currentColor"
              viewBox="0 0 1024 1024"
            >
              <path
                d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 46.165436 152.460344 123.281791 205.78483l-30.80868 91.730191 107.688651-53.455469c38.558178 7.53665 69.459978 15.308661 107.924012 15.308661 9.66308 0 19.230993-0.470721 28.752858-1.225921-6.025227-20.36584-9.521864-41.723264-9.521864-63.862493C402.328693 476.632491 517.908058 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.557154 15.120372 38.557154 38.061874 0 22.846334-15.356756 38.156018-38.557154 38.156018-23.107277 0-46.260603-15.309684-46.260603-38.156018C452.368366 300.994262 475.522716 285.87389 498.62897 285.87389zM283.016307 362.090758c-23.107277 0-46.402843-15.309684-46.402843-38.156018 0-22.941502 23.295566-38.061874 46.402843-38.061874 23.081695 0 38.46301 15.120372 38.46301 38.061874C321.479317 346.782098 306.098002 362.090758 283.016307 362.090758zM945.448458 606.151333c0-121.888048-123.258255-221.236753-261.683954-221.236753-146.57838 0-262.015505 99.348706-262.015505 221.236753 0 122.06508 115.437126 221.200938 262.015505 221.200938 30.66644 0 61.617359-7.609305 92.423993-15.262612l84.513836 45.786813-23.178909-76.17082C899.379213 735.776599 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.332197 0-30.807656-15.096836-30.807656-30.501688 0-15.190981 15.47546-30.477129 30.807656-30.477129 23.295566 0 38.558178 15.286148 38.558178 30.477129C637.361661 552.897456 622.099049 567.994292 598.803483 567.994292zM768.25071 567.994292c-15.213493 0-30.594809-15.096836-30.594809-30.501688 0-15.190981 15.381315-30.477129 30.594809-30.477129 23.107277 0 38.558178 15.286148 38.558178 30.477129C806.808888 552.897456 791.357987 567.994292 768.25071 567.994292z"
              />
            </svg>
          </a>
          <a
            class="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-500 hover:bg-red-500 hover:text-black"
            href="https://www.woodfishhhh.xyz/images/d8d58d2f2c7ac5790fd37f388da41db4.png?_t=1759286665402"
            rel="noopener noreferrer"
            target="_blank"
            title="Email"
          >
            <svg
              class="h-4 w-4 text-white/50 transition-colors group-hover:text-black"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
          <a
            class="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-500 hover:border-white hover:bg-black"
            href="https://www.douyin.com/user/MS4wLjABAAAAgbOrIhdi7Rl5RfaQ3fE3i7c2WnyR3zEOyLiK2Cjtcqk?from_tab_name=main"
            rel="noopener noreferrer"
            target="_blank"
            title="Douyin"
          >
            <svg
              class="relative z-10 h-4 w-4 text-white/50 transition-colors group-hover:text-white"
              fill="currentColor"
              viewBox="0 0 1024 1024"
            >
              <path
                d="M937.4 423.9c-84 0-165.7-27.3-232.9-77.8v352.3c0 179.9-138.6 325.6-309.6 325.6S85.3 878.3 85.3 698.4c0-179.9 138.6-325.6 309.6-325.6 17.1 0 33.7 1.5 49.9 4.3v186.6c-15.5-6.1-32-9.2-48.6-9.2-76.3 0-138.2 65-138.2 145.3 0 80.2 61.9 145.3 138.2 145.3 76.2 0 138.1-65.1 138.1-145.3V0H707c0 134.5 103.7 243.5 231.6 243.5v180.3l-1.2 0.1"
              />
            </svg>
          </a>
        </div>
      </section>

      <!-- 01 哲学/Slogan -->
      <section class="group relative space-y-4">
        <div
          class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
        >
          01
        </div>
        <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
          Philosophy
        </h3>
        <p
          class="text-xl font-extralight leading-[1.4] text-white/90 md:text-2xl"
        >
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
        <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
          Biography
        </h3>
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
              <div
                class="h-2 w-2 rounded-full"
                :style="{ backgroundColor: career.color }"
              ></div>
              <div class="flex-1">
                <span class="text-sm text-white/80">{{ career.school }}</span>
                <span class="ml-2 text-xs text-white/40">{{
                  career.major
                }}</span>
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
              <p
                class="text-lg text-white/90"
                :style="{ color: props.author.personalities?.color }"
              >
                {{ props.author.personalities?.title }}
              </p>
              <p class="text-sm text-white/40">
                {{ props.author.personalities?.type }}
              </p>
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
            <span class="text-white/90">{{
              props.author.expertise?.specialist
            }}</span>
            {{ props.author.expertise?.content }}
            <span class="text-white/90">{{ props.author.expertise?.level }}</span>
          </p>
        </div>
      </section>

      <!-- 07 游戏/Game -->
      <section
        v-if="props.author.game?.length"
        class="group relative space-y-4"
      >
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
            :style="{
              boxShadow: props.author.game[0]?.box_shadow,
            }"
          >
            <img
              :src="props.author.game[0]?.img"
              class="h-32 w-full object-cover"
            />
            <div
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/40"
            >
              <span class="text-2xl font-bold text-white">{{
                props.author.game[0]?.subtitle
              }}</span>
              <span class="mt-1 text-xs text-white/60">{{
                props.author.game[0]?.tips_left
              }}</span>
              <span class="text-xs text-white/40">{{
                props.author.game[0]?.tips_right
              }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 08 爱好/Likes -->
      <section
        v-if="props.author.likes?.length"
        class="group relative space-y-6"
      >
        <div
          class="pointer-events-none absolute -left-2 -top-6 -z-10 select-none text-7xl italic text-white/[0.02] transition-colors duration-1000 group-hover:text-white/[0.05]"
        >
          08
        </div>
        <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
          Hobbies
        </h3>

        <!-- 影视剧 -->
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

          <!-- 科技/AI -->
          <div
            v-if="like.type === 'like-technology' && like.bg"
            class="border-l border-white/10 py-1 pl-6"
          >
            <p class="mb-2 text-sm text-white/60">{{ like.tips }}</p>
            <p class="text-lg text-white/90">{{ like.title }}</p>
            <p class="text-xs text-white/40">{{ like.subtips }}</p>
            <img
              :src="like.bg"
              class="mt-3 h-24 w-full rounded-lg object-cover"
            />
          </div>

          <!-- 音乐 -->
          <div
            v-if="like.type === 'like-music' && like.bg"
            class="border-l border-white/10 py-1 pl-6"
          >
            <p class="mb-2 text-sm text-white/60">{{ like.tips }}</p>
            <p class="text-lg text-white/90">{{ like.title }}</p>
            <p class="text-xs text-white/40">{{ like.subtips }}</p>
            <img
              :src="like.bg"
              class="mt-3 h-24 w-full rounded-lg object-cover"
            />
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
        <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
          About Me
        </h3>
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
        <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
          Capabilities
        </h3>
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
                >{{ skill.title }}</span>
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
        <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
          Support
        </h3>
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
        <h3 class="ml-1 text-[10px] uppercase tracking-[0.4em] text-white/30">
          Footprints
        </h3>
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
    </div>
  </div>
</template>

<style scoped>
.modern-scrollbar::-webkit-scrollbar {
  width: 0;
  background: transparent;
}
</style>

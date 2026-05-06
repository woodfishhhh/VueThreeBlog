<script setup lang="ts">
import AuthorBio from "@/components/home/AuthorBio.vue";
import AuthorContact from "@/components/home/AuthorContact.vue";
import AuthorTimeline from "@/components/home/AuthorTimeline.vue";
import type { AuthorProfileData } from "@/types/content";

const props = defineProps<{
  author: AuthorProfileData;
}>();
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
        <path
          d="M0,30 Q25,10 50,30 T100,30 L100,100 L0,100 Z"
          fill="none"
          stroke="#ffffff"
          stroke-width="0.2"
        >
          <animate
            attributeName="d"
            dur="15s"
            repeatCount="indefinite"
            values="M0,30 Q25,10 50,30 T100,30 L100,100 L0,100 Z;M0,30 Q25,50 50,30 T100,30 L100,100 L0,100 Z;M0,30 Q25,10 50,30 T100,30 L100,100 L0,100 Z"
          />
        </path>
        <path
          d="M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z"
          fill="none"
          stroke="#ffffff"
          stroke-width="0.2"
        >
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
      <AuthorContact :author="props.author" />
      <AuthorBio :author="props.author" />
      <AuthorTimeline :author="props.author" />
    </div>
  </div>
</template>

<style scoped>
.modern-scrollbar::-webkit-scrollbar {
  width: 0;
  background: transparent;
}
</style>

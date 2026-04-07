<script setup lang="ts">
  import { computed, shallowRef, watch } from "vue";
  import { useRoute } from "vue-router";

  import ArticleContent from "@/components/article/ArticleContent.vue";
  import { loadPostArticle, resolvePostSlug } from "@/content/posts";
  import type { PostArticle } from "@/types/content";

  // 当前路由提供用于加载文章的 slug 参数。
  const route = useRoute();
  // 存放已加载的文章；使用 shallowRef 避免对整个对象树进行深度代理。
  const article = shallowRef<PostArticle | null>(null);
  // 追踪加载状态，用于模板分支（加载中、未找到、显示内容）。
  const isLoading = shallowRef(true);

  // 将路由参数规范为安全字符串（缺失时为空字符串）。
  const incomingSlug = computed(() => String(route.params.slug ?? ""));
  // 将 slug 解析为规范形式以便显示（若可用）。
  const resolvedSlug = computed(() => resolvePostSlug(incomingSlug.value));

  // 监听 slug 变更并获取文章内容。
  watch(
    incomingSlug,
    async (slug) => {
      isLoading.value = true;
      // 根据 slug 从内容存储加载文章。
      article.value = await loadPostArticle(slug);
      // 更新文档标题以反映加载成功或未找到文章。
      document.title = article.value ? `${article.value.title} | WOODFISH` : "Article not found | WOODFISH";
      isLoading.value = false;
    },
    // 通过设置 immediate: true 在挂载时立即执行一次，渲染初始路由。
    { immediate: true },
  );
</script>

<template>
  <main class="article-page flex justify-center items-start pt-[100px]">
    <div class="fixed inset-0 z-[-1] bg-black/60 backdrop-blur-sm pointer-events-none"></div>

    <div class="relative w-full max-w-7xl px-4 md:px-8 lg:px-12 flex flex-col gap-6 mx-auto">
      <!-- 导航头；存在 resolvedSlug 时显示规范 slug。 -->
      <div class="flex items-center gap-4 text-sm font-medium tracking-wide">
        <RouterLink
          class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-white/70 hover:text-white backdrop-blur-md flex items-center gap-2"
          to="/">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="lucide lucide-arrow-left">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back Home
        </RouterLink>
        <span v-if="resolvedSlug" class="text-white/40 hidden md:block">/ posts / {{ resolvedSlug }}</span>
      </div>

      <!-- 请求进行中时的加载状态显示。 -->
      <div v-if="isLoading"
        class="p-12 text-center text-white/50 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl">
        <div class="inline-block w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mb-4">
        </div>
        <p>Loading article…</p>
      </div>

      <!-- 当未找到匹配 slug 的文章时显示的空状态。 -->
      <div v-else-if="!article"
        class="p-12 text-center text-white/50 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl">
        <p class="text-2xl text-white mb-2 font-bold">Article not found</p>
        <p>The requested route does not map to an available post.</p>
      </div>

      <!-- 加载完成且有数据时渲染文章内容。 -->
      <div v-else class="relative rounded-3xl mb-24 w-full">
        <!-- 使用绝对定位的背景层，避免 backdrop-filter 阻断子元素的 position: sticky 行为 -->
        <div
          class="absolute inset-0 bg-[#050510]/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl pointer-events-none z-0">
        </div>
        <div class="relative z-10 p-6 md:p-12 lg:p-16 w-full">
          <ArticleContent :article="article" />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }

    100% {
      opacity: 1;
      transform: none;
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>

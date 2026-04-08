import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from "vue";

import { loadAuthorProfile } from "@/content/author";
import { loadFriendLinks } from "@/content/friends";
import { getPostSummaries, warmPostSummaries } from "@/content/posts";
import { getWorkProjects } from "@/content/works";
import type { AuthorProfileData, FriendLinkData, PostSummary, WorkProjectData } from "@/types/content";
import type { SiteMode } from "@/stores/site";

const BLOG_WARMUP_DELAY_MS = 1200;

export function useHomePanels(mode: Ref<SiteMode>) {
  const posts = shallowRef<PostSummary[]>([]);
  const author = shallowRef<AuthorProfileData | null>(null);
  const friendLinks = shallowRef<FriendLinkData[]>([]);
  const works = shallowRef<WorkProjectData[]>(getWorkProjects());
  const isPostsLoading = shallowRef(false);
  const isAuthorLoading = shallowRef(false);
  const isFriendLinksLoading = shallowRef(false);

  let warmupTimer: number | null = null;

  async function ensurePostsLoaded() {
    if (posts.value.length > 0 || isPostsLoading.value) {
      return;
    }

    isPostsLoading.value = true;
    try {
      posts.value = await getPostSummaries();
    } finally {
      isPostsLoading.value = false;
    }
  }

  async function ensureAuthorLoaded() {
    if (author.value || isAuthorLoading.value) {
      return;
    }

    isAuthorLoading.value = true;
    try {
      author.value = await loadAuthorProfile();
    } finally {
      isAuthorLoading.value = false;
    }
  }

  async function ensureFriendLinksLoaded() {
    if (friendLinks.value.length > 0 || isFriendLinksLoading.value) {
      return;
    }

    isFriendLinksLoading.value = true;
    try {
      friendLinks.value = await loadFriendLinks();
    } finally {
      isFriendLinksLoading.value = false;
    }
  }

  watch(
    () => mode.value,
    (nextMode) => {
      if (nextMode === "blog") {
        void ensurePostsLoaded();
      }

      if (nextMode === "author") {
        void ensureAuthorLoaded();
      }

      if (nextMode === "friend") {
        void ensureFriendLinksLoaded();
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    warmupTimer = window.setTimeout(() => {
      if (mode.value === "home" || mode.value === "blog") {
        warmPostSummaries();
      }
    }, BLOG_WARMUP_DELAY_MS);
  });

  onBeforeUnmount(() => {
    if (warmupTimer !== null) {
      window.clearTimeout(warmupTimer);
    }
  });

  return {
    posts,
    author,
    friendLinks,
    works,
    isPostsLoading,
    isAuthorLoading,
    isFriendLinksLoading,
  };
}

import { nextTick, onBeforeUnmount, shallowRef, watch, type Ref } from "vue";

import type { TocItem } from "@/types/content";

interface UseArticleReadingOptions {
  contentRoot: Ref<HTMLElement | null>;
  scrollContainer: Ref<HTMLElement | null | undefined>;
  tocItems: Ref<TocItem[]>;
}

export function useArticleReading(options: UseArticleReadingOptions) {
  const readProgress = shallowRef(0);
  const activeId = shallowRef("");

  let observer: IntersectionObserver | null = null;
  let boundScrollContainer: HTMLElement | null = null;

  function updateReadProgress() {
    const container = options.scrollContainer.value;

    if (!container) {
      readProgress.value = 0;
      return;
    }

    const scrollHeight = container.scrollHeight - container.clientHeight;
    readProgress.value = scrollHeight > 0 ? (container.scrollTop / scrollHeight) * 100 : 0;
  }

  function disconnectObserver() {
    observer?.disconnect();
    observer = null;
  }

  function bindScrollContainer(container: HTMLElement | null | undefined) {
    if (boundScrollContainer === container) {
      return;
    }

    boundScrollContainer?.removeEventListener("scroll", updateReadProgress);
    boundScrollContainer = container ?? null;
    boundScrollContainer?.addEventListener("scroll", updateReadProgress, { passive: true });

    updateReadProgress();
  }

  function setupHeadingObserver() {
    disconnectObserver();

    const contentRoot = options.contentRoot.value;
    const tocItems = options.tocItems.value;

    if (!contentRoot || tocItems.length === 0 || typeof IntersectionObserver === "undefined") {
      activeId.value = tocItems[0]?.id ?? "";
      return;
    }

    const headings = Array.from(contentRoot.querySelectorAll<HTMLElement>("h2[id], h3[id], h4[id]")).filter(
      (heading) => tocItems.some((item) => item.id === heading.id),
    );

    activeId.value = headings[0]?.id ?? tocItems[0]?.id ?? "";

    observer = new IntersectionObserver(
      (entries) => {
        const visibleHeading = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (visibleHeading?.target instanceof HTMLElement && visibleHeading.target.id) {
          activeId.value = visibleHeading.target.id;
        }
      },
      {
        root: options.scrollContainer.value ?? null,
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0.15, 0.45, 0.8],
      },
    );

    headings.forEach((heading) => observer?.observe(heading));
  }

  async function refresh() {
    await nextTick();
    setupHeadingObserver();
    updateReadProgress();
  }

  function jumpToHeading(id: string) {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    activeId.value = id;

    const container = options.scrollContainer.value;
    if (!container) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const targetTop =
      target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 104;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  watch(
    () => options.scrollContainer.value,
    (container) => {
      bindScrollContainer(container);
      void refresh();
    },
    { immediate: true },
  );

  watch(
    () => options.tocItems.value.map((item) => item.id).join("|"),
    () => {
      activeId.value = options.tocItems.value[0]?.id ?? "";
      void refresh();
    },
    { flush: "post", immediate: true },
  );

  watch(
    () => options.contentRoot.value,
    () => {
      void refresh();
    },
    { flush: "post", immediate: true },
  );

  onBeforeUnmount(() => {
    boundScrollContainer?.removeEventListener("scroll", updateReadProgress);
    disconnectObserver();
  });

  return {
    activeId,
    jumpToHeading,
    readProgress,
  };
}

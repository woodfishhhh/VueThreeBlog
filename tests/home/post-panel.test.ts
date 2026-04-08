import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it } from "vitest";

import PostPanel from "@/components/home/PostPanel.vue";
import type { PostSummary } from "@/types/content";

const posts: PostSummary[] = [
  {
    canonicalSlug: "ajax-basics-intro",
    aliases: ["AJAX 基础入门教程"],
    title: "AJAX 基础入门教程",
    publishedAt: "2025-12-20T12:00:04.000Z",
    publishedLabel: "Dec 20, 2025",
    excerpt: "理解 AJAX 请求生命周期和异步界面。",
    type: "Tutorial",
    searchText: "AJAX 请求 生命周期 异步 界面 fetch retry circuit breaker",
    readingMinutes: 6,
    coverImage: null,
    categories: ["前端开发"],
    tags: ["AJAX基础", "axios"],
  },
  {
    canonicalSlug: "notes-observability",
    aliases: ["Node 观测性随记"],
    title: "Node 观测性随记",
    publishedAt: "2025-12-18T08:30:00.000Z",
    publishedLabel: "Dec 18, 2025",
    excerpt: "日志、指标、追踪是线上排障基础。",
    type: "Notes",
    searchText: "日志 指标 追踪 observability telemetry",
    readingMinutes: 3,
    coverImage: null,
    categories: ["工程化"],
    tags: ["Node.js", "日志"],
  },
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/blog",
        name: "blog",
        component: { template: "<div />" },
      },
      {
        path: "/posts/:slug",
        name: "post",
        component: { template: "<div />" },
      },
    ],
  });
}

describe("PostPanel", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("restores the blog search state from route query", async () => {
    const router = createTestRouter();
    await router.push({
      name: "blog",
      query: {
        q: "AJAX",
        type: "Tutorial",
      },
    });
    await router.isReady();

    const wrapper = mount(PostPanel, {
      props: {
        posts,
      },
      global: {
        plugins: [router],
      },
    });

    expect((wrapper.get("[data-testid='blog-search-input']").element as HTMLInputElement).value).toBe("AJAX");
    expect(wrapper.get("[data-testid='blog-filter-type-Tutorial']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.findAll("[data-testid='blog-result-card']")).toHaveLength(1);
  });

  it("syncs search and filter interactions back into the blog query", async () => {
    const router = createTestRouter();
    await router.push({ name: "blog" });
    await router.isReady();

    const wrapper = mount(PostPanel, {
      props: {
        posts,
      },
      global: {
        plugins: [router],
      },
    });

    await wrapper.get("[data-testid='blog-search-input']").setValue("Node");
    await flushPromises();

    expect(router.currentRoute.value.query.q).toBe("Node");
    expect(wrapper.findAll("[data-testid='blog-result-card']")).toHaveLength(1);

    await wrapper.get("[data-testid='blog-filter-type-Notes']").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.query.type).toBe("Notes");

    await wrapper.get("[data-testid='blog-clear-filters']").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({});
    expect(wrapper.findAll("[data-testid='blog-result-card']")).toHaveLength(2);
  });
});

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ArticleToc from "@/components/article/ArticleToc.vue";

describe("ArticleToc", () => {
  it("renders controlled toc items and emits jump requests", async () => {
    const wrapper = mount(ArticleToc, {
      props: {
        activeId: "core-concepts",
        items: [
          { id: "overview", level: 2, text: "Overview" },
          { id: "core-concepts", level: 3, text: "Core Concepts" },
        ],
      },
    });

    const items = wrapper.findAll("[data-testid='article-toc-item']");

    expect(wrapper.get("[data-testid='article-toc']")).toBeTruthy();
    expect(wrapper.get("[data-testid='article-toc-header']").text()).toContain("Table of Contents");
    expect(wrapper.get("[data-testid='article-toc-scroll']")).toBeTruthy();
    expect(items).toHaveLength(2);
    expect(wrapper.get("[data-toc-id='core-concepts']").attributes("aria-current")).toBe("location");

    await wrapper.get("[data-toc-id='overview']").trigger("click");

    expect(wrapper.emitted("jump")?.[0]).toEqual(["overview"]);
  });

  it("renders nothing when no headings are available", () => {
    const wrapper = mount(ArticleToc, {
      props: {
        activeId: "",
        items: [],
      },
    });

    expect(wrapper.find("[data-testid='article-toc']").exists()).toBe(false);
  });
});

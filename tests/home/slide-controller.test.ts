import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SlideController from "@/components/home/SlideController.vue";
import { useSiteStore } from "@/stores/site";

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div />" } },
      { path: "/blog", name: "blog", component: { template: "<div />" } },
      { path: "/author", name: "author", component: { template: "<div />" } },
    ],
  });
}

describe("SlideController", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.body.innerHTML = "";
  });

  it("does not hijack author wheel scrolling once GSAP owns the author surface", async () => {
    const router = createTestRouter();
    await router.push({ name: "author" });
    await router.isReady();

    const siteStore = useSiteStore();
    siteStore.goAuthor();

    const authorScroll = document.createElement("div");
    authorScroll.id = "author-scroll-container";
    authorScroll.scrollBy = vi.fn();
    document.body.appendChild(authorScroll);

    mount(SlideController, {
      slots: {
        default: "<div />",
      },
      global: {
        plugins: [router],
      },
    });

    const event = new WheelEvent("wheel", {
      deltaY: 120,
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(event);

    expect(authorScroll.scrollBy).not.toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe("author");
  });
});

import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import HomeView from "@/views/HomeView.vue";
import { useSiteStore } from "@/stores/site";

const hydrateMock = vi.fn();
const total = ref<number | null>(32);
const isLoading = ref(false);
const hasError = ref(false);

vi.mock("@/composables/useVisitorCount", () => ({
  useVisitorCount: () => ({
    total,
    isLoading,
    hasError,
    hydrate: hydrateMock,
  }),
}));

vi.mock("@/composables/useTheme", () => ({
  useTheme: () => ({
    theme: ref<"night" | "day">("night"),
  }),
}));

vi.mock("@/composables/useHomePanels", () => ({
  useHomePanels: () => ({
    posts: [],
    author: null,
    friendLinks: [],
    works: [],
    isPostsLoading: false,
    isAuthorLoading: false,
    isFriendLinksLoading: false,
  }),
}));

const SiteNavStub = defineComponent({
  name: "SiteNav",
  template: "<div data-testid='site-nav-stub' />",
});

const SlideControllerStub = defineComponent({
  name: "SlideController",
  template: "<div data-testid='slide-controller-stub'><slot /></div>",
});

const ReadingOverlayStub = defineComponent({
  name: "ReadingOverlay",
  template: "<div data-testid='reading-overlay-stub' />",
});

describe("HomeView", () => {
  beforeEach(() => {
    hydrateMock.mockReset();
    total.value = 32;
    isLoading.value = false;
    hasError.value = false;
    setActivePinia(createPinia());
  });

  function mountHomeView() {
    return mount(HomeView, {
      global: {
        stubs: {
          SiteNav: SiteNavStub,
          SlideController: SlideControllerStub,
          ReadingOverlay: ReadingOverlayStub,
          Transition: false,
        },
      },
    });
  }

  it("hydrates the visitor count on mount and shows the badge on home mode", async () => {
    const wrapper = mountHomeView();
    await flushPromises();

    expect(hydrateMock).toHaveBeenCalledTimes(1);
    expect(wrapper.get("[data-testid='visitor-count-badge']").text()).toContain("32");
  });

  it("keeps the home visual texture inside the Three.js scene", () => {
    const wrapper = mountHomeView();

    const sceneLayer = wrapper.get("[data-testid='home-scene-layer']");

    expect(wrapper.find("[data-testid='home-backdrop']").exists()).toBe(false);
    expect(sceneLayer.classes()).toContain("z-0");
  });

  it("hides the visitor badge outside home mode", async () => {
    const siteStore = useSiteStore();
    siteStore.goBlog();

    const wrapper = mountHomeView();
    await flushPromises();

    expect(wrapper.find("[data-testid='visitor-count-badge']").exists()).toBe(false);
  });
});

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import WorksPanel from "@/components/home/WorksPanel.vue";
import { useSiteStore } from "@/stores/site";

const works = [
  {
    slug: "blog",
    name: "WoodFishNest",
    description: "Three.js powered immersive blog hub.",
    kind: "Blog",
    liveUrl: "http://36.151.148.198/newBlog/",
    githubUrl: "https://github.com/woodfishhhh/VueThreeBlog",
  },
  {
    slug: "weather",
    name: "WeatherDemo",
    description: "Monochrome weather workspace and forecast explorer.",
    kind: "App",
    liveUrl: "https://woodfish.site/weather/",
    githubUrl: "https://github.com/woodfishhhh/WeatherDemo",
  },
  {
    slug: "pretext",
    name: "Pretext",
    description: "Interactive pretext geometry experiment.",
    kind: "Lab",
    liveUrl: "https://woodfish.site/pretext/",
    githubUrl: "https://github.com/woodfishhhh/Pretext-cube",
  },
];

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
    writable: true,
  });
}

describe("WorksPanel", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults desktop works to orbit mode with a Case toggle", () => {
    installMatchMedia(true);

    const wrapper = mount(WorksPanel, {
      props: {
        works,
      },
    });

    expect(wrapper.find("[data-testid='works-view-toggle']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='works-view-toggle-orbit']").attributes("aria-pressed")).toBe(
      "true",
    );
    expect(wrapper.find("[data-testid='works-view-orbit']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='works-view-case']").exists()).toBe(false);
    expect(wrapper.findAll("[data-testid='works-item']")).toHaveLength(0);
    expect(wrapper.findAll("a")).toHaveLength(6);
    expect(wrapper.find(".works-panel__title p").text().length).toBeGreaterThan(0);
  });

  it("switches desktop works to Case mode with Live and GitHub entries", async () => {
    installMatchMedia(true);
    const store = useSiteStore();

    const wrapper = mount(WorksPanel, {
      props: {
        works,
      },
    });

    await wrapper.find("[data-testid='works-view-toggle-case']").trigger("click");

    expect(store.worksViewMode).toBe("case");
    expect(wrapper.find("[data-testid='works-view-case']").exists()).toBe(true);
    expect(wrapper.findAll("[data-testid='works-item']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='live']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='github']")).toHaveLength(3);
  });

  it("uses case mode on mobile-sized screens", () => {
    installMatchMedia(false);

    const wrapper = mount(WorksPanel, {
      props: {
        works,
      },
    });

    expect(wrapper.find("[data-testid='works-view-toggle']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='works-view-orbit']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='works-view-case']").exists()).toBe(true);
    expect(wrapper.findAll("[data-testid='works-item']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='live']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='github']")).toHaveLength(3);
  });
});

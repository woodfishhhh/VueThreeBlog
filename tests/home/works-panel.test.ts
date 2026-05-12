import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import WorksPanel from "@/components/home/WorksPanel.vue";

const works = [
  {
    slug: "blog",
    name: "VueCubeBlog",
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
    liveUrl: "http://36.151.148.198/weather/",
    githubUrl: "https://github.com/woodfishhhh/WeatherDemo",
  },
  {
    slug: "pretext",
    name: "Pretext",
    description: "Interactive pretext geometry experiment.",
    kind: "Lab",
    liveUrl: "http://36.151.148.198/pretext/",
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps desktop visual cards out of the DOM because WebGL owns the orbit", () => {
    installMatchMedia(true);

    const wrapper = mount(WorksPanel, {
      props: {
        works,
      },
    });

    expect(wrapper.text()).toContain("Selected Works");
    expect(wrapper.find("[data-testid='works-view-orbit']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='works-view-case']").exists()).toBe(false);
    expect(wrapper.findAll("[data-testid='works-item']")).toHaveLength(0);
    expect(wrapper.findAll("a")).toHaveLength(6);
  });

  it("uses case mode on mobile-sized screens", () => {
    installMatchMedia(false);

    const wrapper = mount(WorksPanel, {
      props: {
        works,
      },
    });

    expect(wrapper.find("[data-testid='works-view-orbit']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='works-view-case']").exists()).toBe(true);
    expect(wrapper.findAll("[data-testid='works-item']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='live']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='github']")).toHaveLength(3);
  });
});

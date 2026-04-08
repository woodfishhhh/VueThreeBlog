import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

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

describe("WorksPanel", () => {
  it("renders three works cards with card links, website links, and github badges", () => {
    const wrapper = mount(WorksPanel, {
      props: {
        works,
      },
    });

    expect(wrapper.text()).toContain("Selected Works");
    expect(wrapper.findAll("[data-testid='works-card']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='card']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='live']")).toHaveLength(3);
    expect(wrapper.findAll("a[data-kind='github']")).toHaveLength(3);
    expect(wrapper.findAll("[data-testid='github-icon']")).toHaveLength(3);
    expect(wrapper.text()).toContain("进入网站");
  });
});

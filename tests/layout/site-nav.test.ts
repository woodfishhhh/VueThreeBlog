import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SiteNav from "@/components/layout/SiteNav.vue";
import { useSiteStore } from "@/stores/site";

const toggleThemeAtMock = vi.fn();

vi.mock("@/composables/useTheme", () => ({
  useTheme: () => ({
    theme: ref<"night" | "day">("night"),
    toggleThemeAt: toggleThemeAtMock,
  }),
}));

const RouterLinkStub = defineComponent({
  name: "RouterLink",
  props: {
    to: {
      type: [String, Object],
      default: "/",
    },
  },
  template: `<a v-bind="$attrs"><slot /></a>`,
});

const ThemeToggleStub = defineComponent({
  name: "ThemeToggle",
  props: {
    theme: {
      type: String,
      default: "night",
    },
  },
  emits: ["toggleTheme"],
  template: `
    <button
      v-bind="$attrs"
      type="button"
      @click="$emit('toggleTheme', { x: 111, y: 222 })"
    >
      toggle
    </button>
  `,
});

describe("SiteNav", () => {
  beforeEach(() => {
    toggleThemeAtMock.mockReset();
    setActivePinia(createPinia());
  });

  function mountNav() {
    return mount(SiteNav, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          ThemeToggle: ThemeToggleStub,
        },
      },
    });
  }

  it("renders desktop navigation in the new order and marks the current page", () => {
    const siteStore = useSiteStore();
    siteStore.goWorks();

    const wrapper = mountNav();
    const desktopLinks = wrapper.findAll("[data-nav-group='desktop'] [data-nav-item]");

    expect(desktopLinks.map((link) => link.text())).toEqual(["Home", "Works", "Blog", "Author", "Friend"]);
    expect(wrapper.find("[data-nav-group='desktop'] [data-nav-item='works']").attributes("aria-current")).toBe("page");
    expect(wrapper.findAll("[data-nav-group='desktop'] [data-testid='nav-active-indicator']")).toHaveLength(1);
  });

  it("renders desktop and mobile theme toggles", () => {
    const wrapper = mountNav();

    expect(wrapper.find("[data-nav-theme-toggle='desktop']").exists()).toBe(true);
    expect(wrapper.find("[data-nav-theme-toggle='mobile']").exists()).toBe(true);
  });

  it("clicking theme toggle calls handler path without changing active nav state", async () => {
    const siteStore = useSiteStore();
    siteStore.goBlog();

    const wrapper = mountNav();
    const beforeMode = siteStore.mode;

    await wrapper.get("[data-nav-theme-toggle='desktop']").trigger("click");

    expect(toggleThemeAtMock).toHaveBeenCalledWith(111, 222);
    expect(siteStore.mode).toBe(beforeMode);
  });
});

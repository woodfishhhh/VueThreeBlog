import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it } from "vitest";

import SiteNav from "@/components/layout/SiteNav.vue";
import { useSiteStore } from "@/stores/site";

const RouterLinkStub = defineComponent({
  name: "RouterLink",
  props: {
    to: {
      type: String,
      default: "/",
    },
  },
  template: `<a :href="to" v-bind="$attrs"><slot /></a>`,
});

describe("SiteNav", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders desktop navigation in the new order and marks the current page", () => {
    const siteStore = useSiteStore();
    siteStore.goWorks();

    const wrapper = mount(SiteNav, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    const desktopLinks = wrapper.findAll("[data-nav-group='desktop'] [data-nav-item]");

    expect(desktopLinks.map((link) => link.text())).toEqual(["Home", "Works", "Blog", "Author", "Friend"]);
    expect(wrapper.find("[data-nav-group='desktop'] [data-nav-item='works']").attributes("aria-current")).toBe("page");
    expect(wrapper.findAll("[data-nav-group='desktop'] [data-testid='nav-active-indicator']")).toHaveLength(1);
  });
});

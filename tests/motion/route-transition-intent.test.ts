import { describe, expect, it } from "vite-plus/test";

import { resolveTransitionIntent } from "@/motion/route-transition-intent";

describe("route transition intent", () => {
  it("resolves panel transitions within home-family routes", () => {
    expect(
      resolveTransitionIntent({
        fromRouteName: "home",
        toRouteName: "blog",
        fromSiteMode: "home",
        toSiteMode: "blog",
      }).type,
    ).toBe("panelTransition");

    expect(
      resolveTransitionIntent({
        fromRouteName: "friend",
        toRouteName: "works",
        fromSiteMode: "friend",
        toSiteMode: "works",
      }).type,
    ).toBe("panelTransition");
  });

  it("resolves page/article transitions", () => {
    expect(
      resolveTransitionIntent({
        fromRouteName: "blog",
        toRouteName: "post",
        fromSiteMode: "blog",
        toSiteMode: "blog",
      }).type,
    ).toBe("pageToPost");

    expect(
      resolveTransitionIntent({
        fromRouteName: "post",
        toRouteName: "home",
        fromSiteMode: "blog",
        toSiteMode: "home",
      }).type,
    ).toBe("postToPage");
  });

  it("resolves overlay transitions from reading state changes", () => {
    expect(
      resolveTransitionIntent({
        fromRouteName: "blog",
        toRouteName: "blog",
        fromSiteMode: "blog",
        toSiteMode: "reading",
        fromActivePostSlug: null,
        toActivePostSlug: "ajax-basics-intro",
      }).type,
    ).toBe("overlayOpen");

    expect(
      resolveTransitionIntent({
        fromRouteName: "blog",
        toRouteName: "blog",
        fromSiteMode: "reading",
        toSiteMode: "blog",
        fromActivePostSlug: "ajax-basics-intro",
        toActivePostSlug: null,
      }).type,
    ).toBe("overlayClose");
  });

  it("marks direct post entry as a no-source route transition", () => {
    const intent = resolveTransitionIntent({
      fromRouteName: null,
      toRouteName: "post",
      fromSiteMode: "home",
      toSiteMode: "blog",
      isInitialNavigation: true,
    });

    expect(intent.type).toBe("pageToPost");
    expect(intent.directEntry).toBe(true);
  });

  it("returns none for unchanged states", () => {
    expect(
      resolveTransitionIntent({
        fromRouteName: "home",
        toRouteName: "home",
        fromSiteMode: "home",
        toSiteMode: "home",
      }).type,
    ).toBe("none");
  });
});

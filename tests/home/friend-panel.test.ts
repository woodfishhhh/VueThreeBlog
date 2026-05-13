import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import FriendPanel from "@/components/home/FriendPanel.vue";
import FriendLinkApplicationForm from "@/components/home/friend/FriendLinkApplicationForm.vue";
import FriendLinkCard from "@/components/home/friend/FriendLinkCard.vue";

const links = [
  {
    name: "Fomalhaut",
    link: "https://fomal.cc/",
    avatar: "/newBlog/remote-assets/fomalhaut.png",
    descr: "我的博客从这里学的",
    className: "友情链接",
  },
  {
    name: "Mohao",
    link: "https://blog.mohao.me/",
    avatar: "/newBlog/remote-assets/mohao.jpeg",
    descr: "钟明皓大神",
    className: "友情链接",
  },
];

describe("FriendPanel", () => {
  const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

  afterEach(() => {
    openSpy.mockClear();
  });

  it("renders friend cards and opens a prefilled GitHub issue only after reminder confirmation", async () => {
    const wrapper = mount(FriendPanel, {
      props: {
        links,
      },
    });

    expect(wrapper.text()).toContain("友链");
    expect(wrapper.get("[data-testid='friend-panel-root']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-panel-hero']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-panel-grid']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-panel-application']")).toBeTruthy();
    const mainCards = wrapper
      .findAll("[data-segment='main']")
      .flatMap((segment) => segment.findAll("[data-testid='friend-link-card']"));

    expect(mainCards).toHaveLength(2);
    expect(wrapper.get("[data-testid='friend-application-site-name']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-application-site-url']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-application-avatar-url']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-application-description']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-application-contact']")).toBeTruthy();

    await wrapper.get("[data-testid='friend-application-site-name']").setValue("Orbiting Notes");
    await wrapper.get("[data-testid='friend-application-site-url']").setValue("https://orbiting.example");
    await wrapper.get("[data-testid='friend-application-avatar-url']").setValue("https://orbiting.example/avatar.png");
    await wrapper.get("[data-testid='friend-application-description']").setValue("沉浸式前端与工程随记。");
    await wrapper.get("[data-testid='friend-application-contact']").setValue("@orbiting-notes");
    await wrapper.get("[data-testid='friend-application-submit']").trigger("click");

    expect(openSpy).not.toHaveBeenCalled();
    expect(wrapper.get("[data-testid='friend-application-reminder']").text()).toContain("将打开 GitHub 提交草稿");

    await wrapper.get("[data-testid='friend-application-confirm']").trigger("click");

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [issueUrl] = openSpy.mock.calls[0] ?? [];
    const parsedIssueUrl = new URL(String(issueUrl));
    const issueTitle = parsedIssueUrl.searchParams.get("title") ?? "";
    const issueBody = parsedIssueUrl.searchParams.get("body") ?? "";

    expect(issueUrl).toContain("https://github.com/woodfishhhh/VueThreeBlog/issues/new");
    expect(issueTitle).toContain("Orbiting Notes");
    expect(issueBody).toContain("https://orbiting.example");
    expect(issueBody).toContain("@orbiting-notes");
  });

  it("shows friend domains instead of legacy class labels", () => {
    const wrapper = mount(FriendPanel, {
      props: {
        links,
      },
    });

    expect(wrapper.text()).toContain("fomal.cc");
    expect(wrapper.text()).toContain("blog.mohao.me");
    expect(wrapper.text()).not.toContain("友情链接");
  });

  it("opens a random friend link from the header action", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.75);
    const wrapper = mount(FriendPanel, {
      props: {
        links,
      },
    });

    await wrapper.get("[data-testid='friend-random-visit']").trigger("click");

    expect(openSpy).toHaveBeenCalledWith("https://blog.mohao.me/", "_blank", "noopener,noreferrer");
    randomSpy.mockRestore();
  });

  it("opens and closes the mobile application drawer", async () => {
    const wrapper = mount(FriendPanel, {
      props: {
        links,
      },
    });

    expect(wrapper.find("[data-testid='friend-mobile-drawer']").exists()).toBe(false);

    await wrapper.get("[data-testid='friend-mobile-drawer-toggle']").trigger("click");

    expect(wrapper.get("[data-testid='friend-mobile-drawer']").isVisible()).toBe(true);
    expect(wrapper.get("[data-testid='friend-mobile-drawer']").find("[data-testid='friend-application-site-name']").exists()).toBe(true);

    await wrapper.get("[data-testid='friend-mobile-drawer-close']").trigger("click");

    expect(wrapper.find("[data-testid='friend-mobile-drawer']").exists()).toBe(false);
  });

  it("renders independent repeated segments in each waterfall column", () => {
    const wrapper = mount(FriendPanel, {
      props: {
        links,
      },
    });

    const columns = wrapper.findAll("[data-testid='friend-loop-column']");

    expect(columns).toHaveLength(2);

    columns.forEach((column) => {
      const segments = column.findAll("[data-testid='friend-loop-segment']");
      const mainSegment = segments.find((segment) => segment.attributes("data-segment") === "main");
      const cloneSegments = segments.filter((segment) => segment.attributes("data-segment") !== "main");

      expect(segments.map((segment) => segment.attributes("data-segment"))).toEqual([
        "clone-before",
        "main",
        "clone-after",
      ]);
      expect(mainSegment?.attributes("aria-hidden")).toBeUndefined();
      expect(mainSegment?.findAll("[data-testid='friend-link-card']").length).toBeGreaterThan(0);
      expect(cloneSegments.every((segment) => segment.attributes("aria-hidden") === "true")).toBe(true);
    });
  });

  it("lets card height grow from the description instead of a fixed minimum", () => {
    const longDescription = "这是一段比较长的友链描述，用来确认卡片高度由正文自然撑开，而不是由固定高度变量锁死。";
    const wrapper = mount(FriendLinkCard, {
      props: {
        link: {
          name: "Long Notes",
          link: "https://long.example",
          avatar: "",
          descr: longDescription,
          className: "友情链接",
        },
      },
    });

    expect(wrapper.get("[data-testid='friend-link-card']").attributes("style") ?? "").not.toContain("--card-min-height");
    expect(wrapper.text()).toContain(longDescription);
  });

  it("renders playful application-card motion layers while filling a draft", async () => {
    const wrapper = mount(FriendLinkApplicationForm);
    const card = wrapper.get("[data-testid='friend-application-card']");

    expect(card.classes()).not.toContain("is-writing");
    expect(wrapper.get("[data-testid='friend-application-shine']")).toBeTruthy();
    expect(wrapper.get("[data-testid='friend-application-stamp']")).toBeTruthy();
    expect(wrapper.findAll("[data-testid='friend-application-trail']")).toHaveLength(3);

    await wrapper.get("[data-testid='friend-application-site-name']").setValue("Orbiting Notes");

    expect(wrapper.get("[data-testid='friend-application-card']").classes()).toContain("is-writing");
  });
});

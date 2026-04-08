import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import FriendPanel from "@/components/home/FriendPanel.vue";

const links = [
  {
    name: "Fomalhaut",
    link: "https://fomal.cc/",
    avatar: "/newBlog/remote-assets/fomalhaut.png",
    descr: "我的博客从这里学的",
  },
  {
    name: "Mohao",
    link: "https://blog.mohao.me/",
    avatar: "/newBlog/remote-assets/mohao.jpeg",
    descr: "钟明皓大神",
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

    expect(wrapper.text()).toContain("Friend Links");
    expect(wrapper.findAll("[data-testid='friend-link-card']")).toHaveLength(2);
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
    expect(wrapper.get("[data-testid='friend-application-reminder']").text()).toContain("即将跳到 GitHub issue 页面提交");

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
});

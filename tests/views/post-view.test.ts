import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadPostArticle: vi.fn(),
  resolvePostSlug: vi.fn(),
  routeState: { slug: "orbiting-interfaces" },
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({
    params: {
      slug: mocks.routeState.slug,
    },
  }),
}));

vi.mock("@/content/posts", () => ({
  loadPostArticle: mocks.loadPostArticle,
  resolvePostSlug: mocks.resolvePostSlug,
}));

import PostView from "@/views/PostView.vue";

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

const ArticleContentStub = defineComponent({
  name: "ArticleContent",
  props: {
    article: {
      type: Object,
      required: true,
    },
  },
  template: `<div data-testid="article-content-stub">{{ article.title }}</div>`,
});

const article = {
  canonicalSlug: "orbiting-interfaces",
  aliases: ["orbiting-interfaces"],
  title: "Orbiting Interfaces",
  publishedAt: "2026-04-08T00:00:00.000Z",
  publishedLabel: "Apr 08, 2026",
  excerpt: "A premium reading surface should feel calm, precise, and slightly theatrical.",
  readingMinutes: 6,
  coverImage: null,
  categories: ["Design Systems"],
  tags: ["Vue", "Motion", "Editorial"],
  html: '<h2 id="overview">Overview</h2><p>Paragraph.</p>',
  toc: [{ id: "overview", level: 2, text: "Overview" }],
};

describe("PostView", () => {
  beforeEach(() => {
    mocks.routeState.slug = "orbiting-interfaces";
    mocks.loadPostArticle.mockReset();
    mocks.resolvePostSlug.mockReset();
    mocks.resolvePostSlug.mockImplementation(async (slug: string) => slug);
    document.title = "WOODFISH";
  });

  it("shows a loading state while the article request is still pending", async () => {
    let resolveArticle: ((value: typeof article | null) => void) | undefined;

    mocks.loadPostArticle.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveArticle = resolve;
        }),
    );

    const wrapper = mount(PostView, {
      global: {
        stubs: {
          ArticleContent: ArticleContentStub,
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.get("[data-testid='post-view-loading']")).toBeTruthy();

    if (resolveArticle) {
      resolveArticle(article);
    }
    await flushPromises();

    expect(wrapper.get("[data-testid='post-view-article']")).toBeTruthy();
  });

  it("renders a premium empty state when the article cannot be found", async () => {
    mocks.loadPostArticle.mockResolvedValue(null);

    const wrapper = mount(PostView, {
      global: {
        stubs: {
          ArticleContent: ArticleContentStub,
          RouterLink: RouterLinkStub,
        },
      },
    });

    await flushPromises();

    expect(wrapper.get("[data-testid='post-view-not-found']").text()).toContain("Article not found");
    expect(document.title).toBe("Article not found | WOODFISH");
  });

  it("renders the article shell and resolved slug metadata after loading succeeds", async () => {
    mocks.loadPostArticle.mockResolvedValue(article);

    const wrapper = mount(PostView, {
      global: {
        stubs: {
          ArticleContent: ArticleContentStub,
          RouterLink: RouterLinkStub,
        },
      },
    });

    await flushPromises();

    expect(wrapper.get("[data-testid='post-view-article']")).toBeTruthy();
    expect(wrapper.get("[data-testid='article-content-stub']").text()).toContain("Orbiting Interfaces");
    expect(wrapper.text()).toContain("/ posts / orbiting-interfaces");
    expect(document.title).toBe("Orbiting Interfaces | WOODFISH");
  });
});

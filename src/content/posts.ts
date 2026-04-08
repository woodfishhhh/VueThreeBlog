import type { PostArticle, PostSummary } from "@/types/content";
import { resolvePostSlugFromIndex } from "./post-helpers";

const postModules = import.meta.glob<{ default: PostArticle }>("../generated/posts/*.json");
const articlePromiseCache = new Map<string, Promise<PostArticle>>();
let postIndexPromise: Promise<PostSummary[]> | null = null;

async function loadPostIndex() {
  if (!postIndexPromise) {
    postIndexPromise = import("@/generated/post-index.json").then((module) => module.default as PostSummary[]);
  }

  return postIndexPromise;
}

export async function getPostSummaries() {
  return loadPostIndex();
}

export function warmPostSummaries() {
  void loadPostIndex();
}

export async function resolvePostSlug(slug: string) {
  const postIndex = await loadPostIndex();
  return resolvePostSlugFromIndex(postIndex, decodeURIComponent(slug));
}

export async function loadPostArticle(slug: string): Promise<PostArticle | null> {
  const canonicalSlug = await resolvePostSlug(slug);

  if (!canonicalSlug) {
    return null;
  }

  const loader = postModules[`../generated/posts/${canonicalSlug}.json`];
  if (!loader) {
    return null;
  }

  const cachedPromise = articlePromiseCache.get(canonicalSlug);
  if (cachedPromise) {
    return cachedPromise;
  }

  const nextPromise = loader()
    .then((module) => module.default)
    .catch((error) => {
      articlePromiseCache.delete(canonicalSlug);
      throw error;
    });

  articlePromiseCache.set(canonicalSlug, nextPromise);
  return nextPromise;
}

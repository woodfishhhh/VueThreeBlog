import postIndexData from "@/generated/post-index.json";

import type { PostArticle, PostSummary } from "@/types/content";
import { resolvePostSlugFromIndex } from "./post-helpers";

const postIndex = postIndexData as PostSummary[];
const postModules = import.meta.glob<{ default: PostArticle }>("../generated/posts/*.json");

export function getPostSummaries() {
  return postIndex;
}

export function resolvePostSlug(slug: string) {
  return resolvePostSlugFromIndex(postIndex, decodeURIComponent(slug));
}

export async function loadPostArticle(slug: string): Promise<PostArticle | null> {
  const canonicalSlug = resolvePostSlug(slug);

  if (!canonicalSlug) {
    return null;
  }

  const loader = postModules[`../generated/posts/${canonicalSlug}.json`];
  if (!loader) {
    return null;
  }

  const module = await loader();
  return module.default;
}

import type { PostArticle, PostSummary } from "@/types/content";
import { normalizeContentPayload } from "./content-url-normalizer";
import { resolvePostSlugFromIndex } from "./post-helpers";

const postModules = import.meta.glob<{ default: PostArticle }>("../generated/posts/*.json");
const articlePromiseCache = new Map<string, Promise<PostArticle>>();
let postIndexPromise: Promise<PostSummary[]> | null = null;

async function loadPostIndex() {
  if (!postIndexPromise) {
    const indexUrl = `${import.meta.env.BASE_URL}post-index.json`;
    postIndexPromise = fetch(indexUrl, { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load post index: ${response.status}`);
        }
        return response.json() as Promise<PostSummary[]>;
      })
      .then((payload) => normalizeContentPayload(payload))
      .catch((error) => {
        postIndexPromise = null;
        throw error;
      });
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
    .then((module) => normalizeContentPayload(module.default))
    .catch((error) => {
      articlePromiseCache.delete(canonicalSlug);
      throw error;
    });

  articlePromiseCache.set(canonicalSlug, nextPromise);
  return nextPromise;
}

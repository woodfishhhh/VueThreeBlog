import type { PostSummary } from "@/types/content";

export type BlogSortKey = "latest" | "oldest" | "reading-time" | "alphabetical";

export interface BlogFacet {
  value: string;
  count: number;
}

export interface BlogFacets {
  types: BlogFacet[];
  categories: BlogFacet[];
  tags: BlogFacet[];
}

export interface BlogFilters {
  query?: string;
  type?: string;
  category?: string;
  tag?: string;
}

export function filterBlogPosts(posts: PostSummary[], filters: BlogFilters = {}) {
  const query = normalizeQuery(filters.query);
  const selectedType = normalizeFilterValue(filters.type);
  const selectedCategory = normalizeFilterValue(filters.category);
  const selectedTag = normalizeFilterValue(filters.tag);

  return posts.filter((post) => {
    if (selectedType && post.type !== selectedType) {
      return false;
    }

    if (selectedCategory && !post.categories.includes(selectedCategory)) {
      return false;
    }

    if (selectedTag && !post.tags.includes(selectedTag)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const terms = query.split(" ");
    const summaryHaystack = normalizeQuery([
      post.title,
      post.excerpt,
      post.type,
      post.categories.join(" "),
      post.tags.join(" "),
    ].join(" "));
    const fullHaystack = shouldUseSearchCorpus(query)
      ? normalizeQuery(`${summaryHaystack} ${post.searchText}`)
      : summaryHaystack;

    return terms.every((term) => fullHaystack.includes(term));
  });
}

export function sortBlogPosts(posts: PostSummary[], sortKey: BlogSortKey = "latest") {
  const sortedPosts = [...posts];

  sortedPosts.sort((left, right) => {
    if (sortKey === "oldest") {
      return Date.parse(left.publishedAt) - Date.parse(right.publishedAt);
    }

    if (sortKey === "reading-time") {
      return right.readingMinutes - left.readingMinutes || Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    }

    if (sortKey === "alphabetical") {
      return left.title.localeCompare(right.title, "zh-Hans-CN");
    }

    return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  });

  return sortedPosts;
}

export function buildBlogFacets(posts: PostSummary[]): BlogFacets {
  return {
    types: toFacets(posts.map((post) => post.type)),
    categories: toFacets(posts.flatMap((post) => post.categories)),
    tags: toFacets(posts.flatMap((post) => post.tags)),
  };
}

function toFacets(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalizedValue = normalizeFilterValue(value);
    if (!normalizedValue) {
      continue;
    }

    counts.set(normalizedValue, (counts.get(normalizedValue) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count);
}

function shouldUseSearchCorpus(query: string) {
  return query.length >= 8 || query.split(" ").length >= 2;
}

function normalizeFilterValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeQuery(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

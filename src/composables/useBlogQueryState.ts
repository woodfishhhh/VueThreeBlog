import { computed } from "vue";
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw, type LocationQueryValue } from "vue-router";

import type { BlogFilters, BlogSortKey } from "@/content/blog-hub";

type BlogQueryKey = "q" | "type" | "category" | "tag" | "sort";

const DEFAULT_SORT: BlogSortKey = "latest";

export function useBlogQueryState() {
  const route = useRoute();
  const router = useRouter();

  const searchQuery = computed({
    get: () => readQueryValue(route.query.q),
    set: (value: string) => {
      void replaceQuery({ q: value });
    },
  });

  const selectedType = computed({
    get: () => readQueryValue(route.query.type),
    set: (value: string) => {
      void replaceQuery({ type: value });
    },
  });

  const selectedCategory = computed({
    get: () => readQueryValue(route.query.category),
    set: (value: string) => {
      void replaceQuery({ category: value });
    },
  });

  const selectedTag = computed({
    get: () => readQueryValue(route.query.tag),
    set: (value: string) => {
      void replaceQuery({ tag: value });
    },
  });

  const sortKey = computed<BlogSortKey>({
    get: () => {
      const value = readQueryValue(route.query.sort);
      return isBlogSortKey(value) ? value : DEFAULT_SORT;
    },
    set: (value) => {
      void replaceQuery({ sort: value });
    },
  });

  const filters = computed<BlogFilters>(() => ({
    query: searchQuery.value,
    type: selectedType.value,
    category: selectedCategory.value,
    tag: selectedTag.value,
  }));

  const activeQuery = computed<LocationQueryRaw>(() => buildNextQuery({}, {
    q: searchQuery.value,
    type: selectedType.value,
    category: selectedCategory.value,
    tag: selectedTag.value,
    sort: sortKey.value,
  }));

  const hasActiveFilters = computed(() => Object.keys(activeQuery.value).length > 0);

  async function clearFilters() {
    await router.replace({
      name: getRouteName(),
      params: route.params,
      query: {},
      hash: route.hash,
    });
  }

  async function replaceQuery(updates: Partial<Record<BlogQueryKey, string>>) {
    const nextQuery = buildNextQuery(route.query, updates);

    await router.replace({
      name: getRouteName(),
      params: route.params,
      query: nextQuery,
      hash: route.hash,
    });
  }

  function getRouteName() {
    return typeof route.name === "string" ? route.name : "blog";
  }

  return {
    searchQuery,
    selectedType,
    selectedCategory,
    selectedTag,
    sortKey,
    filters,
    activeQuery,
    hasActiveFilters,
    clearFilters,
  };
}

function buildNextQuery(
  currentQuery: LocationQuery,
  updates: Partial<Record<BlogQueryKey, string>>,
): LocationQueryRaw {
  const nextQuery: LocationQueryRaw = {
    ...currentQuery,
  };

  for (const [key, value] of Object.entries(updates) as [BlogQueryKey, string][]) {
    const normalizedValue = value.trim();
    if (!normalizedValue || (key === "sort" && normalizedValue === DEFAULT_SORT)) {
      delete nextQuery[key];
      continue;
    }

    nextQuery[key] = normalizedValue;
  }

  return nextQuery;
}

function readQueryValue(value: LocationQueryValue | LocationQueryValue[]) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function isBlogSortKey(value: string): value is BlogSortKey {
  return value === "latest" || value === "oldest" || value === "reading-time" || value === "alphabetical";
}

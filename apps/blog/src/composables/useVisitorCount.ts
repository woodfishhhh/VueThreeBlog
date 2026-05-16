import { shallowRef } from "vue";

const VISITOR_COUNT_STORAGE_KEY = "vuecubeblog:visitor-counted:v1";
const VISITOR_COUNT_API_PATH = "api/visitor-count";

const total = shallowRef<number | null>(null);
const isLoading = shallowRef(false);
const hasError = shallowRef(false);

type VisitorCountResponse = {
  total?: number;
};

function getApiUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

function readCountedMarker() {
  try {
    if (typeof window === "undefined") {
      return { storageAvailable: false, counted: false };
    }

    return {
      storageAvailable: true,
      counted: window.localStorage.getItem(VISITOR_COUNT_STORAGE_KEY) === "1",
    };
  } catch {
    return { storageAvailable: false, counted: false };
  }
}

function writeCountedMarker() {
  try {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(VISITOR_COUNT_STORAGE_KEY, "1");
  } catch {
    // Ignore storage errors and keep the UI usable.
  }
}

async function requestCount(url: string, init?: RequestInit) {
  const response = await fetch(getApiUrl(url), init);

  if (!response.ok) {
    throw new Error(`Visitor count request failed: ${response.status}`);
  }

  return (await response.json()) as VisitorCountResponse;
}

async function hydrate() {
  isLoading.value = true;
  hasError.value = false;

  try {
    const marker = readCountedMarker();
    const shouldCountVisit = marker.storageAvailable && !marker.counted;
    const payload = shouldCountVisit
      ? await requestCount(`${VISITOR_COUNT_API_PATH}/visit`, { method: "POST" })
      : await requestCount(VISITOR_COUNT_API_PATH);

    total.value = typeof payload.total === "number" ? payload.total : null;

    if (shouldCountVisit) {
      writeCountedMarker();
    }
  } catch {
    total.value = null;
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
}

export function useVisitorCount() {
  return {
    total,
    isLoading,
    hasError,
    hydrate,
  };
}

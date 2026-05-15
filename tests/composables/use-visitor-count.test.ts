import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { useVisitorCount } from "@/composables/useVisitorCount";

describe("useVisitorCount", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
    window.localStorage.clear();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("posts a first visit, stores the marker, and exposes the returned total", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 12, counted: true }),
    });

    const visitorCount = useVisitorCount();

    await visitorCount.hydrate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/visitor-count/visit", { method: "POST" });
    expect(window.localStorage.getItem("vuecubeblog:visitor-counted:v1")).toBe("1");
    expect(visitorCount.total.value).toBe(12);
    expect(visitorCount.hasError.value).toBe(false);
    expect(visitorCount.isLoading.value).toBe(false);
  });

  it("reads the current total without posting when the browser is already counted", async () => {
    window.localStorage.setItem("vuecubeblog:visitor-counted:v1", "1");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 44 }),
    });

    const visitorCount = useVisitorCount();

    await visitorCount.hydrate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/visitor-count", undefined);
    expect(visitorCount.total.value).toBe(44);
    expect(visitorCount.hasError.value).toBe(false);
  });

  it("falls back to read-only mode when storage access throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked get");
    });
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked set");
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 6 }),
    });

    const visitorCount = useVisitorCount();

    await expect(visitorCount.hydrate()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/visitor-count", undefined);
    expect(setSpy).not.toHaveBeenCalled();
    expect(visitorCount.total.value).toBe(6);
    expect(visitorCount.hasError.value).toBe(false);
  });

  it("marks an error state when the api request fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ total: 0 }),
    });

    const visitorCount = useVisitorCount();

    await expect(visitorCount.hydrate()).resolves.toBeUndefined();

    expect(visitorCount.total.value).toBe(null);
    expect(visitorCount.hasError.value).toBe(true);
    expect(visitorCount.isLoading.value).toBe(false);
  });
});

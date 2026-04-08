import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useSiteStore } from "@/stores/site";

describe("site store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("enters works mode and resets transient reading state", () => {
    const store = useSiteStore();

    store.enterReading("hello-world");
    store.enterFocus();

    store.goWorks();

    expect(store.mode).toBe("works");
    expect(store.activePostSlug).toBeNull();
    expect(store.isFocusing).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { stepAuthorSlideIndex } from "@/composables/useAuthorSlider";

describe("stepAuthorSlideIndex", () => {
  it("moves exactly one slide and clamps to the available range", () => {
    expect(stepAuthorSlideIndex(0, 1, 4)).toBe(1);
    expect(stepAuthorSlideIndex(1, 1, 4)).toBe(2);
    expect(stepAuthorSlideIndex(3, 1, 4)).toBe(3);
    expect(stepAuthorSlideIndex(2, -1, 4)).toBe(1);
    expect(stepAuthorSlideIndex(0, -1, 4)).toBe(0);
  });
});

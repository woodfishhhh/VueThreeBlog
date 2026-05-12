import { describe, expect, it } from "vitest";

import { getGeometryTransformTarget } from "@/components/scene/geometry-transform";

describe("getGeometryTransformTarget", () => {
  it("keeps friend page geometry centered instead of lifting it", () => {
    expect(
      getGeometryTransformTarget({
        inwardOffset: 4,
        isFocusing: false,
        isMobile: false,
        mode: "friend",
      }),
    ).toEqual({
      baseScale: 1,
      x: 0,
      y: 0,
      z: 0,
    });
  });

  it("keeps works page geometry centered for WebGL orbit cards", () => {
    expect(
      getGeometryTransformTarget({
        inwardOffset: 4,
        isFocusing: false,
        isMobile: false,
        mode: "works",
      }),
    ).toEqual({
      baseScale: 1,
      x: 0,
      y: 0,
      z: 0,
    });
  });
});

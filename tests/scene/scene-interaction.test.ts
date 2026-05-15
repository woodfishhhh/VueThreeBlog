import { describe, expect, it } from "vite-plus/test";

import {
  resolveScenePointerDownAction,
  shouldRaycastSceneGeometry,
} from "@/components/scene/scene-interaction";

describe("scene interaction routing", () => {
  it("does not route desktop works clicks to geometry focus", () => {
    expect(
      resolveScenePointerDownAction({
        mode: "works",
        worksViewMode: "orbit",
        isFocusing: false,
        isMobile: false,
        hasWorksHit: false,
        hasGeometryHit: true,
      }),
    ).toBe("none");

    expect(shouldRaycastSceneGeometry("works", "orbit", false, false)).toBe(false);
  });

  it("routes desktop works card hits to grab-card only", () => {
    expect(
      resolveScenePointerDownAction({
        mode: "works",
        worksViewMode: "orbit",
        isFocusing: false,
        isMobile: false,
        hasWorksHit: true,
        hasGeometryHit: true,
      }),
    ).toBe("grab-card");
  });

  it("keeps geometry focus available only on home", () => {
    expect(
      resolveScenePointerDownAction({
        mode: "home",
        worksViewMode: "orbit",
        isFocusing: false,
        isMobile: false,
        hasWorksHit: false,
        hasGeometryHit: true,
      }),
    ).toBe("focus-geometry");

    expect(shouldRaycastSceneGeometry("home", "orbit", false, false)).toBe(true);
  });

  it("blocks geometry focus and hover raycast on every non-home panel", () => {
    for (const mode of ["blog", "author", "friend", "reading"] as const) {
      expect(
        resolveScenePointerDownAction({
          mode,
          worksViewMode: "orbit",
          isFocusing: false,
          isMobile: false,
          hasWorksHit: false,
          hasGeometryHit: true,
        }),
      ).toBe("none");

      expect(shouldRaycastSceneGeometry(mode, "orbit", false, false)).toBe(false);
    }
  });

  it("disables orbit-card routing when desktop works is in Case mode", () => {
    expect(
      resolveScenePointerDownAction({
        mode: "works",
        worksViewMode: "case",
        isFocusing: false,
        isMobile: false,
        hasWorksHit: true,
        hasGeometryHit: true,
      }),
    ).toBe("none");

    expect(shouldRaycastSceneGeometry("works", "case", false, false)).toBe(false);
  });
});

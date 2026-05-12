import { describe, expect, it } from "vitest";

import { createWorksOrbitCardFrame } from "@/components/scene/works-orbit-cards";

describe("createWorksOrbitCardFrame", () => {
  it("places work cards around a 3D orbit center", () => {
    const frames = [0, 1, 2].map((index) =>
      createWorksOrbitCardFrame({
        center: { x: 0, y: 0, z: 0 },
        count: 3,
        elapsed: 0,
        index,
        radiusX: 6,
        radiusY: 1.4,
        radiusZ: 2.5,
      }),
    );

    expect(frames).toHaveLength(3);
    expect(new Set(frames.map((frame) => frame.position.x))).toHaveLength(3);
    expect(new Set(frames.map((frame) => frame.position.z))).toHaveLength(3);
  });

  it("uses depth to scale and fade background cards", () => {
    const frames = [0, 1, 2].map((index) =>
      createWorksOrbitCardFrame({
        count: 3,
        elapsed: 1,
        index,
      }),
    );
    const front = [...frames].sort((a, b) => b.depth - a.depth)[0];
    const back = [...frames].sort((a, b) => a.depth - b.depth)[0];

    expect(front.scale).toBeGreaterThan(back.scale);
    expect(front.opacity).toBeGreaterThan(back.opacity);
    expect(front.position.z).toBeGreaterThan(back.position.z);
  });

  it("freezes motion when reduced motion is requested", () => {
    expect(
      createWorksOrbitCardFrame({
        count: 3,
        elapsed: 0,
        index: 1,
        reducedMotion: true,
      }),
    ).toEqual(
      createWorksOrbitCardFrame({
        count: 3,
        elapsed: 20,
        index: 1,
        reducedMotion: true,
      }),
    );
  });
});

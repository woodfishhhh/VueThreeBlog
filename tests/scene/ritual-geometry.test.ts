import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { generateMobiusData, useMobiusStrip } from "@/composables/useMobiusStrip";
import { useStarField } from "@/composables/useStarField";

describe("ritual geometry interaction intensity", () => {
  it("adds a depth-only occluder to the mobius strip", () => {
    const mobius = useMobiusStrip();
    const material = mobius.occluder.material as THREE.MeshBasicMaterial;
    const occluderGeometry = mobius.occluder.geometry as THREE.BufferGeometry;
    const surface = generateMobiusData();

    expect(material.colorWrite).toBe(false);
    expect(material.depthWrite).toBe(true);
    expect(material.transparent).toBe(false);
    expect(occluderGeometry.type).toBe("BufferGeometry");
    expect(occluderGeometry.index?.array.length).toBe(surface.triangles.length);
    expect(mobius.line.renderOrder).toBeLessThan(mobius.occluder.renderOrder);
    expect(mobius.occluder.renderOrder).toBeLessThan(80);

    mobius.dispose();
  });

  it("moves star positions forward when warp intensity is enabled", () => {
    const texture = new THREE.CanvasTexture(document.createElement("canvas"));
    const starField = useStarField(texture, 1);
    const points = starField.group.children[0] as THREE.Points;
    const positions = points.geometry.attributes.position.array as Float32Array;
    const startZ = positions[2];

    starField.setWarpIntensity(1);
    starField.update(0.1);

    expect(positions[2]).not.toBe(startZ);

    starField.dispose();
    texture.dispose();
  });
});

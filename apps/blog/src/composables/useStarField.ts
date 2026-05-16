import * as THREE from "three";

export interface StarField {
  group: THREE.Group;
  setOpacity: (alpha: number) => void;
  setWarpIntensity: (value: number) => void;
  update: (delta: number) => void;
  dispose: () => void;
}

export function useStarField(circleTexture: THREE.CanvasTexture, count = 5000): StarField {
  const group = new THREE.Group();
  group.rotation.set(0, 0, Math.PI / 4);

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 40 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xfcfcfc,
    size: 0.05,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    map: circleTexture,
    alphaTest: 0.1,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);

  let warpIntensity = 0;

  function setOpacity(alpha: number) {
    material.opacity = THREE.MathUtils.clamp(alpha, 0, 1);
  }

  function setWarpIntensity(value: number) {
    warpIntensity = THREE.MathUtils.clamp(value, 0, 1);
  }

  function update(delta: number) {
    const intensity = THREE.MathUtils.clamp(warpIntensity, 0, 1);
    group.rotation.x -= delta * (1 / 50 + intensity / 18);
    group.rotation.y -= delta * (1 / 60 + intensity / 24);

    if (intensity > 0) {
      const array = geometry.attributes.position.array as Float32Array;
      const speed = 34 * intensity * delta;
      for (let i = 2; i < array.length; i += 3) {
        array[i] += speed;
        if (array[i] > 40) array[i] = -40 + (array[i] - 40);
      }
      geometry.attributes.position.needsUpdate = true;
      material.size = 0.05 + intensity * 0.025;
    } else if (material.size !== 0.05) {
      material.size = 0.05;
    }
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  return { group, setOpacity, setWarpIntensity, update, dispose };
}

import * as THREE from "three";

export interface HypercubeData {
  vertices: number[][];
  edges: number[];
}

export interface Hypercube {
  group: THREE.Group;
  line: THREE.LineSegments;
  points: THREE.Points;
  hitMesh: THREE.Mesh;
  update: (delta: number) => void;
  lerpColor: (target: THREE.Color, factor: number) => void;
  dispose: () => void;
}

export function generateHypercubeData(): HypercubeData {
  const vertices: number[][] = [];
  for (let i = 0; i < 16; i++) {
    const x = i & 1 ? 1 : -1;
    const y = i & 2 ? 1 : -1;
    const z = i & 4 ? 1 : -1;
    const w = i & 8 ? 1 : -1;
    vertices.push([x, y, z, w]);
  }
  const edges: number[] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 4; j++) {
      const neighbor = i ^ (1 << j);
      if (i < neighbor) {
        edges.push(i, neighbor);
      }
    }
  }
  return { vertices, edges };
}

export function useHypercube(circleTexture: THREE.CanvasTexture): Hypercube {
  const { vertices, edges } = generateHypercubeData();
  const group = new THREE.Group();

  const hitGeom = new THREE.SphereGeometry(1.5, 16, 16);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeom, hitMat);
  group.add(hitMesh);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
  geometry.setIndex(edges);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const line = new THREE.LineSegments(geometry, lineMaterial);
  group.add(line);

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    map: circleTexture,
    alphaTest: 0.1,
  });
  const points = new THREE.Points(geometry, pointsMaterial);
  group.add(points);

  let alphaRot = 0;
  let betaRot = 0;

  function update(delta: number) {
    alphaRot += delta * 0.5;
    betaRot += delta * 0.3;
    const positions = geometry.attributes.position.array as Float32Array;
    const cosA = Math.cos(alphaRot);
    const sinA = Math.sin(alphaRot);
    const cosB = Math.cos(betaRot);
    const sinB = Math.sin(betaRot);

    for (let i = 0; i < 16; i++) {
      const [x, y, z, w] = vertices[i];
      const x1 = x * cosA - w * sinA;
      const w1 = x * sinA + w * cosA;
      const z1 = z * cosB - w1 * sinB;
      const w2 = z * sinB + w1 * cosB;
      const distance = 2.5;
      const wZ = 1 / (distance - w2);

      positions[i * 3] = x1 * wZ * 4;
      positions[i * 3 + 1] = y * wZ * 4;
      positions[i * 3 + 2] = z1 * wZ * 4;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  function lerpColor(target: THREE.Color, factor: number) {
    lineMaterial.color.lerp(target, factor);
    pointsMaterial.color.lerp(target, factor);
  }

  function dispose() {
    hitGeom.dispose();
    hitMat.dispose();
    geometry.dispose();
    lineMaterial.dispose();
    pointsMaterial.dispose();
  }

  return { group, line, points, hitMesh, update, lerpColor, dispose };
}

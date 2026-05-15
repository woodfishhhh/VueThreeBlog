import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWorksOrbitCardFrame,
  createWorksOrbitCards,
  getWorksCenterMagnetStrength,
  getWorksOrbitRadii,
  isWorksLaunchZone,
  WORKS_ORBIT_CARD_RENDER_LAYER,
} from "@/components/scene/works-orbit-cards";

const originalGetContext = HTMLCanvasElement.prototype.getContext;

const works = [
  {
    slug: "blog",
    name: "VueCubeBlog",
    description: "Three.js powered immersive blog hub.",
    kind: "Blog",
    liveUrl: "http://36.151.148.198/newBlog/",
    githubUrl: "https://github.com/woodfishhhh/VueThreeBlog",
  },
  {
    slug: "weather",
    name: "WeatherDemo",
    description: "Monochrome weather workspace and forecast explorer.",
    kind: "App",
    liveUrl: "https://woodfish.site/weather/",
    githubUrl: "https://github.com/woodfishhhh/WeatherDemo",
  },
];

function mockCanvasContext() {
  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 12 })),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn(),
  };

  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => context),
  });
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 12);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

function updateOrbitCards(
  cards: ReturnType<typeof createWorksOrbitCards>,
  camera: THREE.PerspectiveCamera,
  elapsed: number,
  delta: number,
) {
  cards.update({
    camera,
    center: new THREE.Vector3(0, 0, 0),
    delta,
    elapsed,
    reducedMotion: true,
    viewport: {
      height: 900,
      width: 1440,
    },
    visible: true,
  });
}

describe("createWorksOrbitCardFrame", () => {
  beforeEach(() => {
    mockCanvasContext();
  });

  afterEach(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: originalGetContext,
    });
    vi.restoreAllMocks();
  });

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

  it("uses depth to scale down front cards while keeping them opaque", () => {
    const frames = [0, 1, 2].map((index) =>
      createWorksOrbitCardFrame({
        count: 3,
        elapsed: 1,
        index,
      }),
    );
    const front = [...frames].sort((a, b) => b.depth - a.depth)[0];
    const back = [...frames].sort((a, b) => a.depth - b.depth)[0];

    expect(front.scale).toBeLessThan(back.scale);
    expect(front.opacity).toBe(1);
    expect(back.opacity).toBe(1);
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

  it("uses the expanded desktop orbit radii", () => {
    expect(getWorksOrbitRadii(800)).toEqual({
      radiusX: 6.2,
      radiusY: 2.6,
      radiusZ: 4,
    });

    const wide = getWorksOrbitRadii(1440);
    expect(wide.radiusX).toBeCloseTo(1440 / 160);
    expect(wide.radiusY).toBeCloseTo(1440 / 450);
    expect(wide.radiusZ).toBeCloseTo(1440 / 275);
    expect(wide.radiusX / wide.radiusY).toBeGreaterThan(2.6);
    expect(wide.radiusZ).toBeGreaterThan(wide.radiusY);
  });

  it("keeps front and back orbit cards outside the central geometry clearance", () => {
    const radii = getWorksOrbitRadii(1440);
    const frontElapsed = (Math.PI / 2 + Math.PI * 0.12) / 0.24;
    const backElapsed = (Math.PI * 1.5 + Math.PI * 0.12) / 0.24;
    const front = createWorksOrbitCardFrame({
      count: 1,
      elapsed: frontElapsed,
      index: 0,
      radiusX: radii.radiusX,
      radiusY: radii.radiusY,
      radiusZ: radii.radiusZ,
    });
    const back = createWorksOrbitCardFrame({
      count: 1,
      elapsed: backElapsed,
      index: 0,
      radiusX: radii.radiusX,
      radiusY: radii.radiusY,
      radiusZ: radii.radiusZ,
    });

    expect(Math.hypot(front.position.x, front.position.y)).toBeGreaterThan(3);
    expect(Math.hypot(back.position.x, back.position.y)).toBeGreaterThan(3);
  });

  it("launches the live URL only when a dragged card is released in the center zone", () => {
    const camera = createCamera();
    const cards = createWorksOrbitCards({ theme: "night", works });

    cards.beginDrag(
      { action: "live", slug: "blog", url: works[0].liveUrl },
      new THREE.Vector2(-0.6, 0.15),
    );
    cards.drag(new THREE.Vector2(0.08, -0.04));
    updateOrbitCards(cards, camera, 0.1, 1);

    expect(cards.isInteracting()).toBe(true);

    expect(cards.release(0.2)).toEqual({
      action: "launch",
      url: works[0].liveUrl,
    });
    expect(cards.isInteracting()).toBe(false);

    cards.dispose();
  });

  it("resumes immediately from a non-center release without a hold delay", () => {
    const camera = createCamera();
    const cards = createWorksOrbitCards({ theme: "night", works });
    const cardGroup = cards.group.children[0] as THREE.Group;

    cards.beginDrag(
      { action: "live", slug: "blog", url: works[0].liveUrl },
      new THREE.Vector2(-0.6, 0.15),
    );
    cards.drag(new THREE.Vector2(0.84, 0.42));
    updateOrbitCards(cards, camera, 0.1, 1);
    const releasePosition = cardGroup.position.clone();

    expect(cards.release(0.1)).toEqual({ action: "resume" });
    expect(cards.isInteracting()).toBe(false);

    updateOrbitCards(cards, camera, 0.12, 0.016);

    expect(cardGroup.position.distanceTo(releasePosition)).toBeGreaterThan(0.1);
    expect(cardGroup.renderOrder).toBeLessThan(900);
    expect(cards.isInteracting()).toBe(false);

    cards.dispose();
  });

  it("keeps the release pose on the first resume frame, then animates back to orbit", () => {
    const camera = createCamera();
    const cards = createWorksOrbitCards({ theme: "night", works });
    const cardGroup = cards.group.children[0] as THREE.Group;

    cards.beginDrag(
      { action: "live", slug: "blog", url: works[0].liveUrl },
      new THREE.Vector2(-0.6, 0.15),
    );
    cards.drag(new THREE.Vector2(0.7, 0.34));
    updateOrbitCards(cards, camera, 0.1, 1);
    const releasePosition = cardGroup.position.clone();

    expect(cards.release(0.1)).toEqual({ action: "resume" });

    updateOrbitCards(cards, camera, 0.1, 0.016);
    expect(cardGroup.position.distanceTo(releasePosition)).toBeLessThan(0.001);

    updateOrbitCards(cards, camera, 0.14, 0.016);
    expect(cardGroup.position.distanceTo(releasePosition)).toBeGreaterThan(0.05);

    cards.dispose();
  });

  it("does not launch when release is called without a drag", () => {
    const cards = createWorksOrbitCards({ theme: "night", works });

    expect(cards.release(0)).toBeNull();

    cards.dispose();
  });

  it("renders visual cards on a separate depth-tested layer", () => {
    const cards = createWorksOrbitCards({ theme: "night", works });
    const cardGroup = cards.group.children[0] as THREE.Group;
    const cardMesh = cardGroup.children.find((child) =>
      child.name.startsWith("work-card-"),
    ) as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined;

    expect(cardMesh).toBeDefined();
    expect(cardMesh?.layers.mask).toBe(1 << WORKS_ORBIT_CARD_RENDER_LAYER);
    expect(cardMesh?.material.depthTest).toBe(true);
    expect(cardMesh?.material.depthWrite).toBe(true);
    expect(cardMesh?.material.alphaTest).toBeGreaterThan(0);
    expect(cardMesh?.material.transparent).toBe(true);
    expect(cardMesh?.material.opacity).toBe(1);

    cards.dispose();
  });

  it("keeps card material opacity at full strength during orbit updates", () => {
    const camera = createCamera();
    const cards = createWorksOrbitCards({ theme: "night", works });
    const cardGroup = cards.group.children[0] as THREE.Group;
    const cardMesh = cardGroup.children.find((child) =>
      child.name.startsWith("work-card-"),
    ) as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined;

    updateOrbitCards(cards, camera, 0.2, 0.016);

    expect(cardMesh?.material.opacity).toBe(1);

    cards.dispose();
  });

  it("identifies the center launch zone and caps ritual intensity for reduced motion", () => {
    expect(isWorksLaunchZone(new THREE.Vector2(0.1, -0.1))).toBe(true);
    expect(isWorksLaunchZone(new THREE.Vector2(0.4, 0))).toBe(false);

    expect(getWorksCenterMagnetStrength(new THREE.Vector2(0, 0), false)).toBe(1);
    expect(getWorksCenterMagnetStrength(new THREE.Vector2(0, 0), true)).toBeLessThanOrEqual(0.25);
    expect(getWorksCenterMagnetStrength(new THREE.Vector2(0.8, 0.8), false)).toBe(0);
  });
});

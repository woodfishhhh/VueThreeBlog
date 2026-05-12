<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import * as THREE from "three";

import { createCircleTexture } from "@/components/scene/circle-texture";
import { getGeometryTransformTarget } from "@/components/scene/geometry-transform";
import { normalizeRotationForTween } from "@/components/scene/hypercube-rotation";
import {
  createWorksOrbitCards,
  type WorksOrbitCards,
} from "@/components/scene/works-orbit-cards";
import { useHypercube, type Hypercube } from "@/composables/useHypercube";
import { useMobiusStrip, type MobiusStrip } from "@/composables/useMobiusStrip";
import { useStarField, type StarField } from "@/composables/useStarField";
import { useTheme, type ThemeMode } from "@/composables/useTheme";
import { useThreeScene, type ThreeScene } from "@/composables/useThreeScene";
import { getWorkProjects } from "@/content/works";
import { getRouteLocationForSiteMode } from "@/router/site-mode";
import { useSiteStore } from "@/stores/site";

interface ActiveGeometry {
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  lerpColor: (target: THREE.Color, factor: number) => void;
  setOpacity: (alpha: number) => void;
}

const container = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const store = useSiteStore();
const router = useRouter();
const { theme } = useTheme();

const isDragging = ref(false);
const hovered = ref(false);
const isMobile = ref(false);

const onPointerDown = () => {
  if (store.isFocusing) isDragging.value = true;
};
const onPointerUp = () => {
  isDragging.value = false;
};
const onPointerLeave = () => {
  isDragging.value = false;
};
const onClickBackground = (event: MouseEvent) => {
  if (event.target === canvasRef.value) {
    store.triggerStep();
  }
};

const CAMERA_INTRO_DURATION = 1.8;
const CAMERA_INTRO_START_POSITION = new THREE.Vector3(0, 1.5, 92);
const CAMERA_INTRO_START_LOOK = new THREE.Vector3(0, 0, 0);
const NIGHT_CLEAR_COLOR = new THREE.Color("#050510");
const DAY_CLEAR_COLOR = new THREE.Color("#FAFAF7");
const ACTIVE_SCALE = 1;
const INACTIVE_SCALE = 0.001;

const defaultRotations = {
  night: { x: 0.5, y: 0.5, z: 0 },
  day: { x: 0.3, y: 0.36, z: 0 },
} as const;
const savedFocusRotations = {
  night: new THREE.Euler(
    defaultRotations.night.x,
    defaultRotations.night.y,
    defaultRotations.night.z,
  ),
  day: new THREE.Euler(
    defaultRotations.day.x,
    defaultRotations.day.y,
    defaultRotations.day.z,
  ),
};

let threeScene: ThreeScene | null = null;
let starField: StarField | null = null;
let hypercube: Hypercube | null = null;
let mobius: MobiusStrip | null = null;
let worksOrbitCards: WorksOrbitCards | null = null;
let controls: {
  enableZoom: boolean;
  enablePan: boolean;
  autoRotate: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  maxDistance: number;
  enabled: boolean;
  update: () => void;
  dispose: () => void;
} | null = null;
let animationFrameId: number | null = null;
let sceneTimer: THREE.Timer | null = null;
let circleTexture: THREE.CanvasTexture | null = null;
let reducedMotionQuery: MediaQueryList | null = null;
let prefersReducedMotion = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const smoothedPointer = new THREE.Vector2();
const geometryWorldCenter = new THREE.Vector3();

let introStartTime: number | null = null;
let introCompleted = false;

let rotationTweenNight: gsap.core.Tween | null = null;
let rotationTweenDay: gsap.core.Tween | null = null;

function getActiveGeometry() {
  if (theme.value === "day") return mobius;
  return hypercube;
}

function getGeometryByTheme(nextTheme: ThemeMode): ActiveGeometry | null {
  if (nextTheme === "day") {
    return mobius;
  }
  return hypercube;
}

function applyGroupTransform(
  group: THREE.Group,
  rotationTweenRef: "night" | "day",
  options: {
    position: THREE.Vector3;
    scale: number;
    rotation: { x: number; y: number; z: number };
    immediate: boolean;
  },
) {
  const activeRotationTween =
    rotationTweenRef === "night" ? rotationTweenNight : rotationTweenDay;
  if (activeRotationTween) {
    activeRotationTween.kill();
    if (rotationTweenRef === "night") rotationTweenNight = null;
    else rotationTweenDay = null;
  }

  if (options.immediate) {
    gsap.killTweensOf(group.position);
    gsap.killTweensOf(group.rotation);
    gsap.killTweensOf(group.scale);
    group.position.copy(options.position);
    group.rotation.set(
      options.rotation.x,
      options.rotation.y,
      options.rotation.z,
    );
    group.scale.setScalar(options.scale);
    return;
  }

  const normalizedRotation = normalizeRotationForTween(
    {
      x: group.rotation.x,
      y: group.rotation.y,
      z: group.rotation.z,
    },
    options.rotation,
  );
  group.rotation.set(
    normalizedRotation.x,
    normalizedRotation.y,
    normalizedRotation.z,
  );

  gsap.to(group.position, {
    x: options.position.x,
    y: options.position.y,
    z: options.position.z,
    duration: 0.8,
    ease: "power2.out",
  });

  const nextTween = gsap.to(group.rotation, {
    x: options.rotation.x,
    y: options.rotation.y,
    z: options.rotation.z,
    duration: 0.8,
    ease: "power2.out",
    onComplete: () => {
      if (rotationTweenRef === "night") rotationTweenNight = null;
      else rotationTweenDay = null;
    },
  });
  if (rotationTweenRef === "night") rotationTweenNight = nextTween;
  else rotationTweenDay = nextTween;

  gsap.to(group.scale, {
    x: options.scale,
    y: options.scale,
    z: options.scale,
    ease: "power2.out",
    duration: 0.8,
  });
}

function applyThemeImmediate(nextTheme: ThemeMode) {
  if (!threeScene || !hypercube || !mobius || !starField) return;
  const isDay = nextTheme === "day";
  hypercube.setOpacity(isDay ? 0 : 1);
  mobius.setOpacity(isDay ? 1 : 0);
  starField.setOpacity(isDay ? 0 : 1);
  hypercube.group.scale.setScalar(isDay ? INACTIVE_SCALE : ACTIVE_SCALE);
  mobius.group.scale.setScalar(isDay ? ACTIVE_SCALE : INACTIVE_SCALE);
  threeScene.scene.background = isDay
    ? DAY_CLEAR_COLOR.clone()
    : NIGHT_CLEAR_COLOR.clone();
  threeScene.renderer.setClearColor(
    isDay ? DAY_CLEAR_COLOR : NIGHT_CLEAR_COLOR,
    1,
  );
}

function updateGeometryTransform(immediate = false) {
  if (!threeScene || !hypercube || !mobius || !container.value) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  let splitCenterOffset = 0;

  if (width >= 768) {
    const aspect = width / Math.max(height, 1);
    const distance = 12;
    const halfScreenCenterNdc = 0.5;
    const halfFovRad = THREE.MathUtils.degToRad(threeScene.camera.fov / 2);
    splitCenterOffset =
      halfScreenCenterNdc * distance * Math.tan(halfFovRad) * aspect;
  }
  const inwardOffset = splitCenterOffset * 0.9;
  const target = getGeometryTransformTarget({
    mode: store.mode,
    isFocusing: store.isFocusing,
    isMobile: isMobile.value,
    inwardOffset,
  });

  const targetPosition = new THREE.Vector3(target.x, target.y, target.z);
  const activeTheme: ThemeMode = theme.value;
  const activeScale = target.baseScale * ACTIVE_SCALE;
  const inactiveScale = target.baseScale * INACTIVE_SCALE;

  const nightRotation =
    store.isFocusing && activeTheme === "night"
      ? {
          x: savedFocusRotations.night.x,
          y: savedFocusRotations.night.y,
          z: savedFocusRotations.night.z,
        }
      : defaultRotations.night;
  const dayRotation =
    store.isFocusing && activeTheme === "day"
      ? {
          x: savedFocusRotations.day.x,
          y: savedFocusRotations.day.y,
          z: savedFocusRotations.day.z,
        }
      : defaultRotations.day;

  applyGroupTransform(hypercube.group, "night", {
    position: targetPosition,
    scale: activeTheme === "night" ? activeScale : inactiveScale,
    rotation: nightRotation,
    immediate,
  });
  applyGroupTransform(mobius.group, "day", {
    position: targetPosition,
    scale: activeTheme === "day" ? activeScale * 2 : inactiveScale,
    rotation: dayRotation,
    immediate,
  });
}

function handleResize() {
  if (!container.value || !threeScene) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  isMobile.value = width < 768;

  threeScene.resize(width, height);
  updateGeometryTransform();
  updateWorksOrbitCards();
}

function handleReducedMotionChange(event: MediaQueryListEvent) {
  prefersReducedMotion = event.matches;
  updateWorksOrbitCards();
}

function updateWorksOrbitCards(elapsed = 0) {
  if (!container.value || !threeScene || !worksOrbitCards) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  const activeGeometry = getActiveGeometry();
  const visible =
    store.mode === "works" && !store.isFocusing && !isMobile.value && !!activeGeometry;

  if (activeGeometry) {
    activeGeometry.group.getWorldPosition(geometryWorldCenter);
  } else {
    geometryWorldCenter.set(0, 0, 0);
  }

  worksOrbitCards.update({
    camera: threeScene.camera,
    center: geometryWorldCenter,
    elapsed,
    reducedMotion: prefersReducedMotion,
    viewport: {
      height,
      width,
    },
    visible,
  });

  if (!visible) {
    worksOrbitCards.setHovered(null);
  }
}

function updatePointerFromEvent(event: PointerEvent | MouseEvent) {
  if (!container.value) return;
  const rect = container.value.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function openWorkLink(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    opened.opener = null;
  }
}

function handlePointerMove(event: PointerEvent) {
  updatePointerFromEvent(event);
}

function handleCanvasPointerDown(event: MouseEvent) {
  if (store.isFocusing || !threeScene) return;
  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, threeScene.camera);

  if (store.mode === "works" && !isMobile.value) {
    const worksHit = worksOrbitCards?.pick(raycaster);
    if (worksHit) {
      event.stopPropagation();
      openWorkLink(worksHit.url);
      return;
    }
  }

  const activeGeometry = getActiveGeometry();
  if (!activeGeometry) return;

  const intersects = raycaster.intersectObject(activeGeometry.hitMesh);
  if (intersects.length === 0) return;

  event.stopPropagation();

  const targetRotation =
    theme.value === "day" ? savedFocusRotations.day : savedFocusRotations.night;
  targetRotation.copy(activeGeometry.group.rotation);

  store.goHome();
  store.enterFocus();
  void router.push(getRouteLocationForSiteMode("home"));
}

onMounted(async () => {
  if (!container.value || !canvasRef.value) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  isMobile.value = width < 768;

  threeScene = useThreeScene({ canvas: canvasRef.value, width, height });
  threeScene.camera.position.copy(CAMERA_INTRO_START_POSITION);
  threeScene.camera.lookAt(CAMERA_INTRO_START_LOOK);

  circleTexture = createCircleTexture();
  starField = useStarField(circleTexture);
  threeScene.scene.add(starField.group);

  hypercube = useHypercube(circleTexture);
  threeScene.scene.add(hypercube.group);

  mobius = useMobiusStrip();
  threeScene.scene.add(mobius.group);

  worksOrbitCards = createWorksOrbitCards({
    theme: theme.value,
    works: getWorkProjects(),
  });
  threeScene.scene.add(worksOrbitCards.group);

  const { OrbitControls } =
    await import("three/examples/jsm/controls/OrbitControls.js");
  controls = new OrbitControls(
    threeScene.camera,
    threeScene.renderer.domElement,
  );
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 15;
  controls.enabled = store.isFocusing;

  applyThemeImmediate(theme.value);
  updateGeometryTransform(true);

  window.addEventListener("resize", handleResize);
  container.value.addEventListener("pointermove", handlePointerMove);
  canvasRef.value.addEventListener("pointerdown", handleCanvasPointerDown);

  if (typeof window.matchMedia === "function") {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion = reducedMotionQuery.matches;

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    } else {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }
  }

  sceneTimer = new THREE.Timer();
  sceneTimer.connect(document);

  function tick(timestamp?: number) {
    if (!threeScene || !starField || !hypercube || !mobius || !sceneTimer) return;

    sceneTimer.update(timestamp);
    const delta = sceneTimer.getDelta();
    const elapsed = sceneTimer.getElapsed();

    starField.update(delta);
    hypercube.update(delta);
    mobius.update(delta);

    const activeGeometry = getActiveGeometry();
    if (
      activeGeometry &&
      !store.isFocusing &&
      !rotationTweenNight &&
      !rotationTweenDay
    ) {
      activeGeometry.group.rotation.y += delta * 0.1;
      activeGeometry.group.rotation.x += delta * 0.05;
    }

    if (store.isFocusing) {
      controls?.update();
    } else {
      if (introStartTime === null) {
        introStartTime = elapsed;
      }

      const targetPos = new THREE.Vector3(0, 0, 10);
      const targetLook = new THREE.Vector3(0, 0, 0);

      if (
        store.mode === "blog" ||
        store.mode === "author" ||
        store.mode === "friend" ||
        store.mode === "works"
      ) {
        targetPos.set(0, 0, 12);
      } else if (store.mode === "reading") {
        targetPos.set(0, 0, 15);
      }

      if (!introCompleted && introStartTime !== null) {
        const introProgress =
          (elapsed - introStartTime) / CAMERA_INTRO_DURATION;
        const normalizedProgress = Math.min(Math.max(introProgress, 0), 1);
        const easedProgress = 1 - Math.pow(1 - normalizedProgress, 4);

        threeScene.camera.position.lerpVectors(
          CAMERA_INTRO_START_POSITION,
          targetPos,
          easedProgress,
        );
        threeScene.camera.lookAt(targetLook);

        if (normalizedProgress >= 1) introCompleted = true;
      } else {
        smoothedPointer.lerp(pointer, 2.2 * delta);
        targetPos.x += smoothedPointer.x * 0.45;
        targetPos.y += smoothedPointer.y * 0.25;
        targetLook.x += smoothedPointer.x * 0.65;
        targetLook.y += smoothedPointer.y * 0.35;

        const lookAtVec = new THREE.Vector3();
        threeScene.camera.getWorldDirection(lookAtVec);
        lookAtVec.add(threeScene.camera.position);
        lookAtVec.lerp(targetLook, 2 * delta);
        threeScene.camera.lookAt(lookAtVec);
        threeScene.camera.position.lerp(targetPos, 2 * delta);
      }
    }

    updateWorksOrbitCards(elapsed);

    const activeRaycastGeometry = getActiveGeometry();
    let worksHit: ReturnType<WorksOrbitCards["pick"]> = null;
    if (
      !store.isFocusing &&
      store.mode === "works" &&
      !isMobile.value &&
      worksOrbitCards
    ) {
      raycaster.setFromCamera(pointer, threeScene.camera);
      worksHit = worksOrbitCards.pick(raycaster);
      worksOrbitCards.setHovered(worksHit);
    } else {
      worksOrbitCards?.setHovered(null);
    }

    if (!store.isFocusing && activeRaycastGeometry) {
      raycaster.setFromCamera(pointer, threeScene.camera);
      const intersects = raycaster.intersectObject(
        activeRaycastGeometry.hitMesh,
      );
      hovered.value = !!worksHit || intersects.length > 0;
    } else if (hovered.value) {
      hovered.value = false;
    }

    const activeColorGeometry = getActiveGeometry();
    if (activeColorGeometry) {
      const targetColor =
        theme.value === "day"
          ? new THREE.Color(hovered.value ? "#3558cc" : "#151922")
          : new THREE.Color(hovered.value ? "#7ea8ff" : "#ffffff");
      activeColorGeometry.lerpColor(targetColor, 0.1);
    }

    threeScene.render();
    animationFrameId = requestAnimationFrame(tick);
  }

  tick();
});

watch(
  () => store.mode,
  () => {
    updateGeometryTransform();
    updateWorksOrbitCards();
  },
);
watch(
  () => store.isFocusing,
  (focusing) => {
    if (controls) controls.enabled = focusing;
    updateGeometryTransform();
    updateWorksOrbitCards();
  },
);
watch(theme, (nextTheme) => {
  const geometry = getGeometryByTheme(nextTheme);
  if (store.isFocusing && geometry) {
    const targetRotation =
      nextTheme === "day" ? savedFocusRotations.day : savedFocusRotations.night;
    targetRotation.copy(geometry.group.rotation);
  }
  hovered.value = false;
  applyThemeImmediate(nextTheme);
  worksOrbitCards?.setTheme(nextTheme);
  updateGeometryTransform(true);
  updateWorksOrbitCards();
});

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener("resize", handleResize);
  if (container.value)
    container.value.removeEventListener("pointermove", handlePointerMove);
  if (canvasRef.value)
    canvasRef.value.removeEventListener("pointerdown", handleCanvasPointerDown);
  if (reducedMotionQuery) {
    if (typeof reducedMotionQuery.removeEventListener === "function") {
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
    } else {
      reducedMotionQuery.removeListener(handleReducedMotionChange);
    }
  }

  if (rotationTweenNight) {
    rotationTweenNight.kill();
    rotationTweenNight = null;
  }
  if (rotationTweenDay) {
    rotationTweenDay.kill();
    rotationTweenDay = null;
  }

  if (hypercube) {
    gsap.killTweensOf(hypercube.group.position);
    gsap.killTweensOf(hypercube.group.rotation);
    gsap.killTweensOf(hypercube.group.scale);
  }
  if (mobius) {
    gsap.killTweensOf(mobius.group.position);
    gsap.killTweensOf(mobius.group.rotation);
    gsap.killTweensOf(mobius.group.scale);
  }

  starField?.dispose();
  hypercube?.dispose();
  mobius?.dispose();
  worksOrbitCards?.dispose();
  circleTexture?.dispose();
  controls?.dispose();
  sceneTimer?.dispose();
  threeScene?.dispose();

  starField = null;
  hypercube = null;
  mobius = null;
  worksOrbitCards = null;
  circleTexture = null;
  controls = null;
  sceneTimer = null;
  threeScene = null;
  reducedMotionQuery = null;
});
</script>

<template>
  <div
    ref="container"
    class="absolute inset-0 z-0 bg-[var(--stage-bg)]"
    :class="{
      'cursor-grab': store.isFocusing && !isDragging,
      'cursor-grabbing': store.isFocusing && isDragging,
      'cursor-pointer': hovered && !store.isFocusing,
    }"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointerleave="onPointerLeave"
    @click="onClickBackground">
    <canvas ref="canvasRef" class="h-full w-full outline-none"></canvas>
  </div>
</template>

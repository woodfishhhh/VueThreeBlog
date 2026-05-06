<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from "vue";
  import { useRouter } from "vue-router";
  import * as THREE from "three";
  import gsap from "gsap";

  import { createCircleTexture } from "@/components/scene/circle-texture";
  import { normalizeRotationForTween } from "@/components/scene/hypercube-rotation";
  import { useThreeScene, type ThreeScene } from "@/composables/useThreeScene";
  import { useStarField, type StarField } from "@/composables/useStarField";
  import { useHypercube, type Hypercube } from "@/composables/useHypercube";
  import { getRouteLocationForSiteMode } from "@/router/site-mode";
  import { useSiteStore } from "@/stores/site";

  const container = ref<HTMLElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const store = useSiteStore();
  const router = useRouter();

  // UI States
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
  const onClickBackground = (e: MouseEvent) => {
    if (e.target === canvasRef.value) {
      store.triggerStep();
    }
  };

  const CAMERA_INTRO_DURATION = 1.8;
  const CAMERA_INTRO_START_POSITION = new THREE.Vector3(0, 1.5, 92);
  const CAMERA_INTRO_START_LOOK = new THREE.Vector3(0, 0, 0);

  let threeScene: ThreeScene | null = null;
  let starField: StarField | null = null;
  let hypercube: Hypercube | null = null;
  let controls: any = null;
  let animationFrameId: number | null = null;
  let circleTexture: THREE.CanvasTexture | null = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const smoothedPointer = new THREE.Vector2();

  let introStartTime: number | null = null;
  let introCompleted = false;

  let rotationTween: any = null;
  const defaultRotation = { x: 0.5, y: 0.5, z: 0 };
  const savedFocusRotation = new THREE.Euler(0.5, 0.5, 0);

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

    const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
    controls = new OrbitControls(threeScene.camera, threeScene.renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.enabled = store.isFocusing;

    window.addEventListener("resize", handleResize);
    container.value.addEventListener("pointermove", handlePointerMove);
    canvasRef.value.addEventListener("pointerdown", handleCanvasPointerDown);

    updateHypercubeTransform();

    const clock = new THREE.Clock();

    function tick() {
      if (!threeScene || !starField || !hypercube) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      starField.update(delta);
      hypercube.update(delta);

      if (!store.isFocusing && !rotationTween) {
        hypercube.group.rotation.y += delta * 0.1;
        hypercube.group.rotation.x += delta * 0.05;
      }

      if (store.isFocusing) {
        controls.update();
      } else {
        if (introStartTime === null) {
          introStartTime = elapsed;
        }

        const targetPos = new THREE.Vector3(0, 0, 10);
        const targetLook = new THREE.Vector3(0, 0, 0);

        if (store.mode === "home") {
          targetPos.set(0, 0, 10);
        } else if (
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
          const introProgress = (elapsed - introStartTime) / CAMERA_INTRO_DURATION;
          const normalizedProgress = Math.min(Math.max(introProgress, 0), 1);
          const easedProgress = 1 - Math.pow(1 - normalizedProgress, 4);

          threeScene.camera.position.lerpVectors(CAMERA_INTRO_START_POSITION, targetPos, easedProgress);
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

      if (!store.isFocusing) {
        raycaster.setFromCamera(pointer, threeScene.camera);
        const intersects = raycaster.intersectObject(hypercube.hitMesh);
        if (intersects.length > 0) {
          if (!hovered.value) hovered.value = true;
        } else {
          if (hovered.value) hovered.value = false;
        }
      } else {
        if (hovered.value) hovered.value = false;
      }

      const targetColor = hovered.value ? new THREE.Color("#7ea8ff") : new THREE.Color("#ffffff");
      hypercube.lerpColor(targetColor, 0.1);

      threeScene.render();
      animationFrameId = requestAnimationFrame(tick);
    }

    tick();
  });

  function handleResize() {
    if (!container.value || !threeScene) return;
    const width = container.value.clientWidth;
    const height = container.value.clientHeight;
    isMobile.value = width < 768;

    threeScene.resize(width, height);
    updateHypercubeTransform();
  }

  function handlePointerMove(e: PointerEvent) {
    if (!container.value) return;
    const rect = container.value.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function handleCanvasPointerDown(e: MouseEvent) {
    if (store.isFocusing || !threeScene || !hypercube) return;
    raycaster.setFromCamera(pointer, threeScene.camera);
    const intersects = raycaster.intersectObject(hypercube.hitMesh);
    if (intersects.length > 0) {
      e.stopPropagation();
      savedFocusRotation.copy(hypercube.group.rotation);
      store.goHome();
      store.enterFocus();
      void router.push(getRouteLocationForSiteMode("home"));
    }
  }

  function updateHypercubeTransform() {
    if (!threeScene || !hypercube || !container.value) return;

    const width = container.value.clientWidth;
    const height = container.value.clientHeight;
    let splitCenterOffset = 0;

    if (width >= 768) {
      const aspect = width / Math.max(height, 1);
      const distance = 12;
      const halfScreenCenterNdc = 0.5;
      const halfFovRad = THREE.MathUtils.degToRad(threeScene.camera.fov / 2);
      splitCenterOffset = halfScreenCenterNdc * distance * Math.tan(halfFovRad) * aspect;
    }
    const inwardOffset = splitCenterOffset * 0.9;
    const mobile = isMobile.value;

    let targetX = 0,
      targetY = 0,
      targetZ = 0;
    let targetScale = mobile ? 0.75 : 1;

    if (store.isFocusing) {
      targetZ = 2;
    } else if (store.mode === "home") {
      targetX = 0;
      targetY = 0;
      targetZ = 0;
    } else if (store.mode === "blog") {
      if (mobile) targetY = 3;
      else targetX = inwardOffset;
    } else if (store.mode === "author") {
      if (mobile) targetY = 3;
      else targetX = -inwardOffset;
    } else if (store.mode === "friend") {
      targetY = 2.4;
    } else if (store.mode === "works") {
      targetY = 2.4;
    } else if (store.mode === "reading") {
      if (mobile) targetY = 3.5;
      else targetX = 5;
      targetScale = 0.5;
    }

    gsap.to(hypercube.group.position, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 0.8,
      ease: "power2.out",
    });

    const rotationTarget = store.isFocusing
      ? {
          x: savedFocusRotation.x,
          y: savedFocusRotation.y,
          z: savedFocusRotation.z,
        }
      : defaultRotation;
    const normalizedRotation = normalizeRotationForTween(
      {
        x: hypercube.group.rotation.x,
        y: hypercube.group.rotation.y,
        z: hypercube.group.rotation.z,
      },
      rotationTarget,
    );

    hypercube.group.rotation.set(normalizedRotation.x, normalizedRotation.y, normalizedRotation.z);

    if (rotationTween) rotationTween.kill();
    rotationTween = gsap.to(hypercube.group.rotation, {
      x: rotationTarget.x,
      y: rotationTarget.y,
      z: rotationTarget.z,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => {
        rotationTween = null;
      },
    });

    gsap.to(hypercube.group.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      ease: "power2.out",
    });
  }

  watch(() => store.mode, updateHypercubeTransform);
  watch(
    () => store.isFocusing,
    (focusing) => {
      if (controls) controls.enabled = focusing;
      updateHypercubeTransform();
    },
  );

  onBeforeUnmount(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    if (container.value) container.value.removeEventListener("pointermove", handlePointerMove);
    if (canvasRef.value) canvasRef.value.removeEventListener("pointerdown", handleCanvasPointerDown);

    if (rotationTween) {
      rotationTween.kill();
      rotationTween = null;
    }
    if (hypercube) {
      gsap.killTweensOf(hypercube.group.position);
      gsap.killTweensOf(hypercube.group.rotation);
      gsap.killTweensOf(hypercube.group.scale);
    }

    starField?.dispose();
    hypercube?.dispose();
    circleTexture?.dispose();
    controls?.dispose();
    threeScene?.dispose();

    starField = null;
    hypercube = null;
    circleTexture = null;
    controls = null;
    threeScene = null;
  });
</script>

<template>
  <div
    ref="container"
    class="absolute inset-0 z-0 bg-[#050510]"
    :class="{
      'cursor-grab': store.isFocusing && !isDragging,
      'cursor-grabbing': store.isFocusing && isDragging,
      'cursor-pointer': hovered && !store.isFocusing,
    }"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointerleave="onPointerLeave"
    @click="onClickBackground"
  >
    <canvas ref="canvasRef" class="w-full h-full outline-none"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from "vue";
  import { useRouter } from "vue-router";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import gsap from "gsap";

  import { normalizeRotationForTween } from "@/components/scene/hypercube-rotation";
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

  const onPointerDown = () => { if (store.isFocusing) isDragging.value = true; };
  const onPointerUp = () => { isDragging.value = false; };
  const onPointerLeave = () => { isDragging.value = false; };
  const onClickBackground = (e: MouseEvent) => {
    if (e.target === canvasRef.value) {
      store.triggerStep();
    }
  };

  // Hypercube Data
  function generateHypercubeData() {
    const vertices = [];
    for (let i = 0; i < 16; i++) {
      const x = i & 1 ? 1 : -1;
      const y = i & 2 ? 1 : -1;
      const z = i & 4 ? 1 : -1;
      const w = i & 8 ? 1 : -1;
      vertices.push([x, y, z, w]);
    }
    const edges = [];
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

  // Intro Config
  const CAMERA_INTRO_DURATION = 1.8;
  const CAMERA_INTRO_START_POSITION = new THREE.Vector3(0, 1.5, 92);
  const CAMERA_INTRO_START_LOOK = new THREE.Vector3(0, 0, 0);

  // ThreeJS state refs
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let controls: OrbitControls;
  let animationFrameId: number;
  let hypercubeGroup: THREE.Group;
  let hypercubeLine: THREE.LineSegments;
  let hypercubePoints: THREE.Points;
  let hypercubeHitMesh: THREE.Mesh;
  let starFieldGroup: THREE.Group;

  // Raycaster & Pointer
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const smoothedPointer = new THREE.Vector2();

  let introStartTime: number | null = null;
  let introCompleted = false;

  // 4D Rotation Angles
  let alphaRot = 0;
  let betaRot = 0;
  const { vertices, edges } = generateHypercubeData();

  let rotationTween: any = null;
  const defaultRotation = { x: 0.5, y: 0.5, z: 0 };

  // To save focus rotation when leaving focus
  const savedFocusRotation = new THREE.Euler(0.5, 0.5, 0);

  // Helper to create circular points texture
  function createCircleTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      context.beginPath();
      context.arc(32, 32, 30, 0, 2 * Math.PI);
      context.fillStyle = "white";
      context.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  // Initialize Three.js
  onMounted(() => {
    if (!container.value || !canvasRef.value) return;

    const width = container.value.clientWidth;
    const height = container.value.clientHeight;
    isMobile.value = width < 768;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color("#050510"));

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#050510");

    // Camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.copy(CAMERA_INTRO_START_POSITION);
    camera.lookAt(CAMERA_INTRO_START_LOOK);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(-10, -10, -10);
    scene.add(spotLight);

    // StarField
    starFieldGroup = new THREE.Group();
    starFieldGroup.rotation.set(0, 0, Math.PI / 4);
    const count = 5000;
    const circleTexture = createCircleTexture();
    const starPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 40 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xfcfcfc,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      map: circleTexture,
      alphaTest: 0.1,
      blending: THREE.AdditiveBlending,
    });
    const starPoints = new THREE.Points(starGeom, starMat);
    starPoints.frustumCulled = false;
    starFieldGroup.add(starPoints);
    scene.add(starFieldGroup);

    // Hypercube
    hypercubeGroup = new THREE.Group();

    // Invisible hit mesh for raycasting
    const hitGeom = new THREE.SphereGeometry(1.5, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    hypercubeHitMesh = new THREE.Mesh(hitGeom, hitMat);
    hypercubeGroup.add(hypercubeHitMesh);

    const hcGeom = new THREE.BufferGeometry();
    hcGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    hcGeom.setIndex(edges);
    const hcMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    hypercubeLine = new THREE.LineSegments(hcGeom, hcMat);
    hypercubeGroup.add(hypercubeLine);

    // Hypercube Points (Vertices)
    const hcPointsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      map: circleTexture,
      alphaTest: 0.1,
    });
    hypercubePoints = new THREE.Points(hcGeom, hcPointsMat);
    hypercubeGroup.add(hypercubePoints);

    scene.add(hypercubeGroup);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.enabled = store.isFocusing;

    // Window Resize
    window.addEventListener("resize", handleResize);

    // Mouse Move for Raycaster & Sway
    container.value.addEventListener("pointermove", handlePointerMove);
    canvasRef.value.addEventListener("pointerdown", handleCanvasPointerDown);

    // Initial Transform Update
    updateHypercubeTransform();

    // Intro Clock
    const clock = new THREE.Clock();

    function tick() {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // -- Update StarField --
      starFieldGroup.rotation.x -= delta / 50;
      starFieldGroup.rotation.y -= delta / 60;

      // -- Update Hypercube Vertices (4D Rotation) --
      alphaRot += delta * 0.5;
      betaRot += delta * 0.3;
      const positions = (hypercubeLine.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
      const cosA = Math.cos(alphaRot), sinA = Math.sin(alphaRot);
      const cosB = Math.cos(betaRot), sinB = Math.sin(betaRot);

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
      hypercubeLine.geometry.attributes.position.needsUpdate = true;

      // Apply slow 3D rotation if not focusing
      if (!store.isFocusing && !rotationTween) {
        hypercubeGroup.rotation.y += delta * 0.1;
        hypercubeGroup.rotation.x += delta * 0.05;
      }

      // -- Update Camera / Pointer Sway --
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
        } else if (store.mode === "blog" || store.mode === "author" || store.mode === "friend" || store.mode === "works") {
          targetPos.set(0, 0, 12);
        } else if (store.mode === "reading") {
          targetPos.set(0, 0, 15);
        }

        if (!introCompleted && introStartTime !== null) {
          const introProgress = (elapsed - introStartTime) / CAMERA_INTRO_DURATION;
          const normalizedProgress = Math.min(Math.max(introProgress, 0), 1);
          const easedProgress = 1 - Math.pow(1 - normalizedProgress, 4);

          camera.position.lerpVectors(CAMERA_INTRO_START_POSITION, targetPos, easedProgress);
          camera.lookAt(targetLook); // simple lookat for intro

          if (normalizedProgress >= 1) introCompleted = true;
        } else {
          // Sway
          smoothedPointer.lerp(pointer, 2.2 * delta);
          targetPos.x += smoothedPointer.x * 0.45;
          targetPos.y += smoothedPointer.y * 0.25;
          targetLook.x += smoothedPointer.x * 0.65;
          targetLook.y += smoothedPointer.y * 0.35;

          const lookAtVec = new THREE.Vector3();
          camera.getWorldDirection(lookAtVec);
          lookAtVec.add(camera.position);
          lookAtVec.lerp(targetLook, 2 * delta);
          camera.lookAt(lookAtVec);

          camera.position.lerp(targetPos, 2 * delta);
        }
      }

      // Raycast hover check
      if (!store.isFocusing) {
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(hypercubeHitMesh);
        if (intersects.length > 0) {
          if (!hovered.value) hovered.value = true;
        } else {
          if (hovered.value) hovered.value = false;
        }
      } else {
        if (hovered.value) hovered.value = false;
      }

      // Update hypercube color based on hover state
      const targetColor = hovered.value ? new THREE.Color("#7ea8ff") : new THREE.Color("#ffffff");
      const lineMat = hypercubeLine.material as THREE.LineBasicMaterial;
      const pointsMat = hypercubePoints.material as THREE.PointsMaterial;
      lineMat.color.lerp(targetColor, 0.1);
      pointsMat.color.lerp(targetColor, 0.1);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    }

    tick();
  });

  // Event Handlers
  function handleResize() {
    if (!container.value) return;
    const width = container.value.clientWidth;
    const height = container.value.clientHeight;
    isMobile.value = width < 768;

    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    if (renderer) {
      renderer.setSize(width, height);
    }

    updateHypercubeTransform();
  }

  function handlePointerMove(e: PointerEvent) {
    if (!container.value) return;
    const rect = container.value.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function handleCanvasPointerDown(e: MouseEvent) {
    if (store.isFocusing) return;
    // Check intersection
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(hypercubeHitMesh);
    if (intersects.length > 0) {
      e.stopPropagation();
      // Save rotation
      savedFocusRotation.copy(hypercubeGroup.rotation);
      store.goHome();
      store.enterFocus();
      void router.push(getRouteLocationForSiteMode("home"));
    }
  }

  // Transform Sync Logic
  function updateHypercubeTransform() {
    if (!camera || !container.value) return;

    const width = container.value.clientWidth;
    const height = container.value.clientHeight;
    let splitCenterOffset = 0;

    if (width >= 768) {
      const aspect = width / Math.max(height, 1);
      const distance = 12;
      const halfScreenCenterNdc = 0.5;
      const halfFovRad = THREE.MathUtils.degToRad(camera.fov / 2);
      splitCenterOffset = halfScreenCenterNdc * distance * Math.tan(halfFovRad) * aspect;
    }
    const inwardOffset = splitCenterOffset * 0.9;
    const mobile = isMobile.value;

    // Compute targets
    let targetX = 0, targetY = 0, targetZ = 0;
    let targetScale = mobile ? 0.75 : 1;

    if (store.isFocusing) {
      targetZ = 2;
    } else if (store.mode === "home") {
      targetX = 0; targetY = 0; targetZ = 0;
    } else if (store.mode === "blog") {
      if (mobile) targetY = 3; else targetX = inwardOffset;
    } else if (store.mode === "author") {
      if (mobile) targetY = 3; else targetX = -inwardOffset;
    } else if (store.mode === "friend") {
      targetY = 2.4;
    } else if (store.mode === "works") {
      targetY = 2.4;
    } else if (store.mode === "reading") {
      if (mobile) targetY = 3.5; else targetX = 5;
      targetScale = 0.5;
    }

    // Animate with GSAP (like react-spring config { mass:1, tension:170, friction:26 })
    gsap.to(hypercubeGroup.position, {
      x: targetX, y: targetY, z: targetZ,
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
        x: hypercubeGroup.rotation.x,
        y: hypercubeGroup.rotation.y,
        z: hypercubeGroup.rotation.z,
      },
      rotationTarget,
    );

    hypercubeGroup.rotation.set(normalizedRotation.x, normalizedRotation.y, normalizedRotation.z);

    if (store.isFocusing) {
      if (rotationTween) rotationTween.kill();
      rotationTween = gsap.to(hypercubeGroup.rotation, {
        x: rotationTarget.x,
        y: rotationTarget.y,
        z: rotationTarget.z,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          rotationTween = null;
        }
      });
    } else {
      if (rotationTween) rotationTween.kill();
      rotationTween = gsap.to(hypercubeGroup.rotation, {
        x: rotationTarget.x,
        y: rotationTarget.y,
        z: rotationTarget.z,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          rotationTween = null;
        }
      });
    }

    gsap.to(hypercubeGroup.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      ease: "power2.out",
    });
  }

  // Watchers
  watch(() => store.mode, updateHypercubeTransform);
  watch(() => store.isFocusing, (focusing) => {
    if (controls) controls.enabled = focusing;
    updateHypercubeTransform();
  });

  onBeforeUnmount(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    if (container.value) container.value.removeEventListener("pointermove", handlePointerMove);
    if (canvasRef.value) canvasRef.value.removeEventListener("pointerdown", handleCanvasPointerDown);

    if (renderer) renderer.dispose();
    if (controls) controls.dispose();
  });
</script>

<template>
  <div ref="container" class="absolute inset-0 z-0 bg-[#050510]" :class="{
    'cursor-grab': store.isFocusing && !isDragging,
    'cursor-grabbing': store.isFocusing && isDragging,
    'cursor-pointer': hovered && !store.isFocusing,
  }" @pointerdown="onPointerDown" @pointerup="onPointerUp" @pointerleave="onPointerLeave" @click="onClickBackground">
    <canvas ref="canvasRef" class="w-full h-full outline-none"></canvas>
  </div>
</template>

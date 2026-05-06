import * as THREE from "three";

export interface ThreeSceneOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: string;
}

export interface ThreeScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
}

export function useThreeScene(options: ThreeSceneOptions): ThreeScene {
  const background = options.backgroundColor ?? "#050510";

  const renderer = new THREE.WebGLRenderer({
    canvas: options.canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(options.width, options.height);
  renderer.setClearColor(new THREE.Color(background));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(75, options.width / options.height, 0.1, 1000);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);
  const spotLight = new THREE.SpotLight(0xffffff, 0.5);
  spotLight.position.set(-10, -10, -10);
  scene.add(spotLight);

  function resize(width: number, height: number) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return { renderer, scene, camera, resize, render, dispose };
}

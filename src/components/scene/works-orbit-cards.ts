import * as THREE from "three";

import type { ThemeMode } from "@/composables/useTheme";
import type { WorkProjectData } from "@/types/content";

export type WorksOrbitCardAction = "live" | "github";

export interface WorksOrbitCardHit {
  slug: string;
  action: WorksOrbitCardAction;
  url: string;
}

export interface WorksOrbitCardFrame {
  angle: number;
  depth: number;
  frontness: number;
  opacity: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
}

export interface WorksOrbitCardFrameOptions {
  center?: {
    x: number;
    y: number;
    z: number;
  };
  count: number;
  elapsed: number;
  index: number;
  radiusX?: number;
  radiusY?: number;
  radiusZ?: number;
  reducedMotion?: boolean;
}

interface WorksOrbitCardsOptions {
  theme: ThemeMode;
  works: WorkProjectData[];
}

interface WorksOrbitCardsUpdateOptions {
  camera: THREE.PerspectiveCamera;
  center: THREE.Vector3;
  elapsed: number;
  reducedMotion: boolean;
  viewport: {
    width: number;
    height: number;
  };
  visible: boolean;
}

export interface WorksOrbitCards {
  group: THREE.Group;
  dispose: () => void;
  pick: (raycaster: THREE.Raycaster) => WorksOrbitCardHit | null;
  setHovered: (hit: WorksOrbitCardHit | null) => void;
  setTheme: (theme: ThemeMode) => void;
  update: (options: WorksOrbitCardsUpdateOptions) => void;
}

const TAU = Math.PI * 2;
const ORBIT_SPEED = 0.24;
const CARD_WIDTH = 3.35;
const CARD_HEIGHT = 1.9;
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 580;
const GITHUB_HIT_WIDTH = 0.78;
const GITHUB_HIT_HEIGHT = 0.34;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function createWorksOrbitCardFrame({
  center = { x: 0, y: 0, z: 0 },
  count,
  elapsed,
  index,
  radiusX = 6.2,
  radiusY = 1.35,
  radiusZ = 2.6,
  reducedMotion = false,
}: WorksOrbitCardFrameOptions): WorksOrbitCardFrame {
  const safeCount = Math.max(count, 1);
  const phase = (index / safeCount) * TAU - Math.PI * 0.12;
  const angle = phase + (reducedMotion ? 0 : elapsed * ORBIT_SPEED);
  const depth = Math.sin(angle);
  const frontness = (depth + 1) / 2;

  return {
    angle: round(angle),
    depth: round(depth),
    frontness: round(frontness),
    opacity: round(0.46 + frontness * 0.54),
    position: {
      x: round(center.x + Math.cos(angle) * radiusX),
      y: round(center.y + Math.sin(angle - Math.PI * 0.2) * radiusY),
      z: round(center.z + depth * radiusZ),
    },
    scale: round(0.76 + frontness * 0.26),
  };
}

function getOrbitRadii(width: number) {
  return {
    radiusX: clamp(width / 210, 5.1, 7.2),
    radiusY: clamp(width / 820, 1.18, 1.7),
    radiusZ: clamp(width / 520, 2.1, 3.15),
  };
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  return canvas;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const nextRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + nextRadius, y);
  ctx.lineTo(x + width - nextRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + nextRadius);
  ctx.lineTo(x + width, y + height - nextRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - nextRadius, y + height);
  ctx.lineTo(x + nextRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - nextRadius);
  ctx.lineTo(x, y + nextRadius);
  ctx.quadraticCurveTo(x, y, x + nextRadius, y);
  ctx.closePath();
}

function drawTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  let nextText = text;
  while (ctx.measureText(nextText).width > maxWidth && nextText.length > 4) {
    nextText = `${nextText.slice(0, -2)}…`;
  }
  ctx.fillText(nextText, x, y);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = "";

  for (const char of chars) {
    const next = `${current}${char}`;
    if (ctx.measureText(next).width <= maxWidth || current.length === 0) {
      current = next;
      continue;
    }

    lines.push(current);
    current = char;
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  lines.slice(0, maxLines).forEach((line, index) => {
    const suffix = index === maxLines - 1 && lines.length >= maxLines ? "…" : "";
    drawTextLine(ctx, `${line}${suffix}`, x, y + index * lineHeight, maxWidth);
  });
}

function drawCardTexture(canvas: HTMLCanvasElement, work: WorkProjectData, theme: ThemeMode) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const isDay = theme === "day";
  ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const bg = isDay ? "rgba(250, 248, 241, 0.88)" : "rgba(8, 12, 24, 0.82)";
  const border = isDay ? "rgba(31, 34, 44, 0.24)" : "rgba(255, 255, 255, 0.22)";
  const fg = isDay ? "#17191f" : "#f6f8ff";
  const hint = isDay ? "rgba(23, 25, 31, 0.62)" : "rgba(233, 239, 255, 0.66)";
  const accent = isDay ? "#3558cc" : "#8ab2ff";

  ctx.save();
  ctx.shadowColor = isDay ? "rgba(37, 32, 22, 0.16)" : "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 24;
  roundedRect(ctx, 34, 34, TEXTURE_WIDTH - 68, TEXTURE_HEIGHT - 68, 52);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.restore();

  roundedRect(ctx, 34, 34, TEXTURE_WIDTH - 68, TEXTURE_HEIGHT - 68, 52);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = hint;
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  drawTextLine(ctx, work.kind.toUpperCase(), 82, 122, 240);

  ctx.fillStyle = accent;
  roundedRect(ctx, 760, 78, 172, 58, 29);
  ctx.globalAlpha = 0.14;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = isDay ? "rgba(53, 88, 204, 0.32)" : "rgba(138, 178, 255, 0.34)";
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "600 24px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LIVE", 846, 116);
  ctx.textAlign = "left";

  ctx.fillStyle = fg;
  ctx.font = "500 74px Inter, system-ui, sans-serif";
  drawTextLine(ctx, work.name, 82, 238, 780);

  ctx.fillStyle = hint;
  ctx.font = "400 32px Inter, system-ui, sans-serif";
  wrapText(ctx, work.description, 84, 318, 770, 48, 2);

  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(82, 426);
  ctx.lineTo(936, 426);
  ctx.stroke();

  ctx.fillStyle = accent;
  roundedRect(ctx, 82, 464, 218, 62, 31);
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = isDay ? "rgba(53, 88, 204, 0.34)" : "rgba(138, 178, 255, 0.38)";
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "600 25px Inter, system-ui, sans-serif";
  ctx.fillText("进入网站", 132, 504);

  roundedRect(ctx, 736, 464, 200, 62, 31);
  ctx.strokeStyle = border;
  ctx.stroke();
  ctx.fillStyle = hint;
  ctx.font = "600 24px Inter, system-ui, sans-serif";
  ctx.fillText("GITHUB", 784, 503);
}

function createCard(work: WorkProjectData, theme: ThemeMode, geometry: THREE.PlaneGeometry) {
  const canvas = createCanvas();
  drawCardTexture(canvas, work, theme);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const cardMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    depthTest: true,
    depthWrite: false,
    map: texture,
    opacity: 0,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  });
  const cardMesh = new THREE.Mesh(geometry, cardMaterial);
  cardMesh.name = `work-card-${work.slug}`;
  cardMesh.renderOrder = 80;

  const group = new THREE.Group();
  group.name = `work-orbit-card-${work.slug}`;
  group.add(cardMesh);

  return {
    cardMaterial,
    group,
    texture,
    work,
  };
}

function createHitMesh(
  geometry: THREE.PlaneGeometry,
  material: THREE.MeshBasicMaterial,
  hit: WorksOrbitCardHit,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = hit;
  mesh.renderOrder = 120;
  return mesh;
}

export function createWorksOrbitCards({ theme, works }: WorksOrbitCardsOptions): WorksOrbitCards {
  const group = new THREE.Group();
  group.name = "works-orbit-cards";
  group.visible = false;

  const cardGeometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
  const liveHitGeometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
  const githubHitGeometry = new THREE.PlaneGeometry(GITHUB_HIT_WIDTH, GITHUB_HIT_HEIGHT);
  const hitMaterial = new THREE.MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    opacity: 0,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const hitMeshes: THREE.Mesh[] = [];
  const cards = works.map((work) => {
    const card = createCard(work, theme, cardGeometry);
    const liveHitMesh = createHitMesh(liveHitGeometry, hitMaterial, {
      action: "live",
      slug: work.slug,
      url: work.liveUrl,
    });
    liveHitMesh.position.z = 0.01;
    card.group.add(liveHitMesh);
    hitMeshes.push(liveHitMesh);

    const githubHitMesh = createHitMesh(githubHitGeometry, hitMaterial, {
      action: "github",
      slug: work.slug,
      url: work.githubUrl,
    });
    githubHitMesh.position.set(1.12, -0.69, 0.04);
    card.group.add(githubHitMesh);
    hitMeshes.push(githubHitMesh);

    group.add(card.group);
    return card;
  });

  let hoveredSlug: string | null = null;

  return {
    group,
    dispose() {
      for (const card of cards) {
        card.texture.dispose();
        card.cardMaterial.dispose();
      }
      cardGeometry.dispose();
      liveHitGeometry.dispose();
      githubHitGeometry.dispose();
      hitMaterial.dispose();
      group.clear();
    },
    pick(raycaster) {
      if (!group.visible) return null;

      const intersections = raycaster.intersectObjects(hitMeshes, false);
      const hit = intersections[0]?.object.userData as Partial<WorksOrbitCardHit> | undefined;
      if (!hit?.slug || !hit.action || !hit.url) return null;

      return {
        action: hit.action,
        slug: hit.slug,
        url: hit.url,
      };
    },
    setHovered(hit) {
      hoveredSlug = hit?.slug ?? null;
    },
    setTheme(nextTheme) {
      for (const card of cards) {
        drawCardTexture(card.texture.image as HTMLCanvasElement, card.work, nextTheme);
        card.texture.needsUpdate = true;
      }
    },
    update({ camera, center, elapsed, reducedMotion, viewport, visible }) {
      group.visible = visible;
      if (!visible) return;

      const radii = getOrbitRadii(viewport.width);
      cards.forEach((card, index) => {
        const frame = createWorksOrbitCardFrame({
          center,
          count: cards.length,
          elapsed,
          index,
          radiusX: radii.radiusX,
          radiusY: radii.radiusY,
          radiusZ: radii.radiusZ,
          reducedMotion,
        });
        const hovered = hoveredSlug === card.work.slug;

        card.group.position.set(frame.position.x, frame.position.y, frame.position.z);
        card.group.quaternion.copy(camera.quaternion);
        card.group.rotateZ((index - 1) * 0.025);
        card.group.scale.setScalar(frame.scale * (hovered ? 1.08 : 1));
        card.group.renderOrder = Math.round(70 + frame.frontness * 60);
        card.cardMaterial.opacity = frame.opacity * (hovered ? 1 : 0.92);
        card.cardMaterial.color.set(hovered ? "#ffffff" : "#f4f7ff");
      });
    },
  };
}

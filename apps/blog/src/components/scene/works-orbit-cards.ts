import * as THREE from "three";

import type { ThemeMode } from "@/composables/useTheme";
import type { WorkProjectData } from "@/types/content";

export type WorksOrbitCardAction = "live" | "github";
export type WorksOrbitCardReleaseResult =
  | { action: "launch"; url: string }
  | { action: "resume" }
  | null;

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
  phaseOffset?: number;
  reducedMotion?: boolean;
}

interface WorksOrbitCardsOptions {
  theme: ThemeMode;
  works: WorkProjectData[];
}

interface WorksOrbitCardsUpdateOptions {
  camera: THREE.PerspectiveCamera;
  center: THREE.Vector3;
  delta: number;
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
  beginDrag: (hit: WorksOrbitCardHit, pointerNdc: THREE.Vector2) => void;
  clearInteraction: () => void;
  dispose: () => void;
  drag: (pointerNdc: THREE.Vector2) => void;
  isInteracting: () => boolean;
  pick: (raycaster: THREE.Raycaster, pointerNdc?: THREE.Vector2) => WorksOrbitCardHit | null;
  release: (elapsed: number) => WorksOrbitCardReleaseResult;
  setHovered: (hit: WorksOrbitCardHit | null) => void;
  setTheme: (theme: ThemeMode) => void;
  update: (options: WorksOrbitCardsUpdateOptions) => void;
}

const TAU = Math.PI * 2;
const ORBIT_SPEED = 0.24;
const CARD_WIDTH = 4.25;
const CARD_HEIGHT = 2.4;
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 580;
const DRAG_DISTANCE_FROM_CAMERA = 5.2;
const DRAG_LERP_SPEED = 18;
const DRAG_MAX_VIEWPORT_FRACTION = 0.46;
const LAUNCH_ZONE_HALF_NDC = 0.28;
const MAGNET_FALLOFF_NDC = 0.78;
const REDUCED_MOTION_INTENSITY_CAP = 0.25;
const INTERACTION_RENDER_ORDER = 1_000;
const RETURN_ANIMATION_DURATION = 0.38;
const RETURN_ANIMATION_DURATION_REDUCED = 0.18;
export const WORKS_ORBIT_CARD_RENDER_LAYER = 1;

interface CardInteractionState {
  hit: WorksOrbitCardHit;
  pointerNdc: THREE.Vector2;
  slug: string;
}

interface CardScreenHit {
  frontness: number;
  halfHeight: number;
  halfWidth: number;
  hit: WorksOrbitCardHit;
  x: number;
  y: number;
}

interface CardReturnState {
  startedAt: number;
  startPosition: THREE.Vector3;
  startScale: number;
}

const orbitPosition = new THREE.Vector3();
const dragRaycaster = new THREE.Raycaster();
const dragPosition = new THREE.Vector3();
const lastCenter = new THREE.Vector3();
const screenPosition = new THREE.Vector3();
let lastRadii = getWorksOrbitRadii(1440);

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
  radiusY = 2.6,
  radiusZ = 6.2,
  phaseOffset = 0,
  reducedMotion = false,
}: WorksOrbitCardFrameOptions): WorksOrbitCardFrame {
  const safeCount = Math.max(count, 1);
  const phase = (index / safeCount) * TAU - Math.PI * 0.12 + phaseOffset;
  const angle = phase + (reducedMotion ? 0 : elapsed * ORBIT_SPEED);
  const depth = Math.sin(angle);
  const frontness = (depth + 1) / 2;

  return {
    angle: round(angle),
    depth: round(depth),
    frontness: round(frontness),
    opacity: 1,
    position: {
      x: round(center.x + Math.cos(angle) * radiusX),
      y: round(center.y + depth * radiusY),
      z: round(center.z + depth * radiusZ),
    },
    scale: round(0.9 - frontness * 0.3),
  };
}

export function getWorksOrbitRadii(width: number) {
  return {
    radiusX: clamp(width / 160, 6.2, 9.2),
    radiusY: clamp(width / 450, 2.6, 3.4),
    radiusZ: clamp(width / 190, 6.2, 8.2),
  };
}

export function isWorksLaunchZone(pointerNdc: THREE.Vector2) {
  return (
    Math.abs(pointerNdc.x) <= LAUNCH_ZONE_HALF_NDC && Math.abs(pointerNdc.y) <= LAUNCH_ZONE_HALF_NDC
  );
}

export function getWorksCenterMagnetStrength(pointerNdc: THREE.Vector2, reducedMotion = false) {
  const distance = Math.hypot(pointerNdc.x, pointerNdc.y);
  const strength = clamp(1 - distance / MAGNET_FALLOFF_NDC, 0, 1);
  return reducedMotion ? Math.min(strength, REDUCED_MOTION_INTENSITY_CAP) : strength;
}

function getBaseAngle(index: number, count: number, elapsed: number) {
  const safeCount = Math.max(count, 1);
  return (index / safeCount) * TAU - Math.PI * 0.12 + elapsed * ORBIT_SPEED;
}

function getPointerWorldPosition(pointerNdc: THREE.Vector2, camera: THREE.PerspectiveCamera) {
  dragRaycaster.setFromCamera(pointerNdc, camera);
  return dragPosition
    .copy(dragRaycaster.ray.origin)
    .addScaledVector(dragRaycaster.ray.direction, DRAG_DISTANCE_FROM_CAMERA);
}

function getDragScale(camera: THREE.PerspectiveCamera, frameScale: number, strength: number) {
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const viewHeight = 2 * Math.tan(fov / 2) * DRAG_DISTANCE_FROM_CAMERA;
  const viewWidth = viewHeight * camera.aspect;
  const maxScale = (viewWidth * DRAG_MAX_VIEWPORT_FRACTION) / CARD_WIDTH;
  const minScale = Math.max(frameScale * 1.06, maxScale * 0.72);
  return THREE.MathUtils.lerp(minScale, Math.max(minScale, maxScale), strength);
}

function getCardScreenHit(
  camera: THREE.PerspectiveCamera,
  cardPosition: THREE.Vector3,
  scale: number,
  hit: WorksOrbitCardHit,
  frontness: number,
): CardScreenHit {
  screenPosition.copy(cardPosition).project(camera);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = Math.max(camera.position.distanceTo(cardPosition), 0.001);
  const viewHeight = 2 * Math.tan(fov / 2) * distance;
  const viewWidth = viewHeight * camera.aspect;

  return {
    frontness,
    halfHeight: (CARD_HEIGHT * scale) / viewHeight,
    halfWidth: (CARD_WIDTH * scale) / viewWidth,
    hit,
    x: screenPosition.x,
    y: screenPosition.y,
  };
}

function getLerpAlpha(delta: number, speed: number) {
  return 1 - Math.exp(-Math.max(delta, 0) * speed);
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

function getProjectDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split(/[/?#]/)[0] || url;
  }
}

function drawCardTexture(canvas: HTMLCanvasElement, work: WorkProjectData, theme: ThemeMode) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const isDay = theme === "day";
  ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const bg = isDay ? "#fbf7ed" : "#10172b";
  const bgSoft = isDay ? "#fffdf6" : "#182036";
  const border = isDay ? "rgba(76, 61, 43, 0.12)" : "rgba(221, 232, 255, 0.10)";
  const fg = isDay ? "#17191f" : "#f6f8ff";
  const hint = isDay ? "rgba(23, 25, 31, 0.62)" : "rgba(233, 239, 255, 0.66)";
  const subtle = isDay ? "rgba(37, 28, 16, 0.12)" : "rgba(255, 255, 255, 0.10)";
  const avatarBg = isDay ? "#f1e6d3" : "#1a2440";
  const accent = isDay ? "#3558cc" : "#8ab2ff";
  const pin = isDay ? "rgba(155, 101, 24, 0.42)" : "rgba(138, 178, 255, 0.44)";
  const domain = getProjectDomain(work.liveUrl);
  const initials =
    Array.from(work.name.replace(/[^a-z0-9]/gi, ""))
      .slice(0, 2)
      .join("")
      .toUpperCase() || work.kind.slice(0, 2).toUpperCase();

  ctx.save();
  ctx.shadowColor = isDay ? "rgba(37, 32, 22, 0.16)" : "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  roundedRect(ctx, 38, 38, TEXTURE_WIDTH - 76, TEXTURE_HEIGHT - 76, 28);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.restore();

  roundedRect(ctx, 38, 38, TEXTURE_WIDTH - 76, TEXTURE_HEIGHT - 76, 28);
  ctx.fillStyle = bgSoft;
  ctx.fill();

  ctx.save();
  ctx.shadowColor = isDay ? "rgba(37, 28, 16, 0.24)" : "rgba(0, 0, 0, 0.26)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  roundedRect(ctx, TEXTURE_WIDTH / 2 - 7, 62, 14, 14, 999);
  ctx.fillStyle = pin;
  ctx.fill();
  ctx.restore();

  roundedRect(ctx, 86, 102, 132, 132, 20);
  ctx.fillStyle = avatarBg;
  ctx.fill();
  roundedRect(ctx, 86, 102, 132, 132, 20);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "700 42px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, 152, 168);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = fg;
  ctx.font = "600 54px Inter, system-ui, sans-serif";
  drawTextLine(ctx, work.name, 252, 148, 610);

  ctx.fillStyle = hint;
  ctx.font = "600 23px Inter, system-ui, sans-serif";
  drawTextLine(ctx, domain, 254, 200, 520);

  ctx.fillStyle = accent;
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  drawTextLine(ctx, work.kind.toUpperCase(), 920, 128, 160);
  ctx.textAlign = "left";

  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(84, 286);
  ctx.lineTo(940, 286);
  ctx.stroke();

  ctx.fillStyle = hint;
  ctx.font = "400 31px Inter, system-ui, sans-serif";
  wrapText(ctx, work.description, 88, 354, 840, 48, 3);

  roundedRect(ctx, 86, 486, 272, 42, 14);
  ctx.fillStyle = subtle;
  ctx.fill();
  ctx.fillStyle = hint;
  ctx.font = "600 20px Inter, system-ui, sans-serif";
  drawTextLine(ctx, work.githubUrl.replace(/^https?:\/\//, ""), 108, 514, 228);
}

function createCard(work: WorkProjectData, theme: ThemeMode, geometry: THREE.PlaneGeometry) {
  const canvas = createCanvas();
  drawCardTexture(canvas, work, theme);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.premultiplyAlpha = true;

  const cardMaterial = new THREE.MeshBasicMaterial({
    alphaTest: 0.02,
    color: 0xffffff,
    depthTest: true,
    depthWrite: true,
    map: texture,
    opacity: 1,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  });
  const cardMesh = new THREE.Mesh(geometry, cardMaterial);
  cardMesh.name = `work-card-${work.slug}`;
  cardMesh.renderOrder = 90;
  cardMesh.layers.set(WORKS_ORBIT_CARD_RENDER_LAYER);

  const group = new THREE.Group();
  group.name = `work-orbit-card-${work.slug}`;
  group.add(cardMesh);

  return {
    cardMaterial,
    cardMesh,
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

    group.add(card.group);
    return card;
  });

  let hoveredSlug: string | null = null;
  let interaction: CardInteractionState | null = null;
  const phaseOffsets = new Map<string, number>();
  const returnStates = new Map<string, CardReturnState>();
  const screenHits = new Map<string, CardScreenHit>();

  return {
    group,
    beginDrag(hit, pointerNdc) {
      const card = cards.find((item) => item.work.slug === hit.slug);
      if (!card) return;
      returnStates.delete(card.work.slug);
      interaction = {
        hit: {
          action: "live",
          slug: card.work.slug,
          url: card.work.liveUrl,
        },
        pointerNdc: pointerNdc.clone(),
        slug: card.work.slug,
      };
      hoveredSlug = card.work.slug;
    },
    clearInteraction() {
      interaction = null;
    },
    drag(pointerNdc) {
      if (!interaction) return;
      interaction.pointerNdc.copy(pointerNdc);
    },
    dispose() {
      for (const card of cards) {
        card.texture.dispose();
        card.cardMaterial.dispose();
      }
      cardGeometry.dispose();
      liveHitGeometry.dispose();
      hitMaterial.dispose();
      group.clear();
    },
    isInteracting() {
      return interaction !== null;
    },
    pick(raycaster, pointerNdc) {
      if (!group.visible) return null;

      const intersections = raycaster.intersectObjects(hitMeshes, false);
      const hit = intersections[0]?.object.userData as Partial<WorksOrbitCardHit> | undefined;
      if (hit?.slug && hit.action && hit.url) {
        return {
          action: hit.action,
          slug: hit.slug,
          url: hit.url,
        };
      }

      if (!pointerNdc) return null;
      return (
        [...screenHits.values()]
          .filter((screenHit) => {
            return (
              Math.abs(pointerNdc.x - screenHit.x) <= screenHit.halfWidth &&
              Math.abs(pointerNdc.y - screenHit.y) <= screenHit.halfHeight
            );
          })
          .sort((a, b) => b.frontness - a.frontness)[0]?.hit ?? null
      );
    },
    release(elapsed) {
      if (!interaction) return null;

      const activeInteraction = interaction;
      const cardIndex = cards.findIndex((card) => card.work.slug === activeInteraction.slug);
      const card = cards[cardIndex];
      interaction = null;

      if (!card) return null;
      hoveredSlug = card.work.slug;

      if (isWorksLaunchZone(activeInteraction.pointerNdc)) {
        returnStates.delete(card.work.slug);
        return {
          action: "launch",
          url: card.work.liveUrl || activeInteraction.hit.url,
        };
      }

      const localX = (card.group.position.x - lastCenter.x) / lastRadii.radiusX;
      const localZ = (card.group.position.z - lastCenter.z) / lastRadii.radiusZ;
      const projectedAngle = Math.atan2(localZ, localX);
      phaseOffsets.set(
        card.work.slug,
        projectedAngle - getBaseAngle(cardIndex, cards.length, elapsed),
      );
      returnStates.set(card.work.slug, {
        startedAt: elapsed,
        startPosition: card.group.position.clone(),
        startScale: card.group.scale.x,
      });

      return { action: "resume" };
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
    update({ camera, center, delta, elapsed, reducedMotion, viewport, visible }) {
      group.visible = visible;
      if (!visible) {
        interaction = null;
        screenHits.clear();
        return;
      }

      const radii = getWorksOrbitRadii(viewport.width);
      lastCenter.copy(center);
      lastRadii = radii;
      cards.forEach((card, index) => {
        const frame = createWorksOrbitCardFrame({
          center,
          count: cards.length,
          elapsed,
          index,
          phaseOffset: phaseOffsets.get(card.work.slug) ?? 0,
          radiusX: radii.radiusX,
          radiusY: radii.radiusY,
          radiusZ: radii.radiusZ,
          reducedMotion,
        });
        const hovered = hoveredSlug === card.work.slug;
        const activeInteraction = interaction?.slug === card.work.slug ? interaction : null;
        const returnState = returnStates.get(card.work.slug);

        card.group.quaternion.copy(camera.quaternion);
        card.group.rotateZ((index - 1) * 0.025);

        if (activeInteraction) {
          const targetPosition = getPointerWorldPosition(activeInteraction.pointerNdc, camera);
          const strength = getWorksCenterMagnetStrength(
            activeInteraction.pointerNdc,
            reducedMotion,
          );
          const lerpAlpha = getLerpAlpha(delta, DRAG_LERP_SPEED);
          card.group.position.lerp(targetPosition, lerpAlpha);
          card.group.scale.setScalar(getDragScale(camera, frame.scale, strength));
          card.group.renderOrder = INTERACTION_RENDER_ORDER;
          card.cardMesh.renderOrder = INTERACTION_RENDER_ORDER;
          card.cardMaterial.opacity = 1;
          card.cardMaterial.color.set("#ffffff");
          screenHits.set(
            card.work.slug,
            getCardScreenHit(
              camera,
              card.group.position,
              card.group.scale.x,
              activeInteraction.hit,
              1,
            ),
          );
          return;
        }

        orbitPosition.set(frame.position.x, frame.position.y, frame.position.z);
        const orbitScale = frame.scale * (hovered ? 1.08 : 1);
        const cardRenderOrder = Math.round(90 + frame.frontness * 50);
        let resolvedRenderOrder = cardRenderOrder;

        if (returnState) {
          const duration = reducedMotion
            ? RETURN_ANIMATION_DURATION_REDUCED
            : RETURN_ANIMATION_DURATION;
          const progress = clamp((elapsed - returnState.startedAt) / duration, 0, 1);
          const easedProgress = 1 - (1 - progress) ** 3;

          card.group.position.lerpVectors(returnState.startPosition, orbitPosition, easedProgress);
          card.group.scale.setScalar(
            THREE.MathUtils.lerp(returnState.startScale, orbitScale, easedProgress),
          );
          resolvedRenderOrder = Math.round(
            THREE.MathUtils.lerp(INTERACTION_RENDER_ORDER, cardRenderOrder, easedProgress),
          );

          if (progress >= 1) {
            returnStates.delete(card.work.slug);
          }
        } else {
          card.group.position.copy(orbitPosition);
          card.group.scale.setScalar(orbitScale);
        }

        card.group.renderOrder = resolvedRenderOrder;
        card.cardMesh.renderOrder = resolvedRenderOrder;
        card.cardMaterial.opacity = 1;
        card.cardMaterial.color.set(hovered ? "#ffffff" : "#f4f7ff");
        screenHits.set(
          card.work.slug,
          getCardScreenHit(
            camera,
            card.group.position,
            card.group.scale.x,
            {
              action: "live",
              slug: card.work.slug,
              url: card.work.liveUrl,
            },
            frame.frontness,
          ),
        );
      });
    },
  };
}

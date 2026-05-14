import { nextTick, onBeforeUnmount, onMounted, watch, type ShallowRef } from "vue";
import Matter from "matter-js";

type CapsuleSkill = {
  title: string;
  color: string;
};

interface UseMatterCapsulesOptions {
  active: Readonly<ShallowRef<boolean>>;
  sceneRef: Readonly<ShallowRef<HTMLElement | null>>;
  skills: Readonly<ShallowRef<CapsuleSkill[]>>;
}

interface CapsuleBody {
  body: Matter.Body;
  element: HTMLElement;
  initiallyStatic: boolean;
  released: boolean;
  width: number;
  height: number;
}

const WALL_THICKNESS = 96;
const STEP_MS = 1000 / 60;

export function useMatterCapsules({
  active,
  sceneRef,
  skills,
}: UseMatterCapsulesOptions) {
  let engine: Matter.Engine | null = null;
  let mouseConstraint: Matter.MouseConstraint | null = null;
  let mouse: Matter.Mouse | null = null;
  let windowResizeHandler: (() => void) | null = null;
  let resizeTimer: number | null = null;
  let animationFrameId: number | null = null;
  let capsuleBodies: CapsuleBody[] = [];
  let lastTimestamp = 0;
  let accumulatedTime = 0;
  let suppressNextClick = false;
  let agitationTimer: number | null = null;
  let collisionHandler: ((event: Matter.IEventCollision<Matter.Engine>) => void) | null = null;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function cleanup() {
    stopAnimation();
    if (windowResizeHandler !== null) {
      window.removeEventListener('resize', windowResizeHandler);
      windowResizeHandler = null;
    }
    if (resizeTimer !== null) {
      window.clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    if (agitationTimer !== null) {
      window.clearInterval(agitationTimer);
      agitationTimer = null;
    }

    if (mouseConstraint) {
      Matter.Events.off(mouseConstraint, "startdrag");
      Matter.Events.off(mouseConstraint, "enddrag");
      Matter.Events.off(mouseConstraint, "mousedown");
      Matter.Events.off(mouseConstraint, "mouseup");
    }

    if (engine) {
      if (collisionHandler) {
        Matter.Events.off(engine, "collisionStart", collisionHandler);
        collisionHandler = null;
      }
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    }

    mouseConstraint = null;
    mouse = null;
    engine = null;
    capsuleBodies = [];
    lastTimestamp = 0;
    accumulatedTime = 0;
    suppressNextClick = false;
  }

  function syncBodies() {
    for (const capsule of capsuleBodies) {
      capsule.element.style.transform =
        `translate(${capsule.body.position.x - capsule.width / 2}px, ${capsule.body.position.y - capsule.height / 2}px) rotate(${capsule.body.angle}rad)`;
    }
  }

  function setDraggingState(body: Matter.Body | null, dragging: boolean) {
    for (const capsule of capsuleBodies) {
      const active = capsule.body === body;
      capsule.element.style.zIndex = active && dragging ? "3" : "1";
      capsule.element.style.cursor = dragging ? "grabbing" : "grab";
      capsule.element.style.filter = active && dragging ? "brightness(1.06)" : "none";
    }
  }

  function releaseCapsule(capsule: CapsuleBody, impulse = true) {
    if (capsule.released) {
      return;
    }

    capsule.released = true;
    Matter.Body.setStatic(capsule.body, false);
    capsule.element.removeAttribute("data-author-fixed");
    capsule.element.classList.add("is-released");
    if (!impulse) {
      return;
    }

    Matter.Body.setVelocity(capsule.body, {
      x: (Math.random() - 0.5) * 4,
      y: 1.5 + Math.random() * 2,
    });
    Matter.Body.setAngularVelocity(capsule.body, (Math.random() - 0.5) * 0.16);
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function layoutStatic(container: HTMLElement) {
    const capsuleElements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-author-capsule]"),
    );
    const bounds = container.getBoundingClientRect();
    const columns = bounds.width < 520 ? 2 : bounds.width < 900 ? 3 : 5;
    const gutter = 24;
    const colWidth = (bounds.width - gutter * 2) / columns;
    let freeBodyIndex = 0;

    for (const element of capsuleElements) {
      const isTitle = element.hasAttribute("data-author-fixed");
      const width = Math.max(element.offsetWidth, isTitle ? 260 : 120);
      if (isTitle) {
        const cx = Math.max(gutter, bounds.width * 0.32 - width / 2);
        element.style.transform = `translate(${cx}px, 48px)`;
        continue;
      }

      const row = Math.floor(freeBodyIndex / columns);
      const col = freeBodyIndex % columns;
      const x = Math.min(gutter + col * colWidth + (colWidth - width) / 2, bounds.width - width - gutter);
      const y = 220 + row * 62;
      element.style.transform = `translate(${Math.max(gutter, x)}px, ${y}px)`;
      freeBodyIndex += 1;
    }
  }

  function tick(timestamp: number) {
    if (!engine) {
      return;
    }

    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
    }

    accumulatedTime += Math.min(48, timestamp - lastTimestamp);
    lastTimestamp = timestamp;

    while (accumulatedTime >= STEP_MS) {
      Matter.Engine.update(engine, STEP_MS);
      accumulatedTime -= STEP_MS;
    }

    syncBodies();
    animationFrameId = requestAnimationFrame(tick);
  }

  function buildWorld(container: HTMLElement) {
    cleanup();

    if (prefersReducedMotion()) {
      layoutStatic(container);
      return;
    }

    const capsuleElements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-author-capsule]"),
    );
    if (capsuleElements.length === 0) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }

    engine = Matter.Engine.create({
      gravity: {
        x: 0,
        y: 0.5,
      },
      positionIterations: 10,
      velocityIterations: 6,
      constraintIterations: 4,
    });

    mouse = Matter.Mouse.create(container);
    mouse.pixelRatio = window.devicePixelRatio || 1;
    mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.22,
        damping: 0.16,
        render: {
          visible: false,
        },
      },
    });

    const walls: Matter.Body[] = [
      Matter.Bodies.rectangle(
        bounds.width / 2,
        bounds.height + WALL_THICKNESS / 2,
        bounds.width + WALL_THICKNESS * 2,
        WALL_THICKNESS,
        { isStatic: true },
      ),
      Matter.Bodies.rectangle(
        -WALL_THICKNESS / 2,
        bounds.height / 2,
        WALL_THICKNESS,
        bounds.height + WALL_THICKNESS * 2,
        { isStatic: true },
      ),
      Matter.Bodies.rectangle(
        bounds.width + WALL_THICKNESS / 2,
        bounds.height / 2,
        WALL_THICKNESS,
        bounds.height + WALL_THICKNESS * 2,
        { isStatic: true },
      ),
    ];

    const gutter = Math.min(40, bounds.width * 0.06);
    const usableWidth = Math.max(1, bounds.width - gutter * 2);
    let freeBodyIndex = 0;

    capsuleBodies = capsuleElements.map((element) => {
      const initiallyStatic = element.hasAttribute("data-author-fixed");
      const width = Math.max(element.offsetWidth, initiallyStatic ? 288 : 120);
      const height = Math.max(element.offsetHeight, initiallyStatic ? 126 : 52);
      const staticX = Math.min(bounds.width - width / 2 - 24, Math.max(width / 2 + 28, bounds.width * 0.38));
      const staticY = Math.min(bounds.height * 0.22, height / 2 + 48);

      // Scatter freely across full width with staggered vertical entry
      const x = initiallyStatic
        ? staticX
        : gutter + width / 2 + Math.random() * (usableWidth - width);
      // Each capsule starts at a unique random height above viewport
      // Earlier indices enter first (smaller negative y), later ones enter later
      const verticalSpread = bounds.height * 0.5;
      const y = initiallyStatic
        ? staticY
        : -(height / 2 + 20 + Math.random() * verticalSpread + freeBodyIndex * 18);
      if (!initiallyStatic) {
        freeBodyIndex += 1;
      }

      const body = Matter.Bodies.rectangle(x, y, width, height, {
        isStatic: initiallyStatic,
        restitution: 0.72,
        friction: 0.014,
        frictionStatic: 0,
        frictionAir: 0.012,
        density: 0.0018,
        slop: 0.05,
        chamfer: {
          radius: height / 2,
        },
      });

      if (!initiallyStatic) {
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 1.8,
          y: 0.6 + Math.random() * 2.4,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
      }

      return {
        body,
        element,
        initiallyStatic,
        released: !initiallyStatic,
        width,
        height,
      };
    });

    Matter.Composite.add(engine.world, [
      ...walls,
      ...capsuleBodies.map((capsule) => capsule.body),
      mouseConstraint,
    ]);

    collisionHandler = (event) => {
      for (const pair of event.pairs) {
        const capsuleA = capsuleBodies.find((capsule) => capsule.body === pair.bodyA);
        const capsuleB = capsuleBodies.find((capsule) => capsule.body === pair.bodyB);
        if (!capsuleA || !capsuleB) {
          continue;
        }

        if (capsuleA.initiallyStatic && !capsuleA.released && !capsuleB.initiallyStatic) {
          releaseCapsule(capsuleA);
        }
        if (capsuleB.initiallyStatic && !capsuleB.released && !capsuleA.initiallyStatic) {
          releaseCapsule(capsuleB);
        }
      }
    };
    Matter.Events.on(engine, "collisionStart", collisionHandler);

    agitationTimer = window.setInterval(() => {
      if (!engine || capsuleBodies.length === 0 || !active.value) {
        return;
      }

      const releasedCapsules = capsuleBodies.filter((capsule) => capsule.released);
      for (let index = 0; index < Math.min(2, releasedCapsules.length); index += 1) {
        const capsule = releasedCapsules[Math.floor(Math.random() * releasedCapsules.length)];
        Matter.Body.applyForce(capsule.body, capsule.body.position, {
          x: (Math.random() - 0.5) * 0.006,
          y: -0.002 - Math.random() * 0.003,
        });
      }
    }, 3600);

    Matter.Events.on(mouseConstraint, "startdrag", (event) => {
      const dragEvent = event as typeof event & { body: Matter.Body };
      suppressNextClick = true;
      setDraggingState(dragEvent.body, true);
    });

    Matter.Events.on(mouseConstraint, "enddrag", (event) => {
      const dragEvent = event as typeof event & { body: Matter.Body };
      setDraggingState(dragEvent.body, false);
      window.setTimeout(() => {
        suppressNextClick = false;
      }, 120);
    });

    Matter.Events.on(mouseConstraint, "mouseup", () => {
      window.setTimeout(() => {
        suppressNextClick = false;
      }, 120);
    });

    windowResizeHandler = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        if (sceneRef.value) {
          buildWorld(sceneRef.value);
        }
      }, 200);
    };
    window.addEventListener('resize', windowResizeHandler);

    syncBodies();
    animationFrameId = requestAnimationFrame(tick);
  }

  function activateSkill(index: number) {
    if (!engine || capsuleBodies.length === 0 || suppressNextClick) {
      return;
    }

    const target = capsuleBodies[index];
    if (!target) {
      return;
    }

    if (target.initiallyStatic && !target.released) {
      releaseCapsule(target);
      return;
    }

    Matter.Body.setVelocity(target.body, {
      x: (Math.random() - 0.5) * 9,
      y: -5.2 - Math.random() * 2.1,
    });
    Matter.Body.setAngularVelocity(target.body, (Math.random() - 0.5) * 0.28);

    for (const capsule of capsuleBodies) {
      if (capsule === target) {
        continue;
      }

      Matter.Body.applyForce(capsule.body, capsule.body.position, {
        x: (Math.random() - 0.5) * 0.018,
        y: -0.004 - Math.random() * 0.008,
      });
    }
  }

  async function setup() {
    await nextTick();
    if (!active.value || !sceneRef.value || skills.value.length === 0) {
      return;
    }

    buildWorld(sceneRef.value);
  }

  onMounted(() => {
    void setup();
  });

  watch(
    () => active.value,
    (nextActive) => {
      if (nextActive) {
        void setup();
        return;
      }

      cleanup();
    },
    { immediate: false },
  );

  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    activateSkill,
  };
}

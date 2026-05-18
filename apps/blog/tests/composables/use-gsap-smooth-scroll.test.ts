import { mount } from "@vue/test-utils";
import { defineComponent, onMounted, shallowRef } from "vue";
import { describe, expect, it, vi } from "vitest";

import { useGsapSmoothScroll } from "../../src/composables/useGsapSmoothScroll";

const { gsapTo } = vi.hoisted(() => {
  const gsapTo = vi.fn(
    (target: HTMLElement, vars: { scrollTop: number; onComplete?: () => void }) => {
      target.scrollTop = vars.scrollTop;
      vars.onComplete?.();
      return { kill: vi.fn() };
    },
  );

  return { gsapTo };
});

vi.mock("gsap", () => ({
  default: {
    to: gsapTo,
  },
}));

function installReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      matches,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

function createScroller() {
  const scroller = document.createElement("div");

  Object.defineProperty(scroller, "scrollTop", {
    configurable: true,
    value: 0,
    writable: true,
  });
  Object.defineProperty(scroller, "scrollHeight", {
    configurable: true,
    value: 1600,
  });
  Object.defineProperty(scroller, "clientHeight", {
    configurable: true,
    value: 400,
  });

  return scroller;
}

describe("useGsapSmoothScroll", () => {
  it("eases wheel input into the custom scroll container", async () => {
    installReducedMotion(false);
    const scroller = createScroller();

    mount(
      defineComponent({
        setup() {
          const target = shallowRef<HTMLElement | null>(null);
          useGsapSmoothScroll(target);

          onMounted(() => {
            target.value = scroller;
          });

          return () => null;
        },
      }),
    );

    await Promise.resolve();

    const event = new WheelEvent("wheel", { cancelable: true, deltaY: 240 });
    scroller.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(gsapTo).toHaveBeenCalledWith(
      scroller,
      expect.objectContaining({
        duration: expect.any(Number),
        ease: "power3.out",
        scrollTop: 240,
      }),
    );
    expect(scroller.scrollTop).toBe(240);
  });

  it("falls back to native scrolling when reduced motion is requested", async () => {
    installReducedMotion(true);
    gsapTo.mockClear();
    const scroller = createScroller();

    mount(
      defineComponent({
        setup() {
          const target = shallowRef<HTMLElement | null>(null);
          useGsapSmoothScroll(target);

          onMounted(() => {
            target.value = scroller;
          });

          return () => null;
        },
      }),
    );

    await Promise.resolve();

    const event = new WheelEvent("wheel", { cancelable: true, deltaY: 240 });
    scroller.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(gsapTo).not.toHaveBeenCalled();
  });
});

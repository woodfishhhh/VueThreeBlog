import gsap from "gsap";
import { onBeforeUnmount, watch, type Ref } from "vue";

interface UseGsapSmoothScrollOptions {
  duration?: number;
  ease?: string;
  wheelMultiplier?: number;
}

export function useGsapSmoothScroll(
  scrollContainer: Ref<HTMLElement | null | undefined>,
  options: UseGsapSmoothScrollOptions = {},
) {
  const duration = options.duration ?? 0.58;
  const ease = options.ease ?? "power3.out";
  const wheelMultiplier = options.wheelMultiplier ?? 1;

  let boundContainer: HTMLElement | null = null;
  let targetScrollTop = 0;
  let activeTween: gsap.core.Tween | null = null;
  let isAnimating = false;
  let reducedMotionQuery: MediaQueryList | null = null;
  let prefersReducedMotion = false;

  function getMaxScrollTop(container: HTMLElement) {
    return Math.max(0, container.scrollHeight - container.clientHeight);
  }

  function clampScrollTop(container: HTMLElement, value: number) {
    return Math.max(0, Math.min(getMaxScrollTop(container), value));
  }

  function syncScrollPosition(nextTop?: number) {
    if (!boundContainer) {
      return;
    }

    activeTween?.kill();
    activeTween = null;
    isAnimating = false;
    targetScrollTop = clampScrollTop(boundContainer, nextTop ?? boundContainer.scrollTop);
  }

  function handleNativeScroll() {
    if (!boundContainer || isAnimating) {
      return;
    }

    targetScrollTop = boundContainer.scrollTop;
  }

  function handleWheel(event: WheelEvent) {
    if (!boundContainer || prefersReducedMotion || event.ctrlKey) {
      return;
    }

    const maxScrollTop = getMaxScrollTop(boundContainer);
    if (maxScrollTop <= 0 || event.deltaY === 0) {
      return;
    }

    targetScrollTop = clampScrollTop(boundContainer, targetScrollTop + event.deltaY * wheelMultiplier);
    event.preventDefault();

    activeTween?.kill();
    isAnimating = true;
    activeTween = gsap.to(boundContainer, {
      duration,
      ease,
      overwrite: "auto",
      scrollTop: targetScrollTop,
      onComplete: () => {
        if (!boundContainer) {
          return;
        }

        isAnimating = false;
        activeTween = null;
        targetScrollTop = boundContainer.scrollTop;
      },
    });
  }

  function bindContainer(container: HTMLElement | null | undefined) {
    if (boundContainer === container) {
      return;
    }

    activeTween?.kill();
    activeTween = null;
    isAnimating = false;
    boundContainer?.removeEventListener("wheel", handleWheel);
    boundContainer?.removeEventListener("scroll", handleNativeScroll);

    boundContainer = container ?? null;
    targetScrollTop = boundContainer?.scrollTop ?? 0;
    boundContainer?.addEventListener("wheel", handleWheel, { passive: false });
    boundContainer?.addEventListener("scroll", handleNativeScroll, { passive: true });
  }

  function handleReducedMotionChange(event: MediaQueryListEvent) {
    prefersReducedMotion = event.matches;
    syncScrollPosition();
  }

  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion = reducedMotionQuery.matches;

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    } else {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }
  }

  watch(
    () => scrollContainer.value,
    (container) => {
      bindContainer(container);
    },
    { flush: "post", immediate: true },
  );

  onBeforeUnmount(() => {
    activeTween?.kill();
    boundContainer?.removeEventListener("wheel", handleWheel);
    boundContainer?.removeEventListener("scroll", handleNativeScroll);

    if (reducedMotionQuery) {
      if (typeof reducedMotionQuery.removeEventListener === "function") {
        reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      } else {
        reducedMotionQuery.removeListener(handleReducedMotionChange);
      }
    }
  });

  return {
    syncScrollPosition,
  };
}

import { describe, expect, it } from "vite-plus/test";

import { getPresetVars } from "@/motion/route-transition-presets";

describe("route transition presets", () => {
  it("uses low-motion config when reduced motion is enabled", () => {
    const vars = getPresetVars("focusPush", { reducedMotion: true });
    expect(vars.duration).toBeLessThanOrEqual(0.32);
    expect(vars.blur).toBe(0);
    expect(vars.scaleFrom).toBe(1);
    expect(vars.yFrom).toBeGreaterThanOrEqual(4);
  });

  it("uses cinematic config when reduced motion is disabled", () => {
    const vars = getPresetVars("focusPush", { reducedMotion: false });
    expect(vars.duration).toBeGreaterThanOrEqual(0.6);
    expect(vars.blur).toBeGreaterThan(0);
    expect(vars.scaleFrom).toBeLessThan(1);
    expect(vars.yFrom).toBeGreaterThan(10);
  });

  it("keeps soft return lighter than focus push", () => {
    const focus = getPresetVars("focusPush", { reducedMotion: false });
    const back = getPresetVars("softReturn", { reducedMotion: false });
    expect(back.duration).toBeLessThan(focus.duration);
    expect(back.blur).toBeLessThanOrEqual(focus.blur);
  });
});

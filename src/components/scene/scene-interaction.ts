import type { SiteMode, WorksViewMode } from "@/stores/site";

export type ScenePointerDownAction = "grab-card" | "focus-geometry" | "none";

export interface ScenePointerDownActionOptions {
  mode: SiteMode;
  worksViewMode: WorksViewMode;
  isFocusing: boolean;
  isMobile: boolean;
  hasWorksHit: boolean;
  hasGeometryHit: boolean;
}

export function isDesktopWorksOrbitMode(
  mode: SiteMode,
  worksViewMode: WorksViewMode,
  isMobile: boolean,
) {
  return mode === "works" && worksViewMode === "orbit" && !isMobile;
}

export function shouldRaycastSceneGeometry(
  mode: SiteMode,
  _worksViewMode: WorksViewMode,
  isFocusing: boolean,
  _isMobile: boolean,
) {
  return mode === "home" && !isFocusing;
}

export function resolveScenePointerDownAction({
  mode,
  worksViewMode,
  isFocusing,
  isMobile,
  hasWorksHit,
  hasGeometryHit,
}: ScenePointerDownActionOptions): ScenePointerDownAction {
  if (isFocusing) return "none";
  if (mode === "works" && !isMobile) {
    if (worksViewMode !== "orbit") return "none";
    return hasWorksHit ? "grab-card" : "none";
  }

  if (!shouldRaycastSceneGeometry(mode, worksViewMode, isFocusing, isMobile)) {
    return "none";
  }

  return hasGeometryHit ? "focus-geometry" : "none";
}

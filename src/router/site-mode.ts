import type { RouteLocationNormalizedLoaded, RouteLocationRaw, RouteRecordName } from "vue-router";

import type { SitePanelMode } from "@/stores/site";

const sitePanelRouteNames = ["home", "works", "blog", "author", "friend"] as const satisfies readonly SitePanelMode[];

export function resolveSiteModeFromRoute(
  routeOrName: Pick<RouteLocationNormalizedLoaded, "name"> | RouteRecordName | null | undefined,
): SitePanelMode | null {
  const routeName = typeof routeOrName === "object" && routeOrName !== null ? routeOrName.name : routeOrName;

  if (typeof routeName !== "string") {
    return null;
  }

  return sitePanelRouteNames.find((item) => item === routeName) ?? null;
}

export function getRouteLocationForSiteMode(mode: SitePanelMode): RouteLocationRaw {
  return { name: mode };
}


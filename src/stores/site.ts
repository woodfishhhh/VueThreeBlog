import { defineStore } from "pinia";

export type SiteMode = "home" | "blog" | "author" | "friend" | "works" | "reading";
export type SitePanelMode = Exclude<SiteMode, "reading">;

interface SiteState {
  mode: SiteMode;
  isFocusing: boolean;
  activePostSlug: string | null;
  cubeStep: number;
}

export const useSiteStore = defineStore("site", {
  state: (): SiteState => ({
    mode: "home",
    isFocusing: false,
    activePostSlug: null,
    cubeStep: 0,
  }),
  actions: {
    setPanelMode(mode: SitePanelMode) {
      this.mode = mode;
      this.isFocusing = false;
      this.activePostSlug = null;
    },
    syncRouteMode(mode: SitePanelMode) {
      this.mode = mode;
      if (mode !== "home") {
        this.isFocusing = false;
      }
      this.activePostSlug = null;
    },
    goHome() {
      this.setPanelMode("home");
    },
    goBlog() {
      this.setPanelMode("blog");
    },
    goAuthor() {
      this.setPanelMode("author");
    },
    goFriend() {
      this.setPanelMode("friend");
    },
    goWorks() {
      this.setPanelMode("works");
    },
    enterReading(slug: string) {
      this.mode = "reading";
      this.isFocusing = false;
      this.activePostSlug = slug;
    },
    closeReading() {
      this.mode = "blog";
      this.activePostSlug = null;
    },
    enterFocus() {
      this.isFocusing = true;
    },
    exitFocus() {
      this.isFocusing = false;
    },
    triggerStep() {
      this.cubeStep += 1;
    },
  },
});

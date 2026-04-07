import { defineStore } from "pinia";

export type SiteMode = "home" | "blog" | "author" | "friend" | "reading";

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
    goHome() {
      this.mode = "home";
      this.isFocusing = false;
      this.activePostSlug = null;
    },
    goBlog() {
      this.mode = "blog";
      this.isFocusing = false;
      this.activePostSlug = null;
    },
    goAuthor() {
      this.mode = "author";
      this.isFocusing = false;
      this.activePostSlug = null;
    },
    goFriend() {
      this.mode = "friend";
      this.isFocusing = false;
      this.activePostSlug = null;
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

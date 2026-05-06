import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "@/router";
import { resolveSiteModeFromRoute } from "@/router/site-mode";
import { useSiteStore } from "@/stores/site";
import "@/assets/main.css";

const app = createApp(App);
const pinia = createPinia();
const siteStore = useSiteStore(pinia);

function syncSiteMode() {
  const nextMode = resolveSiteModeFromRoute(router.currentRoute.value);
  if (!nextMode) {
    siteStore.exitFocus();
    return;
  }

  siteStore.syncRouteMode(nextMode);
}

syncSiteMode();
router.afterEach(() => {
  syncSiteMode();
});

app.use(pinia);
app.use(router);
app.mount("#app");

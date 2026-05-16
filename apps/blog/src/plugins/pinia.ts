import { createPinia } from "pinia";

// @pinia/nuxt@0.11 does not yet support Nuxt 5 nightly.
// Register Pinia manually so all stores work correctly in SPA mode.
export default defineNuxtPlugin((nuxtApp) => {
  const pinia = createPinia();
  nuxtApp.vueApp.use(pinia);
  return {
    provide: {
      pinia,
    },
  };
});

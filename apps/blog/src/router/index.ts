import { createRouter, createWebHistory } from "vue-router";

import { resolvePostSlug } from "@/content/posts";

const HomeView = () => import("@/views/HomeView.vue");
const PostView = () => import("@/views/PostView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");

const ROUTES_USING_HOME = ["home", "works", "blog", "author", "friend"];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...ROUTES_USING_HOME.map((name) => ({
      path: name === "home" ? "/" : `/${name}`,
      name,
      component: HomeView,
      meta: { title: name.charAt(0).toUpperCase() + name.slice(1) },
    })),
    {
      path: "/posts/:slug",
      name: "post",
      component: PostView,
      props: true,
      meta: { title: "Blog Post" },
      async beforeEnter(to) {
        const incomingSlug = String(to.params.slug ?? "");
        const canonicalSlug = incomingSlug ? await resolvePostSlug(incomingSlug) : null;

        if (canonicalSlug && canonicalSlug !== incomingSlug) {
          return {
            name: "post",
            params: { slug: canonicalSlug },
            replace: true,
          };
        }

        return true;
      },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFoundView,
      meta: { title: "404 Not Found" },
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 96,
      };
    }

    return { top: 0 };
  },
});

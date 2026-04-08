import { createRouter, createWebHistory } from "vue-router";

import { resolvePostSlug } from "@/content/posts";

const HomeView = () => import("@/views/HomeView.vue");
const PostView = () => import("@/views/PostView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/works",
      name: "works",
      component: HomeView,
    },
    {
      path: "/blog",
      name: "blog",
      component: HomeView,
    },
    {
      path: "/author",
      name: "author",
      component: HomeView,
    },
    {
      path: "/friend",
      name: "friend",
      component: HomeView,
    },
    {
      path: "/posts/:slug",
      name: "post",
      component: PostView,
      props: true,
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

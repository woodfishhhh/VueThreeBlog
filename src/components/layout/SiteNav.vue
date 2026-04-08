<script setup lang="ts">
  import { shallowRef } from "vue";

  import { useSiteStore } from "@/stores/site";

  const siteStore = useSiteStore();
  const isOpen = shallowRef(false);

  const navItems = [
    { id: "home", label: "Home", action: () => siteStore.goHome() },
    { id: "works", label: "Works", action: () => siteStore.goWorks() },
    { id: "blog", label: "Blog", action: () => siteStore.goBlog() },
    { id: "author", label: "Author", action: () => siteStore.goAuthor() },
    { id: "friend", label: "Friend", action: () => siteStore.goFriend() },
  ] as const;

  function handleNav(action: () => void) {
    action();
    siteStore.exitFocus();
    isOpen.value = false;
  }

  function isActive(id: (typeof navItems)[number]["id"]) {
    return siteStore.mode === id;
  }
</script>

<template>
  <nav
    class="pointer-events-none fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-6">
    <RouterLink to="/"
      class="pointer-events-auto cursor-pointer text-xl font-bold tracking-widest text-white mix-blend-difference"
      @click="handleNav(() => siteStore.goHome())">
      WOODFISH
    </RouterLink>

    <div data-nav-group="desktop" class="pointer-events-auto hidden gap-8 md:flex">
      <RouterLink v-for="item in navItems" :key="item.id" to="/"
        :aria-current="isActive(item.id) ? 'page' : undefined"
        :data-nav-item="item.id"
        :class="isActive(item.id) ? 'text-blue-300' : 'text-gray-400 hover:text-blue-400'"
        class="relative text-sm uppercase tracking-widest transition-colors" @click="handleNav(item.action)">
        <span>{{ item.label }}</span>
        <span
          v-if="isActive(item.id)"
          data-testid="nav-active-indicator"
          class="absolute -bottom-2 left-0 h-px w-full bg-blue-200"
        />
      </RouterLink>
    </div>

    <div class="pointer-events-auto md:hidden">
      <button aria-label="Toggle Menu" class="p-2 text-white transition-colors hover:text-blue-400" type="button"
        @click="isOpen = !isOpen">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="isOpen" d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"
            stroke-width="2" />
          <path v-else d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
      </button>
    </div>

    <Transition name="fade-slide">
      <div v-if="isOpen"
        class="pointer-events-auto absolute right-6 top-20 flex min-w-[150px] flex-col gap-4 rounded-lg border border-gray-800 bg-black/80 p-4 shadow-lg backdrop-blur-md md:hidden">
        <RouterLink v-for="item in navItems" :key="item.id" to="/"
          :aria-current="isActive(item.id) ? 'page' : undefined"
          :data-nav-item="item.id"
          :class="isActive(item.id) ? 'text-blue-300' : 'text-gray-400 hover:text-blue-400'"
          class="relative w-full text-left text-sm uppercase tracking-widest transition-colors" @click="handleNav(item.action)">
          <span>{{ item.label }}</span>
          <span
            v-if="isActive(item.id)"
            data-testid="nav-active-indicator"
            class="absolute -bottom-1 left-0 h-px w-10 bg-blue-200"
          />
        </RouterLink>
      </div>
    </Transition>
  </nav>
</template>

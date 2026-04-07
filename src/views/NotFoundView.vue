<template>
  <main class="grid min-h-screen place-items-center bg-[#050510] px-6 text-white">
    <div class="space-y-4 text-center">
      <p class="text-sm uppercase tracking-[0.4em] text-white/40">404</p>
      <h1 class="text-4xl font-semibold tracking-tight text-white">Page not found</h1>
      <RouterLink
        class="inline-flex rounded-full border border-white/15 px-5 py-2 text-sm tracking-[0.2em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
        to="/"
      >
        Back Home
      </RouterLink>
    </div>
  </main>
</template>

<template>
  <main class="grid min-h-screen place-items-center bg-[var(--stage-bg)] px-6 text-[var(--stage-fg)]">
    <div class="space-y-4 text-center">
      <p class="text-sm uppercase tracking-[0.4em] text-[var(--stage-hint)]">404</p>
      <h1 class="text-4xl font-semibold tracking-tight text-[var(--stage-fg)]">Page not found</h1>
      <RouterLink
        class="inline-flex rounded-full border border-[var(--border-subtle)] px-5 py-2 text-sm tracking-[0.2em] text-[var(--stage-hint)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--stage-fg)]"
        to="/"
      >
        Back Home
      </RouterLink>
    </div>
  </main>
</template>

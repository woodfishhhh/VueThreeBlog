<template>
  <main
    class="grid min-h-screen place-items-center bg-[var(--stage-bg)] px-6 text-[var(--stage-fg)]"
  >
    <div class="space-y-4 text-center">
      <p class="text-sm uppercase tracking-[0.4em] text-[var(--stage-hint)]">{{ error?.statusCode ?? 404 }}</p>
      <h1 class="text-4xl font-semibold tracking-tight text-[var(--stage-fg)]">
        {{ error?.statusCode === 404 ? "Page not found" : "Something went wrong" }}
      </h1>
      <NuxtLink
        class="inline-flex rounded-full border border-[var(--border-subtle)] px-5 py-2 text-sm tracking-[0.2em] text-[var(--stage-hint)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--stage-fg)]"
        to="/"
      >
        Back Home
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message?: string } | null }>();
</script>

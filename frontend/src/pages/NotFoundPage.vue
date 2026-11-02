<template>
  <section class="flex flex-col items-center justify-center py-24 text-center space-y-4">
    <p class="text-6xl font-bold font-outfit text-[var(--accent)]">404</p>
    <h1 class="text-2xl font-bold font-outfit">Page not found</h1>
    <p class="text-sm text-[var(--text-muted)] max-w-xs">The page you are looking for does not exist or has moved.</p>
    <router-link to="/" class="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent-hover)] transition">Back to Explore</router-link>
  </section>
</template>

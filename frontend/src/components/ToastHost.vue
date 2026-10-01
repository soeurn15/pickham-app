<template>
  <div class="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4" aria-live="polite">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      role="status"
      class="pointer-events-auto flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
      :class="{
        'border-[var(--panel-border)] bg-[var(--bg-soft)] text-[var(--text)]': toast.type !== 'error',
        'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300': toast.type === 'error'
      }"
    >
      <span class="flex items-center gap-2">
        <span
          class="h-2 w-2 shrink-0 rounded-full"
          :class="toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-amber-500' : 'bg-[var(--accent)]'"
        ></span>
        {{ toast.message }}
      </span>
      <button type="button" class="text-xs text-[var(--text-muted)] hover:text-[var(--text)]" @click="dismissToast(toast.id)">Dismiss</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toasts, dismissToast } from '../utils/toast'
</script>

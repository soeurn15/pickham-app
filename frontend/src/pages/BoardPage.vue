<template>
  <section class="space-y-8 animate-scale-up">
    <div v-if="feed.boardNotFound" class="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <h1 class="text-2xl font-bold font-outfit">Board not found</h1>
      <p class="text-sm text-[var(--text-muted)]">It may have been removed.</p>
      <router-link to="/profile" class="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent-hover)] transition">Back to Profile</router-link>
    </div>

    <template v-else>
      <div class="relative rounded-[32px] bg-[var(--bg-soft)] border border-[var(--panel-border)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div class="space-y-2">
          <router-link to="/profile" class="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition pb-2">
            ← Back to Profile
          </router-link>
          <h1 class="text-3xl font-bold tracking-tight text-[var(--text)] font-outfit leading-tight">{{ feed.selectedBoard?.name }}</h1>
          <p class="text-sm text-[var(--text-muted)] max-w-xl">{{ feed.selectedBoard?.description || 'A beautiful collection of saved pins.' }}</p>
        </div>
        <div class="rounded-2xl bg-[var(--bg)] border border-[var(--panel-border)] px-5 py-3 text-center sm:self-center">
          <span class="block text-2xl font-bold text-[var(--text)] font-outfit">{{ feed.boardPins.length }}</span>
          <span class="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Saved Pins</span>
        </div>
      </div>

      <div v-if="feed.isLoadingBoard" class="flex flex-col items-center justify-center py-20" aria-busy="true">
        <div class="h-10 w-10 rounded-full border-4 border-t-[var(--accent)] border-[var(--panel-border)] animate-spin"></div>
      </div>

      <div v-else-if="feed.boardPins.length === 0" class="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p class="text-sm text-[var(--text-muted)] italic">There are no pins saved in this board yet.</p>
        <router-link to="/" class="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent-hover)] transition">Find Pins to Save</router-link>
      </div>

      <div v-else class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5 mx-auto">
        <div
          v-for="pin in feed.boardPins"
          :key="pin.id"
          class="masonry-item group relative mb-5 break-inside-avoid overflow-hidden rounded-[24px] bg-[var(--bg-soft)] border border-[var(--panel-border)] shadow-sm hover:shadow-lg transition-all cursor-pointer"
          @click="ui.openPin(pin.id)"
        >
          <div class="relative overflow-hidden w-full bg-slate-200 dark:bg-zinc-800">
            <img :src="pin.thumb_url || pin.image_url" :alt="pin.title" loading="lazy" decoding="async" class="w-full h-auto object-cover transition duration-300 group-hover:scale-102" />
            <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex p-3 justify-end items-start z-10" @click.stop>
              <button
                type="button"
                class="rounded-full bg-red-600/90 text-white p-2 hover:bg-red-700 hover:scale-105 transition shadow cursor-pointer"
                title="Remove from Board"
                aria-label="Remove from board"
                @click="feed.removePinFromBoard(pin.id)"
              >
                <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div class="p-4">
            <h4 class="font-outfit text-sm font-semibold text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent)] transition">{{ pin.title }}</h4>
            <p class="text-xs text-[var(--text-muted)] mt-1.5">by {{ pin.username }}</p>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFeedStore } from '../stores/feed'
import { useUiStore } from '../stores/ui'

const route = useRoute()
const feed = useFeedStore()
const ui = useUiStore()

watch(() => route.params.id, id => { if (id) feed.openBoard(Number(id)) }, { immediate: true })
</script>

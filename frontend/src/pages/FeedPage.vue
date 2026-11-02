<template>
  <section class="space-y-6">
    <!-- Category filter chips -->
    <div class="no-scrollbar flex items-center gap-2.5 overflow-x-auto py-1">
      <button
        v-for="cat in feed.categories"
        :key="cat"
        type="button"
        class="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95"
        :class="feed.activeCategory === cat ? 'bg-[var(--text)] text-[var(--bg)] shadow-md' : 'bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--panel-border)] hover:text-[var(--text)] hover:border-[var(--text-muted)]/40'"
        @click="feed.activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div v-if="feed.searchText" class="flex items-center gap-2 text-sm text-[var(--text-muted)]">
      <span>Search results for:</span>
      <span class="font-bold text-[var(--text)]">"{{ feed.searchText }}"</span>
      <button class="text-xs text-[var(--accent)] font-semibold underline ml-2 hover:text-[var(--accent-hover)]" @click="feed.searchText = ''">Clear</button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="feed.isLoading" class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5" aria-busy="true" aria-label="Loading pins">
      <div
        v-for="(h, i) in [220, 300, 180, 260, 340, 200, 280, 240, 320, 190]"
        :key="i"
        class="skeleton mb-5 break-inside-avoid rounded-2xl border border-[var(--panel-border)]"
        :style="{ height: h + 'px' }"
      ></div>
    </div>

    <!-- Request failed -->
    <div v-else-if="feed.loadError" role="alert" class="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <h3 class="text-xl font-bold font-outfit">Something went wrong</h3>
      <p class="text-sm text-[var(--text-muted)] max-w-xs">{{ feed.loadError }}</p>
      <button type="button" class="rounded-full bg-[var(--text)] text-[var(--bg-soft)] px-6 py-2.5 text-xs font-bold hover:opacity-90 transition" @click="feed.fetchPins(true)">
        Try again
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="feed.pins.length === 0" class="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-soft)] p-5 text-[var(--accent)]">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
      <template v-if="hasFilters">
        <h3 class="text-xl font-bold font-outfit">No pins match your search</h3>
        <p class="text-sm text-[var(--text-muted)] max-w-xs">Try double checking your keywords or exploring other categories.</p>
        <button type="button" class="rounded-full bg-[var(--text)] text-[var(--bg-soft)] px-6 py-2.5 text-xs font-bold hover:opacity-90 transition" @click="feed.resetFilters()">
          Reset Filters
        </button>
      </template>
      <template v-else>
        <h3 class="text-xl font-bold font-outfit">Nothing here yet</h3>
        <p class="text-sm text-[var(--text-muted)] max-w-xs">Be the first to share an image.</p>
        <router-link to="/create" class="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent-hover)] transition">Create a pin</router-link>
      </template>
    </div>

    <!-- Masonry grid -->
    <template v-else>
      <div class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5 mx-auto">
        <PinCard
          v-for="pin in feed.pins"
          :key="pin.id"
          :pin="pin"
          :boards="feed.boards"
          @click="ui.openPin(pin.id)"
          @like="feed.toggleLike"
          @favorite="feed.toggleFavorite"
          @save="feed.savePinToBoard"
        />
      </div>

      <div v-if="feed.hasMore()" class="flex justify-center pt-2">
        <button
          type="button"
          :disabled="feed.isLoadingMore"
          class="rounded-full border border-[var(--panel-border)] bg-[var(--bg-soft)] px-8 py-2.5 text-sm font-semibold hover:border-[var(--text-muted)]/40 transition disabled:opacity-60"
          @click="feed.fetchPins(false)"
        >
          {{ feed.isLoadingMore ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import PinCard from '../components/PinCard.vue'
import { useFeedStore } from '../stores/feed'
import { useUiStore } from '../stores/ui'

const feed = useFeedStore()
const ui = useUiStore()

const hasFilters = computed(() => !!feed.searchText || feed.activeCategory !== 'All')

onMounted(() => feed.fetchPins(true))

// Search as you type, but wait for a short pause so each keystroke isn't a request
let timer: ReturnType<typeof setTimeout> | undefined
watch(() => feed.searchText, () => {
  clearTimeout(timer)
  timer = setTimeout(() => feed.fetchPins(true), 300)
})
watch(() => feed.activeCategory, () => feed.fetchPins(true))
onBeforeUnmount(() => clearTimeout(timer))
</script>

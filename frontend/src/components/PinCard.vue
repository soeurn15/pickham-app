<template>
  <div 
    class="masonry-item group relative mb-6 break-inside-avoid cursor-pointer"
    @click="$emit('click', pin)"
  >
    <!-- Image Wrapper with Rounded Corners & Premium Shadows -->
    <div class="relative overflow-hidden w-full rounded-2xl bg-slate-200 dark:bg-zinc-800 shadow-[var(--shadow)] group-hover:shadow-[var(--shadow-lg)] transition-all duration-500 ring-1 ring-inset ring-black/5 dark:ring-white/5">
      <img 
        :src="pin.image_url" 
        :alt="pin.title"
        loading="lazy"
        class="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
      />

      <!-- Favorite badge (always visible) -->
      <span v-if="pin.is_favorited" class="absolute left-3 top-3 z-[5] flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white shadow group-hover:opacity-0 transition-opacity" title="In your favorites">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4a1 1 0 011-1h12a1 1 0 011 1v17l-7-4-7 4V4z" /></svg>
      </span>
      <!-- Hover Action Overlay (Top/Bottom gradient highlight) -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-10 pointer-events-none">
        
        <!-- Top Row: Save to Board -->
        <div class="flex items-center justify-between gap-2 w-full">
          <select 
            v-model="selectedBoardId" @click.stop 
            :disabled="!boards.length"
            class="pointer-events-auto disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-black/50 flex-1 max-w-[130px] truncate rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs text-white outline-none hover:bg-black/75 transition"
          >
            <option :value="null" disabled class="text-black bg-white">{{ boards.length ? 'Choose board' : 'No boards yet' }}</option>
            <option 
              v-for="board in boards" 
              :key="board.id" 
              :value="board.id"
              class="text-black bg-white"
            >
              {{ board.name }}
            </option>
          </select>
          
          <button 
            type="button"
            @click.stop="handleSave"
            :disabled="selectedBoardId === null && !isSaved"
            class="pointer-events-auto rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-1.5 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
          >
            {{ saveButtonText }}
          </button>
        </div>

        <!-- Bottom Row: Quick actions -->
        <div class="flex items-center justify-between w-full">
          <!-- Like Button -->
          <button 
            type="button"
            @click.stop="handleLike"
            class="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 px-3 py-1.5 text-white transition duration-200 cursor-pointer shadow-sm"
          >
            <svg 
              class="h-4.5 w-4.5 stroke-2 transition-colors duration-300"
              :class="pin.is_liked ? 'fill-red-500 stroke-red-500 animate-heart-pop' : 'fill-none stroke-white'" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span class="text-xs font-semibold">{{ pin.likes_count || 0 }}</span>
          </button>

          <div class="pointer-events-auto flex items-center gap-2">
            <!-- Favorite Button -->
            <button
              type="button"
              @click.stop="$emit('favorite', pin.id)"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 hover:bg-slate-100 transition shadow-md cursor-pointer"
              :title="pin.is_favorited ? 'Remove from favorites' : 'Add to favorites'"
              :aria-label="pin.is_favorited ? 'Remove from favorites' : 'Add to favorites'"
              :aria-pressed="!!pin.is_favorited"
            >
              <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" :class="pin.is_favorited ? 'fill-amber-400 stroke-amber-500' : 'fill-none'">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 4a1 1 0 011-1h12a1 1 0 011 1v17l-7-4-7 4V4z" />
              </svg>
            </button>

            <!-- Download Button -->
            <button
              type="button"
              @click.stop="handleDownload"
              :disabled="isDownloading"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 hover:bg-slate-100 transition shadow-md cursor-pointer disabled:opacity-60"
              title="Download image"
              aria-label="Download image"
            >
              <span v-if="isDownloading" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"></span>
              <svg v-else class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Details footer sitting cleanly below the image box -->
    <div class="pt-3 pb-1 px-1">
      <h3 class="font-outfit text-sm font-semibold leading-snug text-[var(--text)] group-hover:text-[var(--accent)] transition duration-200 line-clamp-1">
        {{ pin.title }}
      </h3>
      
      <!-- Author info -->
      <div class="mt-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img 
            :src="pin.user_avatar || 'https://ui-avatars.com/api/?name=User'" 
            :alt="pin.username"
            class="h-5.5 w-5.5 rounded-full object-cover ring-2 ring-[var(--panel-border)]/50"
          />
          <span class="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition">
            {{ pin.username }}
          </span>
        </div>
        <span 
          v-if="pin.category" 
          class="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]"
        >
          {{ pin.category }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { downloadImage } from '../utils/download'

const props = defineProps<{
  pin: {
    id: number
    title: string
    image_url: string
    category?: string
    tags?: string
    username: string
    user_avatar: string
    likes_count: number
    is_liked: boolean
    is_favorited?: boolean
  }
  boards: Array<{
    id: number
    name: string
  }>
}>()

const emit = defineEmits<{
  (event: 'click', pin: typeof props.pin): void
  (event: 'like', id: number): void
  (event: 'favorite', id: number): void
  (event: 'save', payload: { pinId: number, boardId: number }): void
}>()

const selectedBoardId = ref<number | null>(null)
const isSaved = ref(false)

const saveButtonText = computed(() => {
  if (isSaved.value) return 'Saved'
  return 'Save'
})

function handleLike() {
  emit('like', props.pin.id)
}

function handleSave() {
  if (selectedBoardId.value === null) {
    // If no board is selected, highlight or do nothing
    return
  }
  emit('save', { pinId: props.pin.id, boardId: selectedBoardId.value })
  isSaved.value = true
  
  // Reset text after 2 seconds
  setTimeout(() => {
    isSaved.value = false
    selectedBoardId.value = null
  }, 2000)
}

const isDownloading = ref(false)

async function handleDownload() {
  isDownloading.value = true
  try {
    await downloadImage(props.pin.image_url, props.pin.title)
  } finally {
    isDownloading.value = false
  }
}
</script>

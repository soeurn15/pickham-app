<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-3 sm:p-6 animate-fade-in" @click.self="$emit('close')">
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="pin ? pin.title : 'Pin details'"
      class="animate-spring-bounce relative my-auto w-full max-w-[1100px] overflow-hidden rounded-3xl border border-[var(--panel-border)] bg-[var(--bg-soft)] shadow-[var(--shadow-lg)]"
    >
      <!-- Close -->
      <button
        type="button"
        @click="$emit('close')"
        class="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--bg-soft)]/90 backdrop-blur text-[var(--text-muted)] transition hover:text-[var(--text)] hover:scale-105 cursor-pointer"
        aria-label="Close"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="grid lg:grid-cols-[1.1fr_1fr]">

        <!-- Image -->
        <div class="bg-[var(--bg)]">
          <div class="flex items-center justify-center p-6 sm:p-8 lg:sticky lg:top-0 lg:min-h-[480px]">
            <img
              v-if="pin"
              :src="pin.image_url"
              :alt="pin.title"
              class="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-[var(--shadow-lg)]"
            />
            <div v-else class="h-10 w-10 animate-spin rounded-full border-4 border-[var(--panel-border)] border-t-[var(--accent)]"></div>
          </div>
        </div>

        <!-- Details -->
        <div class="flex min-w-0 flex-col p-6 sm:p-8">
          <div v-if="isLoading" class="flex flex-1 items-center justify-center py-16 text-sm text-[var(--text-muted)]">Loading details...</div>

          <template v-else-if="pin">
            <!-- Heading -->
            <p class="w-fit rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">{{ pin.category || 'Uncategorised' }}</p>
            <h1 class="mt-3 pr-10 font-outfit text-3xl font-bold leading-tight tracking-tight text-[var(--text)]">{{ pin.title }}</h1>

            <!-- Author -->
            <div class="mt-4 flex items-center gap-3">
              <img :src="pin.user_avatar" :alt="''" class="h-10 w-10 shrink-0 rounded-full object-cover" />
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-[var(--text)]">{{ pin.username }}</p>
                <p class="truncate text-xs text-[var(--text-muted)]">{{ 'Posted ' + formatDay(pin.created_at) }}</p>
              </div>
            </div>

            <p class="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
              {{ pin.description || 'No description provided.' }}
            </p>

            <!-- Actions -->
            <div class="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="toggleLike"
                :aria-pressed="!!pin.is_liked"
                class="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--panel-border)] text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg)] cursor-pointer"
              >
                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" :class="pin.is_liked ? 'fill-red-500 stroke-red-500' : 'fill-none'">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span class="tabular">{{ pin.likes_count }}</span> {{ pin.likes_count === 1 ? 'like' : 'likes' }}
              </button>
              <button
                type="button"
                @click="toggleFavorite"
                :aria-pressed="!!pin.is_favorited"
                class="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition hover:bg-[var(--bg)] cursor-pointer"
                :class="pin.is_favorited ? 'border-amber-400 text-amber-600' : 'border-[var(--panel-border)] text-[var(--text)]'"
              >
                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" :class="pin.is_favorited ? 'fill-amber-400 stroke-amber-500' : 'fill-none'">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 4a1 1 0 011-1h12a1 1 0 011 1v17l-7-4-7 4V4z" />
                </svg>
                {{ pin.is_favorited ? 'Favorited' : 'Favorite' }}
              </button>
            </div>

            <div class="mt-2 flex gap-2">
              <div class="relative min-w-0 flex-1">
                <select
                  v-model="selectedBoardId"
                  :disabled="!boards.length"
                  aria-label="Choose a board"
                  class="h-11 w-full appearance-none rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] pl-3.5 text-sm text-[var(--text)]"
                >
                  <option :value="null" disabled>{{ boards.length ? 'Choose a board' : 'No boards yet' }}</option>
                  <option v-for="board in boards" :key="board.id" :value="board.id" class="bg-white text-black">{{ board.name }}</option>
                </select>
              </div>
              <button
                type="button"
                @click="saveToBoard"
                :disabled="selectedBoardId === null && !isSaved"
                class="h-11 shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {{ saveBtnText }}
              </button>
            </div>

            <button
              type="button"
              @click="downloadFullImage"
              :disabled="isDownloading"
              class="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--panel-border)] text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg)] disabled:opacity-60 cursor-pointer"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {{ isDownloading ? 'Downloading...' : 'Download image' }}
            </button>

            <!-- Tags -->
            <div v-if="tagsArray.length > 0" class="mt-5 flex flex-wrap gap-1.5">
              <button
                v-for="tag in tagsArray"
                :key="tag"
                type="button"
                @click="$emit('tag-click', tag)"
                class="rounded-full bg-[var(--bg)] border border-[var(--panel-border)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--accent)] hover:border-[var(--accent)] cursor-pointer"
              >
                #{{ tag }}
              </button>
            </div>

            <!-- Comments -->
            <section class="mt-6 border-t border-[var(--panel-border)] pt-5" aria-label="Comments">
              <h2 class="text-sm font-semibold text-[var(--text)]">
                Comments <span class="tabular font-normal text-[var(--text-muted)]">({{ comments.length }})</span>
              </h2>

              <ul v-if="comments.length > 0" class="mt-4 space-y-4">
                <li v-for="c in comments" :key="c.id" class="flex gap-3">
                  <img :src="c.user_avatar" :alt="''" class="h-8 w-8 shrink-0 rounded-full object-cover" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm">
                      <span class="font-semibold text-[var(--text)]">{{ c.username }}</span>
                      <span class="ml-2 text-xs text-[var(--text-muted)]">{{ formatDate(c.created_at) }}</span>
                    </p>
                    <p class="mt-0.5 break-words text-sm text-[var(--text-muted)]">{{ c.comment_text }}</p>
                  </div>
                </li>
              </ul>
              <p v-else class="mt-3 text-sm text-[var(--text-muted)]">No comments yet. Start the conversation.</p>

              <form @submit.prevent="submitComment" class="mt-4 flex items-center gap-2">
                <img :src="currentUserAvatar" :alt="''" class="h-8 w-8 shrink-0 rounded-full object-cover" />
                <input
                  type="text"
                  v-model="newComment"
                  placeholder="Add a comment"
                  aria-label="Add a comment"
                  required
                  class="h-10 min-w-0 flex-1 rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="submit"
                  :disabled="!newComment.trim()"
                  class="h-10 shrink-0 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            </section>
          </template>
        </div>
      </div>

      <!-- More like this -->
      <section v-if="similarPins.length > 0" class="border-t border-[var(--panel-border)] bg-[var(--bg-soft)] p-6 sm:p-8" aria-label="More like this">
        <h2 class="text-base font-semibold text-[var(--text)]">More like this</h2>
        <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <button
            v-for="sim in similarPins"
            :key="sim.id"
            @click="reloadPin(sim.id)"
            type="button"
            class="group overflow-hidden rounded-lg border border-[var(--panel-border)] bg-[var(--bg-soft)] text-left hover:border-[var(--accent)]"
          >
            <div class="aspect-4/3 overflow-hidden bg-[var(--bg)]">
              <img :src="sim.thumb_url || sim.image_url" :alt="sim.title" loading="lazy" decoding="async" @error="hideBrokenImage" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            </div>
            <div class="p-3">
              <p class="line-clamp-1 text-sm font-medium text-[var(--text)]">{{ sim.title }}</p>
              <p class="mt-0.5 flex justify-between text-xs text-[var(--text-muted)]">
                <span class="truncate">{{ sim.username }}</span>
                <span class="tabular shrink-0">{{ sim.likes_count }} likes</span>
              </p>
            </div>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { downloadImage } from '../services/download'
import { showToast } from '../composables/useToast'

const props = defineProps<{
  pinId: number
  boards: Array<{
    id: number
    name: string
  }>
  currentUserId: number
  currentUserAvatar: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'tag-click', tag: string): void
  (event: 'like-toggled', payload: { pinId: number, likes: number, isLiked: boolean }): void
  (event: 'favorite-toggled', payload: { pinId: number, isFavorited: boolean }): void
}>()

const pin = ref<any>(null)
const similarPins = ref<any[]>([])
const comments = ref<any[]>([])
const isLoading = ref(true)
const selectedBoardId = ref<number | null>(null)
const isSaved = ref(false)
const newComment = ref('')

const saveBtnText = computed(() => {
  if (isSaved.value) return 'Saved'
  return 'Save'
})

const tagsArray = computed(() => {
  if (!pin.value || !pin.value.tags) return []
  return pin.value.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
})

onMounted(async () => {
  await loadPinDetails(props.pinId)
})

async function loadPinDetails(id: number) {
  isLoading.value = true
  try {
    const pinRes = await fetch(`/api/pins/${id}`)
    if (!pinRes.ok) throw new Error('Pin details load failed')
    const data = await pinRes.json()
    pin.value = data.pin
    similarPins.value = data.similar

    const commentRes = await fetch(`/api/pins/${id}/comments`)
    if (commentRes.ok) {
      comments.value = await commentRes.json()
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

async function reloadPin(id: number) {
  // Re-load the modal content when clicking on a recommendation card
  await loadPinDetails(id)
}

async function toggleLike() {
  if (!pin.value) return
  const originalLiked = pin.value.is_liked
  
  // Optimistic UI updates
  pin.value.is_liked = !pin.value.is_liked
  pin.value.likes_count += pin.value.is_liked ? 1 : -1

  try {
    const response = await fetch(`/api/pins/${pin.value.id}/like`, {
      method: pin.value.is_liked ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: props.currentUserId })
    })
    const data = await response.json()
    pin.value.likes_count = data.likes_count
    
    emit('like-toggled', { 
      pinId: pin.value.id, 
      likes: pin.value.likes_count, 
      isLiked: pin.value.is_liked 
    })
  } catch (error) {
    // Revert optimistic updates on error
    pin.value.is_liked = originalLiked
    pin.value.likes_count += originalLiked ? 1 : -1
  }
}

async function saveToBoard() {
  if (selectedBoardId.value === null || !pin.value) return
  const board = props.boards.find(b => b.id === selectedBoardId.value)

  try {
    const response = await fetch(`/api/boards/${selectedBoardId.value}/pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_id: pin.value.id })
    })
    if (!response.ok) throw new Error('Request failed')

    const data = await response.json()
    showToast(data.already_saved ? `Already in "${board?.name}"` : `Saved to "${board?.name}"`, data.already_saved ? 'info' : 'success')
    isSaved.value = true
    setTimeout(() => {
      isSaved.value = false
      selectedBoardId.value = null
    }, 2000)
  } catch (err) {
    console.error(err)
    showToast('Could not save the pin. Please try again.', 'error')
  }
}

async function toggleFavorite() {
  if (!pin.value) return
  const wasFavorited = !!pin.value.is_favorited
  pin.value.is_favorited = !wasFavorited

  try {
    const response = await fetch(`/api/pins/${pin.value.id}/favorite`, { method: wasFavorited ? 'DELETE' : 'POST' })
    if (!response.ok) throw new Error('Request failed')
    emit('favorite-toggled', { pinId: pin.value.id, isFavorited: !wasFavorited })
    showToast(wasFavorited ? 'Removed from favorites' : 'Added to favorites')
  } catch (err) {
    pin.value.is_favorited = wasFavorited
    showToast('Could not update favorites. Please try again.', 'error')
  }
}

function hideBrokenImage(event: Event) {
  (event.target as HTMLImageElement).style.visibility = 'hidden'
}

const isDownloading = ref(false)

async function downloadFullImage() {
  if (!pin.value) return
  isDownloading.value = true
  try {
    await downloadImage(pin.value.image_url, pin.value.title)
  } finally {
    isDownloading.value = false
  }
}

async function submitComment() {
  if (!newComment.value.trim() || !pin.value) return

  try {
    const response = await fetch(`/api/pins/${pin.value.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: props.currentUserId,
        comment_text: newComment.value.trim()
      })
    })

    if (response.ok) {
      const addedComment = await response.json()
      comments.value.push(addedComment)
      newComment.value = ''
    }
  } catch (err) {
    console.error(err)
  }
}

function formatDay(dateStr: string) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
</script>

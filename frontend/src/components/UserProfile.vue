<template>
  <div class="mx-auto max-w-[1200px] px-4 py-6 sm:py-10 space-y-10">

    <!-- Profile Header Section: soft brand banner behind the avatar -->
    <div class="relative flex flex-col items-center text-center space-y-4 overflow-hidden rounded-3xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-4 pb-8 shadow-[var(--shadow)]">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-emerald-500/25 via-teal-400/15 to-transparent"></div>
      <!-- User Avatar -->
      <button
        type="button"
        class="relative group mt-12 h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-full border-4 border-[var(--bg-soft)] shadow-[var(--shadow-lg)] cursor-pointer"
        title="Change profile photo"
        aria-label="Change profile photo"
        @click="openEdit"
      >
        <img
          :src="userProfile?.avatar || fallbackAvatar"
          alt="Profile Avatar"
          class="h-full w-full object-cover"
          @error="onAvatarError"
        />
        <span class="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">Change photo</span>
      </button>

      <!-- User Names -->
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--text)] font-outfit">
          {{ userProfile?.username || 'Username' }}
        </h1>
        <span
          v-if="userProfile?.role"
          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
          :class="userProfile.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-[var(--panel-border)] text-[var(--text-muted)]'"
        >{{ userProfile.role }}</span>
        <p class="text-xs text-[var(--text-muted)] font-medium tracking-wide">
          @{{ (userProfile?.username || 'user').toLowerCase().replace(/\s+/g, '') }}
        </p>
      </div>

      <!-- User Bio -->
      <p class="text-sm max-w-md text-[var(--text-muted)] font-normal leading-relaxed">
        {{ userProfile?.bio || 'Curating beautiful imagery and visual designs.' }}
      </p>

      <!-- Summary figures -->
      <dl class="grid w-full max-w-md grid-cols-4 divide-x divide-[var(--panel-border)] rounded-2xl border border-[var(--panel-border)] bg-[var(--bg)] py-3">
        <div v-for="stat in stats" :key="stat.label" class="px-2">
          <dd class="tabular text-xl font-semibold text-[var(--text)]">{{ stat.value }}</dd>
          <dt class="text-xs text-[var(--text-muted)]">{{ stat.label }}</dt>
        </div>
      </dl>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 pt-2">
        <button
          type="button"
          @click="openEdit"
          class="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-800 border border-[var(--panel-border)] px-6 py-2.5 text-xs font-bold text-[var(--text)] transition cursor-pointer"
        >
          Edit Profile
        </button>
        <button
          type="button"
          @click="showCreateBoardModal = true"
          class="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-6 py-2.5 text-xs font-bold text-white transition shadow-md shadow-emerald-500/25 cursor-pointer"
        >
          Create Board
        </button>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="flex justify-center border-b border-[var(--panel-border)] pb-1">
      <div class="flex gap-6 sm:gap-10">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          @click="activeTab = tab.key"
          class="pb-3 text-sm font-bold tracking-wide transition relative cursor-pointer"
          :class="activeTab === tab.key ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'"
        >
          {{ tab.label }}
          <span class="tabular ml-1 text-xs font-normal text-[var(--text-muted)]">{{ tabCount(tab.key) }}</span>
          <span
            v-if="activeTab === tab.key"
            class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--accent)]"
          ></span>
        </button>
      </div>
    </div>

    <!-- Tab Contents Grid -->
    <div class="min-h-[300px]">
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
        <div class="h-10 w-10 rounded-full border-4 border-t-[var(--accent)] border-[var(--panel-border)] animate-spin"></div>
        <p class="text-xs text-[var(--text-muted)] font-semibold mt-3">Loading collection...</p>
      </div>

      <div v-else>
        <!-- Created Pins Tab -->
        <div v-if="activeTab === 'created'" class="space-y-4">
          <div v-if="createdPins.length === 0" class="flex flex-col items-center py-16 text-center">
            <p class="text-sm text-[var(--text-muted)]">You haven't uploaded any pins yet.</p>
            <button
              @click="$emit('navigate', 'create')"
              class="mt-4 rounded-full bg-[var(--text)] text-[var(--bg-soft)] px-5 py-2 text-xs font-bold hover:opacity-90 transition"
            >
              Upload Your First Pin
            </button>
          </div>

          <div v-else class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5">
            <!-- Simplified Pin Cards for Subgrid -->
            <div
              v-for="pin in createdPins"
              :key="pin.id"
              @click="$emit('click-pin', pin.id)"
              class="group mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-[var(--bg-soft)] border border-[var(--panel-border)] shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <img :src="pin.image_url" :alt="pin.title" class="w-full h-auto object-cover group-hover:opacity-90 transition" />
              <div class="p-3">
                <h4 class="text-xs font-bold text-[var(--text)] line-clamp-1 leading-snug">{{ pin.title }}</h4>
                <span class="text-[10px] text-[var(--text-muted)] mt-1 block">♥ {{ pin.likes_count || 0 }} likes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Favorites Tab -->
        <div v-if="activeTab === 'favorites'" class="space-y-4">
          <div v-if="favoritePins.length === 0" class="flex flex-col items-center py-16 text-center">
            <p class="text-sm text-[var(--text-muted)]">No favorites yet. Use the bookmark button on any pin to keep it here.</p>
            <button
              @click="$emit('navigate', 'feed')"
              class="mt-4 rounded-full bg-[var(--text)] text-[color:var(--bg-soft)] px-5 py-2 text-xs font-bold hover:opacity-90 transition"
            >
              Explore Pins
            </button>
          </div>

          <div v-else class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5">
            <div
              v-for="pin in favoritePins"
              :key="pin.id"
              @click="$emit('click-pin', pin.id)"
              class="group mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-[var(--bg-soft)] border border-[var(--panel-border)] shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <img :src="pin.image_url" :alt="pin.title" class="w-full h-auto object-cover group-hover:opacity-90 transition" />
              <div class="p-3">
                <h4 class="text-xs font-bold text-[var(--text)] line-clamp-1 leading-snug">{{ pin.title }}</h4>
                <span class="text-[10px] text-[var(--text-muted)] mt-1 block">by {{ pin.username }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Saved / Liked Pins Tab -->
        <div v-if="activeTab === 'saved'" class="space-y-4">
          <div v-if="likedPins.length === 0" class="flex flex-col items-center py-16 text-center">
            <p class="text-sm text-[var(--text-muted)]">You haven't liked any pins yet.</p>
            <button
              @click="$emit('navigate', 'feed')"
              class="mt-4 rounded-full bg-[var(--text)] text-[var(--bg-soft)] px-5 py-2 text-xs font-bold hover:opacity-90 transition"
            >
              Explore and Like Pins
            </button>
          </div>

          <div v-else class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5">
            <div
              v-for="pin in likedPins"
              :key="pin.id"
              @click="$emit('click-pin', pin.id)"
              class="group mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-[var(--bg-soft)] border border-[var(--panel-border)] shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <img :src="pin.image_url" :alt="pin.title" class="w-full h-auto object-cover group-hover:opacity-90 transition" />
              <div class="p-3">
                <h4 class="text-xs font-bold text-[var(--text)] line-clamp-1 leading-snug">{{ pin.title }}</h4>
                <span class="text-[10px] text-[var(--text-muted)] mt-1 block">♥ {{ pin.likes_count || 0 }} likes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Boards Tab -->
        <div v-if="activeTab === 'boards'" class="space-y-4">
          <div v-if="boards.length === 0" class="flex flex-col items-center py-16 text-center">
            <p class="text-sm text-[var(--text-muted)]">You don't have any boards yet.</p>
            <button
              @click="showCreateBoardModal = true"
              class="mt-4 rounded-full bg-[var(--accent)] text-white px-5 py-2 text-xs font-bold hover:bg-[var(--accent-hover)] transition"
            >
              Create a Board
            </button>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            <!-- Board Card Folder -->
            <div
              v-for="board in boards"
              :key="board.id"
              @click="$emit('select-board', board)"
              class="group flex flex-col cursor-pointer bg-[var(--bg-soft)] border border-[var(--panel-border)] rounded-2xl overflow-hidden p-3 shadow-sm hover:shadow-md transition duration-200"
            >
              <!-- Board Folder Preview Image -->
              <div class="aspect-4/3 overflow-hidden rounded-2xl bg-slate-200 dark:bg-zinc-800 relative">
                <img
                  v-if="board.cover_url"
                  :src="board.cover_url"
                  :alt="board.name"
                  class="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div v-else class="h-full w-full flex items-center justify-center text-[var(--text-muted)] bg-slate-100 dark:bg-zinc-800">
                  <svg class="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 003 15v1.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 16.5V15a2.25 2.25 0 00-2.25-2.25m-19.5 0h19.5" />
                  </svg>
                </div>
                <!-- Pins Count Badge -->
                <span class="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                  {{ board.pins_count }} pins
                </span>
              </div>
              <!-- Board Titles -->
              <div class="mt-3 px-1">
                <h3 class="text-sm font-bold text-[var(--text)] line-clamp-1 leading-snug group-hover:text-[var(--accent)] transition">
                  {{ board.name }}
                </h3>
                <p class="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                  {{ board.description || 'No description' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Board Modal Popup -->
    <div v-if="showCreateBoardModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showCreateBoardModal = false">
      <div class="w-full max-w-[450px] rounded-2xl bg-[var(--bg-soft)] p-6 sm:p-8 border border-[var(--panel-border)] shadow-xl animate-scale-up">
        <h3 class="text-xl font-bold text-[var(--text)] font-outfit mb-4">Create a New Board</h3>

        <form @submit.prevent="createBoard" class="space-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-[var(--text-muted)]">Board Name</label>
            <input
              type="text"
              placeholder="e.g. Design Inspo, Dream Trips"
              v-model="newBoardName"
              required
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-[var(--text-muted)]">Description (Optional)</label>
            <textarea
              placeholder="What is this board collection about?"
              v-model="newBoardDesc"
              rows="3"
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition resize-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showCreateBoardModal = false"
              class="rounded-full bg-slate-100 dark:bg-zinc-800 px-5 py-2 text-xs font-semibold text-[var(--text)] hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-6 py-2 text-xs font-bold text-white transition shadow-md"
            >
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Profile Modal Popup -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showEditModal = false">
      <div class="w-full max-w-[480px] rounded-2xl bg-[var(--bg-soft)] p-6 sm:p-8 border border-[var(--panel-border)] shadow-xl animate-scale-up">
        <h3 class="text-xl font-bold text-[var(--text)] font-outfit mb-4">Edit Profile</h3>

        <form @submit.prevent="updateProfile" class="space-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-[var(--text-muted)]">Display Name</label>
            <input
              type="text"
              v-model="editUsername"
              required
              maxlength="50"
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          <!-- Avatar upload -->
          <div class="flex items-center gap-4">
            <img :src="avatarPreview || fallbackAvatar" alt="Avatar preview" class="h-20 w-20 shrink-0 rounded-full border border-[var(--panel-border)] object-cover" @error="onAvatarError" />
            <div class="flex min-w-0 flex-col gap-1.5">
              <div class="flex flex-wrap gap-2">
                <button type="button" class="rounded-full bg-[var(--text)] px-4 py-2 text-xs font-bold text-[var(--bg-soft)] cursor-pointer" @click="avatarInput?.click()">Upload photo</button>
                <button v-if="avatarFile" type="button" class="rounded-full bg-slate-100 dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-[var(--text)] cursor-pointer" @click="clearAvatarFile">Undo</button>
              </div>
              <p class="truncate text-[11px] text-[var(--text-muted)]">
                {{ avatarFile ? avatarFile.name : 'JPG, PNG, GIF or WebP, up to 10MB' }}
              </p>
              <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onAvatarPicked" />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-[var(--text-muted)]">Or paste an image link</label>
            <input
              type="url"
              v-model="editAvatar"
              placeholder="https://..."
              :disabled="!!avatarFile"
              @input="avatarPreview = editAvatar.trim()"
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition disabled:opacity-50"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-[var(--text-muted)]">Bio</label>
            <textarea
              v-model="editBio"
              rows="3"
              maxlength="200"
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition resize-none"
            ></textarea>
            <span class="self-end text-[10px] font-medium text-[var(--text-muted)]">{{ editBio.length }}/200</span>
          </div>

          <div v-if="profileError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{{ profileError }}</div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showEditModal = false" 
              class="rounded-full bg-slate-100 dark:bg-zinc-800 px-5 py-2 text-xs font-semibold text-[var(--text)] hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-6 py-2 text-xs font-bold text-white transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  userId: number
}>()

const emit = defineEmits<{
  (event: 'navigate', view: string): void
  (event: 'click-pin', pinId: number): void
  (event: 'select-board', board: { id: number, name: string }): void
  (event: 'profile-updated'): void
}>()

const tabs = [
  { key: 'created', label: 'Created' },
  { key: 'boards', label: 'Boards' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'saved', label: 'Liked' }
]

const activeTab = ref('created')
const isLoading = ref(true)

// User profiles
const userProfile = ref<any>(null)
const createdPins = ref<any[]>([])
const likedPins = ref<any[]>([])
const favoritePins = ref<any[]>([])
const boards = ref<any[]>([])

const stats = computed(() => [
  { label: 'Pins', value: createdPins.value.length },
  { label: 'Boards', value: boards.value.length },
  { label: 'Likes received', value: createdPins.value.reduce((sum, p) => sum + Number(p.likes_count || 0), 0) },
  { label: 'Favorites', value: favoritePins.value.length }
])

function tabCount(key: string) {
  if (key === 'created') return createdPins.value.length
  if (key === 'boards') return boards.value.length
  if (key === 'favorites') return favoritePins.value.length
  return likedPins.value.length
}

// Create Board state
const showCreateBoardModal = ref(false)
const newBoardName = ref('')
const newBoardDesc = ref('')

// Edit Profile state
const showEditModal = ref(false)
const editUsername = ref('')
const editAvatar = ref('')
const editBio = ref('')
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')
const profileError = ref('')
const isSaving = ref(false)
const fallbackAvatar = 'https://ui-avatars.com/api/?name=User&background=random'

function onAvatarError(e: Event) {
  const img = e.target as HTMLImageElement
  if (img.src !== fallbackAvatar) img.src = fallbackAvatar
}

function openEdit() {
  editUsername.value = userProfile.value?.username || ''
  editAvatar.value = userProfile.value?.avatar || ''
  editBio.value = userProfile.value?.bio || ''
  avatarPreview.value = editAvatar.value
  avatarFile.value = null
  profileError.value = ''
  showEditModal.value = true
}

function onAvatarPicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    profileError.value = 'Please choose a JPG, PNG, GIF or WebP image.'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    profileError.value = 'Image is too large. Limit is 10MB.'
    return
  }
  profileError.value = ''
  if (avatarPreview.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

function clearAvatarFile() {
  if (avatarPreview.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = null
  avatarPreview.value = editAvatar.value.trim()
  if (avatarInput.value) avatarInput.value.value = ''
}

onMounted(async () => {
  await fetchUserData()
})

async function fetchUserData() {
  isLoading.value = true
  try {
    const res = await fetch(`/api/users/${props.userId}`)
    if (res.ok) {
      const data = await res.json()
      userProfile.value = data.user
      createdPins.value = data.created_pins
      likedPins.value = data.liked_pins
      boards.value = data.boards
      const favRes = await fetch('/api/favorites')
      favoritePins.value = favRes.ok ? await favRes.json() : []

      // Initialize edit fields
      editUsername.value = data.user.username
      editAvatar.value = data.user.avatar
      editBio.value = data.user.bio
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

async function createBoard() {
  if (!newBoardName.value.trim()) return

  try {
    const response = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newBoardName.value.trim(),
        description: newBoardDesc.value.trim(),
        user_id: props.userId
      })
    })

    if (response.ok) {
      newBoardName.value = ''
      newBoardDesc.value = ''
      showCreateBoardModal.value = false
      await fetchUserData() // Reload lists
    }
  } catch (err) {
    console.error(err)
  }
}

async function updateProfile() {
  const username = editUsername.value.trim()
  const bio = editBio.value.trim()
  const link = editAvatar.value.trim()

  if (!username) { profileError.value = 'Display name is required.'; return }
  if (!avatarFile.value && link) {
    try {
      const { protocol } = new URL(link)
      if (protocol !== 'http:' && protocol !== 'https:') throw new Error()
    } catch {
      profileError.value = 'Image link must be a valid http(s) URL.'
      return
    }
  }

  isSaving.value = true
  profileError.value = ''
  try {
    const form = new FormData()
    form.append('username', username)
    form.append('bio', bio)
    if (avatarFile.value) form.append('avatar', avatarFile.value)
    else if (link) form.append('avatar', link)

    const response = await fetch(`/api/users/${props.userId}`, { method: 'POST', body: form })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Could not update profile.')

    clearAvatarFile()
    showEditModal.value = false
    await fetchUserData()
    emit('profile-updated') // Tell App.vue to refresh its cached user details
  } catch (err: any) {
    profileError.value = err.message || 'Network connection failed.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1200px] px-4 py-6 sm:py-10 space-y-10">
    
    <!-- Profile Header Section -->
    <div class="flex flex-col items-center text-center space-y-4">
      <!-- User Avatar -->
      <div class="relative group h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-full border-4 border-white dark:border-zinc-800 shadow-lg">
        <img 
          :src="userProfile?.avatar || 'https://ui-avatars.com/api/?name=User&background=random'" 
          alt="Profile Avatar"
          class="h-full w-full object-cover"
        />
      </div>

      <!-- User Names -->
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--text)] font-outfit">
          {{ userProfile?.username || 'Username' }}
        </h1>
        <p class="text-xs text-[var(--text-muted)] font-medium tracking-wide">
          @{{ (userProfile?.username || 'user').toLowerCase().replace(/\s+/g, '') }}
        </p>
      </div>

      <!-- User Bio -->
      <p class="text-sm max-w-md text-[var(--text-muted)] font-normal leading-relaxed">
        {{ userProfile?.bio || 'Curating beautiful imagery and visual designs.' }}
      </p>

      <!-- Summary figures -->
      <dl class="grid w-full max-w-md grid-cols-4 divide-x divide-[var(--panel-border)] rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] py-3">
        <div v-for="stat in stats" :key="stat.label" class="px-2">
          <dd class="tabular text-xl font-semibold text-[var(--text)]">{{ stat.value }}</dd>
          <dt class="text-xs text-[var(--text-muted)]">{{ stat.label }}</dt>
        </div>
      </dl>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 pt-2">
        <button 
          type="button" 
          @click="showEditModal = true"
          class="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-800 border border-[var(--panel-border)] px-6 py-2.5 text-xs font-bold text-[var(--text)] transition cursor-pointer"
        >
          Edit Profile
        </button>
        <button 
          type="button" 
          @click="showCreateBoardModal = true"
          class="rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-6 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer"
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
            class="absolute bottom-0 left-0 right-0 h-1.5 rounded-full bg-[var(--text)]"
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
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-[var(--text-muted)]">Avatar Image URL</label>
            <input 
              type="url" 
              v-model="editAvatar"
              required
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-[var(--text-muted)]">Bio</label>
            <textarea 
              v-model="editBio"
              rows="3"
              class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition resize-none"
            ></textarea>
          </div>

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
              class="rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-6 py-2 text-xs font-bold text-white transition shadow-md"
            >
              Save Changes
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
  if (!editUsername.value.trim() || !editAvatar.value.trim()) return

  try {
    const response = await fetch(`/api/users/${props.userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: editUsername.value.trim(),
        avatar: editAvatar.value.trim(),
        bio: editBio.value.trim()
      })
    })

    if (response.ok) {
      showEditModal.value = false
      await fetchUserData()
      emit('profile-updated') // Tell App.vue to refresh its cached user details
    }
  } catch (err) {
    console.error(err)
  }
}
</script>

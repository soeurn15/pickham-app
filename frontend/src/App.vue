<template>
  <div class="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
    
    <!-- Login Screen overlay if not logged in -->
    <AuthView v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

    <!-- Full Platform UI when logged in -->
    <template v-else>
      <!-- Navbar Component -->
      <Navbar 
        :search-text="searchText"
        @update:search-text="handleSearchUpdate"
        :active-view="activeView"
        @navigate="navigate"
        :is-dark="isDark"
        @toggle-theme="toggleTheme"
        :current-user="currentUser"
        @logout="handleLogout"
      />

      <!-- Main Layout Container -->
      <main class="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
        
        <!-- Explorer / Main Feed View -->
        <section v-if="activeView === 'feed'" class="space-y-6">
          
          <!-- Category Filter Chips -->
          <div class="no-scrollbar flex items-center gap-2.5 overflow-x-auto py-1">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95"
              :class="activeCategory === cat ? 'bg-[var(--text)] text-[var(--bg)] shadow-md' : 'bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--panel-border)] hover:text-[var(--text)] hover:border-[var(--text-muted)]/40'"
              @click="selectCategory(cat)"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Dynamic Header info -->
          <div v-if="searchText" class="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>Search results for:</span>
            <span class="font-bold text-[var(--text)]">"{{ searchText }}"</span>
            <button @click="clearSearch" class="text-xs text-[var(--accent)] font-semibold underline ml-2 hover:text-[var(--accent-hover)]">Clear</button>
          </div>

          <!-- Main Feed Loading Screen -->
          <div v-if="isLoading" class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5" aria-busy="true" aria-label="Loading pins">
            <div
              v-for="(h, i) in [220, 300, 180, 260, 340, 200, 280, 240, 320, 190]"
              :key="i"
              class="skeleton mb-5 break-inside-avoid rounded-2xl border border-[var(--panel-border)]"
              :style="{ height: h + 'px' }"
            ></div>
          </div>

          <!-- Empty Feed State -->
          <div v-else-if="pins.length === 0" class="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-soft)] p-5 text-[var(--accent)]">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold font-outfit">No pins match your search</h3>
            <p class="text-sm text-[var(--text-muted)] max-w-xs">Try double checking your keywords or exploring other categories.</p>
            <button 
              type="button" 
              @click="resetFilters" 
              class="rounded-full bg-[var(--text)] text-[var(--bg-soft)] px-6 py-2.5 text-xs font-bold hover:opacity-90 transition"
            >
              Reset Filters
            </button>
          </div>

          <!-- Pins Masonry Feed Grid -->
          <div v-else class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5 mx-auto">
            <PinCard 
              v-for="pin in pins" 
              :key="pin.id" 
              :pin="pin"
              :boards="boards"
              @click="openPinDetails"
              @like="toggleLikePin"
              @favorite="toggleFavoritePin"
              @save="savePinToBoard"
            />
          </div>
          
        </section>

        <!-- Board Details View -->
        <section v-else-if="activeView === 'board-detail'" class="space-y-8 animate-scale-up">
          <!-- Board Header Card -->
          <div class="relative rounded-[32px] bg-[var(--bg-soft)] border border-[var(--panel-border)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
            <div class="space-y-2">
              <button 
                type="button" 
                @click="navigate('profile')" 
                class="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer pb-2"
              >
                ← Back to Profile
              </button>
              <h1 class="text-3xl font-bold tracking-tight text-[var(--text)] font-outfit leading-tight">
                {{ selectedBoard?.name }}
              </h1>
              <p class="text-sm text-[var(--text-muted)] max-w-xl">
                {{ selectedBoard?.description || 'A beautiful collection of saved pins.' }}
              </p>
            </div>
            <div class="rounded-2xl bg-[var(--bg)] border border-[var(--panel-border)] px-5 py-3 text-center sm:self-center">
              <span class="block text-2xl font-bold text-[var(--text)] font-outfit">{{ boardPins.length }}</span>
              <span class="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Saved Pins</span>
            </div>
          </div>

          <!-- Loading Board Pins -->
          <div v-if="isLoadingBoard" class="flex flex-col items-center justify-center py-20">
            <div class="h-10 w-10 rounded-full border-4 border-t-[var(--accent)] border-[var(--panel-border)] animate-spin"></div>
          </div>

          <!-- Empty Board State -->
          <div v-else-if="boardPins.length === 0" class="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <p class="text-sm text-[var(--text-muted)] italic">There are no pins saved in this board yet.</p>
            <button 
              type="button" 
              @click="navigate('feed')" 
              class="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent-hover)] transition cursor-pointer"
            >
              Find Pins to Save
            </button>
          </div>

          <!-- Board Pins Grid -->
          <div v-else class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5 mx-auto">
            <div 
              v-for="pin in boardPins" 
              :key="pin.id"
              class="masonry-item group relative mb-5 break-inside-avoid overflow-hidden rounded-[24px] bg-[var(--bg-soft)] border border-[var(--panel-border)] shadow-sm hover:shadow-lg transition-all cursor-pointer"
              @click="openPinDetails(pin)"
            >
              <div class="relative overflow-hidden w-full bg-slate-200 dark:bg-zinc-800">
                <img :src="pin.image_url" :alt="pin.title" class="w-full h-auto object-cover transition duration-300 group-hover:scale-102" />
                <!-- Hover delete button overlay -->
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex p-3 justify-end items-start z-10" @click.stop>
                  <button 
                    type="button"
                    @click="removePinFromBoard(pin.id)"
                    class="rounded-full bg-red-600/90 text-white p-2 hover:bg-red-700 hover:scale-105 transition shadow cursor-pointer"
                    title="Remove from Board"
                  >
                    <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
        </section>

        <!-- Upload / Create Pin View -->
        <section v-else-if="activeView === 'create'">
          <CreatePinModal 
            :categories="categories.slice(1)" 
            :boards="boards"
            :current-user-id="currentUserId"
            @cancel="navigate('feed')"
            @success="onUploadSuccess"
          />
        </section>

        <!-- User Profile Dashboard View -->
        <section v-else-if="activeView === 'profile'">
          <UserProfile 
            :user-id="currentUserId"
            @navigate="navigate"
            @click-pin="openPinDetailsById"
            @select-board="selectBoard"
            @profile-updated="fetchCurrentUser"
          />
        </section>

        <!-- Admin Dashboard View -->
        <section v-else-if="activeView === 'admin'">
          <AdminDashboard 
            :current-admin-id="currentUserId" 
            @back-to-feed="navigate('feed')" 
            @categories-changed="onCategoriesChanged"
          />
        </section>

      </main>

      <!-- Detailed Image Modal Backdrop Overlay -->
      <PinDetailModal 
        v-if="selectedPinId !== null"
        :pin-id="selectedPinId"
        :boards="boards"
        :current-user-id="currentUserId"
        :current-user-avatar="currentUser.avatar"
        @close="closePinDetails"
        @tag-click="handleTagSearch"
        @like-toggled="handleLikeSync"
        @favorite-toggled="handleFavoriteSync"
      />
    </template>

    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Navbar from './components/Navbar.vue'
import PinCard from './components/PinCard.vue'
import CreatePinModal from './components/CreatePinModal.vue'
import PinDetailModal from './components/PinDetailModal.vue'
import UserProfile from './components/UserProfile.vue'
import AuthView from './components/AuthView.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import ToastHost from './components/ToastHost.vue'
import { showToast } from './utils/toast'

// Routing and Views
const activeView = ref<'feed' | 'profile' | 'create' | 'board-detail' | 'admin'>('feed')

// Central States
const searchText = ref('')
const activeCategory = ref('All')
const categories = ref<string[]>(['All'])

async function fetchCategories() {
  if (!isLoggedIn.value) return
  try {
    const response = await fetch('/api/categories')
    if (!response.ok) return
    const rows: { name: string }[] = await response.json()
    categories.value = ['All', ...rows.map(r => r.name)]
    // A category an admin just deleted can't stay selected
    if (!categories.value.includes(activeCategory.value)) activeCategory.value = 'All'
  } catch (err) {
    console.error(err)
  }
}

// Authentication States
const isLoggedIn = ref(false)
const currentUserId = ref(0)
const currentUser = ref({
  username: '',
  avatar: '',
  bio: '',
  role: ''
})

// Lists and data
const pins = ref<any[]>([])
const boards = ref<any[]>([])
const boardPins = ref<any[]>([])
const isLoading = ref(true)
const isLoadingBoard = ref(false)
const isDark = ref(false)

// Modals
const selectedPinId = ref<number | null>(null)
const selectedBoard = ref<any | null>(null)

// Auto-trigger searches when filters change
watch([searchText, activeCategory], () => {
  if (activeView.value === 'feed' && isLoggedIn.value) {
    fetchPins()
  }
})

onMounted(async () => {
  // Theme check
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme')
    isDark.value = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    updateThemeClass()
  }

  // Session check
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('vivid_user')
    if (savedUser && localStorage.getItem('vivid_token')) {
      try {
        const parsed = JSON.parse(savedUser)
        currentUser.value = parsed
        currentUserId.value = parsed.id
        isLoggedIn.value = true
      } catch (err) {
        // Clear corrupt storage
        localStorage.removeItem('vivid_user')
      }
    }
  }

  if (isLoggedIn.value) {
    await fetchCurrentUser()
    await fetchCategories()
    await fetchPins()
    await fetchBoards()
  }
})

async function handleLoginSuccess(userObj: any) {
  currentUser.value = userObj
  currentUserId.value = userObj.id
  isLoggedIn.value = true

  if (typeof window !== 'undefined') {
    const { token, ...user } = userObj
    localStorage.setItem('vivid_token', token)
    localStorage.setItem('vivid_user', JSON.stringify(user))
  }

  navigate('feed')
  await fetchCategories()
  await fetchPins()
  await fetchBoards()
}

function handleLogout() {
  isLoggedIn.value = false
  currentUser.value = { username: '', avatar: '', bio: '', role: '' }
  currentUserId.value = 0

  if (typeof window !== 'undefined') {
    localStorage.removeItem('vivid_user')
    localStorage.removeItem('vivid_token')
  }

  navigate('feed')
}

async function fetchCurrentUser() {
  if (!isLoggedIn.value) return
  try {
    const response = await fetch(`/api/users/${currentUserId.value}`)
    if (response.ok) {
      const data = await response.json()
      currentUser.value = {
        username: data.user.username,
        avatar: data.user.avatar,
        bio: data.user.bio,
        role: data.user.role
      }
      
      // Update session storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('vivid_user', JSON.stringify(data.user))
      }
    }
  } catch (error) {
    console.error('Failed to load user info:', error)
  }
}

async function onCategoriesChanged() {
  await fetchCategories()
  await fetchPins() // deleted categories move their pins to "Other"
}

async function fetchPins() {
  if (!isLoggedIn.value) return
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (searchText.value) params.append('search', searchText.value)
    if (activeCategory.value) params.append('category', activeCategory.value)
    params.append('user_id', currentUserId.value.toString())

    const response = await fetch(`/api/pins?${params.toString()}`)
    if (response.ok) {
      pins.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch pins:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchBoards() {
  if (!isLoggedIn.value) return
  try {
    const response = await fetch(`/api/boards?user_id=${currentUserId.value}`)
    if (response.ok) {
      boards.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch boards:', error)
  }
}

function handleSearchUpdate(val: string) {
  searchText.value = val
  if (activeView.value !== 'feed') {
    activeView.value = 'feed'
  }
}

function selectCategory(cat: string) {
  activeCategory.value = cat
  if (activeView.value !== 'feed') {
    activeView.value = 'feed'
  }
}

function clearSearch() {
  searchText.value = ''
}

function resetFilters() {
  searchText.value = ''
  activeCategory.value = 'All'
}

function navigate(view: any) {
  activeView.value = view
  if (view === 'feed') {
    fetchPins()
  } else if (view === 'profile') {
    fetchBoards()
  }
}

// Liking sync handler
async function toggleLikePin(id: number) {
  const pin = pins.value.find(p => p.id === id)
  if (!pin) return

  const originalLiked = pin.is_liked
  pin.is_liked = !pin.is_liked
  pin.likes_count += pin.is_liked ? 1 : -1

  try {
    const response = await fetch(`/api/pins/${id}/like`, {
      method: pin.is_liked ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUserId.value })
    })
    const data = await response.json()
    pin.likes_count = data.likes_count
  } catch (error) {
    pin.is_liked = originalLiked
    pin.likes_count += originalLiked ? 1 : -1
  }
}

// Board Pin Relationship Save Action
async function savePinToBoard(payload: { pinId: number, boardId: number }) {
  try {
    const response = await fetch(`/api/boards/${payload.boardId}/pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_id: payload.pinId })
    })

    if (response.ok) {
      const data = await response.json()
      const boardName = boards.value.find(b => b.id === payload.boardId)?.name || 'board'
      showToast(data.already_saved ? `Already in "${boardName}"` : `Saved to "${boardName}"`, data.already_saved ? 'info' : 'success')
      // Refresh boards counts
      await fetchBoards()
    } else {
      showToast('Could not save the pin. Please try again.', 'error')
    }
  } catch (error) {
    console.error(error)
    showToast('Could not reach the server.', 'error')
  }
}

// Favorites (private bookmarks, separate from likes)
async function toggleFavoritePin(id: number) {
  const pin = pins.value.find(p => p.id === id)
  if (!pin) return

  const wasFavorited = !!pin.is_favorited
  pin.is_favorited = !wasFavorited

  try {
    const response = await fetch(`/api/pins/${id}/favorite`, { method: wasFavorited ? 'DELETE' : 'POST' })
    if (!response.ok) throw new Error('Request failed')
    showToast(wasFavorited ? 'Removed from favorites' : 'Added to favorites')
  } catch (error) {
    pin.is_favorited = wasFavorited
    showToast('Could not update favorites. Please try again.', 'error')
  }
}

function handleFavoriteSync(payload: { pinId: number, isFavorited: boolean }) {
  for (const list of [pins.value, boardPins.value]) {
    const pin = list.find(p => p.id === payload.pinId)
    if (pin) pin.is_favorited = payload.isFavorited
  }
}

// Display board folder view
async function selectBoard(board: any) {
  selectedBoard.value = board
  activeView.value = 'board-detail'
  isLoadingBoard.value = true
  
  try {
    const response = await fetch(`/api/boards/${board.id}/pins?user_id=${currentUserId.value}`)
    if (response.ok) {
      const data = await response.json()
      boardPins.value = data.pins
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingBoard.value = false
  }
}

async function removePinFromBoard(pinId: number) {
  if (!selectedBoard.value) return

  try {
    const response = await fetch(`/api/boards/${selectedBoard.value.id}/pins/${pinId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      // Refresh current board view
      boardPins.value = boardPins.value.filter(p => p.id !== pinId)
      await fetchBoards() // Update folder counts
    }
  } catch (err) {
    console.error(err)
  }
}

// Detail popups management
function openPinDetails(pinObj: any) {
  selectedPinId.value = pinObj.id
}

function openPinDetailsById(pinId: number) {
  selectedPinId.value = pinId
}

function closePinDetails() {
  selectedPinId.value = null
  // Re-sync lists (likes might have changed inside details modal)
  if (activeView.value === 'feed') {
    fetchPins()
  } else if (activeView.value === 'board-detail' && selectedBoard.value) {
    selectBoard(selectedBoard.value)
  }
}

function handleLikeSync(payload: { pinId: number, likes: number, isLiked: boolean }) {
  // Sync likes on explore feed list in real-time
  const pin = pins.value.find(p => p.id === payload.pinId)
  if (pin) {
    pin.likes_count = payload.likes
    pin.is_liked = payload.isLiked
  }
  // Sync inside active board view
  const bPin = boardPins.value.find(p => p.id === payload.pinId)
  if (bPin) {
    bPin.likes_count = payload.likes
    bPin.is_liked = payload.isLiked
  }
}

function handleTagSearch(tag: string) {
  selectedPinId.value = null // Close modal
  searchText.value = tag
  activeView.value = 'feed'
  fetchPins()
}

function onUploadSuccess() {
  activeView.value = 'feed'
  searchText.value = ''
  activeCategory.value = 'All'
  fetchPins()
  fetchBoards()
}

// Theme controls
function toggleTheme() {
  isDark.value = !isDark.value
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }
  updateThemeClass()
}

function updateThemeClass() {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
</script>
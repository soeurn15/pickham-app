import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Board, Pin } from '../types'
import { showToast } from '../composables/useToast'

const PAGE_SIZE = 30

// The explore feed (search, category, paging), the user's boards and the pins inside one board.
export const useFeedStore = defineStore('feed', () => {
  const searchText = ref('')
  const activeCategory = ref('All')
  const categories = ref<string[]>(['All'])

  const pins = ref<Pin[]>([])
  const total = ref(0)
  const page = ref(1)
  const isLoading = ref(true)
  const isLoadingMore = ref(false)
  const loadError = ref('')

  const boards = ref<Board[]>([])

  const selectedBoard = ref<Board | null>(null)
  const boardPins = ref<Pin[]>([])
  const isLoadingBoard = ref(false)
  const boardNotFound = ref(false)

  // Guards against an older, slower response overwriting a newer one while typing
  let feedRequest = 0

  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) return
      const rows: { name: string }[] = await response.json()
      categories.value = ['All', ...rows.map(r => r.name)]
      // A category an admin just deleted can't stay selected
      if (!categories.value.includes(activeCategory.value)) activeCategory.value = 'All'
    } catch (error) {
      console.error(error)
    }
  }

  // Loads the first page (reset) or appends the next one.
  async function fetchPins(reset = true) {
    const request = ++feedRequest
    const nextPage = reset ? 1 : page.value + 1
    if (reset) isLoading.value = true
    else isLoadingMore.value = true
    loadError.value = ''

    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) })
      if (searchText.value) params.append('search', searchText.value)
      if (activeCategory.value) params.append('category', activeCategory.value)

      const response = await fetch(`/api/pins?${params}`)
      if (request !== feedRequest) return
      if (!response.ok) throw new Error('Request failed')

      const rows: Pin[] = await response.json()
      pins.value = reset ? rows : [...pins.value, ...rows]
      total.value = Number(response.headers.get('X-Total-Count')) || pins.value.length
      page.value = nextPage
    } catch (error) {
      if (request !== feedRequest) return
      console.error('Failed to fetch pins:', error)
      loadError.value = 'We could not load pins. Check your connection and try again.'
    } finally {
      if (request === feedRequest) {
        isLoading.value = false
        isLoadingMore.value = false
      }
    }
  }

  const hasMore = () => pins.value.length < total.value

  async function fetchBoards() {
    try {
      const response = await fetch('/api/boards')
      if (response.ok) boards.value = await response.json()
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    }
  }

  function resetFilters() {
    searchText.value = ''
    activeCategory.value = 'All'
  }

  async function toggleLike(id: number) {
    const pin = pins.value.find(p => p.id === id)
    if (!pin) return

    const originalLiked = pin.is_liked
    pin.is_liked = !pin.is_liked
    pin.likes_count += pin.is_liked ? 1 : -1

    try {
      const response = await fetch(`/api/pins/${id}/like`, { method: pin.is_liked ? 'POST' : 'DELETE' })
      if (!response.ok) throw new Error('Request failed')
      pin.likes_count = (await response.json()).likes_count
    } catch {
      pin.is_liked = originalLiked
      pin.likes_count += originalLiked ? 1 : -1
      showToast('Could not update your like. Please try again.', 'error')
    }
  }

  async function toggleFavorite(id: number) {
    const pin = pins.value.find(p => p.id === id)
    if (!pin) return

    const wasFavorited = !!pin.is_favorited
    pin.is_favorited = !wasFavorited

    try {
      const response = await fetch(`/api/pins/${id}/favorite`, { method: wasFavorited ? 'DELETE' : 'POST' })
      if (!response.ok) throw new Error('Request failed')
      showToast(wasFavorited ? 'Removed from favorites' : 'Added to favorites')
    } catch {
      pin.is_favorited = wasFavorited
      showToast('Could not update favorites. Please try again.', 'error')
    }
  }

  async function savePinToBoard(payload: { pinId: number; boardId: number }) {
    try {
      const response = await fetch(`/api/boards/${payload.boardId}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin_id: payload.pinId })
      })
      if (!response.ok) {
        showToast('Could not save the pin. Please try again.', 'error')
        return
      }
      const data = await response.json()
      const boardName = boards.value.find(b => b.id === payload.boardId)?.name || 'board'
      showToast(data.already_saved ? `Already in "${boardName}"` : `Saved to "${boardName}"`, data.already_saved ? 'info' : 'success')
      await fetchBoards() // refresh board counts
    } catch (error) {
      console.error(error)
      showToast('Could not reach the server.', 'error')
    }
  }

  async function openBoard(id: number) {
    isLoadingBoard.value = true
    boardNotFound.value = false
    try {
      const response = await fetch(`/api/boards/${id}/pins`)
      if (response.status === 404) {
        boardNotFound.value = true
        selectedBoard.value = null
        boardPins.value = []
      } else if (response.ok) {
        const data = await response.json()
        selectedBoard.value = data.board
        boardPins.value = data.pins
      } else {
        showToast('Could not load this board.', 'error')
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
      const response = await fetch(`/api/boards/${selectedBoard.value.id}/pins/${pinId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Request failed')
      boardPins.value = boardPins.value.filter(p => p.id !== pinId)
      await fetchBoards() // update folder counts
    } catch {
      showToast('Could not remove the pin. Please try again.', 'error')
    }
  }

  // Keeps every list showing the same like/favourite state after the detail popup changes it
  function syncLike(payload: { pinId: number; likes: number; isLiked: boolean }) {
    for (const list of [pins.value, boardPins.value]) {
      const pin = list.find(p => p.id === payload.pinId)
      if (pin) {
        pin.likes_count = payload.likes
        pin.is_liked = payload.isLiked
      }
    }
  }

  function syncFavorite(payload: { pinId: number; isFavorited: boolean }) {
    for (const list of [pins.value, boardPins.value]) {
      const pin = list.find(p => p.id === payload.pinId)
      if (pin) pin.is_favorited = payload.isFavorited
    }
  }

  function $reset() {
    searchText.value = ''
    activeCategory.value = 'All'
    categories.value = ['All']
    pins.value = []
    boards.value = []
    boardPins.value = []
    selectedBoard.value = null
    total.value = 0
    page.value = 1
  }

  return {
    searchText, activeCategory, categories, pins, total, isLoading, isLoadingMore, loadError, boards,
    selectedBoard, boardPins, isLoadingBoard, boardNotFound,
    fetchCategories, fetchPins, hasMore, fetchBoards, resetFilters, toggleLike, toggleFavorite, savePinToBoard,
    openBoard, removePinFromBoard, syncLike, syncFavorite, $reset
  }
})

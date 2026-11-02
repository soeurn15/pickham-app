<template>
  <div class="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
    <Navbar
      :search-text="feed.searchText"
      :active-view="activeView"
      :is-dark="ui.isDark"
      :current-user="session.user"
      @update:search-text="onSearch"
      @navigate="navigate"
      @toggle-theme="ui.toggleTheme"
      @logout="logout"
    />

    <main class="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
      <router-view />
    </main>

    <!-- Detailed image popup; can open on top of any page -->
    <PinDetailModal
      v-if="ui.selectedPinId !== null"
      :pin-id="ui.selectedPinId"
      :boards="feed.boards"
      :current-user-id="session.user.id"
      :current-user-avatar="session.user.avatar"
      @close="ui.closePin"
      @tag-click="onTagClick"
      @like-toggled="feed.syncLike"
      @favorite-toggled="feed.syncFavorite"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import PinDetailModal from '../components/PinDetailModal.vue'
import { useSessionStore } from '../stores/session'
import { useFeedStore } from '../stores/feed'
import { useUiStore } from '../stores/ui'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const feed = useFeedStore()
const ui = useUiStore()

// The navbar highlights its tabs by view name
const activeView = computed(() => (route.name === 'board' ? 'board-detail' : String(route.name ?? '')))

const PATHS: Record<string, string> = { feed: '/', create: '/create', profile: '/profile', admin: '/admin' }

function navigate(view: string) {
  router.push(PATHS[view] ?? '/')
}

function onSearch(value: string) {
  feed.searchText = value
  if (route.name !== 'feed') router.push('/')
}

function onTagClick(tag: string) {
  ui.closePin()
  feed.searchText = tag
  router.push('/')
}

function logout() {
  ui.closePin()
  feed.$reset()
  session.signOut()
  router.push({ name: 'login' })
}

onMounted(() => {
  feed.fetchCategories()
  feed.fetchBoards()
  session.refresh()
})
</script>

<template>
  <UserProfile
    :user-id="session.user.id"
    @navigate="view => router.push(view === 'create' ? '/create' : '/')"
    @click-pin="ui.openPin"
    @select-board="board => router.push({ name: 'board', params: { id: board.id } })"
    @profile-updated="session.refresh"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserProfile from '../components/UserProfile.vue'
import { useFeedStore } from '../stores/feed'
import { useSessionStore } from '../stores/session'
import { useUiStore } from '../stores/ui'

const router = useRouter()
const session = useSessionStore()
const ui = useUiStore()
const feed = useFeedStore()

onMounted(() => feed.fetchBoards())
</script>

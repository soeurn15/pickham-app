<template>
  <CreatePinModal
    :categories="feed.categories.slice(1)"
    :boards="feed.boards"
    :current-user-id="session.user.id"
    @cancel="router.push('/')"
    @success="onSuccess"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import CreatePinModal from '../components/CreatePinModal.vue'
import { useFeedStore } from '../stores/feed'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const feed = useFeedStore()
const session = useSessionStore()

function onSuccess() {
  feed.resetFilters()
  feed.fetchBoards()
  router.push('/')
}
</script>

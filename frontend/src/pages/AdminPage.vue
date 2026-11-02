<template>
  <AdminDashboard
    :current-admin-id="session.user.id"
    @back-to-feed="router.push('/')"
    @categories-changed="feed.fetchCategories"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminDashboard from '../components/AdminDashboard.vue'
import { useFeedStore } from '../stores/feed'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const session = useSessionStore()
const feed = useFeedStore()
</script>

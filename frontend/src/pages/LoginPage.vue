<template>
  <AuthView @login-success="onLogin" />
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AuthView from '../components/AuthView.vue'
import { useSessionStore } from '../stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

function onLogin(payload: Parameters<typeof session.signIn>[0]) {
  session.signIn(payload)
  // Only follow same-site redirects such as /profile, never //evil.example or full URLs
  const target = typeof route.query.redirect === 'string' && /^\/(?!\/)/.test(route.query.redirect) ? route.query.redirect : '/'
  router.push(target)
}
</script>

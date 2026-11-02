import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '../types'
import { clearSession, loadStoredUser, saveSession } from '../services/session'

const EMPTY_USER: User = { id: 0, username: '', avatar: '', bio: '', role: '' }

export const useSessionStore = defineStore('session', () => {
  const user = ref<User>(loadStoredUser() ?? EMPTY_USER)
  const isLoggedIn = computed(() => user.value.id > 0)
  const isAdmin = computed(() => user.value.role === 'admin')

  // Called with the response of /api/auth/login or /register
  function signIn(payload: User & { token: string }) {
    const { token, ...profile } = payload
    user.value = profile
    saveSession(token, profile)
  }

  function signOut() {
    user.value = EMPTY_USER
    clearSession()
  }

  async function refresh() {
    if (!isLoggedIn.value) return
    try {
      const response = await fetch(`/api/users/${user.value.id}`)
      if (!response.ok) return
      const data = await response.json()
      user.value = data.user
      saveSession(null, data.user)
    } catch (error) {
      console.error('Failed to load user info:', error)
    }
  }

  return { user, isLoggedIn, isAdmin, signIn, signOut, refresh }
})

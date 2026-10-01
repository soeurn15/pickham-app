<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)] p-4 overflow-hidden">
    
    <!-- Auth Card (Premium Glassmorphic container) -->
    <div class="w-full max-w-[460px] rounded-2xl bg-[var(--bg-soft)] p-8 sm:p-10 border border-[var(--panel-border)] shadow-xl relative z-10">
      
      <!-- Brand Logo Header -->
      <div class="flex flex-col items-center text-center mb-8">
        <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white mb-4">
          <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4" />
            <path d="M12 9v1M15 13h-1" class="opacity-60" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold font-outfit tracking-tight text-[var(--text)]">
          Pic<span class="text-[var(--accent)]">Kham</span>
        </h1>
        <p class="text-xs text-[var(--text-muted)] mt-1.5 font-semibold">Discover and collect visual inspiration</p>
      </div>

      <!-- Error feedback banner -->
      <div v-if="errorMsg" class="mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 text-xs font-semibold text-red-600 dark:text-red-400">
        {{ errorMsg }}
      </div>

      <!-- LOGIN FORM -->
      <form v-if="isLoginView" @submit.prevent="handleLogin" class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]">Username</label>
          <input 
            type="text" 
            placeholder="Your username" autocomplete="username" 
            v-model="username"
            required
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]">Password</label>
          <input 
            type="password" 
            placeholder="Your password" autocomplete="current-password" 
            v-model="password"
            required
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full mt-6 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <!-- REGISTER FORM -->
      <form v-else @submit.prevent="handleRegister" class="space-y-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]">Username</label>
          <input 
            type="text" 
            placeholder="Choose a username" autocomplete="username" 
            v-model="username"
            required
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]">Password</label>
          <input 
            type="password" 
            placeholder="Create a password" autocomplete="new-password" 
            v-model="password"
            required
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]">Bio</label>
          <input 
            type="text" 
            placeholder="Tell us about yourself..." 
            v-model="bio"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
          />
        </div>

        <!-- Custom / Preset Avatar Selector -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-[var(--text-muted)]">Select Profile Avatar</label>
          
          <!-- Avatar List Grid -->
          <div class="flex items-center gap-3">
            <button 
              v-for="url in presetAvatars" 
              :key="url"
              type="button"
              @click="avatar = url"
              class="h-10 w-10 overflow-hidden rounded-full border-2 transition cursor-pointer"
              :class="avatar === url ? 'border-[var(--accent)] scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'"
            >
              <img :src="url" alt="Avatar" class="h-full w-full object-cover" />
            </button>
            
            <button 
              type="button" 
              @click="avatar = ''"
              class="h-10 px-3 rounded-full border text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-zinc-800"
              :class="avatar === '' ? 'border-[var(--accent)] bg-slate-50 dark:bg-zinc-800' : 'border-[var(--panel-border)]'"
            >
              Default
            </button>
          </div>

          <!-- URL Avatar Input -->
          <input 
            v-if="avatar !== '' && !presetAvatars.includes(avatar)"
            type="url" 
            v-model="avatar"
            placeholder="Or paste custom avatar URL" 
            class="w-full mt-2 rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full mt-6 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </form>

      <!-- Toggle Switcher Links -->
      <div class="mt-8 border-t border-[var(--panel-border)] pt-5 text-center">
        <button 
          v-if="isLoginView" 
          @click="toggleAuthView"
          class="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
        >
          Don't have an account? <span class="font-bold text-[var(--text)] underline">Sign up free</span>
        </button>
        <button 
          v-else 
          @click="toggleAuthView"
          class="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
        >
          Already have an account? <span class="font-bold text-[var(--text)] underline">Log in here</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (event: 'login-success', user: any): void
}>()

const isLoginView = ref(true)
const username = ref('')
const password = ref('')
const bio = ref('')
const avatar = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const presetAvatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', // Male Avatar
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', // Female Avatar
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', // Beard Avatar
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'  // Natural Avatar
]

function toggleAuthView() {
  isLoginView.value = !isLoginView.value
  username.value = ''
  password.value = ''
  bio.value = ''
  avatar.value = ''
  errorMsg.value = ''
}

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) return

  isLoading.value = true
  errorMsg.value = ''

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value.trim()
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    emit('login-success', data)
  } catch (error: any) {
    errorMsg.value = error.message || 'Server connection failed.'
  } finally {
    isLoading.value = false
  }
}

async function handleRegister() {
  if (!username.value.trim() || !password.value.trim()) return

  isLoading.value = true
  errorMsg.value = ''

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value.trim(),
        avatar: avatar.value.trim() || null,
        bio: bio.value.trim()
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    emit('login-success', data)
  } catch (error: any) {
    errorMsg.value = error.message || 'Server connection failed.'
  } finally {
    isLoading.value = false
  }
}
</script>

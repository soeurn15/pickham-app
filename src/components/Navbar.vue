<template>
  <header class="sticky top-0 z-40 w-full px-4 py-3 glass-effect border-b border-[var(--panel-border)] shadow-sm">
    <div class="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
      
      <!-- Logo and Brand -->
      <div class="flex items-center gap-2.5 cursor-pointer" @click="$emit('navigate', 'feed')">
        <!-- Upgraded Gradient squircle logo with custom aperture vector -->
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <svg class="h-5.5 w-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4" />
            <path d="M12 9v1M15 13h-1" class="opacity-60" />
          </svg>
        </div>
        <span class="hidden font-outfit text-2xl font-bold tracking-tight text-[var(--text)] sm:block">
          Pic<span class="text-[var(--accent)]">Kham</span>
        </span>
      </div>

      <!-- Navigation Links -->
      <nav class="hidden items-center gap-1.5 md:flex">
        <button 
          type="button"
          class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition"
          :class="activeView === 'feed' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--panel-border)]'"
          @click="$emit('navigate', 'feed')"
        >
          Explore
        </button>
        <button 
          type="button"
          class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition"
          :class="activeView === 'create' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--panel-border)]'"
          @click="$emit('navigate', 'create')"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create
        </button>
        <!-- Admin Dashboard link -->
        <button 
          v-if="currentUser.role === 'admin'"
          type="button"
          class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition"
          :class="activeView === 'admin' ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--panel-border)]'"
          @click="$emit('navigate', 'admin')"
        >
          Admin Panel
        </button>
      </nav>

      <!-- Center Search Bar -->
      <div class="relative flex-1 max-w-[680px]">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          type="text" 
          placeholder="Search pins, tags and topics" aria-label="Search pins" 
          :value="searchText"
          @input="handleInput"
          class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--bg-soft)] focus:ring-2 focus:ring-[var(--accent)]/10"
        />
        <!-- Clear query button -->
        <button 
          v-if="searchText" 
          @click="clearSearch"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Action Area: Theme and Profile -->
      <div class="flex items-center gap-3">
        <!-- Add image icon for mobile -->
        <button 
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--panel-border)] md:hidden transition"
          @click="$emit('navigate', 'create')"
          title="Create Pin"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <!-- Theme Toggle Button -->
        <button 
          type="button"
          @click="$emit('toggleTheme')"
          class="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--panel-border)] transition"
          aria-label="Toggle Theme"
          title="Toggle Light/Dark Mode"
        >
          <svg v-if="isDark" class="h-5 w-5 fill-current text-yellow-400" viewBox="0 0 24 24">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zM6.99 16.95l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>
          </svg>
          <svg v-else class="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.3 2a10 10 0 0 0-1.9 1.8 10 10 0 1 0 11.6 11.6 10 10 0 0 0-9.7-13.4z"/>
          </svg>
        </button>

        <!-- Logout Button -->
        <button 
          type="button"
          @click="$emit('logout')"
          class="hidden sm:inline-flex whitespace-nowrap h-10 px-4 items-center justify-center rounded-lg border border-[var(--panel-border)] text-sm font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
          title="Logout Account"
        >
          Log out
        </button>

        <!-- User Profile Avatar -->
        <div 
          @click="$emit('navigate', 'profile')"
          class="h-9 w-9 overflow-hidden rounded-full border-2 border-transparent hover:border-[var(--accent)] transition cursor-pointer shadow-sm"
          title="My Profile"
        >
          <img 
            :src="currentUser.avatar || 'https://ui-avatars.com/api/?name=User&background=random'" 
            :alt="currentUser.username"
            class="h-full w-full object-cover"
          />
        </div>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  searchText: string
  activeView: string
  isDark: boolean
  currentUser: {
    username: string
    avatar: string
    role?: string
  }
}>()

const emit = defineEmits<{
  (event: 'update:searchText', value: string): void
  (event: 'navigate', view: string): void
  (event: 'toggleTheme'): void
  (event: 'logout'): void
}>()

function handleInput(event: Event) {
  emit('update:searchText', (event.target as HTMLInputElement).value)
}

function clearSearch() {
  emit('update:searchText', '')
}
</script>
<template>
  <div class="mx-auto max-w-[1200px] space-y-8 py-2">

    <!-- Page header -->
    <header class="flex flex-col gap-4 border-b border-[var(--panel-border)] pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Administration</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Platform overview</h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">Usage figures and account management.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="refresh"
          :disabled="isLoading"
          class="rounded-lg border border-[var(--panel-border)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-50"
        >
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button
          type="button"
          @click="$emit('back-to-feed')"
          class="rounded-lg border border-[var(--panel-border)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg)]"
        >
          Back to feed
        </button>
      </div>
    </header>

    <!-- Error banner -->
    <div v-if="errorMsg" role="alert" class="flex items-start justify-between gap-4 rounded-lg border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
      <span>{{ errorMsg }}</span>
      <button type="button" class="font-medium underline" @click="errorMsg = ''">Dismiss</button>
    </div>

    <!-- KPI cards -->
    <section aria-label="Key figures" class="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <div v-for="kpi in kpis" :key="kpi.label" class="rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-5">
        <p class="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{{ kpi.label }}</p>
        <p class="tabular mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
          <span v-if="isLoading && !loaded" class="inline-block h-8 w-14 animate-pulse rounded bg-[var(--panel-border)]"></span>
          <template v-else>{{ kpi.value }}</template>
        </p>
        <p class="mt-1 text-xs text-[var(--text-muted)]">{{ kpi.hint }}</p>
      </div>
    </section>

    <!-- Breakdown row -->
    <section class="grid gap-4 lg:grid-cols-3">
      <div class="rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-6 lg:col-span-2">
        <h2 class="text-base font-semibold text-[var(--text)]">Pins by category</h2>
        <p class="mt-0.5 text-xs text-[var(--text-muted)]">Share of all {{ metrics.pins }} pins</p>

        <ul v-if="metrics.categories.length" class="mt-5 space-y-3">
          <li v-for="c in metrics.categories" :key="c.category" class="grid grid-cols-[110px_1fr_90px] items-center gap-3 text-sm">
            <span class="truncate text-[var(--text)]">{{ c.category }}</span>
            <span class="h-2 overflow-hidden rounded-full bg-[var(--panel-border)]">
              <span class="block h-full rounded-full bg-[var(--accent)]" :style="{ width: percent(c.count, metrics.pins) + '%' }"></span>
            </span>
            <span class="tabular text-right text-xs text-[var(--text-muted)]">
              {{ c.count }} <span class="opacity-70">({{ percent(c.count, metrics.pins) }}%)</span>
            </span>
          </li>
        </ul>
        <p v-else class="mt-6 text-sm text-[var(--text-muted)]">No pins yet.</p>
      </div>

      <div class="rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-6">
        <h2 class="text-base font-semibold text-[var(--text)]">Accounts by role</h2>
        <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ usersList.length }} registered</p>
        <ul class="mt-5 space-y-3">
          <li v-for="r in roleBreakdown" :key="r.role" class="grid grid-cols-[70px_1fr_40px] items-center gap-3 text-sm">
            <span class="capitalize text-[var(--text)]">{{ r.role }}</span>
            <span class="h-2 overflow-hidden rounded-full bg-[var(--panel-border)]">
              <span class="block h-full rounded-full" :class="r.role === 'admin' ? 'bg-amber-500' : 'bg-[var(--accent)]'" :style="{ width: percent(r.count, usersList.length) + '%' }"></span>
            </span>
            <span class="tabular text-right text-xs text-[var(--text-muted)]">{{ r.count }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Categories -->
    <section class="rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 class="text-base font-semibold text-[var(--text)]">Categories</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">Shown in the feed filter and when creating a pin. Deleting one moves its pins to "Other".</p>
        </div>
        <form class="flex w-full gap-2 md:w-auto" @submit.prevent="addCategory">
          <input
            v-model="newCategory"
            type="text"
            maxlength="50"
            placeholder="New category name"
            aria-label="New category name"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] md:w-64"
          />
          <button
            type="submit"
            :disabled="isAddingCategory || !newCategory.trim()"
            class="whitespace-nowrap rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >{{ isAddingCategory ? 'Adding...' : 'Add category' }}</button>
        </form>
      </div>

      <p v-if="categoryError" role="alert" class="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">{{ categoryError }}</p>

      <ul class="mt-5 flex flex-wrap gap-2">
        <li
          v-for="c in categoryList"
          :key="c.id"
          class="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--bg)] py-1.5 pl-3.5 pr-2 text-sm text-[var(--text)]"
        >
          <span>{{ c.name }}</span>
          <span class="tabular text-xs text-[var(--text-muted)]">{{ c.pins_count }}</span>
          <span v-if="c.name === 'Other'" class="rounded-full bg-[var(--panel-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]" title="Fallback category, cannot be deleted">default</span>
          <template v-else>
            <button
              v-if="confirmingCategoryId !== c.id"
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              :aria-label="`Delete category ${c.name}`"
              @click="confirmingCategoryId = c.id"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <span v-else class="flex items-center gap-1">
              <button type="button" class="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white" @click="deleteCategory(c)">Delete{{ c.pins_count ? ` (move ${c.pins_count})` : '' }}</button>
              <button type="button" class="rounded-full px-2 py-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]" @click="confirmingCategoryId = null">Cancel</button>
            </span>
          </template>
        </li>
        <li v-if="!categoryList.length" class="text-sm text-[var(--text-muted)]">No categories yet.</li>
      </ul>
    </section>

    <!-- Accounts table -->
    <section class="overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)]">
      <div class="flex flex-col gap-3 border-b border-[var(--panel-border)] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-base font-semibold text-[var(--text)]">Accounts</h2>
          <p class="mt-0.5 text-xs text-[var(--text-muted)]">Manage profiles, roles and access.</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input
            v-model="query"
            type="search"
            placeholder="Search by username"
            aria-label="Search accounts"
            class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] sm:w-60"
          />
          <select
            v-model="roleFilter"
            aria-label="Filter by role"
            class="rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-[var(--panel-border)] bg-[var(--bg)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
              <th v-for="col in columns" :key="col.key" scope="col" class="px-5 py-3 font-medium" :class="col.align === 'right' ? 'text-right' : ''" :aria-sort="ariaSort(col.key)">
                <button type="button" class="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[var(--text)]" @click="setSort(col.key)">
                  {{ col.label }}
                  <span aria-hidden="true" class="w-3 text-[10px]">{{ sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '' }}</span>
                </button>
              </th>
              <th scope="col" class="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--panel-border)] text-[var(--text)]">
            <tr v-for="user in pageRows" :key="user.id" class="hover:bg-[var(--bg)]">
              <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                  <img :src="user.avatar" :alt="''" class="h-8 w-8 rounded-full bg-[var(--panel-border)] object-cover" />
                  <div class="min-w-0">
                    <p class="truncate font-medium">
                      {{ user.username }}
                      <span v-if="user.id === currentAdminId" class="ml-1 text-xs font-normal text-[var(--text-muted)]">(you)</span>
                    </p>
                    <p class="text-xs text-[var(--text-muted)]">ID {{ user.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3">
                <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize"
                  :class="user.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-[var(--panel-border)] text-[var(--text-muted)]'"
                >{{ user.role }}</span>
              </td>
              <td class="tabular px-5 py-3 text-[var(--text-muted)]">{{ formatDate(user.created_at) }}</td>
              <td class="tabular px-5 py-3 text-right">{{ user.pins_count }}</td>
              <td class="whitespace-nowrap px-5 py-3 text-right">
                <button type="button" @click="openEditModal(user)" class="rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--panel-border)]">Edit</button>
                <button
                  type="button"
                  @click="toggleUserRole(user)"
                  :disabled="user.id === currentAdminId"
                  :title="user.id === currentAdminId ? 'You cannot change your own role' : ''"
                  class="rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--panel-border)] disabled:opacity-40"
                >{{ user.role === 'admin' ? 'Make user' : 'Make admin' }}</button>
                <button
                  type="button"
                  @click="confirmDeleteUser(user)"
                  :disabled="user.id === currentAdminId"
                  :title="user.id === currentAdminId ? 'You cannot delete your own account' : ''"
                  class="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/30"
                >Delete</button>
              </td>
            </tr>
            <tr v-if="!pageRows.length">
              <td colspan="5" class="px-5 py-12 text-center text-sm text-[var(--text-muted)]">
                {{ loaded ? 'No accounts match your filters.' : 'Loading accounts...' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col items-center justify-between gap-3 border-t border-[var(--panel-border)] px-5 py-3 text-xs text-[var(--text-muted)] sm:flex-row">
        <span class="tabular">
          {{ filteredRows.length ? rangeStart + '–' + rangeEnd : '0' }} of {{ filteredRows.length }} accounts
        </span>
        <div class="flex items-center gap-2">
          <button type="button" :disabled="page <= 1" @click="page--" class="rounded-md border border-[var(--panel-border)] px-3 py-1.5 font-medium text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-40">Previous</button>
          <span class="tabular">Page {{ page }} of {{ totalPages }}</span>
          <button type="button" :disabled="page >= totalPages" @click="page++" class="rounded-md border border-[var(--panel-border)] px-3 py-1.5 font-medium text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>

    <!-- Edit user modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showEditModal = false">
      <div role="dialog" aria-modal="true" aria-labelledby="edit-title" class="w-full max-w-[460px] rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-6 shadow-xl">
        <h3 id="edit-title" class="text-lg font-semibold text-[var(--text)]">Edit {{ selectedUser?.username }}</h3>
        <form @submit.prevent="saveUserEdit" class="mt-5 space-y-4">
          <div class="flex flex-col gap-1.5">
            <label for="edit-username" class="text-xs font-medium text-[var(--text-muted)]">Username</label>
            <input id="edit-username" type="text" v-model="editUsername" required class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="edit-avatar" class="text-xs font-medium text-[var(--text-muted)]">Avatar image URL</label>
            <input id="edit-avatar" type="url" v-model="editAvatar" required class="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="edit-bio" class="text-xs font-medium text-[var(--text-muted)]">Bio</label>
            <textarea id="edit-bio" v-model="editBio" rows="3" class="w-full resize-none rounded-lg border border-[var(--panel-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showEditModal = false" class="rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg)]">Cancel</button>
            <button type="submit" class="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">Save changes</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showDeleteModal = false">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" class="w-full max-w-[420px] rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-6 shadow-xl">
        <h3 id="delete-title" class="text-lg font-semibold text-[var(--text)]">Delete {{ selectedUser?.username }}?</h3>
        <p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          This permanently removes the account and all of its pins, boards, comments and likes. This cannot be undone.
        </p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" @click="showDeleteModal = false" class="rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg)]">Cancel</button>
          <button type="button" @click="deleteUser" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete account</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  currentAdminId: number
}>()

const emit = defineEmits<{
  (event: 'back-to-feed'): void
  (event: 'categories-changed'): void
}>()

const PAGE_SIZE = 8

const metrics = ref<{ users: number; pins: number; boards: number; comments: number; likes: number; categories: { category: string; count: number }[] }>({
  users: 0, pins: 0, boards: 0, comments: 0, likes: 0, categories: []
})
const usersList = ref<any[]>([])

// Categories
const categoryList = ref<{ id: number; name: string; pins_count: number }[]>([])
const newCategory = ref('')
const isAddingCategory = ref(false)
const categoryError = ref('')
const confirmingCategoryId = ref<number | null>(null)
const isLoading = ref(false)
const loaded = ref(false)
const errorMsg = ref('')

// Table state
const query = ref('')
const roleFilter = ref<'all' | 'admin' | 'user'>('all')
const sortKey = ref<'username' | 'role' | 'created_at' | 'pins_count'>('created_at')
const sortDir = ref<'asc' | 'desc'>('desc')
const page = ref(1)

const columns = [
  { key: 'username', label: 'User', align: 'left' },
  { key: 'role', label: 'Role', align: 'left' },
  { key: 'created_at', label: 'Joined', align: 'left' },
  { key: 'pins_count', label: 'Pins', align: 'right' }
] as const

// Edit / delete state
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedUser = ref<any | null>(null)
const editUsername = ref('')
const editAvatar = ref('')
const editBio = ref('')

const fmt = new Intl.NumberFormat('en-US')

const kpis = computed(() => {
  const m = metrics.value
  const perUser = m.users ? (m.pins / m.users).toFixed(1) : '0'
  return [
    { label: 'Users', value: fmt.format(m.users), hint: 'Registered accounts' },
    { label: 'Pins', value: fmt.format(m.pins), hint: `${perUser} per user` },
    { label: 'Boards', value: fmt.format(m.boards), hint: 'Collections created' },
    { label: 'Comments', value: fmt.format(m.comments), hint: 'Across all pins' },
    { label: 'Likes', value: fmt.format(m.likes), hint: m.pins ? `${(m.likes / m.pins).toFixed(1)} per pin` : 'Across all pins' }
  ]
})

const roleBreakdown = computed(() => {
  const admins = usersList.value.filter(u => u.role === 'admin').length
  return [
    { role: 'admin', count: admins },
    { role: 'user', count: usersList.value.length - admins }
  ]
})

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  const rows = usersList.value.filter(u =>
    (roleFilter.value === 'all' || u.role === roleFilter.value) &&
    (!q || u.username.toLowerCase().includes(q))
  )
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...rows].sort((a, b) => {
    const av = key === 'created_at' ? new Date(a[key]).getTime() : a[key]
    const bv = key === 'created_at' ? new Date(b[key]).getTime() : b[key]
    if (typeof av === 'string') return av.localeCompare(bv) * dir
    return (av - bv) * dir
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / PAGE_SIZE)))
const pageRows = computed(() => filteredRows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const rangeStart = computed(() => (page.value - 1) * PAGE_SIZE + 1)
const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, filteredRows.value.length))

// Back to page 1 whenever the result set changes; clamp if rows were deleted
watch([query, roleFilter, sortKey, sortDir], () => { page.value = 1 })
watch(totalPages, (n) => { if (page.value > n) page.value = n })

onMounted(refresh)

async function refresh() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const [m, u, c] = await Promise.all([fetch('/api/admin/metrics'), fetch('/api/admin/users'), fetch('/api/categories')])
    if (c.ok) categoryList.value = await c.json()
    if (!m.ok || !u.ok) {
      throw new Error(m.status === 403 || u.status === 403
        ? 'Your account does not have admin access.'
        : 'Could not load dashboard data.')
    }
    metrics.value = await m.json()
    usersList.value = await u.json()
    loaded.value = true
  } catch (err: any) {
    errorMsg.value = err.message || 'Could not reach the server.'
  } finally {
    isLoading.value = false
  }
}

// Show the server's reason (e.g. "Username is already taken") instead of a generic message
async function serverError(res: Response, fallback: string) {
  try {
    const body = await res.json()
    return typeof body?.error === 'string' ? body.error : fallback
  } catch {
    return fallback
  }
}

async function addCategory() {
  const name = newCategory.value.trim()
  if (!name) return
  isAddingCategory.value = true
  categoryError.value = ''
  try {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error(await serverError(res, 'Could not create the category.'))
    newCategory.value = ''
    await refresh()
    emit('categories-changed')
  } catch (err: any) {
    categoryError.value = err.message
  } finally {
    isAddingCategory.value = false
  }
}

async function deleteCategory(category: { id: number; name: string }) {
  categoryError.value = ''
  try {
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await serverError(res, 'Could not delete the category.'))
    confirmingCategoryId.value = null
    await refresh()
    emit('categories-changed')
  } catch (err: any) {
    confirmingCategoryId.value = null
    categoryError.value = err.message
  }
}

function setSort(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'username' || key === 'role' ? 'asc' : 'desc'
  }
}

function ariaSort(key: string) {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0
}

async function toggleUserRole(user: any) {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  try {
    const res = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    })
    if (!res.ok) throw new Error(await serverError(res, 'Could not change the role.'))
    user.role = newRole
  } catch (err: any) {
    errorMsg.value = err.message
  }
}

function openEditModal(user: any) {
  selectedUser.value = user
  editUsername.value = user.username
  editAvatar.value = user.avatar || ''
  editBio.value = user.bio || ''
  showEditModal.value = true
}

async function saveUserEdit() {
  if (!selectedUser.value || !editUsername.value.trim() || !editAvatar.value.trim()) return
  try {
    const res = await fetch(`/api/admin/users/${selectedUser.value.id}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: editUsername.value.trim(),
        avatar: editAvatar.value.trim(),
        bio: editBio.value.trim()
      })
    })
    if (!res.ok) throw new Error(await serverError(res, 'Could not save the profile.'))
    showEditModal.value = false
    await refresh()
  } catch (err: any) {
    showEditModal.value = false
    errorMsg.value = err.message
  }
}

function confirmDeleteUser(user: any) {
  selectedUser.value = user
  showDeleteModal.value = true
}

async function deleteUser() {
  if (!selectedUser.value) return
  try {
    const res = await fetch(`/api/admin/users/${selectedUser.value.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await serverError(res, 'Could not delete the account.'))
    showDeleteModal.value = false
    await refresh()
  } catch (err: any) {
    showDeleteModal.value = false
    errorMsg.value = err.message
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr))
}
</script>

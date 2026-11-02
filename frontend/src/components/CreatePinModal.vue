<template>
  <div class="mx-auto max-w-[960px] rounded-[40px] bg-[var(--bg-soft)] p-6 sm:p-10 border border-[var(--panel-border)] shadow-xl relative animate-scale-up">
    
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between border-b border-[var(--panel-border)] pb-4">
      <div>
        <h2 class="text-3xl font-extrabold text-[var(--text)] tracking-tight font-outfit">Create a Pin</h2>
        <p class="text-xs text-[var(--text-muted)] mt-1 font-semibold">Upload high-resolution photography and catalog your visual collections</p>
      </div>
      <button 
        type="button" 
        @click="$emit('cancel')" 
        class="rounded-full bg-slate-100 dark:bg-zinc-800 px-5 py-2 text-xs font-bold text-[var(--text)] hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
      >
        Cancel
      </button>
    </div>

    <!-- Main Grid -->
    <div v-if="!isSuccess" class="grid gap-8 md:grid-cols-12">
      
      <!-- Left Column: Image Upload Area (45% width equivalent) -->
      <div class="md:col-span-5 flex flex-col gap-4">
        <label class="block text-xs font-medium text-[var(--text-muted)]">
          Image Canvas
        </label>
        
        <!-- Drag & Drop Zone -->
        <div 
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="handleDrop"
          class="relative flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition duration-300 overflow-hidden"
          :class="[
            dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--panel-border)] bg-slate-50 dark:bg-zinc-900/40 hover:border-[var(--text-muted)]',
            previewUrl ? 'p-2' : 'p-6'
          ]"
          @click="triggerFileSelect"
        >
          <!-- Hidden Input -->
          <input 
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />

          <!-- Preview Mode with Ambient Glow Backdrop -->
          <template v-if="previewUrl">
            <div class="relative w-full h-[360px] rounded-2xl overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-zinc-950">
              <!-- Smart blur glow matching preview photo -->
              <div 
                :style="{ backgroundImage: `url(${previewUrl})` }" 
                class="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-20 pointer-events-none"
              ></div>
              <img :src="previewUrl" alt="Preview" class="h-full w-full object-contain rounded-2xl relative z-10 p-2" @error="onPreviewError" />
              <button
                type="button"
                class="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-red-500 cursor-pointer"
                title="Remove image"
                aria-label="Remove image"
                @click.stop="clearImage"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
                <span class="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-lg scale-95 transition duration-200">Swap Photo</span>
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template v-else>
            <div class="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--bg-soft)] text-[var(--accent)] shadow-md mb-2">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p class="mt-4 text-center text-sm font-bold text-[var(--text)] font-outfit">
              Drag & drop your media
            </p>
            <p class="mt-1.5 text-center text-[10px] font-bold text-[var(--text-muted)] max-w-[200px] leading-relaxed uppercase tracking-wider">
              JPG, PNG, GIF or WebP<br>(max 10MB)
            </p>
            <button 
              type="button" 
              class="mt-5 rounded-full bg-[var(--text)] px-5 py-2 text-xs font-bold text-[var(--bg-soft)] transition-all shadow cursor-pointer"
            >
              Select File
            </button>
          </template>
        </div>

        <p v-if="selectedFile" class="-mt-1 truncate text-center text-[11px] font-medium text-[var(--text-muted)]">
          {{ selectedFile.name }} · {{ formatSize(selectedFile.size) }}
        </p>

        <!-- URL Input Alternative -->
        <div class="flex flex-col gap-2 mt-2">
          <span class="text-center text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">— OR PASTE AN IMAGE LINK —</span>
          <input 
            type="url" 
            placeholder="https://images.unsplash.com/your-favorite-photo" 
            v-model="imageUrl"
            @input="handleUrlInput"
            :class="fieldClass"
          />
        </div>
      </div>

      <!-- Right Column: Metadata Form (55% width equivalent) -->
      <form @submit.prevent="submitPin" class="md:col-span-7 flex flex-col gap-5">
        <!-- Title -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]" for="pin-title">
            Title <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input 
            id="pin-title"
            type="text" 
            placeholder="Add a catchy visual title" 
            v-model="title"
            maxlength="100"
            required
            :class="fieldClass"
          />
          <span class="self-end text-[10px] font-medium text-[var(--text-muted)]">{{ title.length }}/100</span>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]" for="pin-desc">
            Description
          </label>
          <textarea 
            id="pin-desc"
            placeholder="Describe what people are seeing in this photo..." 
            v-model="description"
            rows="3"
            maxlength="500"
            class="resize-none"
            :class="fieldClass"
          ></textarea>
        </div>

        <!-- Category -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]" for="pin-category">
            Category
          </label>
          <div class="relative">
          <select 
            id="pin-category"
            v-model="category"
            :class="fieldClass"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]" for="pin-tags">
            Tags (comma-separated)
          </label>
          <input 
            id="pin-tags"
            type="text" 
            placeholder="nature, aesthetic, emerald, background" 
            v-model="tags"
            :class="fieldClass"
          />
          <div v-if="tagList.length" class="flex flex-wrap gap-1.5 pt-1">
            <span v-for="t in tagList" :key="t" class="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">#{{ t }}</span>
          </div>
        </div>

        <!-- Board Selection -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-[var(--text-muted)]" for="pin-board">
            Add to Board (Optional)
          </label>
          <div class="relative">
          <select 
            id="pin-board"
            v-model="boardId"
            :class="fieldClass"
          >
            <option :value="null">Don't save to a board</option>
            <option v-for="board in boards" :key="board.id" :value="board.id">{{ board.name }}</option>
          </select>
          </div>
        </div>

        <!-- Error feedback -->
        <div v-if="errorMsg" class="mt-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3 text-[11px] font-semibold text-red-600 dark:text-red-400">
          {{ errorMsg }}
        </div>

        <div v-if="isSubmitting" class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--panel-border)]" role="progressbar" :aria-valuenow="uploadProgress" aria-valuemin="0" aria-valuemax="100" aria-label="Upload progress">
          <div class="h-full rounded-full bg-[var(--accent)] transition-all duration-200" :style="{ width: uploadProgress + '%' }"></div>
        </div>

        <!-- Submit Buttons -->
        <div class="mt-6 flex justify-end gap-3 border-t border-[var(--panel-border)] pt-5">
          <button 
            type="button" 
            @click="$emit('cancel')" 
            class="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-6 py-2.5 text-xs font-bold text-[var(--text)] transition cursor-pointer"
          >
            Discard
          </button>
          
          <button 
            type="submit" 
            :disabled="isSubmitting || !canPublish"
            class="rounded-full bg-[var(--accent)] px-8 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? (uploadProgress > 0 && uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Processing...') : 'Publish Pin' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success View -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-[var(--accent)] animate-scale-up mb-6 shadow-md shadow-emerald-500/5">
        <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-[var(--text)] font-outfit">Pin Published Successfully!</h3>
      <p class="text-[var(--text-muted)] max-w-sm mt-2 text-xs font-medium leading-relaxed">Your new pin has been saved to the MySQL database and is now live in the explorer feed.</p>
      
      <div class="mt-8 flex gap-4">
        <button 
          @click="resetForm" 
          class="rounded-full border border-[var(--panel-border)] px-6 py-2.5 text-xs font-semibold text-[var(--text)] hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          Create another
        </button>
        
        <button 
          @click="$emit('success')" 
          class="rounded-full bg-[var(--accent)] px-8 py-2.5 text-xs font-bold text-white transition shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          View Explorer Feed
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { uploadWithProgress } from '../services/upload'
import { computed, ref } from 'vue'

const props = defineProps<{
  categories: string[]
  boards: Array<{
    id: number
    name: string
  }>
  currentUserId: number
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (event: 'success'): void
}>()

const title = ref('')
const description = ref('')
const category = ref(props.categories[0] || 'Other')
const tags = ref('')
const boardId = ref<number | null>(null)

// File handling
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const imageUrl = ref('') // Paste URL alternative
const dragOver = ref(false)

// UI states
const isSubmitting = ref(false)
const uploadProgress = ref(0)
const isSuccess = ref(false)
const errorMsg = ref('')

const fieldClass = 'w-full appearance-none rounded-[20px] border border-transparent bg-slate-50 dark:bg-zinc-900/60 px-4 py-3.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]/70 focus:border-[var(--accent)] focus:bg-[var(--bg-soft)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all duration-300'

const tagList = computed(() =>
  Array.from(new Set(tags.value.split(',').map(t => t.trim()).filter(Boolean))).slice(0, 12)
)
const canPublish = computed(() => !!title.value.trim() && (!!selectedFile.value || !!imageUrl.value.trim()))

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function clearImage() {
  selectedFile.value = null
  previewUrl.value = ''
  imageUrl.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function onPreviewError() {
  if (!selectedFile.value) {
    errorMsg.value = 'That link could not be loaded as an image.'
    previewUrl.value = ''
  }
}

function triggerFileSelect() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    setFile(target.files[0])
  }
}

function handleDrop(event: DragEvent) {
  dragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    setFile(event.dataTransfer.files[0])
  }
}

function setFile(file: File) {
  if (!file.type.startsWith('image/')) {
    errorMsg.value = 'Please select a valid image file.'
    return
  }
  
  if (file.size > 10 * 1024 * 1024) {
    errorMsg.value = 'File size is too large. Limit is 10MB.'
    return
  }

  selectedFile.value = file
  imageUrl.value = '' // Clear URL alternative
  errorMsg.value = ''
  
  // Set preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function handleUrlInput() {
  if (imageUrl.value.trim()) {
    selectedFile.value = null
    previewUrl.value = imageUrl.value.trim()
  } else {
    previewUrl.value = ''
  }
}

function validateForm(): string {
  if (!title.value.trim()) return 'Title is required.'
  if (!selectedFile.value && !imageUrl.value.trim()) return 'Please upload a physical image or paste a valid photo URL.'
  if (!selectedFile.value) {
    try {
      const { protocol } = new URL(imageUrl.value.trim())
      if (protocol !== 'http:' && protocol !== 'https:') return 'Image link must start with http:// or https://.'
    } catch {
      return 'Image link is not a valid URL.'
    }
  }
  const rawTags = tags.value.split(',').map(t => t.trim()).filter(Boolean)
  if (new Set(rawTags).size > 12) return 'Use at most 12 tags.'
  if (rawTags.some(t => t.length > 30)) return 'Each tag must be 30 characters or fewer.'
  return ''
}

async function submitPin() {
  const problem = validateForm()
  if (problem) {
    errorMsg.value = problem
    return
  }

  isSubmitting.value = true
  errorMsg.value = ''

  try {
    const formData = new FormData()
    formData.append('title', title.value.trim())
    formData.append('description', description.value.trim())
    formData.append('category', category.value)
    formData.append('tags', tags.value.trim())
    
    if (boardId.value !== null) {
      formData.append('board_id', boardId.value.toString())
    }

    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    } else {
      formData.append('image_url', imageUrl.value.trim())
    }

    uploadProgress.value = 0
    const { status, data } = await uploadWithProgress('/api/pins', formData, percent => { uploadProgress.value = percent })
    if (status < 200 || status >= 300) {
      throw new Error(data?.error || (status === 401 ? 'Please sign in again.' : 'Server error uploading pin'))
    }

    isSuccess.value = true
  } catch (error: any) {
    errorMsg.value = error.message || 'Network connection failed.'
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  title.value = ''
  description.value = ''
  category.value = props.categories[0] || 'Other'
  tags.value = ''
  boardId.value = null
  selectedFile.value = null
  previewUrl.value = ''
  imageUrl.value = ''
  isSuccess.value = false
  errorMsg.value = ''
}
</script>

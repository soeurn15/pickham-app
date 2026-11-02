import { ref } from 'vue'
import { defineStore } from 'pinia'

// Theme and the pin-detail popup, which can open on top of any page.
export const useUiStore = defineStore('ui', () => {
  const isDark = ref(false)
  const selectedPinId = ref<number | null>(null)

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function initTheme() {
    let saved: string | null = null
    try {
      saved = localStorage.getItem('theme')
    } catch {
      /* ignore */
    }
    isDark.value = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    applyTheme()
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    try {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
    applyTheme()
  }

  const openPin = (id: number) => { selectedPinId.value = id }
  const closePin = () => { selectedPinId.value = null }

  return { isDark, selectedPinId, initTheme, toggleTheme, openPin, closePin }
})

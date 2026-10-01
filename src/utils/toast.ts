import { reactive } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export const toasts = reactive<Toast[]>([])
let nextId = 1

export function showToast(message: string, type: Toast['type'] = 'success', duration = 3000) {
  const id = nextId++
  toasts.push({ id, message, type })
  setTimeout(() => dismissToast(id), duration)
}

export function dismissToast(id: number) {
  const index = toasts.findIndex(t => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

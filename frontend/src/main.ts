import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'

// Attach the session token to every API call, and drop the session if the server rejects it
const nativeFetch = window.fetch.bind(window)
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!url.startsWith('/api/')) return nativeFetch(input, init)

  const headers = new Headers(init?.headers)
  const token = localStorage.getItem('vivid_token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await nativeFetch(input, { ...init, headers })
  if (response.status === 401 && !url.startsWith('/api/auth/') && token) {
    localStorage.removeItem('vivid_token')
    localStorage.removeItem('vivid_user')
    window.location.reload()
  }
  return response
}

createApp(App).mount('#app')

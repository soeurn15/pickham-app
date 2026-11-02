import { showToast } from '../composables/useToast'
import { clearSession, getToken } from './session'

let lastNotice = 0

// Shown at most once every 5 seconds so a failing page doesn't bury the user in toasts
function notifyOnce(message: string) {
  const now = Date.now()
  if (now - lastNotice < 5000) return
  lastNotice = now
  showToast(message, 'error', 4500)
}

/**
 * Wraps window.fetch for every /api call: attaches the session token, signs the user out when the
 * server rejects it, and reports network failures, rate limiting and server errors in one place.
 */
export function installHttp(onSessionExpired: () => void) {
  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!url.startsWith('/api/')) return nativeFetch(input, init)

    const headers = new Headers(init?.headers)
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    let response: Response
    try {
      response = await nativeFetch(input, { ...init, headers })
    } catch (error) {
      notifyOnce('Cannot reach the server. Check your connection and try again.')
      throw error
    }

    if (response.status === 401 && token && !url.startsWith('/api/auth/')) {
      clearSession()
      onSessionExpired()
    } else if (response.status === 429) {
      notifyOnce('Too many requests. Please wait a moment and try again.')
    } else if (response.status >= 500) {
      notifyOnce('Something went wrong on our side. Please try again.')
    }
    return response
  }
}

// Reads an API error message out of a failed response.
export async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return typeof data?.error === 'string' ? data.error : fallback
  } catch {
    return fallback
  }
}

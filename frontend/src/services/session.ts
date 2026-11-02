import type { User } from '../types'

// Where the signed-in session lives in the browser. localStorage is readable by any script on the page,
// so the app must never render untrusted HTML (it uses no v-html) and sets a strict CSP in index.html.
const TOKEN_KEY = 'vivid_token'
const USER_KEY = 'vivid_user'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const getToken = () => read(TOKEN_KEY)

export function loadStoredUser(): User | null {
  const raw = read(USER_KEY)
  if (!raw || !getToken()) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(token: string | null, user: User) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* storage unavailable (private mode): session lasts until reload */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

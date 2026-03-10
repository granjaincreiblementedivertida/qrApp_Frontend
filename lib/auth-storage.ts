import type { UserSession } from "@/lib/api-client"

const AUTH_TOKEN_KEY = "qr_auth_token"
const USER_KEY = "qr_user"
const EVENT_TOKENS_KEY = "qr_event_tokens"

function inBrowser() {
  return typeof window !== "undefined"
}

export function saveSession(session: UserSession) {
  if (!inBrowser()) return
  localStorage.setItem(AUTH_TOKEN_KEY, session.token)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function clearSession() {
  if (!inBrowser()) return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EVENT_TOKENS_KEY)
}

export function getAuthToken() {
  if (!inBrowser()) return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getStoredUser() {
  if (!inBrowser()) return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserSession["user"]
  } catch {
    return null
  }
}

export function saveEventToken(eventId: string, token: string) {
  if (!inBrowser()) return
  const raw = localStorage.getItem(EVENT_TOKENS_KEY)
  const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
  map[eventId] = token
  localStorage.setItem(EVENT_TOKENS_KEY, JSON.stringify(map))
}

export function getEventToken(eventId: string) {
  if (!inBrowser()) return null
  const raw = localStorage.getItem(EVENT_TOKENS_KEY)
  if (!raw) return null
  try {
    const map = JSON.parse(raw) as Record<string, string>
    return map[eventId] || null
  } catch {
    return null
  }
}

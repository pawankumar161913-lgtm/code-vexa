import type { HistoryEntry } from './types'

const SESSION_KEY = 'cvx:reopen:v1'

/** The workspace reads this on mount to reopen a session picked in History. */
export function takePendingSession(): HistoryEntry | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    sessionStorage.removeItem(SESSION_KEY)
    return JSON.parse(raw) as HistoryEntry
  } catch {
    return null
  }
}

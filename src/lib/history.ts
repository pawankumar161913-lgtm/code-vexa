import type { HistoryEntry } from './types'

const KEY = 'cvx:history:v1'
const MAX_ENTRIES = 50

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e) => e && typeof e.id === 'string' && e.response?.analysis)
  } catch {
    return []
  }
}

function write(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // Quota exceeded: drop the oldest half and retry once.
    try {
      localStorage.setItem(KEY, JSON.stringify(entries.slice(0, Math.floor(MAX_ENTRIES / 2))))
    } catch {
      /* give up silently — history is a convenience, not core functionality */
    }
  }
}

export const history = {
  list(): HistoryEntry[] {
    return read().sort((a, b) => b.createdAt - a.createdAt)
  },
  add(entry: HistoryEntry): HistoryEntry[] {
    const next = [entry, ...read().filter((e) => e.id !== entry.id)]
    write(next)
    return next.sort((a, b) => b.createdAt - a.createdAt)
  },
  remove(id: string): HistoryEntry[] {
    const next = read().filter((e) => e.id !== id)
    write(next)
    return next.sort((a, b) => b.createdAt - a.createdAt)
  },
  clear(): HistoryEntry[] {
    write([])
    return []
  },
  get(id: string): HistoryEntry | undefined {
    return read().find((e) => e.id === id)
  },
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function historyTitle(language: string, fileName: string, summary: string): string {
  if (fileName) return fileName
  const firstLine = summary.split(/[.!?\n]/)[0]?.trim()
  const base = firstLine && firstLine.length > 4 ? firstLine.slice(0, 70) : 'Analysis'
  return `${language.toUpperCase()} — ${base}`
}

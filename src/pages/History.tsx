import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, FileCode2, History as HistoryIcon, Trash2, X, ExternalLink, HardDrive } from 'lucide-react'
import { useSeo } from '../lib/seo'
import { history } from '../lib/history'
import type { HistoryEntry } from '../lib/types'
import { SeverityBadge } from '../components/SeverityBadge'

export function History() {
  useSeo({
    title: 'Analysis History — Code Vexa',
    description: 'Your saved debugging sessions, stored locally in this browser.',
    path: '/history',
    noindex: true,
  })

  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [confirmClear, setConfirmClear] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setEntries(history.list())
  }, [])

  function open(entry: HistoryEntry) {
    try {
      sessionStorage.setItem('cvx:reopen:v1', JSON.stringify(entry))
    } catch {
      /* storage may be unavailable; fall back to a plain navigation */
    }
    navigate('/workspace')
  }

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-white">
            <HistoryIcon className="h-5 w-5 text-electric-300" aria-hidden="true" />
            Analysis history
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-400">
            <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
            Stored only in this browser. Nothing is synced to a server.
          </p>
        </div>

        {entries.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <>
                <span className="text-xs text-slate-400">Delete all {entries.length} sessions?</span>
                <button
                  type="button"
                  onClick={() => {
                    setEntries(history.clear())
                    setConfirmClear(false)
                  }}
                  className="btn-sm rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400"
                >
                  Delete all
                </button>
                <button type="button" onClick={() => setConfirmClear(false)} className="btn-ghost btn-sm">
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)} className="btn-secondary btn-sm">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear history
              </button>
            )}
          </div>
        )}
      </header>

      {entries.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-500">
            <HistoryIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-white">No saved analyses yet</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            Every analysis you run in the workspace is saved here automatically, so you can reopen it later.
          </p>
          <Link to="/workspace" className="btn-primary btn-sm mt-5">
            Open the workspace
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="panel group px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" onClick={() => open(entry)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={entry.response.analysis.severity} withIcon={false} />
                    <span className="chip font-mono">{entry.request.language}</span>
                    {entry.response.mode === 'demo' && <span className="chip text-violet-300">demo</span>}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-slate-100 group-hover:text-white">
                    {entry.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{entry.response.analysis.summary}</p>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => open(entry)} className="btn-secondary btn-sm">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Reopen
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntries(history.remove(entry.id))}
                    className="btn-ghost btn-sm px-2 text-slate-400 hover:text-rose-300"
                    aria-label={`Delete analysis ${entry.title}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
        Clearing your browser data also removes this history.
      </p>
    </div>
  )
}

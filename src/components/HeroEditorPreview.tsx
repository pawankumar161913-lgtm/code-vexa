import { useEffect, useMemo, useState } from 'react'
import { Check, CircleAlert, Loader2, Play, RotateCcw, Wand2 } from 'lucide-react'
import { highlight, TOKEN_CLASS } from '../lib/highlight'

const CODE = `async function renderList(api) {
  const response = await api.getItems();
  const items = response.items;
  return items.map((item) => item.name).join(", ");
}`

const FIX = `async function renderList(api) {
  const response = await api.getItems();
  const items = Array.isArray(response?.items) ? response.items : [];
  if (!items.length) return "";
  return items.map((item) => item.name).join(", ");
}`

type Phase = 'idle' | 'running' | 'done'

/**
 * Interactive preview for the landing hero. It replays a scripted walkthrough of
 * the workspace — clearly labelled "Preview" so it is never mistaken for a live
 * AI response on the marketing page.
 */
export function HeroEditorPreview() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [showFix, setShowFix] = useState(false)

  const code = showFix ? FIX : CODE
  const tokens = useMemo(() => highlight(code, 'javascript'), [code])
  const lines = code.split('\n')

  useEffect(() => {
    if (phase !== 'running') return
    const t = window.setTimeout(() => setPhase('done'), 1500)
    return () => window.clearTimeout(t)
  }, [phase])

  function run() {
    setShowFix(false)
    setPhase('running')
  }

  function reset() {
    setPhase('idle')
    setShowFix(false)
  }

  return (
    <div className="panel overflow-hidden" role="figure" aria-label="Preview of the Code Vexa workspace">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="font-mono text-[11px] text-slate-500">renderList.js — JavaScript</span>
        <span className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
          Preview
        </span>
      </div>

      <div className="grid md:grid-cols-[1.15fr_1fr]">
        {/* Code side */}
        <div className="border-b border-white/[0.06] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Editor</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={run}
                disabled={phase === 'running'}
                className="btn-primary btn-sm"
                aria-label="Run the preview analysis"
              >
                {phase === 'running' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {phase === 'running' ? 'Analysing' : 'Analyse'}
              </button>
              <button type="button" onClick={reset} className="btn-ghost btn-sm px-2" aria-label="Reset preview">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <pre className="code-surface scroll-slim max-h-[19rem] overflow-auto px-3 py-3 text-[12.5px]">
            <code>
              {tokens.map((t, i) => (
                <span key={i} className={TOKEN_CLASS[t.type]}>
                  {t.text}
                </span>
              ))}
            </code>
          </pre>
        </div>

        {/* Result side */}
        <div className="min-h-[19rem] bg-ink-950/40 p-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Results</span>

          {phase === 'idle' && (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
              <CircleAlert className="h-6 w-6 text-slate-600" aria-hidden="true" />
              <p className="text-sm text-slate-400">No analysis yet</p>
              <p className="max-w-[15rem] text-xs text-slate-500">
                Press Analyse to watch a scripted walkthrough of the findings panel.
              </p>
            </div>
          )}

          {phase === 'running' && (
            <div className="mt-4 space-y-2.5" aria-live="polite">
              {[90, 70, 80, 55].map((w, i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse-soft rounded bg-white/[0.06]"
                  style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                />
              ))}
              <p className="pt-2 text-xs text-slate-500">Reading the stack trace and the code path…</p>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-3 animate-fade-up space-y-3" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                  High severity
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  Runtime error
                </span>
                <span className="text-[10px] text-slate-500">91% confidence</span>
              </div>
              <p className="text-[13px] font-medium leading-snug text-slate-100">
                <code className="rounded bg-white/[0.06] px-1 font-mono text-[12px] text-rose-300">response.items</code> is
                undefined when the API returns an empty payload, so <code className="rounded bg-white/[0.06] px-1 font-mono text-[12px] text-rose-300">.map()</code> throws.
              </p>
              <ul className="space-y-1.5 text-[12px] text-slate-400">
                <li className="flex gap-2">
                  <MapPinDot /> renderList.js:4
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  Guard the value with <code className="font-mono text-slate-300">Array.isArray()</code> and default to{' '}
                  <code className="font-mono text-slate-300">[]</code>.
                </li>
              </ul>
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.07] p-2 font-mono text-[11.5px] leading-5 text-emerald-200/90">
                {lines[2]}
                <br />
                {lines[3]}
              </div>
              <button type="button" onClick={() => setShowFix(true)} className="btn-secondary btn-sm w-full">
                <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                {showFix ? 'Fix shown in editor' : 'Show the fix in the editor'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MapPinDot() {
  return <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-electric-400/60" aria-hidden="true" />
}

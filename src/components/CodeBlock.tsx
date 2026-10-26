import { useMemo } from 'react'
import { highlight, TOKEN_CLASS } from '../lib/highlight'
import { CopyButton } from './CopyButton'

export function CodeBlock({
  code,
  language,
  title,
  maxHeight = '22rem',
  copyLabel = 'Copy',
}: {
  code: string
  language: string
  title?: string
  maxHeight?: string
  copyLabel?: string
}) {
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code])
  const tokens = useMemo(() => highlight(code.replace(/\n$/, ''), language), [code, language])

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/80">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {title || language}
        </span>
        <CopyButton value={code} label={copyLabel} small />
      </div>
      <div className="scroll-slim overflow-auto" style={{ maxHeight }}>
        <pre className="code-surface flex min-w-full">
          <span
            aria-hidden="true"
            className="sticky left-0 select-none border-r border-white/[0.05] bg-ink-950/95 px-2 py-3 text-right text-slate-600"
          >
            {lines.map((_, i) => (
              <span key={i} className="block w-8 tabular-nums">
                {i + 1}
              </span>
            ))}
          </span>
          <code className="block px-3 py-3 whitespace-pre">
            {tokens.map((t, i) => (
              <span key={i} className={TOKEN_CLASS[t.type]}>
                {t.text}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

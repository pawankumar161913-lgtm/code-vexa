import { useMemo } from 'react'
import { diffLines } from 'diff'
import { CopyButton } from './CopyButton'

type Row = { kind: 'context' | 'added' | 'removed'; text: string; oldLine?: number; newLine?: number }

function buildRows(original: string, updated: string): Row[] {
  const parts = diffLines(original, updated)
  const rows: Row[] = []
  let oldLine = 1
  let newLine = 1

  for (const part of parts) {
    const lines = part.value.replace(/\n$/, '').split('\n')
    for (const text of lines) {
      if (part.added) {
        rows.push({ kind: 'added', text, newLine })
        newLine++
      } else if (part.removed) {
        rows.push({ kind: 'removed', text, oldLine })
        oldLine++
      } else {
        rows.push({ kind: 'context', text, oldLine, newLine })
        oldLine++
        newLine++
      }
    }
  }
  return rows
}

const KIND_STYLE: Record<Row['kind'], { row: string; gutter: string; sign: string }> = {
  added: { row: 'bg-emerald-500/10', gutter: 'text-emerald-400/80', sign: '+' },
  removed: { row: 'bg-rose-500/10', gutter: 'text-rose-400/80', sign: '−' },
  context: { row: '', gutter: 'text-slate-600', sign: ' ' },
}

export function DiffView({ original, updated }: { original: string; updated: string }) {
  const rows = useMemo(() => buildRows(original, updated), [original, updated])
  const stats = useMemo(() => {
    const added = rows.filter((r) => r.kind === 'added').length
    const removed = rows.filter((r) => r.kind === 'removed').length
    return { added, removed }
  }, [rows])

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Original vs suggested fix</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-emerald-400">+{stats.added}</span>
          <span className="font-mono text-[11px] text-rose-400">−{stats.removed}</span>
          <CopyButton value={updated} label="Copy fix" small />
        </div>
      </div>
      <div className="scroll-slim max-h-[26rem] overflow-auto">
        <table className="w-full border-collapse font-mono text-[12.5px] leading-6">
          <tbody>
            {rows.map((row, i) => {
              const style = KIND_STYLE[row.kind]
              return (
                <tr key={i} className={style.row}>
                  <td className={`w-10 select-none border-r border-white/[0.04] px-2 text-right align-top ${style.gutter}`}>
                    {row.oldLine ?? ''}
                  </td>
                  <td className={`w-10 select-none border-r border-white/[0.04] px-2 text-right align-top ${style.gutter}`}>
                    {row.newLine ?? ''}
                  </td>
                  <td className={`w-5 select-none pl-2 align-top ${style.gutter}`}>{style.sign}</td>
                  <td className="whitespace-pre-wrap break-words pr-3 align-top text-slate-200">{row.text || '\u00a0'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { AlertOctagon, AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import type { Severity } from '../lib/types'

const STYLES: Record<Severity, { cls: string; Icon: typeof Info; label: string }> = {
  critical: { cls: 'border-rose-500/30 bg-rose-500/10 text-rose-300', Icon: AlertOctagon, label: 'Critical' },
  high: { cls: 'border-orange-500/30 bg-orange-500/10 text-orange-300', Icon: ShieldAlert, label: 'High' },
  medium: { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300', Icon: AlertTriangle, label: 'Medium' },
  low: { cls: 'border-sky-500/30 bg-sky-500/10 text-sky-300', Icon: Info, label: 'Low' },
}

export function SeverityBadge({ severity, withIcon = true }: { severity: Severity; withIcon?: boolean }) {
  const { cls, Icon, label } = STYLES[severity] ?? STYLES.low
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {withIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {label} severity
    </span>
  )
}

export const CATEGORY_LABEL: Record<string, string> = {
  syntax_error: 'Confirmed syntax error',
  type_error: 'Type error',
  logic_error: 'Suspected logic error',
  runtime_error: 'Runtime error',
  security: 'Security issue',
  performance: 'Performance issue',
  improvement: 'Potential improvement',
}

export const RISK_LABEL: Record<string, string> = {
  null_reference: 'Null reference',
  incorrect_condition: 'Incorrect condition',
  runtime: 'Runtime risk',
  security: 'Security risk',
  performance: 'Performance',
  style: 'Style',
}

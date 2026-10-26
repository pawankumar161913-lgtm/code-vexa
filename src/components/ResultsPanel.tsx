import { useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileCode2,
  FlaskConical,
  Gauge,
  Lightbulb,
  MapPin,
  MessageSquareWarning,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TestTube2,
  Wand2,
} from 'lucide-react'
import type { AnalyzeRequest, AnalyzeResponse } from '../lib/types'
import { CATEGORY_LABEL, RISK_LABEL, SeverityBadge } from './SeverityBadge'
import { CodeBlock } from './CodeBlock'
import { DiffView } from './DiffView'
import { CopyButton } from './CopyButton'

export function ResultsPanel({
  response,
  request,
  onApplyFix,
  onRerun,
  onClear,
  isAnalyzing,
}: {
  response: AnalyzeResponse
  request: AnalyzeRequest
  onApplyFix: (code: string) => void
  onRerun: () => void
  onClear: () => void
  isAnalyzing: boolean
}) {
  const { analysis } = response
  const [confirmApply, setConfirmApply] = useState(false)
  const canApply = Boolean(analysis.suggestedFix.trim()) && analysis.status === 'analyzed'
  const alreadyApplied = canApply && request.code.trim() === analysis.suggestedFix.trim()

  return (
    <section className="flex h-full min-h-0 flex-col gap-4" aria-label="Analysis results" aria-live="polite">
      {/* Header */}
      <div className="panel px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={analysis.severity} />
              <span className="chip">{CATEGORY_LABEL[analysis.category] ?? analysis.category}</span>
              {response.mode === 'demo' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
                  <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Demo analysis — not produced by AI
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Live AI analysis
                  {response.model ? <span className="font-normal text-emerald-400/80">· {response.model}</span> : null}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-semibold leading-snug text-white">
              {analysis.status === 'needs_more_context' ? 'More context needed' : analysis.summary}
            </h2>
            {analysis.severityReason && <p className="mt-1.5 text-sm text-slate-400">{analysis.severityReason}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onRerun} className="btn-secondary btn-sm" disabled={isAnalyzing}>
              <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Re-run
            </button>
            <button type="button" onClick={onClear} className="btn-ghost btn-sm">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat
            icon={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Location"
            value={
              analysis.location.file || analysis.location.line
                ? `${analysis.location.file ?? 'this file'}${analysis.location.line ? `:${analysis.location.line}` : ''}`
                : 'Not determinable'
            }
            hint={analysis.location.reliable ? 'Derived from your input' : 'Unverified estimate'}
            muted={!analysis.location.reliable}
          />
          <Stat
            icon={<Gauge className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Confidence"
            value={`${Math.round(analysis.confidence * 100)}%`}
            hint={analysis.confidenceReason || 'No reason supplied'}
            progress={analysis.confidence}
          />
          <Stat
            icon={<Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Analysis"
            value={`${(response.meta.durationMs / 1000).toFixed(1)}s`}
            hint={response.provider ? `Provider: ${response.provider}` : 'Built-in demo case'}
          />
        </div>
      </div>

      {analysis.status === 'needs_more_context' && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
            <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
            The information provided was not enough for a confident diagnosis
          </div>
          {analysis.missingContext.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
              {analysis.missingContext.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-amber-100/80">
              Add the full error message, a stack trace, or the surrounding function and run the analysis again.
            </p>
          )}
        </div>
      )}

      <div className="scroll-slim flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 pr-1">
        {analysis.status === 'analyzed' && (
          <>
            <Section icon={<AlertCircle className="h-4 w-4" aria-hidden="true" />} title="Likely cause">
              <p className="text-sm leading-relaxed text-slate-300">{analysis.cause}</p>
            </Section>

            <Section
              icon={<Code2 className="h-4 w-4" aria-hidden="true" />}
              title="Original code & suggested fix"
              action={
                canApply ? (
                  alreadyApplied ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Fix applied to editor
                    </span>
                  ) : confirmApply ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFix(analysis.suggestedFix)
                          setConfirmApply(false)
                        }}
                        className="btn-primary btn-sm"
                      >
                        Replace editor code
                      </button>
                      <button type="button" onClick={() => setConfirmApply(false)} className="btn-ghost btn-sm">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmApply(true)} className="btn-secondary btn-sm">
                      <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Apply fix to editor
                    </button>
                  )
                ) : null
              }
            >
              <div className="space-y-3">
                {analysis.originalCode ? (
                  <CodeBlock
                    code={analysis.originalCode}
                    language={request.language}
                    title={`Original${analysis.location.line ? ` · line ${analysis.location.line}` : ''}`}
                  />
                ) : (
                  <p className="text-sm text-slate-500">No specific snippet was isolated.</p>
                )}
                <DiffView original={analysis.originalCode} updated={analysis.suggestedFix} />
                {confirmApply && (
                  <p className="text-xs text-slate-400">
                    Applying replaces the code in the editor with the suggested fix. Your analysis stays available, and
                    nothing is overwritten until you confirm.
                  </p>
                )}
              </div>
            </Section>

            <Section icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />} title="How the fix works">
              <ol className="space-y-2.5">
                {analysis.explanationSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-electric-500/15 text-[11px] font-semibold text-electric-300">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {analysis.relatedRisks.length > 0 && (
              <Section icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} title="Other risks spotted">
                <ul className="space-y-2">
                  {analysis.relatedRisks.map((risk, i) => (
                    <li key={i} className="flex flex-wrap items-start gap-2 text-sm text-slate-300">
                      <span className="chip shrink-0">{RISK_LABEL[risk.kind] ?? risk.kind}</span>
                      <span className="min-w-0 flex-1">{risk.description}</span>
                      {risk.line ? <span className="font-mono text-[11px] text-slate-500">line {risk.line}</span> : null}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}

        {analysis.beginnerExplanation && (
          <Section icon={<BookOpen className="h-4 w-4" aria-hidden="true" />} title="Explain it like I'm new">
            <p className="text-sm leading-relaxed text-slate-300">{analysis.beginnerExplanation}</p>
          </Section>
        )}

        {analysis.minimalRepro && (
          <Section
            icon={<FileCode2 className="h-4 w-4" aria-hidden="true" />}
            title="Minimal reproducible example"
            action={<CopyButton value={analysis.minimalRepro} label="Copy repro" small />}
          >
            <CodeBlock code={analysis.minimalRepro} language={request.language} title="Reproduction" maxHeight="16rem" />
          </Section>
        )}

        {analysis.unitTests && (
          <Section
            icon={<TestTube2 className="h-4 w-4" aria-hidden="true" />}
            title="Test suggestions"
            action={<CopyButton value={analysis.unitTests} label="Copy tests" small />}
          >
            <CodeBlock code={analysis.unitTests} language={request.language} title="Suggested tests" maxHeight="18rem" />
          </Section>
        )}

        {analysis.preventionTips.length > 0 && (
          <Section icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} title="Prevention tips">
            <ul className="space-y-2">
              {analysis.preventionTips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <details className="panel-flat group px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
            <span className="inline-flex items-center gap-2">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
              Input used for this analysis
            </span>
            <span className="font-mono text-[11px] normal-case tracking-normal text-slate-500">
              {request.code.split('\n').length} lines · {request.language}
            </span>
          </summary>
          <div className="mt-3 space-y-2 text-xs text-slate-400">
            {request.fileName && (
              <p>
                <span className="text-slate-500">File:</span> <span className="font-mono">{request.fileName}</span>
              </p>
            )}
            {request.errorMessage && (
              <div>
                <p className="text-slate-500">Error message:</p>
                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-ink-950/70 p-2 font-mono text-[11px] text-rose-300/90">
                  {request.errorMessage}
                </pre>
              </div>
            )}
            {request.description && (
              <p>
                <span className="text-slate-500">Expected behaviour:</span> {request.description}
              </p>
            )}
          </div>
        </details>
      </div>
    </section>
  )
}

function Stat({
  icon,
  label,
  value,
  hint,
  muted,
  progress,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  muted?: boolean
  progress?: number
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <p className={`mt-1 truncate font-mono text-[13px] ${muted ? 'text-slate-400' : 'text-slate-100'}`} title={value}>
        {value}
      </p>
      {typeof progress === 'number' && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-400"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {hint && <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-slate-500">{hint}</p>}
    </div>
  )
}

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="panel px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="text-electric-300">{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  )
}

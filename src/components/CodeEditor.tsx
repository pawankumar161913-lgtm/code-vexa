import { useCallback, useEffect, useMemo, useRef } from 'react'
import { highlight, TOKEN_CLASS } from '../lib/highlight'
import type { LanguageId } from '../lib/types'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: LanguageId
  id?: string
  ariaLabel?: string
  placeholder?: string
  maxLength?: number
  readOnly?: boolean
  highlightLine?: number | null
  className?: string
}

/**
 * A lightweight code editor: a transparent <textarea> layered over a
 * token-rendered <pre>. Both scroll in lockstep and use identical metrics, so
 * the caret lines up exactly. Rendering tokens as React text (never innerHTML)
 * keeps pasted markup inert.
 */
export function CodeEditor({
  value,
  onChange,
  language,
  id = 'code-editor',
  ariaLabel = 'Code editor',
  placeholder = 'Paste your code here…',
  maxLength = 40000,
  readOnly = false,
  highlightLine = null,
  className = '',
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lines = useMemo(() => value.split('\n'), [value])
  const tokens = useMemo(() => highlight(value, language), [value, language])

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop
      preRef.current.scrollLeft = ta.scrollLeft
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop
  }, [])

  // Reset scroll when the language or the whole document is replaced.
  useEffect(() => {
    syncScroll()
  }, [language, syncScroll])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = value.slice(0, start) + '  ' + value.slice(end)
      if (next.length > maxLength) return
      onChange(next)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
      return
    }
    // Ctrl/Cmd + Enter is handled by the parent form; nothing else to intercept.
  }

  return (
    <div className={`relative flex min-h-0 overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/90 ${className}`}>
      {/* Line numbers */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="scroll-slim w-12 shrink-0 select-none overflow-hidden border-r border-white/[0.05] bg-ink-950/95 py-3 text-right font-mono text-[13px] leading-6 text-slate-600"
      >
        {lines.map((_, i) => (
          <div
            key={i}
            className={`pr-2.5 tabular-nums ${highlightLine === i + 1 ? 'bg-amber-400/10 text-amber-300' : ''}`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        {/* Highlight layer */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="code-surface pointer-events-none absolute inset-0 overflow-auto px-3 py-3 whitespace-pre"
        >
          {tokens.map((t, i) => (
            <span key={i} className={TOKEN_CLASS[t.type]}>
              {t.text}
            </span>
          ))}
          {'\n'}
        </pre>

        {/* Input layer */}
        <textarea
          ref={textareaRef}
          id={id}
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          readOnly={readOnly}
          placeholder={placeholder}
          maxLength={maxLength}
          className="code-surface scroll-slim relative z-10 block h-full min-h-[18rem] w-full resize-none overflow-auto bg-transparent px-3 py-3 whitespace-pre text-transparent caret-electric-300 placeholder:text-slate-600 focus:outline-none"
          style={{ WebkitTextFillColor: 'transparent' }}
        />
      </div>
    </div>
  )
}

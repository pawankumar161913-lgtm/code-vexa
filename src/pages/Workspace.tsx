import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  CircleSlash,
  FlaskConical,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useSeo } from '../lib/seo'
import { analyzeCode, ApiError, fetchCapabilities, type Capabilities } from '../lib/api'
import { history, historyTitle, newId } from '../lib/history'
import { takePendingSession } from '../lib/pendingSession'
import { LANGUAGES, type AnalyzeRequest, type AnalyzeResponse, type LanguageId } from '../lib/types'
import { EXAMPLES, type CodeExample } from '../data/examples'
import { CodeEditor } from '../components/CodeEditor'
import { ResultsPanel } from '../components/ResultsPanel'

const MAX_CODE = 40000
const MAX_ERROR = 8000
const MAX_DESC = 2000
const ALLOWED_EXT = ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'py', 'java', 'c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'html', 'htm', 'css', 'sql', 'php', 'txt']

export function Workspace() {
  useSeo({
    title: 'Debugging Workspace — AI Bug Detective',
    description:
      'Paste code, add an error message and get a root-cause analysis with a suggested fix, diff and explanation.',
    path: '/workspace',
  })

  const [searchParams, setSearchParams] = useSearchParams()

  const [language, setLanguage] = useState<LanguageId>('javascript')
  const [code, setCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [description, setDescription] = useState('')
  const [fileName, setFileName] = useState('')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [response, setResponse] = useState<AnalyzeResponse | null>(null)
  const [lastRequest, setLastRequest] = useState<AnalyzeRequest | null>(null)
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const [caps, setCaps] = useState<Capabilities | null>(null)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const showNotice = useCallback((message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 3500)
  }, [])

  useEffect(() => {
    fetchCapabilities().then(setCaps)
    return () => abortRef.current?.abort()
  }, [])

  // Reopen a session picked from the History page.
  useEffect(() => {
    const pending = takePendingSession()
    if (!pending) return
    setLanguage(pending.request.language)
    setCode(pending.request.code)
    setErrorMessage(pending.request.errorMessage ?? '')
    setDescription(pending.request.description ?? '')
    setFileName(pending.request.fileName ?? '')
    setResponse(pending.response)
    setLastRequest(pending.request)
    setApiError(null)
    showNotice('Saved session reopened.')
  }, [showNotice])

  // Deep link: /workspace?examples=1 opens the sample-bug picker.
  useEffect(() => {
    if (searchParams.get('examples') === '1') {
      setExamplesOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('examples')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!code.trim()) errors.code = 'Paste or upload some code to analyse.'
    else if (code.length > MAX_CODE) errors.code = `Code is limited to ${MAX_CODE.toLocaleString()} characters.`
    if (errorMessage.length > MAX_ERROR) errors.errorMessage = `Error message is limited to ${MAX_ERROR.toLocaleString()} characters.`
    if (description.length > MAX_DESC) errors.description = `Description is limited to ${MAX_DESC.toLocaleString()} characters.`
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const runAnalysis = useCallback(
    async (request: AnalyzeRequest) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsAnalyzing(true)
      setApiError(null)
      try {
        const res = await analyzeCode(request, controller.signal)
        setResponse(res)
        setLastRequest(request)
        history.add({
          id: newId(),
          createdAt: Date.now(),
          title: historyTitle(request.language, request.fileName || '', res.analysis.summary),
          request,
          response: res,
        })
        if (window.innerWidth < 1024) {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setApiError(err instanceof ApiError ? err : new ApiError('Analysis failed unexpectedly.'))
        setResponse(null)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [],
  )

  // Ctrl/Cmd + Enter submits from anywhere in the workspace.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const form = document.getElementById('workspace-form') as HTMLFormElement | null
        form?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isAnalyzing) return
    if (!validate()) return
    void runAnalysis({
      language,
      code,
      errorMessage: errorMessage.trim() || undefined,
      description: description.trim() || undefined,
      fileName: fileName.trim() || undefined,
    })
  }

  function handleClear() {
    abortRef.current?.abort()
    setCode('')
    setErrorMessage('')
    setDescription('')
    setFileName('')
    setResponse(null)
    setLastRequest(null)
    setApiError(null)
    setFieldErrors({})
    setUploadError(null)
    showNotice('Editor and results cleared.')
  }

  function loadExample(example: CodeExample) {
    setLanguage(example.language)
    setCode(example.code)
    setErrorMessage(example.errorMessage)
    setDescription(example.expected)
    setFileName(example.fileName)
    setResponse(null)
    setLastRequest(null)
    setApiError(null)
    setFieldErrors({})
    setExamplesOpen(false)
    showNotice(`Loaded “${example.title}”. Press Analyse Code to run it.`)
  }

  function handleUpload(file: File | undefined) {
    setUploadError(null)
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXT.includes(ext)) {
      setUploadError(`Unsupported file type “.${ext}”. Allowed: ${ALLOWED_EXT.join(', ')}.`)
      return
    }
    if (file.size > 1_000_000) {
      setUploadError('File is larger than 1 MB. Please paste the relevant part of the code instead.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      if (text.length > MAX_CODE) {
        setUploadError(
          `File has ${text.length.toLocaleString()} characters; the limit is ${MAX_CODE.toLocaleString()}. Paste the failing function only.`,
        )
        return
      }
      setCode(text)
      setFileName(file.name)
      const detected = detectLanguage(ext)
      if (detected) setLanguage(detected)
      showNotice(`Loaded ${file.name}${detected ? ` as ${labelFor(detected)}` : ''}.`)
    }
    reader.onerror = () => setUploadError('That file could not be read. Try pasting the code instead.')
    reader.readAsText(file)
  }

  function applyFix(fixed: string) {
    setCode(fixed)
    showNotice('Suggested fix applied to the editor. Re-run the analysis to verify.')
  }

  const canAnalyze = code.trim().length > 0 && !isAnalyzing
  const demoMode = caps ? !caps.aiConfigured : false

  return (
    <div className="container-page pb-16 pt-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-electric-500/20 to-violet-500/20 text-electric-300 ring-1 ring-white/10">
              <Bug className="h-4 w-4" aria-hidden="true" />
            </span>
            Debugging Workspace
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Paste code, add the error, and get a root-cause analysis with a suggested fix.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {caps && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                demoMode
                  ? 'border-violet-400/30 bg-violet-500/10 text-violet-300'
                  : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {demoMode ? (
                <>
                  <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Demo mode — no AI key on the server
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Live AI mode{caps.provider ? ` · ${caps.provider}` : ''}
                </>
              )}
            </span>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExamplesOpen((v) => !v)}
              className="btn-secondary btn-sm"
              aria-expanded={examplesOpen}
              aria-haspopup="listbox"
            >
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              Load Example
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {examplesOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExamplesOpen(false)} aria-hidden="true" />
                <div
                  role="listbox"
                  aria-label="Sample bugs"
                  className="scroll-slim absolute right-0 z-40 mt-2 max-h-[24rem] w-[19rem] overflow-y-auto rounded-xl border border-white/10 bg-ink-850 p-1.5 shadow-2xl"
                >
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Sample bugs
                  </p>
                  {EXAMPLES.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => loadExample(example)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-lg px-2 py-2 text-left hover:bg-white/[0.06]"
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-slate-100">{example.title}</span>
                        <span className="font-mono text-[10px] uppercase text-slate-500">{example.language}</span>
                      </span>
                      <span className="text-[11px] text-slate-500">{example.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {demoMode && (
        <div className="mb-5 rounded-xl border border-violet-400/25 bg-violet-500/[0.07] px-4 py-3 text-sm text-violet-200">
          <strong className="font-semibold">Demo mode.</strong> No <code className="font-mono text-[12px]">AI_API_KEY</code> is
          configured on the server, so only the built-in sample bugs can be analysed. Those results are labelled
          “Demo analysis — not produced by AI”. Add a key to the server environment to analyse arbitrary code.
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* ---------------- Input column ---------------- */}
        <form
          id="workspace-form"
          onSubmit={handleSubmit}
          className="panel self-start p-4 sm:p-5 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto scroll-slim"
          noValidate
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[10rem] flex-1">
              <label htmlFor="language" className="label">
                Language
              </label>
              <div className="relative">
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageId)}
                  className="input appearance-none pr-9"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id} className="bg-ink-850">
                      {l.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="min-w-[10rem] flex-1">
              <label htmlFor="fileName" className="label">
                File name <span className="font-normal normal-case text-slate-500">optional</span>
              </label>
              <input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value.slice(0, 120))}
                placeholder="renderList.js"
                className="input font-mono text-[13px]"
                autoComplete="off"
              />
            </div>

            <div>
              <span className="label">Upload</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXT.map((e) => `.${e}`).join(',')}
                className="sr-only"
                onChange={(e) => {
                  handleUpload(e.target.files?.[0])
                  e.target.value = ''
                }}
                aria-label="Upload a code file"
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Choose file
              </button>
            </div>
          </div>

          {uploadError && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-rose-300" role="alert">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {uploadError}
            </p>
          )}

          <div className="mt-4">
            <label htmlFor="code-editor" className="label">
              <span>Source code</span>
              <span className="font-normal normal-case text-slate-500">
                {code.length.toLocaleString()} / {MAX_CODE.toLocaleString()}
              </span>
            </label>
            <CodeEditor
              value={code}
              onChange={(v) => {
                setCode(v)
                if (fieldErrors.code) setFieldErrors((f) => ({ ...f, code: '' }))
              }}
              language={language}
              ariaLabel="Source code to analyse"
              maxLength={MAX_CODE}
              highlightLine={response?.analysis.location.line ?? null}
              placeholder={`Paste your ${labelFor(language)} code here, or upload a file above.`}
              className="h-[20rem]"
            />
            {fieldErrors.code && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-300" role="alert">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {fieldErrors.code}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="errorMessage" className="label">
              <span>Error message or stack trace</span>
              <span className="font-normal normal-case text-slate-500">recommended</span>
            </label>
            <textarea
              id="errorMessage"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value.slice(0, MAX_ERROR))}
              rows={3}
              placeholder={`TypeError: Cannot read properties of undefined (reading 'map')\n    at renderList (renderList.js:4:16)`}
              className="input scroll-slim resize-y font-mono text-[12.5px] leading-5"
            />
            {fieldErrors.errorMessage && <p className="mt-1 text-xs text-rose-300">{fieldErrors.errorMessage}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="label">
              <span>Expected behaviour</span>
              <span className="font-normal normal-case text-slate-500">optional</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              rows={2}
              placeholder="What should this code do, and what does it do instead?"
              className="input scroll-slim resize-y"
            />
            {fieldErrors.description && <p className="mt-1 text-xs text-rose-300">{fieldErrors.description}</p>}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="submit" className="btn-primary min-w-[9.5rem]" disabled={!canAnalyze}>
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {isAnalyzing ? 'Analysing…' : 'Analyze Code'}
            </button>
            <button type="button" onClick={handleClear} className="btn-secondary">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Clear
            </button>
            {code.trim().length > 0 && (
              <span className="ml-auto text-[11px] text-slate-500">
                Ctrl / ⌘ + Enter to analyse
              </span>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Your code is sent to the server, forwarded to the AI provider for this one analysis, and not stored. It is
            never executed. History is kept only in this browser.
          </p>

        </form>

        {/* ---------------- Results column ---------------- */}
        <div ref={resultsRef} className="min-h-[30rem]">
          {apiError ? (
            <ErrorState error={apiError} onDismiss={() => setApiError(null)} demoMode={demoMode} />
          ) : isAnalyzing ? (
            <LoadingState />
          ) : response && lastRequest ? (
            <ResultsPanel
              response={response}
              request={lastRequest}
              onApplyFix={applyFix}
              onRerun={() => void runAnalysis(lastRequest)}
              onClear={() => {
                setResponse(null)
                setLastRequest(null)
              }}
              isAnalyzing={isAnalyzing}
            />
          ) : (
            <EmptyState onLoadExample={() => setExamplesOpen(true)} onFocusEditor={() => document.getElementById('code-editor')?.focus()} />
          )}
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-xl border border-white/10 bg-ink-850 px-4 py-2.5 text-sm text-slate-200 shadow-2xl"
        >
          {notice}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onLoadExample, onFocusEditor }: { onLoadExample: () => void; onFocusEditor: () => void }) {
  return (
    <div className="panel flex h-full min-h-[30rem] flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-500">
        <CircleSlash className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-white">No analysis yet</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">
        Paste code on the left and press <span className="text-slate-200">Analyze Code</span>, or start from one of the
        built-in sample bugs.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onLoadExample} className="btn-secondary btn-sm">
          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
          Load a sample bug
        </button>
        <button type="button" onClick={onFocusEditor} className="btn-ghost btn-sm">
          Go to the editor
        </button>
      </div>
      <ul className="mt-8 grid w-full max-w-sm gap-2 text-left text-xs text-slate-500">
        {[
          'Confirmed syntax errors are separated from suspected logic issues',
          'Line numbers only appear when they can be determined',
          'Nothing is applied to your editor without confirmation',
        ].map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-electric-400/70" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="panel flex h-full min-h-[30rem] flex-col justify-center px-6 py-10" aria-busy="true" aria-live="polite">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-200">
          <Loader2 className="h-4 w-4 animate-spin text-electric-300" aria-hidden="true" />
          Reading the code and the error…
        </div>
        <div className="mt-6 space-y-3">
          {[92, 74, 84, 60, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 animate-pulse-soft rounded bg-white/[0.06]"
              style={{ width: `${w}%`, animationDelay: `${i * 130}ms` }}
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Larger files and full stack traces take a little longer. You can cancel by pressing Clear.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ error, onDismiss, demoMode }: { error: ApiError; onDismiss: () => void; demoMode: boolean }) {
  const isLimit = error.code === 'rate_limited'
  const isDemoMiss = error.code === 'demo_case_not_found'

  return (
    <div className="panel p-5" role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {isLimit ? 'Usage limit reached' : isDemoMiss ? 'Not available in demo mode' : 'Analysis failed'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{error.message}</p>
            <p className="mt-2 font-mono text-[11px] text-slate-600">code: {error.code}</p>
          </div>
        </div>
        <button type="button" onClick={onDismiss} className="btn-ghost btn-sm px-2" aria-label="Dismiss error">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {error.fields && error.fields.length > 0 && (
        <ul className="mt-4 space-y-1.5 rounded-lg border border-white/[0.07] bg-ink-950/60 p-3 text-xs text-rose-200">
          {error.fields.map((f, i) => (
            <li key={i}>
              <span className="font-mono text-rose-300">{f.field}</span> — {f.message}
            </li>
          ))}
        </ul>
      )}

      {(isDemoMiss || demoMode) && !isDemoMiss && (
        <p className="mt-4 text-xs text-slate-500">
          Demo mode is active because the server has no <code className="font-mono">AI_API_KEY</code>. Try one of the
          sample bugs, or configure a key to analyse your own code.
        </p>
      )}

      {isLimit && error.retryAfter ? (
        <p className="mt-4 text-xs text-slate-500">Try again in about {error.retryAfter} seconds.</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onDismiss} className="btn-secondary btn-sm">
          Back to the editor
        </button>
        <a href="/privacy" className="btn-ghost btn-sm">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          How input is handled
        </a>
      </div>
    </div>
  )
}

function detectLanguage(ext: string): LanguageId | null {
  const map: Record<string, LanguageId> = {
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    html: 'html',
    htm: 'html',
    css: 'css',
    sql: 'sql',
    php: 'php',
  }
  return map[ext] ?? null
}

function labelFor(id: LanguageId): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? id
}

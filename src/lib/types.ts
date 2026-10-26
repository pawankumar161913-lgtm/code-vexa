export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'c', label: 'C', ext: 'c' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'php', label: 'PHP', ext: 'php' },
] as const

export type LanguageId = (typeof LANGUAGES)[number]['id']

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type AnalysisCategory =
  | 'syntax_error'
  | 'logic_error'
  | 'runtime_error'
  | 'type_error'
  | 'security'
  | 'performance'
  | 'improvement'

export interface RelatedRisk {
  kind: 'null_reference' | 'incorrect_condition' | 'runtime' | 'security' | 'performance' | 'style'
  description: string
  line: number | null
}

export interface Analysis {
  status: 'analyzed' | 'needs_more_context'
  summary: string
  severity: Severity
  severityReason: string
  category: AnalysisCategory
  cause: string
  location: { file: string | null; line: number | null; reliable: boolean }
  originalCode: string
  suggestedFix: string
  explanationSteps: string[]
  preventionTips: string[]
  confidence: number
  confidenceReason: string
  beginnerExplanation: string
  minimalRepro: string
  unitTests: string
  relatedRisks: RelatedRisk[]
  missingContext: string[]
}

export interface AnalyzeRequest {
  language: LanguageId
  code: string
  errorMessage?: string
  description?: string
  fileName?: string
}

export interface AnalyzeMeta {
  language: string
  durationMs: number
  rateRemaining?: number
}

export interface AnalyzeResponse {
  ok: true
  mode: 'live' | 'demo'
  provider: string | null
  model: string | null
  demoCase?: string
  analysis: Analysis
  meta: AnalyzeMeta
}

export interface ApiErrorBody {
  ok: false
  error: {
    code: string
    message: string
    fields?: { field: string; message: string }[]
    retryAfter?: number
    demoMode?: boolean
  }
}

export interface HistoryEntry {
  id: string
  createdAt: number
  title: string
  request: AnalyzeRequest
  response: AnalyzeResponse
}

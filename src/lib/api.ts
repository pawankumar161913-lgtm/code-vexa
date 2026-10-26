import type { AnalyzeRequest, AnalyzeResponse, ApiErrorBody } from './types'

export class ApiError extends Error {
  code: string
  status: number
  fields?: { field: string; message: string }[]
  retryAfter?: number
  demoMode?: boolean

  constructor(message: string, opts: { code?: string; status?: number; fields?: ApiErrorBody['error']['fields']; retryAfter?: number; demoMode?: boolean } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = opts.code ?? 'unknown'
    this.status = opts.status ?? 0
    this.fields = opts.fields
    this.retryAfter = opts.retryAfter
    this.demoMode = opts.demoMode
  }
}

const ENDPOINT = '/api/analyze'

/**
 * Calls the analysis API.
 * The AI key lives only on the server; the browser never sees it.
 */
export async function analyzeCode(request: AnalyzeRequest, signal?: AbortSignal): Promise<AnalyzeResponse> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError(
      'Could not reach the analysis service. Check your connection, or run the backend with `netlify dev`.',
      { code: 'network_error' },
    )
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    // Most likely the SPA fallback: the function is not deployed or not proxied.
    throw new ApiError(
      'The analysis API is not available at /api/analyze. In development run `npm run netlify:dev`; in production make sure the Netlify function is deployed.',
      { code: 'api_unavailable', status: res.status },
    )
  }

  const body = (await res.json()) as AnalyzeResponse | ApiErrorBody

  if (!res.ok || (body as ApiErrorBody).ok === false) {
    const err = (body as ApiErrorBody).error || { code: 'unknown', message: 'Analysis failed.' }
    throw new ApiError(err.message, {
      code: err.code,
      status: res.status,
      fields: err.fields,
      retryAfter: err.retryAfter,
      demoMode: err.demoMode,
    })
  }

  return body as AnalyzeResponse
}

export interface Capabilities {
  aiConfigured: boolean
  provider: string | null
  languages: string[]
  limits: { maxCodeChars: number; maxErrorChars: number; maxDescriptionChars: number }
}

/** Reads server capabilities so the UI can honestly label demo mode. */
export async function fetchCapabilities(): Promise<Capabilities | null> {
  try {
    const res = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return null
    const body = await res.json()
    return {
      aiConfigured: Boolean(body.aiConfigured),
      provider: body.provider ?? null,
      languages: body.languages ?? [],
      limits: body.limits ?? { maxCodeChars: 40000, maxErrorChars: 8000, maxDescriptionChars: 2000 },
    }
  } catch {
    return null
  }
}

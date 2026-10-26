/**
 * POST /api/analyze — the only server endpoint.
 *
 * Security posture:
 *  - submitted code is never executed, evaluated or written to disk;
 *  - it is only forwarded to the configured AI provider (or answered in demo
 *    mode) and then discarded — nothing is stored server-side;
 *  - size limits, per-IP rate limiting, origin checks and strict validation run
 *    before anything else happens;
 *  - source code is not logged; only non-sensitive metadata is.
 */
import { LANGUAGES, LIMITS, normalizeAnalysis } from './_shared/schema.js'
import { runAnalysis, isAiConfigured, providerName, ProviderError } from './_shared/providers.js'
import { SYSTEM_PROMPT, buildUserPrompt } from './_shared/prompt.js'
import { findDemoAnalysis } from './_shared/demo.js'

// ---------------------------------------------------------------------------
// Rate limiting: sliding window per IP, held in the function instance memory.
// Good enough to stop casual abuse; pair with platform-level limits for
// production traffic (see README).
// ---------------------------------------------------------------------------
const buckets = new Map()

function rateLimit(ip) {
  const max = Number(process.env.RATE_LIMIT_MAX || 12)
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000)
  const now = Date.now()
  const hits = (buckets.get(ip) || []).filter((t) => now - t < windowMs)
  if (hits.length >= max) {
    buckets.set(ip, hits)
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000)
    return { limited: true, retryAfter, remaining: 0 }
  }
  hits.push(now)
  buckets.set(ip, hits)
  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > 5000) {
    for (const [key, value] of buckets) {
      if (!value.some((t) => now - t < windowMs)) buckets.delete(key)
    }
  }
  return { limited: false, retryAfter: 0, remaining: max - hits.length }
}

function json(statusCode, payload, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
    body: JSON.stringify(payload),
  }
}

function fail(statusCode, code, message, extra = {}, headers = {}) {
  return json(statusCode, { ok: false, error: { code, message, ...extra } }, headers)
}

function clientIp(event) {
  const h = event.headers || {}
  const forwarded = h['x-nf-client-connection-ip'] || h['x-forwarded-for'] || h['client-ip'] || ''
  return String(forwarded).split(',')[0].trim() || 'unknown'
}

function originAllowed(event) {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (allowed.length === 0) return true // same-origin deployment
  const origin = event.headers?.origin || event.headers?.referer || ''
  return allowed.some((a) => origin === a || origin.startsWith(a + '/'))
}

/** Strips control characters that serve no purpose in the model prompt. */
function sanitizeText(value, max) {
  if (typeof value !== 'string') return ''
  return value.replace(/\u0000/g, '').slice(0, max)
}

function validate(body) {
  const errors = []
  const language = String(body.language || '').toLowerCase()
  if (!LANGUAGES.includes(language)) {
    errors.push({ field: 'language', message: `Unsupported language. Use one of: ${LANGUAGES.join(', ')}.` })
  }

  const code = sanitizeText(body.code, LIMITS.maxCodeChars + 1)
  if (!code.trim()) errors.push({ field: 'code', message: 'Please provide some code to analyse.' })
  if (code.length > LIMITS.maxCodeChars) {
    errors.push({ field: 'code', message: `Code is too long (max ${LIMITS.maxCodeChars.toLocaleString()} characters).` })
  }

  const errorMessage = sanitizeText(body.errorMessage, LIMITS.maxErrorChars + 1)
  if (errorMessage.length > LIMITS.maxErrorChars) {
    errors.push({
      field: 'errorMessage',
      message: `Error message is too long (max ${LIMITS.maxErrorChars.toLocaleString()} characters).`,
    })
  }

  const description = sanitizeText(body.description, LIMITS.maxDescriptionChars + 1)
  if (description.length > LIMITS.maxDescriptionChars) {
    errors.push({
      field: 'description',
      message: `Description is too long (max ${LIMITS.maxDescriptionChars.toLocaleString()} characters).`,
    })
  }

  const fileName = sanitizeText(body.fileName, LIMITS.maxFileNameChars + 1)
  if (fileName.length > LIMITS.maxFileNameChars) {
    errors.push({ field: 'fileName', message: 'File name is too long.' })
  }
  if (fileName && !/^[\w.\-/\\ ()[\]]+$/.test(fileName)) {
    errors.push({ field: 'fileName', message: 'File name contains invalid characters.' })
  }

  return { errors, value: { language, code, errorMessage, description, fileName } }
}

export async function handler(event) {
  const method = event.httpMethod || 'GET'

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: { Allow: 'POST, OPTIONS' }, body: '' }
  }

  // Lightweight capability probe used by the UI to label demo mode.
  if (method === 'GET') {
    return json(200, {
      ok: true,
      service: 'ai-bug-detective',
      aiConfigured: isAiConfigured(),
      provider: isAiConfigured() ? providerName() : null,
      model: isAiConfigured() ? process.env.AI_MODEL || null : null,
      languages: LANGUAGES,
      limits: LIMITS,
    })
  }

  if (method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Use POST to analyse code.', {}, { Allow: 'POST, OPTIONS' })
  }

  if (!originAllowed(event)) {
    return fail(403, 'origin_not_allowed', 'This origin is not allowed to call the analysis API.')
  }

  const rawBody = event.body || ''
  const bodyBytes = Buffer.byteLength(rawBody, event.isBase64Encoded ? 'base64' : 'utf8')
  if (bodyBytes > LIMITS.maxBodyBytes) {
    return fail(413, 'payload_too_large', 'Request body is too large.')
  }

  const rl = rateLimit(clientIp(event))
  if (rl.limited) {
    return fail(
      429,
      'rate_limited',
      `Too many analyses. Please wait ${rl.retryAfter}s and try again.`,
      { retryAfter: rl.retryAfter },
      { 'Retry-After': String(rl.retryAfter) },
    )
  }

  let parsed
  try {
    parsed = JSON.parse(rawBody || '{}')
  } catch {
    return fail(400, 'invalid_json', 'Request body must be valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return fail(400, 'invalid_body', 'Request body must be a JSON object.')
  }

  const { errors, value } = validate(parsed)
  if (errors.length) {
    return fail(422, 'validation_failed', 'Some fields need attention.', { fields: errors })
  }

  const started = Date.now()

  // ---- Demo mode: no key configured ---------------------------------------
  if (!isAiConfigured()) {
    const demo = findDemoAnalysis(value)
    if (demo) {
      console.log(JSON.stringify({ event: 'demo_analysis_served', language: value.language, ms: Date.now() - started }))
      return json(200, {
        ok: true,
        mode: 'demo',
        provider: null,
        model: null,
        demoCase: demo.title,
        analysis: normalizeAnalysis(demo.analysis),
        meta: { language: value.language, durationMs: Date.now() - started, rateRemaining: rl.remaining },
      })
    }
    return fail(
      503,
      'demo_case_not_found',
      'Demo mode is active (no AI key configured) and this input does not match any built-in sample case. Add AI_API_KEY on the server to analyse arbitrary code.',
      { demoMode: true },
    )
  }

  // ---- Live mode ----------------------------------------------------------
  try {
    const raw = await runAnalysis({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(value),
    })
    console.log(
      JSON.stringify({
        event: 'analysis_ok',
        language: value.language,
        codeChars: value.code.length,
        ms: Date.now() - started,
      }),
    )
    return json(200, {
      ok: true,
      mode: 'live',
      provider: providerName(),
      model: process.env.AI_MODEL || null,
      analysis: normalizeAnalysis(raw),
      meta: { language: value.language, durationMs: Date.now() - started, rateRemaining: rl.remaining },
    })
  } catch (err) {
    const isProvider = err instanceof ProviderError
    const status = isProvider ? err.status : 500
    const code = isProvider ? err.code : 'internal_error'
    const message =
      status === 500 && !isProvider
        ? 'Something went wrong while analysing the code. Please try again.'
        : err.message
    console.error(
      JSON.stringify({
        event: 'analysis_failed',
        code,
        status,
        ms: Date.now() - started,
        detail: isProvider ? err.message : String(err && err.message),
      }),
    )
    return fail(status, code, message, { demoMode: false })
  }
}

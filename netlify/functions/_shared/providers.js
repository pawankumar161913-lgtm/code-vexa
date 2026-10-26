/**
 * Server-side AI provider adapters.
 *
 * All credentials are read from process.env here, on the server only. Nothing in
 * this file is ever bundled into the browser build.
 *
 * Each adapter receives the system prompt, user prompt and a JSON schema, and
 * must return a parsed, schema-shaped analysis object.
 */
import { ANALYSIS_JSON_SCHEMA, isValidAnalysis } from './schema.js'

/** Anthropic tool schemas reject additionalProperties, so strip it recursively. */
function stripAdditionalProps(schema) {
  if (Array.isArray(schema)) return schema.map(stripAdditionalProps)
  if (!schema || typeof schema !== 'object') return schema
  const out = {}
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'additionalProperties') continue
    out[key] = stripAdditionalProps(value)
  }
  return out
}

const ANTHROPIC_INPUT_SCHEMA = stripAdditionalProps(ANALYSIS_JSON_SCHEMA)

class ProviderError extends Error {
  constructor(message, status = 502, code = 'provider_error') {
    super(message)
    this.status = status
    this.code = code
  }
}

function timeoutSignal(ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, clear: () => clearTimeout(timer) }
}

function parseJsonLoose(text) {
  if (!text) throw new ProviderError('The AI provider returned an empty response.', 502, 'empty_response')
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // Recover the first balanced JSON object in the text.
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1))
      } catch {
        /* fall through */
      }
    }
    throw new ProviderError('The AI provider returned malformed JSON.', 502, 'malformed_response')
  }
}

/** Maps provider HTTP failures onto our own error codes. */
function providerHttpError(status, detail) {
  if (status === 401 || status === 403) {
    return new ProviderError('The AI provider rejected the configured API key.', 502, 'auth_error')
  }
  if (status === 429) {
    return new ProviderError('The AI provider is rate limiting this key. Try again shortly.', 429, 'provider_rate_limited')
  }
  return new ProviderError(`AI provider error (${status}). ${detail}`.trim(), 502)
}

async function readError(res) {
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.error?.message || body?.message || JSON.stringify(body).slice(0, 300)
  } catch {
    try {
      detail = (await res.text()).slice(0, 300)
    } catch {
      detail = ''
    }
  }
  return detail
}

async function callOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  system,
  user,
  timeoutMs,
  extraHeaders = {},
  /** 'bearer' | 'x-goog-api-key' | 'x-api-key' */
  authMode = 'bearer',
  /** 'json_schema' (OpenAI) | 'json_object' (most free tiers) | 'none' */
  responseFormat = 'json_schema',
  /** Gemini requires the key in the URL as well as the header on some gateways. */
  apiKeyInQuery = false,
  extraBody = {},
}) {
  const base = baseUrl.replace(/\/$/, '')
  const url = apiKeyInQuery ? `${base}/chat/completions?key=${encodeURIComponent(apiKey)}` : `${base}/chat/completions`

  const authHeaders = {}
  if (authMode === 'x-goog-api-key') authHeaders['x-goog-api-key'] = apiKey
  else if (authMode === 'x-api-key') authHeaders['x-api-key'] = apiKey
  else authHeaders.Authorization = `Bearer ${apiKey}`
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]

  const post = async (body) => {
    const { signal, clear } = timeoutSignal(timeoutMs)
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...extraHeaders,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const detail = await readError(res)
        throw providerHttpError(res.status, detail)
      }
      return await res.json()
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ProviderError('The AI provider took too long to respond.', 504, 'provider_timeout')
      }
      if (err instanceof ProviderError) throw err
      throw new ProviderError('Could not reach the AI provider. Check AI_BASE_URL and outbound network access.', 502, 'provider_unreachable')
    } finally {
      clear()
    }
  }

  const jsonSchemaFormat =
    responseFormat === 'json_schema'
      ? {
          type: 'json_schema',
          json_schema: { name: 'bug_analysis', strict: true, schema: ANALYSIS_JSON_SCHEMA },
        }
      : responseFormat === 'json_object'
        ? { type: 'json_object' }
        : undefined

  // First attempt: the provider's best supported structured-output mode.
  const strictBody = {
    model,
    temperature: 0.1,
    max_tokens: 3000,
    ...(jsonSchemaFormat ? { response_format: jsonSchemaFormat } : {}),
    ...extraBody,
    messages,
  }

  let body
  try {
    body = await post(strictBody)
  } catch (err) {
    // Not every OpenAI-compatible endpoint supports response_format /
    // json_schema. Fall back to JSON mode once, then to plain text.
    if (err instanceof ProviderError && err.status === 502 && /response_format|json_schema/i.test(err.message)) {
      try {
        body = await post({ ...strictBody, response_format: { type: 'json_object' } })
      } catch (err2) {
        if (err2 instanceof ProviderError && err2.status === 502 && /response_format/i.test(err2.message)) {
          const { response_format: _drop, ...plain } = strictBody
          body = await post(plain)
        } else {
          throw err2
        }
      }
    } else {
      throw err
    }
  }

  const text = body?.choices?.[0]?.message?.content
  return parseJsonLoose(typeof text === 'string' ? text : JSON.stringify(text))
}

async function callAnthropic({ apiKey, model, system, user, timeoutMs }) {
  const { signal, clear } = timeoutSignal(timeoutMs)
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 3000,
        temperature: 0.1,
        system,
        messages: [{ role: 'user', content: user }],
        tools: [
          {
            name: 'report_bug_analysis',
            description: 'Return the structured bug analysis as JSON.',
            input_schema: ANTHROPIC_INPUT_SCHEMA,
          },
        ],
        tool_choice: { type: 'tool', name: 'report_bug_analysis' },
      }),
    })

    if (!res.ok) {
      const detail = await readError(res)
      throw providerHttpError(res.status, detail)
    }

    const body = await res.json()
    const block = Array.isArray(body?.content)
      ? body.content.find((b) => b.type === 'tool_use' && b.name === 'report_bug_analysis')
      : null
    if (block?.input) return block.input
    const textBlock = Array.isArray(body?.content) ? body.content.find((b) => b.type === 'text') : null
    return parseJsonLoose(textBlock?.text)
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ProviderError('The AI provider took too long to respond.', 504, 'provider_timeout')
    }
    if (err instanceof ProviderError) throw err
    throw new ProviderError('Could not reach the AI provider. Check outbound network access.', 502, 'provider_unreachable')
  } finally {
    clear()
  }
}

/**
 * Presets for providers that hand out free API keys. Selected with
 * AI_PROVIDER=groq | gemini | openrouter | cerebras | ollama (or use "custom"
 * and set AI_BASE_URL yourself). All of them speak the OpenAI chat-completions
 * protocol, which is why one adapter covers them.
 *
 * Model names change over time; AI_MODEL always overrides the default below, so
 * check the provider's model list if a preset stops working.
 */
export const PROVIDER_PRESETS = {
  groq: {
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    responseFormat: 'json_object',
    freeTier: 'Free key at console.groq.com — roughly 30 requests/min, ~1,000 requests/day on the 70B model.',
  },
  gemini: {
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    responseFormat: 'json_object',
    authMode: 'bearer',
    freeTier: 'Free key at aistudio.google.com — generous per-minute limits; daily caps vary by model.',
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    responseFormat: 'json_object',
    extraHeaders: { 'HTTP-Referer': 'https://ai-bug-detective.netlify.app', 'X-Title': 'AI Bug Detective' },
    freeTier: 'Free key at openrouter.ai — models with a ":free" suffix cost nothing, with lower rate limits.',
  },
  cerebras: {
    label: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama-3.3-70b',
    responseFormat: 'json_object',
    freeTier: 'Free key at cloud.cerebras.ai — very fast inference, daily token limits.',
  },
  ollama: {
    label: 'Ollama (local, no key)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    responseFormat: 'json_object',
    authMode: 'none',
    freeTier: 'Runs entirely on your machine — no key, no cost, no rate limit.',
  },
}

/** Returns true when server-side AI credentials are configured. */
export function isAiConfigured() {
  if (providerName() === 'ollama') return true // local models need no key
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_api_key_here')
}

export function providerName() {
  return (process.env.AI_PROVIDER || 'openai').toLowerCase()
}

/**
 * Runs the analysis against the configured provider.
 * Throws ProviderError on any failure so the handler can map it to a status.
 */
export async function runAnalysis({ system, user }) {
  if (!isAiConfigured()) {
    throw new ProviderError('No AI API key is configured on the server.', 503, 'not_configured')
  }

  const provider = providerName()
  const preset = PROVIDER_PRESETS[provider]
  const apiKey = process.env.AI_API_KEY || (preset?.authMode === 'none' ? 'local' : '')
  const model =
    process.env.AI_MODEL ||
    preset?.defaultModel ||
    (provider === 'anthropic' ? 'claude-3-5-sonnet-latest' : 'gpt-4o-mini')
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 45000)

  if (!model) {
    throw new ProviderError('No AI model is configured on the server (set AI_MODEL).', 500, 'misconfigured')
  }

  let raw
  if (provider === 'anthropic') {
    raw = await callAnthropic({ apiKey, model, system, user, timeoutMs })
  } else if (preset) {
    raw = await callOpenAICompatible({
      baseUrl: process.env.AI_BASE_URL || preset.baseUrl,
      apiKey,
      model,
      system,
      user,
      timeoutMs,
      authMode: preset.authMode || 'bearer',
      responseFormat: preset.responseFormat || 'json_object',
      extraHeaders: preset.extraHeaders,
    })
  } else if (provider === 'custom') {
    const baseUrl = process.env.AI_BASE_URL
    if (!baseUrl) throw new ProviderError('AI_BASE_URL is required for AI_PROVIDER=custom.', 500, 'misconfigured')
    raw = await callOpenAICompatible({ baseUrl, apiKey, model, system, user, timeoutMs })
  } else {
    raw = await callOpenAICompatible({
      baseUrl: 'https://api.openai.com/v1',
      apiKey,
      model,
      system,
      user,
      timeoutMs,
    })
  }

  if (!isValidAnalysis(raw)) {
    throw new ProviderError('The AI provider returned an unexpected result shape.', 502, 'invalid_shape')
  }
  return raw
}

export { ProviderError }

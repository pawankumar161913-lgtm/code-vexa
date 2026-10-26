/**
 * Shared request/response contract for the analysis API.
 * Dependency-free so the Netlify function can import it directly.
 * Mirrored by the TypeScript types in src/lib/types.ts.
 */

export const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'cpp',
  'html',
  'css',
  'sql',
  'php',
]

export const LIMITS = {
  maxCodeChars: 40000,
  maxErrorChars: 8000,
  maxDescriptionChars: 2000,
  maxFileNameChars: 120,
  maxBodyBytes: 200000,
}

/**
 * JSON Schema describing the analysis object.
 *
 * This is sent to providers that support structured outputs (OpenAI's
 * json_schema mode, Anthropic tool input schemas). It is kept in the common
 * JSON-Schema subset those two accept: no `additionalProperties` on objects,
 * no `minLength`/`maxLength`, `type` arrays only as ["string","null"].
 */
export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  required: [
    'status',
    'summary',
    'severity',
    'severityReason',
    'category',
    'cause',
    'locationFile',
    'locationLine',
    'locationReliable',
    'originalCode',
    'suggestedFix',
    'explanationSteps',
    'preventionTips',
    'confidence',
    'confidenceReason',
    'beginnerExplanation',
    'minimalRepro',
    'unitTests',
    'relatedRisks',
    'missingContext',
  ],
  properties: {
    status: {
      type: 'string',
      enum: ['analyzed', 'needs_more_context'],
      description:
        'Use "needs_more_context" when the supplied code and error are insufficient to identify a real problem.',
    },
    summary: { type: 'string', description: 'One or two sentences naming the suspected bug.' },
    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
    severityReason: { type: 'string', description: 'One sentence justifying the severity.' },
    category: {
      type: 'string',
      enum: ['syntax_error', 'logic_error', 'runtime_error', 'type_error', 'security', 'performance', 'improvement'],
      description:
        'syntax_error only for confirmed parse/compile errors. Logic and runtime issues are suspicions unless proven.',
    },
    cause: { type: 'string', description: 'Why the problem occurs.' },
    locationFile: { type: ['string', 'null'], description: 'File name if derivable from the input, else null.' },
    locationLine: { type: ['integer', 'null'], description: 'Line number if derivable from the input, else null.' },
    locationReliable: {
      type: 'boolean',
      description: 'True only when the location comes from the supplied code or stack trace.',
    },
    originalCode: { type: 'string', description: 'Verbatim excerpt (max ~30 lines) from the supplied code.' },
    suggestedFix: { type: 'string', description: 'Corrected replacement for the excerpt, same language.' },
    explanationSteps: { type: 'array', items: { type: 'string' } },
    preventionTips: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', description: 'Confidence between 0 and 1.' },
    confidenceReason: { type: 'string' },
    beginnerExplanation: { type: 'string' },
    minimalRepro: { type: 'string' },
    unitTests: { type: 'string' },
    relatedRisks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['kind', 'description', 'line'],
        properties: {
          kind: {
            type: 'string',
            enum: ['null_reference', 'incorrect_condition', 'runtime', 'security', 'performance', 'style'],
          },
          description: { type: 'string' },
          line: { type: ['integer', 'null'] },
        },
      },
    },
    missingContext: { type: 'array', items: { type: 'string' } },
  },
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((s) => typeof s === 'string' && s.trim()) : []
}

/** Basic shape check of a model-produced analysis object. */
export function isValidAnalysis(a) {
  if (!a || typeof a !== 'object') return false
  if (a.status !== 'analyzed' && a.status !== 'needs_more_context') return false
  if (typeof a.summary !== 'string' || !a.summary.trim()) return false
  if (!['critical', 'high', 'medium', 'low'].includes(a.severity)) return false
  if (typeof a.cause !== 'string') return false
  if (typeof a.originalCode !== 'string' || typeof a.suggestedFix !== 'string') return false
  if (!Array.isArray(a.explanationSteps) || !Array.isArray(a.preventionTips)) return false
  if (typeof a.confidence !== 'number' || Number.isNaN(a.confidence)) return false
  return true
}

/**
 * Converts a model result into the client contract:
 * flat location fields become a `location` object and every optional field is
 * filled so the UI never has to guard against undefined.
 */
export function normalizeAnalysis(a) {
  const line = Number.isInteger(a.locationLine) ? a.locationLine : null
  const file = typeof a.locationFile === 'string' && a.locationFile.trim() ? a.locationFile.trim() : null

  return {
    status: a.status,
    summary: a.summary,
    severity: a.severity,
    severityReason: a.severityReason || '',
    category: a.category || 'logic_error',
    cause: a.cause,
    location: {
      file,
      line,
      // A line without a file is still usable; a location is never "reliable"
      // unless the model says so AND something was actually located.
      reliable: Boolean(a.locationReliable) && (file !== null || line !== null),
    },
    originalCode: a.originalCode || '',
    suggestedFix: a.suggestedFix || '',
    explanationSteps: asStringArray(a.explanationSteps),
    preventionTips: asStringArray(a.preventionTips),
    confidence: Math.min(1, Math.max(0, Number(a.confidence))),
    confidenceReason: a.confidenceReason || '',
    beginnerExplanation: a.beginnerExplanation || '',
    minimalRepro: a.minimalRepro || '',
    unitTests: a.unitTests || '',
    relatedRisks: Array.isArray(a.relatedRisks)
      ? a.relatedRisks
          .filter((r) => r && typeof r.description === 'string')
          .map((r) => ({
            kind: r.kind || 'runtime',
            description: r.description,
            line: Number.isInteger(r.line) ? r.line : null,
          }))
      : [],
    missingContext: asStringArray(a.missingContext),
  }
}

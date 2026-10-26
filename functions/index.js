/**
 * Firebase Functions entry point for Code Vexa.
 *
 * It is a thin adapter: all validation, rate limiting and AI provider logic stays
 * in netlify/functions/_shared, so Netlify and Firebase behave identically.
 *
 * Route: https://<region>-<project>.cloudfunctions.net/api/analyze
 *        (or /api/analyze through Firebase Hosting, see firebase.json)
 *
 * Secrets: set AI_API_KEY with
 *   firebase functions:secrets:set AI_API_KEY
 * and the remaining configuration with firebase functions:config or params —
 * see the README, section "Deploy to Google (Firebase Hosting)".
 */
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { handler } from '../netlify/functions/api.js'

const aiApiKey = defineSecret('AI_API_KEY')

export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 10,
    secrets: [aiApiKey],
    cors: false, // the handler answers OPTIONS and checks origins itself
  },
  async (req, res) => {
    // Make the secret visible to the shared handler through process.env.
    process.env.AI_API_KEY = aiApiKey.value()

    const event = {
      httpMethod: req.method,
      path: req.path,
      headers: req.headers,
      body: req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body ?? {}),
      isBase64Encoded: false,
      queryStringParameters: req.query ?? {},
    }

    const result = await handler(event, {})
    res.status(result.statusCode)
    for (const [key, value] of Object.entries(result.headers || {})) res.setHeader(key, value)
    res.send(result.body ?? '')
  },
)

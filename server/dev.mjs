/**
 * Local development server (no Netlify CLI required).
 *
 * - Serves the production build from ./dist
 * - Runs the real Netlify function from ./netlify/functions/api.js in-process
 * - Emulates the SPA redirect so client routes survive a refresh
 *
 * Usage:  npm run build && npm run serve
 *         PORT=4173 AI_PROVIDER=openai AI_API_KEY=... node server/dev.mjs
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handler } from '../netlify/functions/api.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/ not found — run `npm run build` first.')
  process.exit(1)
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const body = fs.readFileSync(filePath)
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(body)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  if (url.pathname === '/api/analyze') {
    const chunks = []
    let size = 0
    let tooLarge = false
    for await (const chunk of req) {
      size += chunk.length
      if (size > 250000) {
        tooLarge = true
        break
      }
      chunks.push(chunk)
    }
    if (tooLarge) {
      res.writeHead(413, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: { code: 'payload_too_large', message: 'Body too large.' } }))
      return
    }

    const event = {
      httpMethod: req.method,
      path: url.pathname,
      headers: {
        ...req.headers,
        'x-nf-client-connection-ip': req.socket.remoteAddress || 'local',
      },
      body: Buffer.concat(chunks).toString('utf8'),
      isBase64Encoded: false,
      queryStringParameters: Object.fromEntries(url.searchParams),
    }

    try {
      const result = await handler(event, {})
      res.writeHead(result.statusCode, result.headers || {})
      res.end(result.body ?? '')
    } catch (err) {
      console.error('Function crashed:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: { code: 'internal_error', message: 'Function crashed.' } }))
    }
    return
  }

  // Static assets, then SPA fallback.
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidate = path.join(DIST, safePath)
  if (candidate.startsWith(DIST) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    sendFile(res, candidate)
    return
  }
  sendFile(res, path.join(DIST, 'index.html'))
})

server.listen(PORT, () => {
  console.log(`AI Bug Detective dev server → http://localhost:${PORT}`)
  console.log(`AI configured: ${Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_api_key_here')}`)
})

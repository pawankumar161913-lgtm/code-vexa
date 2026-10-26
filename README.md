# Code Vexa

> **Find the bug. Understand the cause. Fix it faster.**

Code Vexa is a full-stack debugging workspace. Paste code, add the error message or stack
trace, and get a structured analysis: the suspected cause, severity, the bug location (only when it
can be determined), the original snippet, a suggested fix shown as a diff, a step-by-step
explanation, prevention tips and a qualified confidence score.

**Stack**

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Lucide icons
- **Backend:** one Netlify Function (`netlify/functions/api.js`) — plain Node, no framework
- **AI:** configurable provider (OpenAI, Anthropic, or any OpenAI-compatible endpoint)
- **Storage:** none on the server; analysis history lives in the browser

---

## 1. Quick start (three commands)

```bash
npm install
npm run build
npm run serve        # http://localhost:4173  — starts with no API key, in demo mode
```

That gives you the complete application running locally against the real backend function. Without an
`AI_API_KEY` the app runs in **demo mode** (see section 6).

### Development with hot reload

```bash
# Terminal 1 — backend + build-free proxy on :8888 (requires the Netlify CLI once)
npx netlify-cli dev            # or: npm install -g netlify-cli && npm run netlify:dev

# Terminal 2 — Vite dev server on :5173, proxying /api to :8888
npm run dev
```

`vite.config.ts` proxies `/api` to `http://localhost:8888`, so the UI talks to the function exactly
as it will in production. If you prefer not to install the Netlify CLI, run `npm run build` and
`npm run serve` (the bundled `server/dev.mjs` runs the same function in-process).

---

## 2. Project structure

```
code-vexa/
├── index.html                  # meta tags, Open Graph, favicon, fonts
├── netlify.toml                # build, SPA redirect, security headers, function timeout
├── vite.config.ts              # dev proxy to the function
├── tailwind.config.js          # design tokens (ink / electric / violet)
├── .env.example                # every server-side variable, documented
├── public/
│   ├── favicon.svg             # custom favicon
│   ├── og-image.svg            # social sharing image
│   ├── robots.txt              # disallows /workspace, /history, /api
│   ├── sitemap.xml
│   └── site.webmanifest
├── netlify/functions/
│   ├── api.js                  # POST /api/analyze  (validation, rate limit, dispatch)
│   └── _shared/
│       ├── schema.js           # language list, limits, JSON schema, normalisation
│       ├── prompt.js           # system prompt + untrusted-input framing
│       ├── providers.js        # OpenAI / Anthropic / custom adapters (server only)
│       └── demo.js             # built-in demo analyses (clearly labelled)
├── server/dev.mjs              # local static + function server (no Netlify CLI needed)
└── src/
    ├── App.tsx                 # routes, scroll manager, skip link
    ├── pages/
    │   ├── Landing.tsx         # hero, features, how it works, languages, pricing, FAQ
    │   ├── Workspace.tsx       # the debugging dashboard
    │   ├── History.tsx         # local history: reopen / delete / clear
    │   ├── FeaturesPage.tsx
    │   ├── HowItWorksPage.tsx
    │   └── StaticPages.tsx     # pricing, privacy, terms, contact, sign-in, 404
    ├── components/
    │   ├── CodeEditor.tsx      # textarea + token overlay, line numbers, tab indent
    │   ├── ResultsPanel.tsx    # findings, diff, apply-fix confirmation, copy buttons
    │   ├── DiffView.tsx        # line diff via `diff`
    │   ├── HeroEditorPreview.tsx
    │   ├── CodeBlock.tsx, CopyButton.tsx, SeverityBadge.tsx, Navbar.tsx, Footer.tsx, Logo.tsx
    ├── lib/
    │   ├── api.ts              # typed fetch client + capability probe
    │   ├── types.ts            # the client contract
    │   ├── highlight.ts        # tiny tokenizer (renders text, never HTML)
    │   ├── history.ts          # localStorage history (max 50, deletable)
    │   ├── pendingSession.ts   # hand-off from History → Workspace
    │   └── seo.ts              # per-route title/description/canonical/robots
    └── data/examples.ts        # 10 sample bugs
```

---

## 3. Environment variables

Copy `.env.example` to `.env` (gitignored) for local runs, and set the same keys in
**Netlify → Site configuration → Environment variables** for production.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | yes | Free-key presets `groq` (default in `.env.example`), `gemini`, `openrouter`, `cerebras`, `ollama`; paid `openai`, `anthropic`; or `custom` |
| `AI_API_KEY` | for live mode | Provider secret. **Server only.** |
| `AI_MODEL` | no | Optional override; each preset has a working default (see the table in section 3b) |
| `AI_BASE_URL` | for `custom` | OpenAI-compatible base URL, e.g. `https://api.groq.com/openai/v1` |
| `AI_TIMEOUT_MS` | no | Upstream timeout, default `45000` |
| `RATE_LIMIT_MAX` | no | Requests per IP per window, default `12` |
| `RATE_LIMIT_WINDOW_MS` | no | Window length, default `60000` |
| `MAX_CODE_CHARS` | no | Documented limit, default `40000` |
| `MAX_BODY_BYTES` | no | Hard body cap, default `200000` |
| `ALLOWED_ORIGINS` | no | Comma-separated extra origins allowed to call the API |
| `VITE_SITE_URL` | no | Public site URL used for canonical links (build-time, non-secret) |
| `VITE_CONTACT_EMAIL` | no | Public contact address shown on the contact/pricing pages (default `p23988087@gmail.com`) |
| `VITE_UPI_ID` | no | UPI number shown on the pricing page (default `9466825395`). Public by design — manual payments only, no gateway and no automatic verification |

### 3b. Free API keys (no credit card)

Every preset below speaks the OpenAI chat-completions protocol, so switching is two environment
variables. The backend asks for JSON output and falls back automatically if a provider rejects
`response_format`.

| `AI_PROVIDER` | Free key | Default `AI_MODEL` | Typical free limits |
| --- | --- | --- | --- |
| `groq` | <https://console.groq.com/keys> | `llama-3.3-70b-versatile` | ~30 req/min, ~1,000 req/day on the 70B model |
| `gemini` | <https://aistudio.google.com/apikey> | `gemini-flash-lite-latest` | generous per-minute limits; daily caps vary by model |
| `openrouter` | <https://openrouter.ai/keys> | `meta-llama/llama-3.3-70b-instruct:free` | free models only (`:free` suffix), lower rate limits |
| `cerebras` | <https://cloud.cerebras.ai/> | `llama-3.3-70b` | fast inference, daily token limit |
| `ollama` | none — runs locally | `llama3.2` | limited only by your machine |

Local setup, Groq as the example:

```bash
cp .env.example .env
# put your key in .env:  AI_PROVIDER=groq  and  AI_API_KEY=gsk_...
npm run build && npm run serve      # workspace badge switches to "Live AI mode · groq"
```

Netlify:

```bash
netlify env:set AI_PROVIDER groq
netlify env:set AI_API_KEY "gsk_..."     # never commit this
netlify deploy --build --prod
```

With Ollama, also run `ollama serve` and `ollama pull llama3.2`, then
`netlify env:set AI_PROVIDER ollama`. That only works when the backend can reach your machine, so
it is for local use — not for a deployed site.

Free tiers are rate-limited: if you hit `429 provider_rate_limited`, wait a minute, lower
`RATE_LIMIT_MAX`, or switch provider. Model names change over time — set `AI_MODEL` if a default
is retired.

**Never** rename the key to `VITE_AI_API_KEY`: Vite inlines `VITE_*` variables into the browser
bundle, which would publish the secret to every visitor. The backend reads `AI_API_KEY` from
`process.env` inside the function only.

---

## 4. The API

### `GET /api/analyze`

Capability probe used by the UI to label demo/live mode.

```json
{ "ok": true, "aiConfigured": true, "provider": "openai",
  "languages": ["javascript", "..."], "limits": { "maxCodeChars": 40000 } }
```

### `POST /api/analyze`

```json
{
  "language": "javascript",
  "code": "const items = response.items;\nitems.map(f)",
  "errorMessage": "TypeError: Cannot read properties of undefined (reading 'map')",
  "description": "Should render the list, crashes instead",
  "fileName": "renderList.js"
}
```

Success (`200`):

```json
{
  "ok": true, "mode": "live", "provider": "openai", "model": "gpt-4o-mini",
  "analysis": {
    "status": "analyzed",
    "summary": "...", "severity": "high", "severityReason": "...",
    "category": "runtime_error", "cause": "...",
    "location": { "file": "renderList.js", "line": 2, "reliable": true },
    "originalCode": "...", "suggestedFix": "...",
    "explanationSteps": ["..."], "preventionTips": ["..."],
    "confidence": 0.9, "confidenceReason": "...",
    "beginnerExplanation": "...", "minimalRepro": "...", "unitTests": "...",
    "relatedRisks": [{ "kind": "null_reference", "description": "...", "line": 1 }],
    "missingContext": []
  },
  "meta": { "language": "javascript", "durationMs": 1840, "rateRemaining": 11 }
}
```

Errors are always `{ "ok": false, "error": { "code", "message", "fields?" } }` with a status code:

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `invalid_json` / `invalid_body` | Malformed request |
| 403 | `origin_not_allowed` | Origin not in `ALLOWED_ORIGINS` |
| 405 | `method_not_allowed` | Not `POST`/`GET`/`OPTIONS` |
| 413 | `payload_too_large` | Body over `MAX_BODY_BYTES` |
| 422 | `validation_failed` | Field-level problems in `error.fields[]` |
| 429 | `rate_limited` | Per-IP limit, `retryAfter` included |
| 502 | `auth_error`, `malformed_response`, `invalid_shape`, `provider_unreachable` | Upstream problem |
| 503 | `not_configured`, `demo_case_not_found` | No key configured |
| 504 | `provider_timeout` | Model took too long |

---

## 5. How submitted code is handled (safe code handling)

1. **Never executed.** The server does not run, compile, evaluate or sandbox the code. There is no
   execution path at all, so no sandbox is required. If execution is ever added, it must be a
   separate, isolated service with CPU/memory/time limits — not this function.
2. **Never rendered as HTML.** The editor and result blocks tokenise code and render it as React
   text nodes, so pasted `<script>` shows up literally.
3. **Never stored server-side.** Nothing is written to a database or disk; the request is forwarded
   to the AI provider and discarded.
4. **Not logged.** Log lines contain only the language, character count, duration and outcome.
5. **Validated twice.** The browser validates first; the server re-validates language, sizes and
   file names, and strips NUL bytes.
6. **Size and rate limited.** `MAX_BODY_BYTES`, `MAX_CODE_CHARS`, plus a per-IP sliding window
   (`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`). The in-memory window is per function instance; for
   hard guarantees put Netlify's or Cloudflare's rate limiting in front of `/api/*`.
7. **Prompt-injection aware.** The code is wrapped in an explicit untrusted-input block and the
   system prompt instructs the model to ignore instructions inside it.
8. **Deletable history.** Local history can be deleted per session or cleared entirely on
   `/history`; clearing browser storage removes it too.

The user-facing version of this is on `/privacy`.

---

## 6. Demo mode (no API key)

If `AI_API_KEY` is missing or still the placeholder:

- `GET /api/analyze` reports `aiConfigured: false` and the workspace shows a **Demo mode** badge;
- the sample bugs in the picker are answered from `netlify/functions/_shared/demo.js`;
- every such response carries `mode: "demo"` and the UI labels it
  **“Demo analysis — not produced by AI”**;
- arbitrary code returns `503 demo_case_not_found` with an explanation, rather than a fake answer.

Nothing in demo mode pretends to be a live model response.

---

## 7. Features implemented

- Syntax-highlighted editor (10 languages), line numbers, tab-to-indent, paste, upload, copy
- Language selector, error/stack-trace input, expected-behaviour input, optional file name
- `Analyze Code`, `Clear`, `Load Example`, loading state, empty state, inline + banner errors
- Results: summary, severity + reason, confirmed-vs-suspected category, cause, location with a
  reliability flag, original snippet, diff viewer, apply-fix-to-editor (with confirmation),
  step-by-step explanation, other risks, beginner explanation, minimal reproduction, test
  suggestions, prevention tips, confidence with reason
- `Re-run` after editing; `Ctrl/⌘ + Enter` to analyse
- Local history: reopen, delete one, clear all
- 10 sample bugs across JavaScript, TypeScript, Python, Java, C++, SQL, PHP, CSS, HTML
- Responsive layout, keyboard focus styles, skip link, `aria-live` regions, semantic landmarks
- SEO: per-route titles/descriptions/canonical, Open Graph + Twitter cards, `robots.txt`,
  `sitemap.xml`, `noindex` on workspace/history/sign-in, custom 404, SPA refresh-safe routing

### Deliberately not implemented

| Feature | Why | Where it would plug in |
| --- | --- | --- |
| User accounts, cross-device history | Needs an auth provider + database | Add Supabase Auth/Auth0, a `sessions` table, and replace `src/lib/history.ts` with API calls |
| Payments | No payment provider is connected | Stripe Checkout + a webhook function that verifies signatures server-side |
| Running / testing user code | Requires an isolated sandbox service | A separate container/VM runner with hard resource limits — never in this function |
| Team workspaces | Depends on accounts | Postgres row-level security on a `workspaces` table |

The sign-in page states plainly that accounts are not available; there is no fake login form.

---

## 8. Build and type-check

```bash
npm run typecheck    # tsc -b --noEmit
npm run build        # tsc -b && vite build  → dist/
npm run serve        # serve dist/ + the real function locally
```

The production build is verified in this repository's development: `tsc -b` passes and Vite emits
`dist/index.html`, one CSS bundle and one JS bundle.

---

## 9. Deploy to Netlify

### Option A — CLI

```bash
npm install -g netlify-cli
netlify login
netlify init                       # create/link a site
netlify env:set AI_PROVIDER openai
netlify env:set AI_API_KEY "sk-..."        # paste the real key, never commit it
netlify env:set AI_MODEL gpt-4o-mini
netlify deploy --build --prod
```

### Option B — Git

1. Push this repository to GitHub/GitLab.
2. Netlify → **Add new site → Import an existing project**.
3. Build command `npm run build`, publish directory `dist` (already set in `netlify.toml`).
4. Add the environment variables from section 3.
5. Deploy.

### Notes for deployment

- `netlify.toml` sets `node_bundler = "esbuild"`, a 60 s timeout for the function, an SPA redirect
  (`/* → /index.html`, 200) so deep links survive a refresh, and security headers.
- Functions are deployed automatically from `netlify/functions` — no extra service needed. Nothing
  depends on your laptop staying on.
- Update the placeholder domain `https://code-vexa.netlify.app` in `index.html`,
  `public/robots.txt`, `public/sitemap.xml` and `VITE_SITE_URL` to your real domain.
- If you deploy the frontend elsewhere (e.g. Vercel/Cloudflare Pages), point `/api/analyze` at the
  Netlify function URL and add that origin to `ALLOWED_ORIGINS`.

---

## 10. Verification checklist

```bash
# capability probe (demo mode)
curl -s http://localhost:4173/api/analyze | jq

# a sample-bug analysis in demo mode
curl -s -X POST http://localhost:4173/api/analyze -H 'Content-Type: application/json' \
  -d '{"language":"python","code":"def f(v):\n    for i in range(1, len(v) + 1):\n        print(v[i])","errorMessage":"IndexError: list index out of range"}' | jq '.mode, .analysis.summary'

# validation
curl -s -X POST http://localhost:4173/api/analyze -H 'Content-Type: application/json' \
  -d '{"language":"ruby","code":""}' | jq
```

---

## 11. Troubleshooting

| Symptom | Fix |
| --- | --- |
| “The analysis API is not available at /api/analyze” | In dev, run `netlify dev` (or `npm run build && npm run serve`); in production check the function deployed |
| Everything answers “demo mode” | `AI_API_KEY` is unset or still `your_api_key_here` on the server |
| `provider_unreachable` | Wrong `AI_BASE_URL`, or the deployment has no outbound network access |
| `auth_error` | Key rejected — check it belongs to the selected `AI_PROVIDER` |
| `invalid_shape` | The model returned something outside the schema; try a stronger model |
| Deep link 404s after refresh | The SPA redirect is missing — keep the `[[redirects]]` block in `netlify.toml` |

---

## 12. Exact commands (copy/paste)

```bash
# 1. install
cd code-vexa
npm install

# 2. develop (Vite on :5173, function via Netlify CLI on :8888)
npx netlify-cli dev

# 2b. or run the built app + real function on :4173 with no extra tooling
npm run build
npm run serve

# 3. type-check + production build  → dist/
npm run typecheck
npm run build

# 4. deploy to Netlify
npm install -g netlify-cli
netlify login
netlify init
netlify env:set AI_PROVIDER openai
netlify env:set AI_API_KEY "sk-..."       # real key, server-side only
netlify env:set AI_MODEL gpt-4o-mini
netlify deploy --build --prod
```

---

## 13. What needs external credentials or services

| Capability | Needs |
| --- | --- |
| Live AI analysis of arbitrary code | `AI_API_KEY` (+ `AI_PROVIDER`, `AI_MODEL`) in the server environment |
| Sample-bug walkthroughs, validation, rate limiting, history, SEO | Nothing — works as shipped |
| Accounts / cross-device history | An auth provider and a database (not implemented) |
| Payments | A payment provider with server-side verification (not implemented) |
| Hard, cross-instance rate limits | Netlify or Cloudflare rate limiting in front of `/api/*` (the built-in window is per instance) |

---

## 14. Content honesty

Example prices, usage limits and the contact address are placeholders for a product in development;
they are labelled as such in the UI and are configurable. There are no fabricated statistics,
testimonials or simulated results presented as real AI output.

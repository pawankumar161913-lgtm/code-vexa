import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bug, CheckCircle2, Info, Mail, ShieldCheck } from 'lucide-react'
import { useSeo } from '../lib/seo'
import { CopyButton } from '../components/CopyButton'
import { PRICING_TIERS } from './Landing'

function PageShell({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <div className="container-page max-w-3xl py-14">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to home
      </Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{intro}</p>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel px-5 py-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  )
}

export function Privacy() {
  useSeo({
    title: 'Privacy — Code Vexa',
    description: 'How Code Vexa processes, stores and deletes the code you submit.',
    path: '/privacy',
  })
  return (
    <PageShell
      title="Privacy and data handling"
      intro="This page describes exactly what happens to the code and error messages you submit. It is written to match the behaviour of the application, not to make promises the code does not keep."
    >
      <Block title="What is sent, and where">
        <p>
          When you press <strong className="text-slate-200">Analyze Code</strong>, the browser sends your code, the
          selected language, the error message, the optional description and the optional file name to this site’s own
          backend endpoint (<code className="font-mono text-[12px]">POST /api/analyze</code>).
        </p>
        <p>
          That backend forwards the same information to the configured AI model provider to produce the analysis. The
          provider’s own retention policy applies to that request; consult your deployment’s provider documentation if
          that matters to you.
        </p>
      </Block>
      <Block title="What is not done with your code">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>It is never executed, evaluated, compiled or run in a sandbox.</li>
          <li>It is never written to a database or to disk by this application.</li>
          <li>It is not logged: server logs record only the language, character count, duration and outcome.</li>
          <li>It is not shared with anyone other than the AI provider configured by the site operator.</li>
        </ul>
      </Block>
      <Block title="What is stored, and how to delete it">
        <p>
          Analysis results are saved in your own browser’s <code className="font-mono text-[12px]">localStorage</code> so
          you can reopen them. Nothing is synced to a server.
        </p>
        <p>
          Delete a single session from the{' '}
          <Link to="/history" className="link">
            History page
          </Link>
          , or delete everything with <strong className="text-slate-200">Clear history</strong>. Clearing your browser
          storage removes it too.
        </p>
      </Block>
      <Block title="Limits and abuse prevention">
        <p>
          The backend applies per-IP rate limiting and maximum request sizes. To enforce a limit it must process your
          connection’s IP address for a short, in-memory window; it is not stored in a database.
        </p>
      </Block>
      <Block title="Accounts">
        <p>
          Accounts are not implemented in this build. There is no sign-up, no password storage and no server-side user
          profile. The sign-in page explains this rather than presenting a form that would not authenticate anyone.
        </p>
      </Block>
    </PageShell>
  )
}

export function Terms() {
  useSeo({
    title: 'Terms of Use — Code Vexa',
    description: 'The terms that apply to using Code Vexa.',
    path: '/terms',
  })
  return (
    <PageShell
      title="Terms of use"
      intro="A short, plain-language summary of the terms for using this application."
    >
      <Block title="The service">
        <p>
          Code Vexa provides AI-assisted code analysis. Results are suggestions, not guarantees. You are
          responsible for reviewing any change before you ship it.
        </p>
      </Block>
      <Block title="Acceptable use">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Do not submit code you have no right to share.</li>
          <li>Do not attempt to overload, probe or bypass the API limits.</li>
          <li>Do not use the service to build or distribute malware.</li>
        </ul>
      </Block>
      <Block title="No warranty">
        <p>
          The service is provided “as is”, without warranty of any kind. Analyses can be incomplete or wrong, especially
          when the supplied context is thin — the interface labels low-confidence results accordingly.
        </p>
      </Block>
      <Block title="Pricing">
        <p>
          The tiers shown on the pricing page are example values for a product in development. No paid feature is gated
          behind a purchase in this build, and no checkout exists.
        </p>
        <p>
          A UPI number is published on the pricing page for manual, voluntary payments. Transfers made to it are
          peer-to-peer payments to its owner, not purchases from a company: they carry no automatic access, no
          automated invoice and no guaranteed refund. Confirm any payment by email before relying on it.
        </p>
      </Block>
      <Block title="Changes">
        <p>These terms may change as the product develops. The date of the current version is shown in the footer.</p>
      </Block>
    </PageShell>
  )
}

/** The operator's UPI number. Override at build time with VITE_UPI_ID if needed. */
const UPI_ID = (import.meta.env.VITE_UPI_ID as string | undefined) || '9466825395'

const PAYMENT_METHODS = [
  {
    name: 'UPI (manual)',
    status: 'Unverified',
    detail:
      'Send a transfer, then email the reference number for manual confirmation. Nothing on this site verifies or confirms a UPI payment automatically.',
    tone: 'info' as const,
  },
  {
    name: 'Card / international',
    status: 'Not connected',
    detail:
      'Needs a payment provider such as Stripe or Razorpay with server-side webhook verification before any plan can be sold.',
    tone: 'warn' as const,
  },
  {
    name: 'Bank transfer',
    status: 'Manual',
    detail:
      'For Team plans only, arranged directly by email. Invoices are issued by hand.',
    tone: 'info' as const,
  },
]

export function Pricing() {
  useSeo({
    title: 'Pricing — Code Vexa',
    description: 'Example Free, Pro and Team tiers for Code Vexa, with a clear statement of what is implemented.',
    path: '/pricing',
  })
  return (
    <div className="container-page max-w-5xl py-14">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-300/80">Pricing</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Example tiers, honestly labelled</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          The application is functional today in demo and live-AI modes. The tiers below are example configurations for a
          product still in development — no payment provider is connected, and no plan can be purchased from this site.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PRICING_TIERS.map((tier) => (
          <div key={tier.name} className={`panel flex flex-col p-6 ${tier.highlight ? 'border-electric-400/30' : ''}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{tier.name}</h2>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-white">{tier.price}</span>
              <span className="text-xs text-slate-500">{tier.cadence}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{tier.tagline}</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2 text-[13px] text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to={tier.to} className={`mt-6 ${tier.highlight ? 'btn-primary' : 'btn-secondary'}`}>
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="panel mt-8 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Pay by UPI</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
              Manual UPI payment to the number below. Nothing is activated automatically: after paying, email the
              reference number and it is confirmed by hand.
            </p>
          </div>
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Manual · not verified
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3">
          <span className="font-mono text-lg tracking-wide text-white">{UPI_ID}</span>
          <CopyButton value={UPI_ID} label="Copy UPI number" small />
        </div>

        <ol className="mt-4 space-y-1.5 text-[13px] text-slate-400">
          <li>1. Open any UPI app and send the amount for the tier you want.</li>
          <li>2. Note the 12-digit UPI reference (UTR) from the payment screen.</li>
          <li>
            3. Email it to{' '}
            <a href="mailto:hello@example.com" className="link">
              hello@example.com
            </a>{' '}
            so the payment can be matched and confirmed.
          </li>
        </ol>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-200/80">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Sending money to this number is a direct transfer to its owner, not a purchase from a company. There is no
          refund process, no invoice automation and no verification until someone replies to your email. Never share a
          UPI PIN or OTP — no legitimate payment ever needs them.
        </p>
      </div>

      <div className="panel mt-8 px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Payment</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          No payment method is live yet. This table is the honest status of each option; nothing here can charge you
          today.
        </p>
        <ul className="mt-4 space-y-2.5">
          {PAYMENT_METHODS.map((m) => (
            <li key={m.name} className="flex flex-wrap items-start gap-2 rounded-lg border border-white/[0.06] bg-ink-950/50 px-3 py-2.5">
              <span className="w-40 shrink-0 text-[13px] font-medium text-slate-100">{m.name}</span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  m.tone === 'warn'
                    ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                    : 'border-electric-400/30 bg-electric-500/10 text-electric-300'
                }`}
              >
                {m.status}
              </span>
              <span className="w-full text-[12px] leading-relaxed text-slate-400 sm:w-auto sm:flex-1">{m.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          To accept UPI properly, add a payment gateway (Razorpay or Cashfree support UPI and verify the transfer
          server-side), then enable a paid tier here. Never type a UPI PIN, card number or OTP into this site — Code Vexa
          will never ask for one.
        </p>
      </div>

      <div className="panel mt-8 flex items-start gap-3 px-5 py-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-electric-300" aria-hidden="true" />
        <div className="text-sm leading-relaxed text-slate-400">
          <p className="font-medium text-slate-200">What is implemented right now</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The full debugging workflow, without an account, in demo mode or live AI mode.</li>
            <li>Server-side rate limiting and request size limits (values in the README).</li>
            <li>Local, per-browser history that you can delete at any time.</li>
          </ul>
          <p className="mt-2 font-medium text-slate-200">What is not implemented</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Payment processing of any kind.</li>
            <li>Accounts, cross-device history and shared team workspaces.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const FREE_PROVIDERS = [
  {
    name: 'Groq',
    url: 'https://console.groq.com/keys',
    model: 'llama-3.3-70b-versatile',
    note: 'Fastest option. Free key, about 30 requests/min and ~1,000 requests/day on the 70B model.',
  },
  {
    name: 'Google Gemini',
    url: 'https://aistudio.google.com/apikey',
    model: 'gemini-2.5-flash',
    note: 'Free key from AI Studio. Generous per-minute limits; daily caps vary by model.',
  },
  {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/keys',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    note: 'One key for many models. Use a model whose name ends in “:free” so nothing is billed.',
  },
  {
    name: 'Cerebras',
    url: 'https://cloud.cerebras.ai/',
    model: 'llama-3.3-70b',
    note: 'Very fast inference on a free tier with daily token limits.',
  },
  {
    name: 'Ollama (local)',
    url: 'https://ollama.com/download',
    model: 'llama3.2',
    note: 'No key at all — runs on your own machine. Slower, and only while your machine is on.',
  },
]

export function Contact() {
  useSeo({
    title: 'Contact — Code Vexa',
    description: 'How to reach the team behind Code Vexa.',
    path: '/contact',
  })
  return (
    <PageShell
      title="Contact"
      intro="Questions, bug reports about the Code Vexa itself, or a request for a Team workspace — here is how to reach us."
    >
      <Block title="Email">
        <p className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-electric-300" aria-hidden="true" />
          <a href="mailto:hello@example.com" className="link">
            hello@example.com
          </a>
        </p>
        <p className="text-xs text-slate-500">
          This is a placeholder address in the example deployment. Replace it with your real support address before
          launch.
        </p>
      </Block>
      <Block title="Found a problem with an analysis?">
        <p>
          The fastest path is to re-run the analysis with the full error message and a stack trace included. If it still
          looks wrong, send us the input and the analysis you got — that is the most useful bug report we can receive.
        </p>
      </Block>
      <Block title="Use a free API key">
        <p>
          The app ships in demo mode until a server-side AI key is configured. These providers give you a free key, and
          the backend already has a preset for each one — you only set two environment variables.
        </p>
        <ul className="mt-1 space-y-2.5">
          {FREE_PROVIDERS.map((p) => (
            <li key={p.name} className="rounded-lg border border-white/[0.06] bg-ink-950/50 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <a href={p.url} target="_blank" rel="noreferrer noopener" className="text-[13px] font-semibold text-slate-100 hover:text-white">
                  {p.name}
                </a>
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-electric-300">{p.model}</code>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{p.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3">Then set, on the server (never in the browser bundle):</p>
        <pre className="overflow-x-auto rounded-lg bg-ink-950/80 p-3 font-mono text-[11.5px] leading-5 text-slate-300">
{`AI_PROVIDER=groq
AI_API_KEY=your-free-key-here
# AI_MODEL=llama-3.3-70b-versatile   (optional override)`}
        </pre>
        <p className="text-xs text-slate-500">
          Locally that means a <code className="font-mono">.env</code> file next to <code className="font-mono">netlify.toml</code>; on Netlify it means
          Site configuration → Environment variables. The README has the exact commands.
        </p>
      </Block>
      <Block title="Paying by UPI">
        <p>
          The UPI number and the exact steps are on the{' '}
          <Link to="/pricing" className="link">
            pricing page
          </Link>
          . After sending a transfer, email the 12-digit reference number so it can be matched and confirmed.
        </p>
      </Block>
      <Block title="Security">
        <p>
          Please do not include secrets or production credentials in any report. Redact the code before sending it.
        </p>
      </Block>
      <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3 text-xs text-emerald-200">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        We never ask for your API keys, passwords or card details.
      </div>
    </PageShell>
  )
}

export function SignIn() {
  useSeo({
    title: 'Sign In — Code Vexa',
    description: 'Accounts are not implemented yet; the debugging workspace works without signing in.',
    path: '/signin',
    noindex: true,
  })
  return (
    <div className="container-page flex min-h-[70vh] max-w-lg flex-col justify-center py-14">
      <div className="panel px-6 py-8">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-electric-500/20 to-violet-500/20 text-electric-300 ring-1 ring-white/10">
          <Bug className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-white">Accounts are not available yet</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          There is no authentication in this build, so there is no sign-in form here pretending otherwise. The debugging
          workspace is fully usable without an account, and your analysis history is kept privately in this browser.
        </p>

        <ul className="mt-5 space-y-2 text-sm text-slate-300">
          {[
            'Debug without signing in',
            'History saved locally and deletable at any time',
            'No passwords stored anywhere',
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/workspace" className="btn-primary flex-1">
            Start Debugging
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/history" className="btn-secondary flex-1">
            View local history
          </Link>
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
          Adding real accounts requires an authentication provider and a database (for example Supabase Auth or Auth0
          plus Postgres). The README documents where that integration would plug in.
        </p>
      </div>
    </div>
  )
}

export function NotFound() {
  useSeo({
    title: 'Page not found — Code Vexa',
    description: 'That page does not exist.',
    path: '/404',
    noindex: true,
  })
  return (
    <div className="container-page flex min-h-[70vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-6xl font-semibold text-white/10">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">This route does not exist</h1>
      <p className="mt-2 text-sm text-slate-400">
        The page you asked for was not found. It may have moved, or the link may be mistyped.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link to="/" className="btn-secondary">
          Back to home
        </Link>
        <Link to="/workspace" className="btn-primary">
          Open the workspace
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

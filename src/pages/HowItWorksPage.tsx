import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Cpu, EyeOff, FileCheck2, KeyRound, ShieldCheck } from 'lucide-react'
import { useSeo } from '../lib/seo'

const FLOW = [
  {
    step: '01',
    title: 'Input is validated in the browser',
    body: 'Empty code, oversized files and unsupported uploads are caught before a request is made, with an inline message explaining what to fix.',
  },
  {
    step: '02',
    title: 'The backend re-validates everything',
    body: 'The server enforces its own size limits, rejects unknown languages, strips control characters and rate-limits per IP address. Client-side checks are never trusted.',
  },
  {
    step: '03',
    title: 'Your input is framed as data, not instructions',
    body: 'The code is placed inside an explicit untrusted-input block in the prompt, and the model is instructed to ignore any instructions found inside it. This reduces prompt-injection risk from pasted code or error text.',
  },
  {
    step: '04',
    title: 'The model answers with a strict schema',
    body: 'The provider is asked for a JSON object with a fixed shape — summary, severity, cause, location, snippets, steps, tips, confidence. The server validates that shape before replying, and normalises optional fields.',
  },
  {
    step: '05',
    title: 'Results are rendered, never executed',
    body: 'Suggested code is displayed as text with syntax highlighting. It is not evaluated, and it is not written into your editor unless you explicitly apply it.',
  },
]

export function HowItWorksPage() {
  useSeo({
    title: 'How It Works — Code Vexa',
    description:
      'How Code Vexa validates input, calls the AI model, validates the structured response, and keeps your code out of execution paths.',
    path: '/how-it-works',
  })

  return (
    <div className="container-page max-w-4xl py-14">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-300/80">How it works</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          What happens between paste and fix
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Five stages, each with a specific job. Nothing here relies on your code being executed — the analysis is
          reasoning over text, which is also why it can be wrong and why it says when it is unsure.
        </p>
      </header>

      <ol className="mt-12 space-y-3">
        {FLOW.map((item) => (
          <li key={item.step} className="panel flex gap-4 px-5 py-4">
            <span className="font-mono text-sm text-electric-300/70">{item.step}</span>
            <div>
              <h2 className="text-sm font-semibold text-white">{item.title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="mt-3.5 text-sm font-semibold text-white">What we do not do</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] text-slate-400">
            <li>Run, compile or sandbox your code.</li>
            <li>Store your code in a database.</li>
            <li>Log your source code.</li>
            <li>Invent a line number when it cannot be determined.</li>
          </ul>
        </div>
        <div className="panel p-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-electric-400/20 bg-electric-500/10 text-electric-300">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="mt-3.5 text-sm font-semibold text-white">Model configuration</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            The provider and model are chosen by the operator with server-side environment variables. Free-key presets
            ship for Groq, Google Gemini, OpenRouter, Cerebras and a local Ollama model; paid OpenAI and Anthropic keys
            and any other OpenAI-compatible endpoint work too.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: KeyRound, title: 'Keys stay server-side', body: 'Only the Netlify function reads AI_API_KEY. The browser bundle never contains it.' },
          { icon: ShieldCheck, title: 'Rate limited', body: 'A per-IP sliding window stops runaway usage; platform limits can be layered on top.' },
          { icon: Boxes, title: 'No execution sandbox', body: 'Because nothing is executed, no sandbox is needed. If execution is added later, it must be isolated and time-limited.' },
        ].map((card) => (
          <div key={card.title} className="panel-flat p-4">
            <card.icon className="h-4 w-4 text-electric-300" aria-hidden="true" />
            <h3 className="mt-2.5 text-[13px] font-semibold text-white">{card.title}</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link to="/workspace" className="btn-primary">
          <FileCheck2 className="h-4 w-4" aria-hidden="true" />
          Analyse a real error
        </Link>
        <Link to="/features" className="btn-secondary">
          See the features
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

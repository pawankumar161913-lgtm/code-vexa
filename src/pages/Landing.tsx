import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Braces,
  Bug,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Code2,
  Database,
  FileSearch,
  GitCompare,
  GraduationCap,
  Lock,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Wand2,
  Zap,
} from 'lucide-react'
import { useSeo } from '../lib/seo'
import { HeroEditorPreview } from '../components/HeroEditorPreview'
import { LANGUAGES } from '../lib/types'

export function Landing() {
  useSeo({
    title: 'AI Bug Detective — Find the bug. Understand the cause. Fix it faster.',
    description:
      'Paste code and an error message, and get the likely cause, the bug location, a corrected snippet, a diff and a step-by-step explanation. Supports JavaScript, TypeScript, Python, Java, C, C++, SQL, PHP, HTML and CSS.',
    path: '/',
  })

  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Languages />
      <Pricing />
      <Faq />
    </>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div className="container-page relative pb-16 pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-electric-300" aria-hidden="true" />
            AI debugging with explanations, not guesses
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            Your Personal{' '}
            <span className="bg-gradient-to-r from-electric-300 via-electric-400 to-violet-400 bg-clip-text text-transparent">
              AI Debugging Engineer
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
            Paste your code and the error you are seeing. AI Bug Detective identifies the likely bug, explains why it
            happens, shows exactly where it lives, and gives you a corrected snippet with a step-by-step explanation —
            so you understand the fix instead of copy-pasting blindly.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/workspace" className="btn-primary w-full px-6 py-3 text-[15px] sm:w-auto">
              <Bug className="h-4 w-4" aria-hidden="true" />
              Start Debugging
            </Link>
            <a href="#features" className="btn-secondary w-full px-6 py-3 text-[15px] sm:w-auto">
              Explore Features
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80" aria-hidden="true" /> No account needed to start
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400/80" aria-hidden="true" /> Your code is never executed
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-emerald-400/80" aria-hidden="true" /> 10 languages supported
            </li>
          </ul>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <HeroEditorPreview />
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: ScanSearch,
    title: 'Root-cause analysis',
    body: 'A concise summary, severity with reasoning, the likely cause, and the file and line where the problem lives — only when it can actually be determined.',
  },
  {
    icon: GitCompare,
    title: 'Side-by-side diffs',
    body: 'See the original snippet and the suggested fix as a real line diff, then copy it or apply it to the editor — only when you choose to.',
  },
  {
    icon: GraduationCap,
    title: 'Beginner-friendly mode',
    body: 'Every analysis includes a plain-language explanation of the error and the fix, without assuming you know the framework internals.',
  },
  {
    icon: FileSearch,
    title: 'Stack trace parsing',
    body: 'Paste the full trace. The analysis picks the first frame that belongs to your code, not the framework, and starts there.',
  },
  {
    icon: TestTube2,
    title: 'Test suggestions',
    body: 'Get a minimal reproduction plus test cases that would have caught the bug, written in your language’s usual testing style.',
  },
  {
    icon: ShieldCheck,
    title: 'Prevention tips',
    body: 'Each fix comes with concrete practices — lints, guards, validation at the boundary — so the same class of bug stops recurring.',
  },
  {
    icon: Braces,
    title: 'Ten languages',
    body: 'JavaScript, TypeScript, Python, Java, C, C++, HTML, CSS, SQL and PHP, with the editor’s highlighting following your selection.',
  },
  {
    icon: Zap,
    title: 'Honest confidence',
    body: 'A qualified confidence score with the reason behind it. When the evidence is thin, the analysis says what is missing instead of inventing a line number.',
  },
] as const

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-white/[0.06] py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to go from error to understanding"
          subtitle="Built for the moment you are staring at a stack trace at 11pm. Clear findings, real explanations, no theatre."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel group p-5 transition-colors hover:border-white/[0.14]">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-electric-400/20 bg-electric-500/10 text-electric-300">
                <f.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    icon: ClipboardPaste,
    title: 'Paste code and the error',
    body: 'Drop in a snippet or upload a file, pick the language, and add the error message or stack trace. Describe what you expected to happen if it helps.',
  },
  {
    icon: ScanSearch,
    title: 'The AI reads the evidence',
    body: 'The backend sends your input to a configurable model with a strict schema. It separates confirmed syntax errors from suspected logic issues and flags what it cannot verify.',
  },
  {
    icon: Wand2,
    title: 'Understand, then fix',
    body: 'Review the cause, the diff and the explanation. Copy the fix, apply it to the editor when you are ready, and re-run the analysis on the updated code.',
  },
] as const

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-white/[0.06] py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from broken to understood"
          subtitle="No build setup, no dependency install, no sending your whole repository. Just the code that is failing."
        />
        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="panel relative p-6">
              <span className="absolute right-5 top-5 font-mono text-xs text-slate-600">0{i + 1}</span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-electric-500/20 to-violet-500/20 text-electric-300 ring-1 ring-white/10">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link to="/workspace" className="btn-secondary">
            Try it with a sample bug
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Languages() {
  return (
    <section id="languages" className="scroll-mt-20 border-t border-white/[0.06] py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Supported languages"
          title="Ten languages, one workspace"
          subtitle="The editor’s highlighting, the fix snippets and the test suggestions all follow the language you select."
        />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {LANGUAGES.map((lang) => (
            <span
              key={lang.id}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-mono text-sm text-slate-200"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-electric-400 to-violet-400" aria-hidden="true" />
              {lang.label}
              <span className="text-[11px] text-slate-500">.{lang.ext}</span>
            </span>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          Other languages can still be analysed by describing them in the expected-behaviour field, but highlighting and
          tailored test suggestions are only guaranteed for the list above.
        </p>
      </div>
    </section>
  )
}

export const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tagline: 'For occasional debugging and trying the product out.',
    features: [
      '10 analyses per day',
      'All 10 supported languages',
      'Cause, severity and suggested fix',
      'Diff view, copy and apply-to-editor',
      'Local analysis history in your browser',
    ],
    cta: 'Start Debugging',
    to: '/workspace',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    cadence: 'per month',
    tagline: 'For working developers debugging every day.',
    features: [
      '300 analyses per month',
      'Longer files and full stack traces',
      'Test suggestions and minimal reproductions',
      'Saved history across devices',
      'Priority queue during peak load',
    ],
    cta: 'Join the Pro waitlist',
    to: '/pricing',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$29',
    cadence: 'per user / month',
    tagline: 'For teams that want shared debugging knowledge.',
    features: [
      'Everything in Pro',
      'Shared workspaces and saved sessions',
      'Team-wide prevention checklists',
      'Usage reporting per member',
      'Centralised billing',
    ],
    cta: 'Talk to us about Team',
    to: '/contact',
    highlight: false,
  },
] as const

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-white/[0.06] py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple tiers, clearly labelled examples"
          subtitle="These are example prices and limits for a product still in development. Nothing here is charged today."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`panel relative flex flex-col p-6 ${
                tier.highlight ? 'border-electric-400/30 ring-1 ring-electric-400/20' : ''
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-electric-500 to-violet-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Most useful
                </span>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold text-white">{tier.price}</span>
                <span className="text-xs text-slate-500">{tier.cadence}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{tier.tagline}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] text-slate-300">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={tier.to}
                className={`mt-6 w-full ${tier.highlight ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          No payment provider is connected yet, so no plan can be purchased from this site. See the{' '}
          <Link to="/pricing" className="link">
            pricing page
          </Link>{' '}
          for what is and is not implemented.
        </p>
      </div>
    </section>
  )
}

const FAQS = [
  {
    q: 'Is my code stored or executed?',
    a: 'No. Submitted code is never executed, evaluated or written to disk on the server. It is forwarded to the configured AI provider to produce the analysis and then discarded. The only copy kept is the one in your own browser’s local history, which you can delete at any time.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. The debugging workspace works without signing in. Analysis history is stored locally in your browser. Accounts, saved history across devices and team workspaces are planned features, not implemented yet — the sign-in page says so plainly.',
  },
  {
    q: 'What happens if no AI key is configured?',
    a: 'The app runs in demo mode: a small set of built-in sample bugs is answered with clearly labelled demo analyses, marked “Demo analysis — not produced by AI”. Arbitrary code cannot be analysed until a server-side AI key is set.',
  },
  {
    q: 'How accurate is the line number?',
    a: 'It is only reported when it can be derived from your code or stack trace. When it cannot be determined the analysis says “Not determinable” rather than guessing, and the confidence score is qualified with the reason it is limited.',
  },
  {
    q: 'Which languages are supported?',
    a: 'JavaScript, TypeScript, Python, Java, C, C++, HTML, CSS, SQL and PHP, with editor highlighting and tailored test suggestions for each.',
  },
  {
    q: 'Can it fix my code automatically?',
    a: 'It suggests a corrected snippet and shows a diff. It never overwrites your editor until you press “Apply fix to editor” and confirm. Your original code is kept in the analysis panel either way.',
  },
  {
    q: 'What are the usage limits?',
    a: 'The backend rate-limits requests per IP address and caps the size of the code and error message you can submit. The numbers in the pricing section are example values and are documented in the README as configurable.',
  },
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="scroll-mt-20 border-t border-white/[0.06] py-20">
      <div className="container-page max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions developers actually ask" />
        <div className="mt-10 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/60">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-slate-100">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{faq.a}</p>}
              </div>
            )
          })}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Database className="h-3.5 w-3.5" aria-hidden="true" />
          Still curious how input is handled? Read the{' '}
          <Link to="/privacy" className="link">
            privacy notes
          </Link>
          .
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-300/80">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">{subtitle}</p>}
    </div>
  )
}

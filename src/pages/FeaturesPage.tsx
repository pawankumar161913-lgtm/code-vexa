import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  FileCode2,
  FileSearch,
  GitCompare,
  GraduationCap,
  Layers,
  ScanSearch,
  ShieldCheck,
  Terminal,
  TestTube2,
  Wand2,
} from 'lucide-react'
import { useSeo } from '../lib/seo'

const GROUPS = [
  {
    title: 'Diagnosis',
    items: [
      {
        icon: ScanSearch,
        title: 'Root-cause analysis',
        body: 'A concise bug summary, severity with a reason, the likely cause, and the location — file and line only when they can be derived from your input or stack trace.',
      },
      {
        icon: FileSearch,
        title: 'Stack trace analysis',
        body: 'The first frame that belongs to your code is used as the starting point, instead of the framework internals that usually sit on top.',
      },
      {
        icon: ShieldCheck,
        title: 'Confirmed vs suspected',
        body: 'Syntax and compile errors are reported as confirmed. Logic issues, null-reference risks and incorrect conditions are labelled as suspicions, with a confidence score that explains itself.',
      },
    ],
  },
  {
    title: 'Fixes',
    items: [
      {
        icon: GitCompare,
        title: 'Diff viewer',
        body: 'The original snippet and the suggested fix are shown as a real line diff with added and removed counts.',
      },
      {
        icon: Wand2,
        title: 'Apply only on request',
        body: 'Nothing is ever written into your editor automatically. Press “Apply fix to editor” and confirm, and the original stays visible in the results.',
      },
      {
        icon: BookOpen,
        title: 'Step-by-step explanation',
        body: 'Each fix comes with ordered steps describing what changed and why, so you can defend the change in review.',
      },
    ],
  },
  {
    title: 'Learning and prevention',
    items: [
      {
        icon: GraduationCap,
        title: 'Beginner-friendly explanation',
        body: 'A plain-language version of the error and the fix, without assuming framework knowledge.',
      },
      {
        icon: TestTube2,
        title: 'Test suggestions',
        body: 'A minimal reproduction plus tests that would have caught the bug, in your language’s usual testing style.',
      },
      {
        icon: Layers,
        title: 'Related risks',
        body: 'Other plausible defects visible in the same snippet: unvalidated input, null references, resource leaks, injection risks.',
      },
    ],
  },
  {
    title: 'Workspace',
    items: [
      {
        icon: Terminal,
        title: 'IDE-style editor',
        body: 'Syntax highlighting for ten languages, line numbers, tab-to-indent, paste, upload and copy. Your code is displayed as text, never executed.',
      },
      {
        icon: FileCode2,
        title: 'Sample bugs and re-runs',
        body: 'Ten built-in buggy snippets to try the product, and a Re-run button so you can iterate after editing.',
      },
      {
        icon: ShieldCheck,
        title: 'Private by default',
        body: 'No account required. History lives in your browser and can be deleted per session or entirely.',
      },
    ],
  },
]

export function FeaturesPage() {
  useSeo({
    title: 'Features — Code Vexa',
    description:
      'Root-cause analysis, stack trace parsing, diff viewer, apply-on-request fixes, beginner explanations, test suggestions and prevention tips for ten languages.',
    path: '/features',
  })

  return (
    <div className="container-page py-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-300/80">Features</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          A debugging partner, not an autocomplete
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
          Every feature below is implemented in this application. Where something depends on a server-side API key or a
          cloud service, that dependency is stated in the README.
        </p>
      </header>

      <div className="mt-12 space-y-12">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{group.title}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {group.items.map((item) => (
                <div key={item.title} className="panel p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-electric-400/20 bg-electric-500/10 text-electric-300">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3.5 text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 flex justify-center">
        <Link to="/workspace" className="btn-primary">
          Try it on a sample bug
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

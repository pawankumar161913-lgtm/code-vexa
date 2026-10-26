import { Link } from 'react-router-dom'
import { Github, Mail } from 'lucide-react'
import { Logo } from './Logo'

const GITHUB_URL = 'https://github.com/'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.07] bg-ink-950/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Find the bug. Understand the cause. Fix it faster. An AI debugging workspace that explains problems instead
            of just guessing at them.
          </p>
        </div>

        <FooterColumn
          title="Product"
          links={[
            { label: 'Workspace', to: '/workspace' },
            { label: 'Features', to: '/features' },
            { label: 'How It Works', to: '/how-it-works' },
            { label: 'Pricing', to: '/pricing' },
          ]}
        />
        <FooterColumn
          title="Resources"
          links={[
            { label: 'Sample bugs', to: '/workspace?examples=1' },
            { label: 'History', to: '/history' },
            { label: 'FAQ', to: '/#faq' },
            { label: 'GitHub', to: GITHUB_URL, external: true },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { label: 'Privacy', to: '/privacy' },
            { label: 'Terms', to: '/terms' },
            { label: 'Contact', to: '/contact' },
            { label: 'Sign In', to: '/signin' },
          ]}
        />
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="container-page flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} AI Bug Detective. Sample prices and limits are configurable examples.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 hover:text-slate-300">
              <Github className="h-3.5 w-3.5" aria-hidden="true" /> GitHub
            </a>
            <Link to="/contact" className="inline-flex items-center gap-1.5 hover:text-slate-300">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; to: string; external?: boolean }[]
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.to}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link to={link.to} className="text-sm text-slate-400 transition-colors hover:text-white">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

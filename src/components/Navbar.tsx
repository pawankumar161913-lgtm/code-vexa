import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Bug, ArrowRight } from 'lucide-react'
import { Logo } from './Logo'

const LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        scrolled ? 'border-white/10 bg-ink-950/85 backdrop-blur-xl' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/history" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-white">
            History
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/signin" className="btn-ghost btn-sm px-3 py-2 text-sm">
            Sign In
          </Link>
          <Link to="/workspace" className="btn-primary btn-sm px-3.5 py-2 text-sm">
            <Bug className="h-4 w-4" aria-hidden="true" />
            Start Debugging
          </Link>
        </div>

        <button
          type="button"
          className="btn-ghost -mr-2 p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-ink-950/95 px-5 pb-5 pt-3 backdrop-blur-xl md:hidden">
          <div className="flex flex-col">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/history"
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              History
            </Link>
            <Link
              to="/signin"
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Sign In
            </Link>
          </div>
          <button
            type="button"
            onClick={() => navigate('/workspace')}
            className="btn-primary mt-3 w-full"
          >
            Start Debugging
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  )
}

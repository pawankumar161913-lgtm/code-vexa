import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5 rounded-lg" aria-label="Code Vexa — home">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-electric-500 to-violet-500 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="2.1" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" strokeLinecap="round" />
          <path d="M8 9.5 9.8 11.2 8 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.5 13h3" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-white">Code Vexa</span>
          <span className="mt-0.5 hidden text-[9.5px] uppercase tracking-[0.14em] text-slate-500 group-hover:text-slate-400 sm:block">
            find · understand · fix
          </span>
        </span>
      )}
    </Link>
  )
}

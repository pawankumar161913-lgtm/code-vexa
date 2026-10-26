import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({
  value,
  label = 'Copy',
  className = '',
  small = false,
}: {
  value: string
  label?: string
  className?: string
  small?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const el = document.createElement('textarea')
        el.value = value
        el.setAttribute('readonly', '')
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setFailed(false)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setFailed(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setFailed(false), 2500)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`btn-secondary ${small ? 'btn-sm' : ''} ${className}`}
      aria-label={copied ? 'Copied to clipboard' : `${label} to clipboard`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{failed ? 'Press Ctrl+C' : copied ? 'Copied' : label}</span>
    </button>
  )
}

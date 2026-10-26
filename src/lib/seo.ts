import { useEffect } from 'react'

interface SeoOptions {
  title: string
  description: string
  path?: string
  noindex?: boolean
}

const SITE = (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://code-vexa.netlify.app'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Per-route document title, description, canonical and robots directives. */
export function useSeo({ title, description, path, noindex }: SeoOptions) {
  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    const url = `${SITE}${path ?? window.location.pathname}`
    setMeta('property', 'og:url', url)
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, description, path, noindex])
}

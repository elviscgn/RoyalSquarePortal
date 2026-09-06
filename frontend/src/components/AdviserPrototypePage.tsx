import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { hydratePrototypeIcons } from './PrototypePage'
import adviserMobileCss from '../adviser-mobile.css?raw'

type AdviserPrototypeRoute = 'dashboard' | 'inbox' | 'clients'

type AdviserPrototypeWindow = Window & {
  lucide?: { createIcons: () => void }
  __adviserSetInterval?: typeof window.setInterval
  __adviserSetTimeout?: typeof window.setTimeout
  [key: string]: unknown
}

type PrototypePayload = {
  markup: string
  scripts: string
}

function functionNames(source: string) {
  return [...source.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1])
}

function readPrototype(parsed: Document): PrototypePayload {
  const scripts = [...parsed.body.querySelectorAll('script:not([src])')]
    .map((script) => script.textContent ?? '')
    .join('\n')

  parsed.querySelectorAll('script, link, meta, title').forEach((node) => node.remove())
  return { markup: parsed.body.innerHTML, scripts }
}

function adviserDestination(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href') ?? ''
  const label = anchor.textContent?.replace(/\s+/g, ' ').trim() ?? ''

  if (anchor.classList.contains('sidebar-brand') || href === 'adviser_ui.html') return '/adviser'
  if (href === '#home' || label === 'Home') return '/adviser'
  if (href === '#inbox' || href === 'adviser_ui.html#inbox' || label === 'Inbox') return '/adviser/inbox'
  if (href === '#clients' || label === 'Clients') return '/adviser/clients'
  return null
}

export function AdviserPrototypePage({ source, route }: { source: string; route: AdviserPrototypeRoute }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [payload, setPayload] = useState<PrototypePayload | null>(null)
  const navigate = useNavigate()

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest<HTMLAnchorElement>('a[href]')
    if (!anchor) return
    const destination = adviserDestination(anchor)
    if (!destination) return
    event.preventDefault()
    navigate(destination)
  }

  useEffect(() => {
    let cancelled = false
    const previousTitle = document.title

    fetch(source)
      .then((response) => response.text())
      .then((html) => {
        if (cancelled) return
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const style = document.createElement('style')
        style.id = `adviser-prototype-styles-${route}`
        style.textContent = `${parsed.querySelector('style')?.textContent ?? ''}
.adviser-prototype-host { display: flex; min-height: 100vh; position: relative; width: 100%; }
${adviserMobileCss}
`
        document.head.appendChild(style)
        document.title = parsed.title
        setPayload(readPrototype(parsed))
      })

    return () => {
      cancelled = true
      document.getElementById(`adviser-prototype-styles-${route}`)?.remove()
      document.title = previousTitle
    }
  }, [route, source])

  useEffect(() => {
    const root = hostRef.current
    if (!root || !payload) return

    const prototypeWindow = window as unknown as AdviserPrototypeWindow
    const previousGlobals = new Map<string, { present: boolean; value: unknown }>()
    const remember = (name: string) => {
      if (!previousGlobals.has(name)) {
        previousGlobals.set(name, { present: name in prototypeWindow, value: prototypeWindow[name] })
      }
    }

    functionNames(payload.scripts).forEach(remember)
    ;['lucide', '__adviserSetInterval', '__adviserSetTimeout'].forEach(remember)

    const listenerCleanups: Array<() => void> = []
    const intervalIds: number[] = []
    const timeoutIds: number[] = []
    const originalWindowAddEventListener = window.addEventListener
    const originalDocumentAddEventListener = document.addEventListener
    const originalSetInterval = window.setInterval
    const originalSetTimeout = window.setTimeout

    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      originalWindowAddEventListener.call(window, type, listener, options)
      listenerCleanups.push(() => window.removeEventListener(type, listener, options))
    }) as typeof window.addEventListener

    document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      originalDocumentAddEventListener.call(document, type, listener, options)
      listenerCleanups.push(() => document.removeEventListener(type, listener, options))
    }) as typeof document.addEventListener

    prototypeWindow.__adviserSetInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = originalSetInterval.call(window, handler, timeout, ...args)
      intervalIds.push(id)
      return id
    }) as typeof window.setInterval

    prototypeWindow.__adviserSetTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = originalSetTimeout.call(window, handler, timeout, ...args)
      timeoutIds.push(id)
      return id
    }) as typeof window.setTimeout

    prototypeWindow.lucide = { createIcons: () => hydratePrototypeIcons(root) }

    let iconSweepQueued = false
    const iconObserver = new MutationObserver(() => {
      if (iconSweepQueued || !root.querySelector('[data-lucide]')) return
      iconSweepQueued = true
      queueMicrotask(() => {
        iconSweepQueued = false
        hydratePrototypeIcons(root)
      })
    })
    iconObserver.observe(root, { childList: true, subtree: true })

    const script = document.createElement('script')
    const exposedFunctions = payload.scripts.replace(
      /function\s+([A-Za-z_$][\w$]*)\s*\(/g,
      'window.$1 = function $1(',
    )
    const managedTimers = exposedFunctions
      .replace(/\bsetInterval\s*\(/g, 'window.__adviserSetInterval(')
      .replace(/\bsetTimeout\s*\(/g, 'window.__adviserSetTimeout(')

    try {
      script.textContent = `(function () {\n${managedTimers}\n})();`
      root.appendChild(script)
      hydratePrototypeIcons(root)
    } finally {
      window.addEventListener = originalWindowAddEventListener
      document.addEventListener = originalDocumentAddEventListener
    }

    return () => {
      iconObserver.disconnect()
      listenerCleanups.forEach((cleanup) => cleanup())
      intervalIds.forEach((id) => window.clearInterval(id))
      timeoutIds.forEach((id) => window.clearTimeout(id))
      script.remove()

      previousGlobals.forEach(({ present, value }, name) => {
        if (present) prototypeWindow[name] = value
        else delete prototypeWindow[name]
      })
    }
  }, [payload])

  return (
    <div
      className={`adviser-prototype-host adviser-prototype-${route}`}
      ref={hostRef}
      onClick={handleClick}
      dangerouslySetInnerHTML={payload ? { __html: payload.markup } : undefined}
    />
  )
}

const CACHE_NAME = 'royal-square-shell-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/royal-square-logo.png',
  '/latoya-matai.png',
  '/qiniso-ntuli.png',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-512.png',
  '/apple-touch-icon.png',
  '/prototype/client_ui.html',
  '/prototype/client_requests_ui.html',
  '/prototype/client_documents.html',
  '/prototype/client_consent.html',
  '/prototype/client_change_bank_prot1.html',
  '/prototype/client_report.html',
  '/prototype/royal-square-logo.png',
  '/prototype-adviser/adviser_ui.html',
  '/prototype-adviser/adviser_inbox.html',
  '/prototype-adviser/adviser_clients.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(APP_SHELL)

    const indexResponse = await fetch('/index.html')
    const indexMarkup = await indexResponse.text()
    const builtAssets = [...indexMarkup.matchAll(/(?:src|href)="(\/assets\/[^"?]+)(?:\?[^\"]*)?"/g)]
      .map((match) => match[1])
    await cache.addAll([...new Set(builtAssets)])
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/demo-assets/documents/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', response.clone()))
          return response
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})

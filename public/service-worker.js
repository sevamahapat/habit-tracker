// Bloom service worker — installable PWA + offline shell.
// Bump CACHE_VERSION whenever the cache strategy changes; per-asset
// invalidation is handled by network-first + Vite's hashed filenames.

const CACHE_VERSION = 'bloom-v2'
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const FONT_CACHE = `${CACHE_VERSION}-fonts`

// App shell: pre-cached at install so the first offline boot has something.
// Hashed asset URLs are added on first fetch via the runtime cache.
const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) =>
        Promise.all(
          APP_SHELL.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => (res.ok ? cache.put(url, res) : null))
              .catch(() => null),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        if (self.clients.openWindow) return self.clients.openWindow('/')
      }),
  )
})

const isSameOrigin = (url) => url.origin === self.location.origin
const isFontRequest = (url) =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Don't intercept Supabase or any other API calls — let them queue/fail
  // naturally and surface real network state to the app.
  if (!isSameOrigin(url) && !isFontRequest(url)) return

  // Navigations: network-first, fall back to cached index.html so the SPA
  // can boot offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() =>
          caches.match(request).then((m) => m || caches.match('/index.html')),
        ),
    )
    return
  }

  // Google Fonts: stale-while-revalidate (always serve cached, refresh in bg).
  if (isFontRequest(url)) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone())
              return res
            })
            .catch(() => null)
          return cached || network
        }),
      ),
    )
    return
  }

  // Same-origin assets (JS, CSS, icons): network-first, fall back to cache.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
        }
        return res
      })
      .catch(() => caches.match(request)),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

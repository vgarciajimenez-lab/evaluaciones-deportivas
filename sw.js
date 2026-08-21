// Service worker mínimo, solo para que la web sea "instalable" como app.
// A propósito NO guarda copia en caché de index.html: como esta app se
// actualiza a menudo subiendo un nuevo index.html, cachearlo agresivamente
// haría que la gente viera versiones antiguas tras cada cambio. Los datos
// siempre requieren conexión a internet (vienen de Supabase), así que el
// beneficio real de esta PWA es el icono/instalación, no el uso sin conexión.

const CACHE_NAME = 'eval-deportiva-static-v1';
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept the main document (index.html) or Supabase API calls:
  // always go to the network so you get the latest version and live data.
  if (event.request.mode === 'navigate' || url.hostname.includes('supabase.co')) {
    return;
  }

  // For small static assets (icons, manifest): try network first, fall
  // back to cache if offline.
  if (STATIC_ASSETS.some((asset) => event.request.url.endsWith(asset.replace('./', '')))) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

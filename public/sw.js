/* CubIQ · service worker. La versión y la lista de precarga las rellena vite.config.js en cada build. */
const V = '__VERSION__', PRECACHE = /*__PRECACHE__*/[], C = 'cubiq-' + V;
const SCOPE = self.registration.scope;
const abs = (u) => new URL(u, SCOPE).href;
const isInScope = (url) => url.origin === self.location.origin && url.href.startsWith(SCOPE);


// Instalación: precarga completa y atómica. Si falla un recurso, no se activa una
// versión incompleta de la aplicación y la versión anterior sigue disponible.
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(C);
  await cache.addAll(PRECACHE.map((url) => new Request(abs(url), { cache: 'reload' })));
  await self.skipWaiting();
})()));


// Activación: conserva únicamente la caché de la versión actual y toma el control.
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith('cubiq-') && key !== C).map((key) => caches.delete(key)));
  await self.clients.claim();
})()));


self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (!isInScope(url) || !PRECACHE.length) return; // desarrollo: no interferir con Vite

  // Navegación: devuelve la página precargada para que el inicio offline sea fiable.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(C);
      const offlinePage = await cache.match(abs('./')) || await cache.match(abs('./index.html'));
      try {
        const response = await fetch(request);
        return response.ok ? response : (offlinePage || response);
      } catch (_) {
        return offlinePage || new Response('CubIQ no está disponible sin conexión.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // Recursos estáticos: caché primero. Los nombres generados por Vite incluyen hash.
  event.respondWith((async () => {
    const cache = await caches.open(C);
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic' && response.headers.get('Cache-Control') !== 'no-store') {
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch (error) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});

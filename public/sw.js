/* CubIQ · service worker. La versión y la lista de precarga las rellena vite.config.js en cada build. */
const V = '__VERSION__', PRECACHE = /*__PRECACHE__*/[], C = 'cubiq-' + V;
const abs = (u) => new URL(u, self.registration.scope).href;

// Instalación: todo lo necesario para funcionar sin conexión se descarga de una vez (en paralelo).
self.addEventListener('install', (e) => e.waitUntil(
  caches.open(C)
    .then((c) => c.addAll(PRECACHE.map((u) => new Request(abs(u), { cache: 'reload' }))))
    .then(() => self.skipWaiting())
));

// Activación: borra cachés de versiones anteriores y toma el control.
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('cubiq-') && k !== C).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())
));

// Fetch: caché primero (los archivos llevan hash en el nombre, así que nunca quedan obsoletos).
// Las actualizaciones llegan con un sw.js nuevo (la versión cambia con el contenido), no con red en cada carga.
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || !PRECACHE.length) return; // en desarrollo (sin lista) no se interviene
  if (new URL(r.url).origin !== location.origin) return;
  const nav = r.mode === 'navigate';
  e.respondWith(
    caches.match(nav ? abs('./') : r, { ignoreSearch: nav }).then((hit) => hit || fetch(r).then((res) => {
      if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(C).then((c) => c.put(r, cp)); }
      return res;
    }))
  );
});

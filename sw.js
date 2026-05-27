/* ═══════════════════════════════════════════════════════════════════════
   Lévitad — Service Worker
   Cachea imágenes (Cloudinary + locales) para que cargas posteriores
   vengan del disco. Pensado para usuarios con red lenta o intermitente.

   Estrategia: cache-first para imágenes con fallback a red.
   - Cloudinary versiona las URLs (/upload/.../v123/...), así que un
     cambio de imagen genera URL distinta → cachear "para siempre" es seguro.
   - Solo intercepta requests GET de imágenes; cualquier otra cosa
     (API de GitHub, JSON, scripts) pasa de largo al fetch normal.

   Para invalidar todo el caché de imágenes (raro): subir el número de
   versión en CACHE_NAME. El activate borra los cachés viejos.
   ═══════════════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'levitad-img-v2';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k.startsWith('levitad-') && k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    let url;
    try { url = new URL(req.url); } catch (_) { return; }

    // Solo nos interesan imágenes. Cualquier otra cosa pasa al fetch normal.
    const esCloudinary = url.hostname === 'res.cloudinary.com';
    const esImagenLocal = /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url.pathname);
    if (!esCloudinary && !esImagenLocal) return;

    e.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(req).then(cached => {
                if (cached) return cached;
                // Para Cloudinary forzamos modo CORS (lo soporta) para obtener
                // respuestas con status legible — así evitamos cachear 404/500
                // como "opaque" y dejar imágenes rotas permanentes.
                const fetchReq = esCloudinary
                    ? new Request(req.url, { mode: 'cors', credentials: 'omit' })
                    : req;
                return fetch(fetchReq).then(res => {
                    if (res && res.ok && res.status === 200) {
                        cache.put(req, res.clone()).catch(() => {});
                    }
                    return res;
                }).catch(() => cached || Response.error());
            })
        )
    );
});

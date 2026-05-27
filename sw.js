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

const CACHE_IMG  = 'levitad-img-v1';
const CACHE_DATA = 'levitad-data-v1';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    const vigentes = new Set([CACHE_IMG, CACHE_DATA]);
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k.startsWith('levitad-') && !vigentes.has(k))
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

    // 1) Catálogo (datos.json): stale-while-revalidate.
    //    Servimos la versión cacheada al instante; en paralelo bajamos la nueva
    //    y la guardamos. La próxima visita ve los cambios. Esto da carga inicial
    //    instantánea y soporte offline para el catálogo.
    if (url.pathname.endsWith('/datos/datos.json') || url.pathname.endsWith('datos.json')) {
        e.respondWith(
            caches.open(CACHE_DATA).then(cache =>
                cache.match(req).then(cached => {
                    const red = fetch(req).then(res => {
                        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
                        return res;
                    }).catch(() => cached);
                    return cached || red;
                })
            )
        );
        return;
    }

    // 2) Imágenes: cache-first.
    //    Cloudinary versiona las URLs, así que cachear "para siempre" es seguro.
    const esCloudinary  = url.hostname === 'res.cloudinary.com';
    const esImagenLocal = /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url.pathname);
    if (esCloudinary || esImagenLocal) {
        e.respondWith(
            caches.open(CACHE_IMG).then(cache =>
                cache.match(req).then(cached => {
                    if (cached) return cached;
                    return fetch(req).then(res => {
                        if (res && (res.ok || res.type === 'opaque')) {
                            cache.put(req, res.clone()).catch(() => {});
                        }
                        return res;
                    }).catch(() => cached || Response.error());
                })
            )
        );
        return;
    }

    // 3) Cualquier otra cosa pasa al fetch normal del navegador.
});

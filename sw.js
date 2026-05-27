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

// CACHE_IMG sube a v2: el v1 guardaba respuestas opacas (cross-origin sin CORS)
// que a veces eran bytes truncados. El activate borra v1 al instalar este SW.
const CACHE_IMG  = 'levitad-img-v2';
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
    //    IMPORTANTE: para Cloudinary forzamos `mode: 'cors'` y `credentials: 'omit'`
    //    aunque el <img> sea no-cors. Sin esto, la respuesta llega como `opaque` y
    //    no podemos saber si es 200 OK o un error truncado — terminábamos cacheando
    //    imágenes corruptas. Cloudinary devuelve `Access-Control-Allow-Origin: *`,
    //    así que el CORS funciona sin tocar el HTML.
    const esCloudinary  = url.hostname === 'res.cloudinary.com';
    const esImagenLocal = /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url.pathname);
    if (esCloudinary || esImagenLocal) {
        const reqFetch = esCloudinary
            ? new Request(req.url, { method: 'GET', mode: 'cors', credentials: 'omit' })
            : req;
        e.respondWith(
            caches.open(CACHE_IMG).then(cache =>
                cache.match(req).then(cached => {
                    if (cached) return cached;
                    return fetch(reqFetch).then(res => {
                        // Solo cacheamos si el status es OK y la respuesta NO es opaca.
                        // Las opacas (cross-origin sin CORS) pueden ser bytes truncados
                        // o errores disfrazados — caché venenoso. Mejor refetch que servir basura.
                        if (res && res.ok && res.type !== 'opaque') {
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

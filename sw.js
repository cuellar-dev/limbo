/* ═══════════════════════════════════════════════════════════════════════
   Lévitad — Service Worker
   Cachea el "app-shell" (HTML/CSS/JS), las imágenes (Cloudinary + locales)
   y el catálogo (datos.json) para que el sitio cargue rápido y funcione
   offline. Pensado para usuarios con red lenta o intermitente.

   Estrategias:
   - App-shell (HTML): network-first → si no hay red, sirve index.html cacheado.
   - Estáticos (CSS/JS/fuentes/manifest): stale-while-revalidate (rápido + fresco).
   - Imágenes: cache-first (Cloudinary versiona URLs, cachear es seguro).
   - datos.json: stale-while-revalidate.

   Para forzar actualización tras un deploy: sube el número de versión del
   caché correspondiente (CACHE_SHELL / CACHE_IMG / CACHE_DATA). El `activate`
   borra los cachés viejos de 'levitad-'.
   ═══════════════════════════════════════════════════════════════════════ */

const CACHE_SHELL = 'levitad-shell-v1';
// CACHE_IMG sube a v2: el v1 guardaba respuestas opacas (cross-origin sin CORS)
// que a veces eran bytes truncados. El activate borra v1 al instalar este SW.
const CACHE_IMG  = 'levitad-img-v2';
const CACHE_DATA = 'levitad-data-v1';

// Archivos núcleo que permiten arrancar la app sin red. NO incluimos las
// fuentes ni GSAP aquí: se cachean bajo demanda (las fuentes vía SWR; GSAP es
// CDN externa con SRI y el código degrada bien si falta).
const SHELL_ASSETS = [
    './',
    'index.html',
    'Css/style.css',
    'Css/angel.css',
    'js/js.js',
    'js/angel.js',
    'js/vendor/masonry.pkgd.min.js',
    'favicon.svg',
    'site.webmanifest'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    // Precache resiliente: si un asset falla, no tumba toda la instalación.
    e.waitUntil(
        caches.open(CACHE_SHELL).then(cache =>
            Promise.allSettled(SHELL_ASSETS.map(u => cache.add(u)))
        )
    );
});

self.addEventListener('activate', (e) => {
    const vigentes = new Set([CACHE_SHELL, CACHE_IMG, CACHE_DATA]);
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

    const mismoOrigen = url.origin === self.location.origin;

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

    // 3) Navegaciones (HTML): network-first con fallback offline al index cacheado.
    //    Online ves siempre el HTML fresco; offline arranca el app-shell.
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req)
                .then(res => {
                    if (res && res.ok && mismoOrigen) {
                        const copia = res.clone();
                        caches.open(CACHE_SHELL).then(c => c.put('index.html', copia)).catch(() => {});
                    }
                    return res;
                })
                .catch(() => caches.match('index.html').then(c => c || caches.match('./')))
        );
        return;
    }

    // 4) Estáticos propios (CSS/JS/fuentes/manifest): stale-while-revalidate.
    //    Sirve del caché al instante y refresca en segundo plano para la próxima carga.
    if (mismoOrigen && /\.(css|js|mjs|woff2?|ttf|otf|webmanifest)(\?|$)/i.test(url.pathname)) {
        e.respondWith(
            caches.open(CACHE_SHELL).then(cache =>
                cache.match(req).then(cached => {
                    const red = fetch(req).then(res => {
                        if (res && res.ok && res.type !== 'opaque') {
                            cache.put(req, res.clone()).catch(() => {});
                        }
                        return res;
                    }).catch(() => cached);
                    return cached || red;
                })
            )
        );
        return;
    }

    // 5) Cualquier otra cosa pasa al fetch normal del navegador.
});

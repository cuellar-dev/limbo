/* ═══════════════════════════════════════════════
   ÁNGEL — mascota pixel art de Lévitad
   Importá este script al final del <body>,
   después de js.js:
   <script src="js/angel.js"></script>
═══════════════════════════════════════════════ */

(function () {

/* ── SVG del ángel: se construye por JS para poder
      reutilizarlo y cambiarle partes fácilmente ── */

function buildAngelSVG(state) {
    const isCart   = state === 'cart';
    const isEmpty  = state === 'empty';
    const isFilter = state === 'filter';
    const isSearch = state === 'search';
    const isWalk   = state === 'walk';

    /* colores */
    const C_SKIN  = '#f5d9b8';
    const C_ROBE  = '#E2E2E2';
    const C_FOLD  = '#c8c8c8';
    const C_GOLD  = '#caac47';
    const C_DARK  = '#1B2233';
    const C_NAVY  = '#2b3755';
    const C_LIPS  = '#c8956a';
    const C_GREY  = '#9BA4B5';

    /* expresión según estado */
    const mouth = isCart
        ? `<path d="M12 14 Q16 18 20 14" fill="none" stroke="${C_LIPS}" stroke-width="1.2"/>`
        : isEmpty
            ? `<rect x="13" y="14" width="5" height="1" fill="${C_LIPS}"/>`
            : `<path d="M13 14 Q16 16 19 14" fill="none" stroke="${C_LIPS}" stroke-width="1"/>`;

    /* ojos según estado */
    const eyes = isEmpty
        ? `<line x1="11" y1="11" x2="15" y2="11" stroke="${C_DARK}" stroke-width="1.5"/>
           <line x1="17" y1="11" x2="21" y2="11" stroke="${C_DARK}" stroke-width="1.5"/>`
        : `<g class="angel-eyes">
               <rect x="11" y="9" width="3" height="3" fill="${C_DARK}"/>
               <rect x="18" y="9" width="3" height="3" fill="${C_DARK}"/>
               <rect x="12" y="9" width="1" height="1" fill="#fff" opacity="0.7"/>
               <rect x="19" y="9" width="1" height="1" fill="#fff" opacity="0.7"/>
           </g>`;

    /* alas: más abiertas cuando salta */
    const wingLPoints = isCart ? '-6,18 11,22 7,36' : '0,24 11,22 9,32';
    const wingRPoints = isCart ? '38,18 21,22 25,36' : '32,24 21,22 23,32';

    /* extras por estado */
    let extras = '';

    if (isCart) {
        extras = `
        <text class="angel-star-l" x="-8" y="12" font-size="10" fill="${C_GOLD}" font-family="monospace">✦</text>
        <text class="angel-star-r" x="34" y="10" font-size="10" fill="${C_GOLD}" font-family="monospace">✦</text>
        <text class="angel-star-t" x="12" y="-2" font-size="8"  fill="${C_GOLD}" font-family="monospace">✦</text>`;
    }

    if (isEmpty) {
        extras = `
        <text class="angel-zzz1" x="24" y="8"  font-size="8"  fill="${C_GREY}" font-family="monospace">z</text>
        <text class="angel-zzz2" x="29" y="4"  font-size="7"  fill="${C_GREY}" font-family="monospace">z</text>`;
    }

    if (isWalk) {
        /* bolsita de compra en la mano derecha */
        extras = `
        <rect x="22" y="26" width="10" height="9" fill="${C_GOLD}" rx="1"/>
        <rect x="24" y="24" width="6" height="3" fill="none" stroke="#a68966" stroke-width="1.5"/>
        <rect x="24" y="29" width="6" height="1" fill="#a68966"/>`;
    }

    if (isSearch) {
        /* lupa en mano derecha */
        extras = `
        <circle cx="26" cy="28" r="5" fill="none" stroke="${C_GOLD}" stroke-width="1.5"/>
        <line   x1="30" y1="32" x2="33" y2="35" stroke="${C_GOLD}" stroke-width="1.5"/>`;
    }

    if (isFilter) {
        /* papelito con líneas de filtro */
        extras = `
        <rect x="22" y="22" width="12" height="16" fill="#fff" rx="1" stroke="${C_FOLD}" stroke-width="0.5"/>
        <line x1="24" y1="26" x2="32" y2="26" stroke="${C_GREY}" stroke-width="1"/>
        <line x1="24" y1="29" x2="32" y2="29" stroke="${C_GOLD}" stroke-width="1"/>
        <line x1="24" y1="32" x2="30" y2="32" stroke="${C_GREY}" stroke-width="1"/>`;
    }

    return `
    <svg class="angel-svg" viewBox="-10 -6 52 66"
         xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true">

        ${extras}

        <!-- alas -->
        <polygon class="angel-wingL" points="${wingLPoints}"
                 fill="${C_ROBE}" opacity="0.92"/>
        <polygon class="angel-wingR" points="${wingRPoints}"
                 fill="${C_ROBE}" opacity="0.92"/>

        <g class="angel-body">

            <!-- halo -->
            <ellipse class="angel-halo"
                     cx="16" cy="4" rx="9" ry="3"
                     fill="none" stroke="${C_GOLD}" stroke-width="2"/>

            <!-- cabeza -->
            <g class="angel-head">
                <rect x="9" y="6"  width="14" height="12" fill="${C_SKIN}"/>
                ${eyes}
                ${mouth}
            </g>

            <!-- cuello / hombros -->
            <rect x="9" y="18" width="14" height="4" fill="${C_ROBE}"/>

            <!-- capa larga con pliegues -->
            <polygon points="7,22 25,22 27,56 5,56" fill="${C_ROBE}"/>
            <!-- pliegues internos -->
            <line x1="10" y1="24" x2="8"  y2="56" stroke="${C_FOLD}" stroke-width="1"/>
            <line x1="16" y1="23" x2="16" y2="56" stroke="${C_FOLD}" stroke-width="1"/>
            <line x1="22" y1="24" x2="24" y2="56" stroke="${C_FOLD}" stroke-width="1"/>
            <!-- borde dorado inferior de la capa -->
            <line x1="5" y1="56" x2="27" y2="56" stroke="${C_GOLD}" stroke-width="1.8"/>
            <!-- detalle dorado en el cuello -->
            <rect x="13" y="19" width="6" height="2" fill="${C_GOLD}" opacity="0.5"/>

            <!-- manitas -->
            <rect x="4"  y="28" width="5" height="5" fill="${C_SKIN}"/>
            <rect x="23" y="28" width="5" height="5" fill="${C_SKIN}"/>

        </g>
    </svg>`;
}

/* ── Crear / actualizar el elemento DOM ── */
let angelEl = null;

function getAngel() {
    if (!angelEl) {
        angelEl = document.createElement('div');
        angelEl.className = 'angel-wrap';
        angelEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(angelEl);
    }
    return angelEl;
}

/* ── Mostrar con estado y posición ── */
function showAngel(state, pos) {
    const el = getAngel();

    /* Quitar todas las clases de estado y posición anteriores */
    el.className = 'angel-wrap';

    /* Vaciar y reconstruir el SVG para el estado */
    el.innerHTML = buildAngelSVG(state);

    /* Añadir clases nuevas */
    el.classList.add(`angel-state-${state}`, `pos-${pos}`);

    /* Pequeño delay para que la transición de opacidad se vea */
    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('is-visible'));
    });
}

function hideAngel() {
    if (!angelEl) return;
    angelEl.classList.remove('is-visible');
}

/* ══════════════════════════════════════════════
   LÓGICA DE CONTEXTO
   Detecta qué está pasando en la web y
   cambia el estado del angelito en consecuencia
══════════════════════════════════════════════ */

let currentContext = 'idle';
let contextTimer   = null;

function setContext(ctx) {
    if (ctx === currentContext) return;
    currentContext = ctx;

    clearTimeout(contextTimer);

    switch (ctx) {
        case 'search':
            showAngel('search', 'search');
            break;
        case 'filter':
            showAngel('filter', 'filtros');
            break;
        case 'cart':
            showAngel('cart', 'carrito');
            break;
        case 'empty':
            showAngel('empty', 'empty');
            break;
        case 'walk':
            showAngel('walk', 'catalog');
            /* vuelve a idle después de 4 s sin interacción */
            contextTimer = setTimeout(() => setContext('idle'), 4000);
            break;
        case 'idle':
        default:
            showAngel('idle', 'idle');
            break;
    }
}

/* ── Observadores ── */
function initAngelObservers() {

    /* 1. BUSCADOR activo → estado search */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        const obsSearch = new MutationObserver(() => {
            if (searchBar.classList.contains('is-active')) {
                setContext('search');
            } else if (currentContext === 'search') {
                setContext('idle');
            }
        });
        obsSearch.observe(searchBar, { attributes: true, attributeFilter: ['class'] });
    }

    /* 2. MODAL FILTROS abierto → estado filter */
    const bodyObs = new MutationObserver(() => {
        const filtrosModal = document.getElementById('modal-filtros');
        if (filtrosModal) {
            if (currentContext !== 'filter') setContext('filter');
        } else if (currentContext === 'filter') {
            setContext('idle');
        }

        /* CARRITO PANEL abierto → estado cart */
        const carritoPanel = document.getElementById('carrito-panel');
        if (carritoPanel && carritoPanel.classList.contains('is-active')) {
            if (currentContext !== 'cart') setContext('cart');
        } else if (currentContext === 'cart') {
            setContext('idle');
        }
    });
    bodyObs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    /* 3. SIN RESULTADOS visible → estado empty */
    const emptyObs = new MutationObserver(() => {
        const emptyEl = document.getElementById('estado-sin-resultados');
        if (emptyEl && emptyEl.classList.contains('is-visible')) {
            setContext('empty');
        } else if (currentContext === 'empty') {
            setContext('idle');
        }
    });
    /* observar el body para cuando se cree el elemento dinámico */
    bodyObs.observe(document.body, { childList: true });

    /* 4. Click en tarjeta de producto → walk (el angelito se anima) */
    document.addEventListener('click', (e) => {
        if (e.target.closest('.tarjeta-producto')) {
            if (currentContext === 'idle' || currentContext === 'walk') {
                setContext('walk');
            }
        }
    });

    /* 5. Añadir al carrito → salto breve de alegría aunque el panel no esté abierto */
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-anadir')) {
            const prev = currentContext;
            setContext('cart');
            /* si el carrito no está abierto, vuelve al estado anterior en 2 s */
            const panel = document.getElementById('carrito-panel');
            if (!panel || !panel.classList.contains('is-active')) {
                clearTimeout(contextTimer);
                contextTimer = setTimeout(() => setContext(prev === 'cart' ? 'idle' : prev), 2000);
            }
        }
    });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    /* Estado inicial: idle */
    setContext('idle');
    initAngelObservers();
});

})();
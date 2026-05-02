(function () {

/* ─────────────────────────────────────────────
   SVG del ángel — construido por JS
───────────────────────────────────────────── */
function buildAngelSVG(state) {
    const isCart   = state === 'cart';
    const isEmpty  = state === 'empty';
    const isFilter = state === 'filter';
    const isSearch = state === 'search';
    const isWalk   = state === 'walk';

    const C_SKIN = '#f5d9b8';
    const C_ROBE = '#E2E2E2';
    const C_FOLD = '#c8c8c8';
    const C_GOLD = '#caac47';
    const C_DARK = '#1B2233';
    const C_LIPS = '#c8956a';
    const C_GREY = '#9BA4B5';

    const mouth = isCart
        ? `<path d="M12 14 Q16 18 20 14" fill="none" stroke="${C_LIPS}" stroke-width="1.2"/>`
        : isEmpty
            ? `<rect x="13" y="14" width="5" height="1" fill="${C_LIPS}"/>`
            : `<path d="M13 14 Q16 16 19 14" fill="none" stroke="${C_LIPS}" stroke-width="1"/>`;

    const eyes = isEmpty
        ? `<line x1="11" y1="11" x2="15" y2="11" stroke="${C_DARK}" stroke-width="1.5"/>
           <line x1="17" y1="11" x2="21" y2="11" stroke="${C_DARK}" stroke-width="1.5"/>`
        : `<g class="angel-eyes">
               <rect x="11" y="9" width="3" height="3" fill="${C_DARK}"/>
               <rect x="18" y="9" width="3" height="3" fill="${C_DARK}"/>
               <rect x="12" y="9" width="1" height="1" fill="#fff" opacity="0.7"/>
               <rect x="19" y="9" width="1" height="1" fill="#fff" opacity="0.7"/>
           </g>`;

    const wingLPoints = isCart ? '-6,18 11,22 7,36' : '0,24 11,22 9,32';
    const wingRPoints = isCart ? '38,18 21,22 25,36' : '32,24 21,22 23,32';

    let extras = '';
    if (isCart) {
        extras = `
        <text class="angel-star-l" x="-8" y="12" font-size="10" fill="${C_GOLD}" font-family="monospace">✦</text>
        <text class="angel-star-r" x="34" y="10" font-size="10" fill="${C_GOLD}" font-family="monospace">✦</text>
        <text class="angel-star-t" x="12" y="-2" font-size="8"  fill="${C_GOLD}" font-family="monospace">✦</text>`;
    } else if (isEmpty) {
        extras = `
        <text class="angel-zzz1" x="24" y="8" font-size="8" fill="${C_GREY}" font-family="monospace">z</text>
        <text class="angel-zzz2" x="29" y="4" font-size="7" fill="${C_GREY}" font-family="monospace">z</text>`;
    } else if (isWalk) {
        extras = `
        <rect x="22" y="26" width="10" height="9" fill="${C_GOLD}" rx="1"/>
        <rect x="24" y="24" width="6"  height="3" fill="none" stroke="#a68966" stroke-width="1.5"/>
        <rect x="24" y="29" width="6"  height="1" fill="#a68966"/>`;
    } else if (isSearch) {
        extras = `
        <!-- Lupa centrada en el ojo derecho -->
        <circle class="angel-lupa-vidrio" cx="19.5" cy="10.5" r="5" fill="none" stroke="${C_GOLD}" stroke-width="1.2"/>
        <line class="angel-lupa-mango" x1="23" y1="14" x2="26" y2="17" stroke="${C_GOLD}" stroke-width="1.5"/>`;
    } else if (isFilter) {
        extras = `
        <rect x="22" y="22" width="12" height="16" fill="#fff" rx="1" stroke="${C_FOLD}" stroke-width="0.5"/>
        <line x1="24" y1="26" x2="32" y2="26" stroke="${C_GREY}" stroke-width="1"/>
        <line x1="24" y1="29" x2="32" y2="29" stroke="${C_GOLD}" stroke-width="1"/>
        <line x1="24" y1="32" x2="30" y2="32" stroke="${C_GREY}" stroke-width="1"/>`;
    }

    return `<svg class="angel-svg" viewBox="-10 -6 52 66" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="angel-main-container">
        <polygon class="angel-wingL" points="${wingLPoints}" fill="${C_ROBE}" opacity="0.92"/>
        <polygon class="angel-wingR" points="${wingRPoints}" fill="${C_ROBE}" opacity="0.92"/>
        <g class="angel-body">
            <ellipse class="angel-halo" cx="16" cy="4" rx="9" ry="3" fill="none" stroke="${C_GOLD}" stroke-width="2"/>
            <g class="angel-head">
                <rect x="9" y="6" width="14" height="12" fill="${C_SKIN}"/>
                ${eyes}
                ${mouth}
                ${extras}
            </g>
            <rect x="9" y="18" width="14" height="4" fill="${C_ROBE}"/>
            <polygon points="7,22 25,22 27,56 5,56" fill="${C_ROBE}"/>
            <line x1="10" y1="24" x2="8"  y2="56" stroke="${C_FOLD}" stroke-width="1"/>
            <line x1="16" y1="23" x2="16" y2="56" stroke="${C_FOLD}" stroke-width="1"/>
            <line x1="22" y1="24" x2="24" y2="56" stroke="${C_FOLD}" stroke-width="1"/>
            <line x1="5"  y1="56" x2="27" y2="56" stroke="${C_GOLD}" stroke-width="1.8"/>
            <rect x="13" y="19" width="6" height="2" fill="${C_GOLD}" opacity="0.5"/>
            <rect x="4"  y="28" width="5" height="5" fill="${C_SKIN}"/>
            <rect x="23" y="28" width="5" height="5" fill="${C_SKIN}"/>
        </g>
        </g>
    </svg>`;
}

/* ─────────────────────────────────────────────
   Elemento DOM
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Mostrar / cambiar estado

   Si ya hay SVG visible: hace fade-out → cambia SVG → fade-in
   para evitar saltos bruscos en las animaciones.
───────────────────────────────────────────── */
const FADE_DURATION = 350; // ms — debe coincidir con transition en angel.css
let   fadeTimer     = null;

function showAngel(state, pos) {
    const el      = getAngel();
    const visible = el.classList.contains('is-visible');

    function applyState() {
        // Limpiar todas las clases y aplicar el nuevo estado
        el.className = `angel-wrap pos-${pos} angel-state-${state}`;
        el.innerHTML  = buildAngelSVG(state);

        // Siguiente frame para que el navegador registre el cambio antes de la transición
        requestAnimationFrame(() => {
            requestAnimationFrame(() => el.classList.add('is-visible'));
        });
    }

    clearTimeout(fadeTimer);

    if (visible) {
        // Fade-out primero, luego cambiar
        el.classList.remove('is-visible');
        fadeTimer = setTimeout(applyState, FADE_DURATION);
    } else {
        applyState();
    }
}

function hideAngel() {
    if (!angelEl) return;
    clearTimeout(fadeTimer);
    angelEl.classList.remove('is-visible');
    fadeTimer = setTimeout(() => {
        if (angelEl && !angelEl.classList.contains('is-visible')) {
            angelEl.innerHTML = '';
        }
    }, FADE_DURATION);
}

/* ─────────────────────────────────────────────
   Lógica de contexto
───────────────────────────────────────────── */
// null inicial: así la primera llamada a setContext('idle') NO queda bloqueada
let currentContext = null;
let contextTimer   = null;

function setContext(ctx) {
    if (ctx === currentContext) return;
    currentContext = ctx;
    clearTimeout(contextTimer);

    switch (ctx) {
        case 'search': showAngel('search', 'search');  break;
        case 'filter': showAngel('filter', 'filtros'); break;
        case 'cart':   showAngel('cart',   'carrito'); break;
        case 'empty':  showAngel('empty',  'empty');   break;
        case 'walk':
            showAngel('walk', 'catalog');
            contextTimer = setTimeout(() => setContext('idle'), 4000);
            break;
        case 'idle':
        default:
            showAngel('idle', 'idle');
            break;
    }
}

/* ─────────────────────────────────────────────
   Observadores — cada uno observa su propio elemento
   para evitar loops y falsas detecciones
───────────────────────────────────────────── */
function watchClass(el, className, onActive, onInactive) {
    if (!el) return;
    new MutationObserver(() => {
        if (el.classList.contains(className)) onActive();
        else                                  onInactive();
    }).observe(el, { attributes: true, attributeFilter: ['class'] });
}

function initAngelObservers() {
    // 1. Barra de búsqueda
    watchClass(
        document.getElementById('search-bar'),
        'is-active',
        () => setContext('search'),
        () => { if (currentContext === 'search') setContext('idle'); }
    );

    // 2. Modal de filtros
    watchClass(
        document.querySelector('.modal-filtros-overlay'),
        'is-active',
        () => setContext('filter'),
        () => { if (currentContext === 'filter') setContext('idle'); }
    );

    // 3. Panel del carrito
    watchClass(
        document.querySelector('.carrito-panel'),
        'is-active',
        () => setContext('cart'),
        () => { if (currentContext === 'cart') setContext('idle'); }
    );

    // 4. Estado sin resultados
    watchClass(
        document.getElementById('estado-sin-resultados'),
        'is-visible',
        () => setContext('empty'),
        () => { if (currentContext === 'empty') setContext('idle'); }
    );

    // 5. Click en tarjeta de producto → walk
    document.addEventListener('click', (e) => {
        if (e.target.closest('.tarjeta-producto') && !e.target.closest('.btn-anadir')) {
            if (currentContext === 'idle' || currentContext === 'walk') {
                setContext('walk');
            }
        }
    });

    // 6. Click en "añadir al carrito" → salto de alegría breve
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-anadir')) {
            const prev  = currentContext;
            const panel = document.querySelector('.carrito-panel');
            setContext('cart');
            // Si el panel no está abierto, vuelve al estado anterior en 2 s
            if (!panel || !panel.classList.contains('is-active')) {
                clearTimeout(contextTimer);
                contextTimer = setTimeout(
                    () => setContext(prev === 'cart' ? 'idle' : prev),
                    2000
                );
            }
        }
    });
}

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    setContext('idle');     // currentContext es null → entra sin problema
    initAngelObservers();
});

})();

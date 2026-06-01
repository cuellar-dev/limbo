/* ╔════════════════════════════════════════════════════════════╗
   ║  Panel admin — Lévitad                                       ║
   ║  Lee y escribe datos/datos.json en el repo de GitHub vía API ║
   ╚════════════════════════════════════════════════════════════╝ */

const REPO        = 'cuellar-dev/limbo';
const BRANCH      = 'main';
const FILE_PATH   = 'datos/datos.json';
const SESSION_KEY = 'levitad-admin-token';
const TEMA_KEY    = 'levitad-admin-tema';

const API = 'https://api.github.com';

const CLOUDINARY = {
    cloudName:    'ddhwh86yd',
    uploadPreset: 'levitad_unsigned',
    folder:       'levitad'
};

/* ─── Utilidades ─── */
function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function utf8ToBase64(str) {
    return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}
function base64ToUtf8(b64) {
    const clean = b64.replace(/\s+/g, '');
    return new TextDecoder().decode(Uint8Array.from(atob(clean), c => c.charCodeAt(0)));
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function authHeaders(token, extra) {
    return Object.assign({
        'Authorization': 'token ' + token,
        'Accept':        'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    }, extra || {});
}

/* ─── Toasts ─── */
function aviso(tipo, titulo, mensaje) {
    const cont = document.getElementById('aviso-cont');
    const el = document.createElement('div');
    el.className = 'aviso aviso--' + (tipo || 'info');
    el.innerHTML = `<b></b><span></span>`;
    el.querySelector('b').textContent     = titulo || '';
    el.querySelector('span').textContent  = mensaje || '';
    cont.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));
    setTimeout(() => {
        el.classList.remove('is-visible');
        setTimeout(() => el.remove(), 400);
    }, 4200);
}

/* ─── Estado en memoria ─── */
const state = {
    token: '',
    data: { productos: [], outfits: [] },
    sha: null,
    cambios: false,
    tab: 'productos',
    filtroModo: 'todos',
    busquedaProd: '',
    busquedaOut: ''
};

/* ─── Tema (oscuro/claro) ─── */
function aplicarTema() {
    const guardado = localStorage.getItem(TEMA_KEY);
    if (guardado === 'light') document.body.classList.add('is-light');
}
document.getElementById('btn-tema')?.addEventListener('click', () => {
    const esClaro = document.body.classList.toggle('is-light');
    localStorage.setItem(TEMA_KEY, esClaro ? 'light' : 'dark');
});
aplicarTema();

/* ─── Login ─── */
const loginForm = document.getElementById('login-form');
const loginBtn  = document.getElementById('login-btn');
const tokenInput = document.getElementById('token');
const recordarChk = document.getElementById('recordar');

async function validarToken(token) {
    const r = await fetch(`${API}/repos/${REPO}`, { headers: authHeaders(token) });
    if (r.status === 401 || r.status === 403) return { ok: false, motivo: 'Token inválido o sin permisos sobre el repo.' };
    if (r.status === 404) return { ok: false, motivo: 'No se encontró el repo o el token no tiene acceso.' };
    if (!r.ok) return { ok: false, motivo: 'Error inesperado: ' + r.status };
    return { ok: true };
}

async function cargarDatos() {
    const url = `${API}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const r = await fetch(url, { headers: authHeaders(state.token) });
    if (!r.ok) throw new Error('No se pudo leer datos.json (' + r.status + ')');
    const meta = await r.json();
    const texto = base64ToUtf8(meta.content);
    const json = JSON.parse(texto);
    state.data = {
        productos: Array.isArray(json.productos) ? json.productos : [],
        outfits:   Array.isArray(json.outfits)   ? json.outfits   : []
    };
    state.sha = meta.sha;
}

async function guardarEnGitHub() {
    const cuerpo = {
        message: 'Actualizar catálogo desde panel admin',
        content: utf8ToBase64(JSON.stringify(state.data, null, 2) + '\n'),
        sha:     state.sha,
        branch:  BRANCH
    };
    const r = await fetch(`${API}/repos/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: authHeaders(state.token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(cuerpo)
    });
    if (r.status === 409 || r.status === 422) {
        throw new Error('CONFLICTO');
    }
    if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error('GitHub ' + r.status + ': ' + txt.slice(0, 180));
    }
    const res = await r.json();
    state.sha = res.content.sha;
}

async function iniciarApp() {
    document.getElementById('login-wrap').style.display = 'none';
    document.getElementById('app').classList.add('is-active');
    aviso('info', 'Cargando catálogo…', 'Leyendo datos del repositorio.');
    try {
        await cargarDatos();
        renderProductos();
        renderOutfits();
        aviso('exito', 'Listo', `Cargados ${state.data.productos.length} productos y ${state.data.outfits.length} outfits.`);
    } catch (e) {
        aviso('error', 'Error al cargar', e.message || String(e));
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = tokenInput.value.trim();
    if (!token) return;
    loginBtn.disabled = true;
    loginBtn.innerHTML = 'Validando<span class="spinner"></span>';
    try {
        const res = await validarToken(token);
        if (!res.ok) {
            aviso('error', 'No se pudo entrar', res.motivo);
            return;
        }
        state.token = token;
        if (recordarChk.checked) sessionStorage.setItem(SESSION_KEY, token);
        await iniciarApp();
    } catch (err) {
        aviso('error', 'Fallo de red', 'Revisa tu conexión y vuelve a intentarlo.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
});

// Auto-login si hay token de sesión
(async function autologin() {
    const guardado = sessionStorage.getItem(SESSION_KEY);
    if (!guardado) return;
    const res = await validarToken(guardado);
    if (res.ok) {
        state.token = guardado;
        iniciarApp();
    } else {
        sessionStorage.removeItem(SESSION_KEY);
    }
})();

document.getElementById('btn-salir').addEventListener('click', () => {
    if (state.cambios && !confirm('Tienes cambios sin guardar. ¿Salir y perderlos?')) return;
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
});

/* ─── Marca de cambios pendientes ─── */
function marcarCambios() {
    state.cambios = true;
    const est = document.getElementById('estado-cambios');
    const btn = document.getElementById('btn-guardar');
    est.textContent = '● Cambios sin guardar';
    est.classList.add('has-cambios');
    btn.disabled = false;
    btn.classList.add('has-cambios');
}
function limpiarCambios() {
    state.cambios = false;
    const est = document.getElementById('estado-cambios');
    const btn = document.getElementById('btn-guardar');
    est.textContent = 'Al día';
    est.classList.remove('has-cambios');
    btn.disabled = true;
    btn.classList.remove('has-cambios');
}

/* ─── Guardar en GitHub ─── */
document.getElementById('btn-guardar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    btn.innerHTML = 'Guardando<span class="spinner"></span>';
    try {
        await guardarEnGitHub();
        limpiarCambios();
        aviso('exito', 'Guardado en GitHub', 'GitHub Pages se actualizará en ~1 minuto.');
    } catch (e) {
        if (e.message === 'CONFLICTO') {
            aviso('error', 'Archivo cambió en GitHub',
                'Alguien o tú desde otro lado actualizó el archivo. Recarga la página y vuelve a aplicar tus cambios.');
        } else {
            aviso('error', 'No se pudo guardar', e.message);
        }
    } finally {
        const btn2 = document.getElementById('btn-guardar');
        btn2.textContent = 'Guardar en GitHub';
        if (state.cambios) btn2.disabled = false;
    }
});

/* ─── Tabs ─── */
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t === tab));
        state.tab = tab.dataset.tab;
        document.getElementById('tab-productos').hidden = state.tab !== 'productos';
        document.getElementById('tab-outfits').hidden   = state.tab !== 'outfits';
    });
});

/* ─── Render: lista de productos ─── */
function renderProductos() {
    const cont = document.getElementById('lista-prod');
    let items = state.data.productos;
    if (state.filtroModo !== 'todos') items = items.filter(p => (p.modo || 'stack') === state.filtroModo);
    if (state.busquedaProd) {
        const q = state.busquedaProd.toLowerCase();
        items = items.filter(p => (p.nombre || '').toLowerCase().includes(q));
    }
    if (!items.length) {
        cont.innerHTML = `<div class="vacio">No hay productos para mostrar.</div>`;
        return;
    }
    cont.innerHTML = items.map((p) => {
        const indiceReal = state.data.productos.indexOf(p);
        const img = (Array.isArray(p.imagenes) && p.imagenes[0]) || '';
        const modo = p.modo || 'stack';
        return `
            <div class="item" data-i="${indiceReal}">
                <img class="item-thumb" src="${esc(img)}" alt="">
                <div class="item-info">
                    <div class="item-nombre">${esc(p.nombre || '(sin nombre)')}</div>
                    <div class="item-meta">
                        <span>${esc(formatPrecio(p.precio))}</span>
                        <span class="badge badge--${modo}">${modo}</span>
                        <span>${esc(p.categoria || '—')}</span>
                    </div>
                </div>
                <div class="item-acciones">
                    <button class="btn-edit" type="button" aria-label="Editar">✎</button>
                    <button class="btn-del" type="button" aria-label="Borrar">🗑</button>
                </div>
            </div>
        `;
    }).join('');
    cont.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', e => {
        const i = Number(b.closest('.item').dataset.i);
        abrirEditorProducto(i);
    }));
    cont.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', e => {
        const i = Number(b.closest('.item').dataset.i);
        borrarProducto(i);
    }));
    engancharErrorImagenes(cont);
}

function engancharErrorImagenes(cont) {
    cont.querySelectorAll('.item-thumb').forEach(img => {
        img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
    });
}

/* ─── Cloudinary: subida de imágenes desde el navegador (unsigned) ─── */
function abrirSubidorCloudinary({ multiple = true } = {}, onUrl) {
    if (typeof cloudinary === 'undefined' || !cloudinary.createUploadWidget) {
        aviso('error', 'Subidor no disponible', 'No se cargó el widget de Cloudinary. Revisa tu conexión y recarga.');
        return;
    }
    const widget = cloudinary.createUploadWidget({
        cloudName:           CLOUDINARY.cloudName,
        uploadPreset:        CLOUDINARY.uploadPreset,
        folder:              CLOUDINARY.folder,
        multiple,
        sources:             ['local', 'camera', 'url'],
        defaultSource:       'local',
        cropping:            false,
        showAdvancedOptions: false,
        clientAllowedFormats:['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic'],
        maxFileSize:         10 * 1024 * 1024,  // 10 MB antes de la optimización
        language:            'es',
        text: {
            es: {
                or:           'o',
                menu: {
                    files:    'Mi dispositivo',
                    camera:   'Cámara',
                    url:      'URL'
                },
                local: {
                    browse:   'Elegir archivo',
                    dd_title_single: 'Arrastra una foto aquí',
                    dd_title_multi:  'Arrastra fotos aquí'
                }
            }
        },
        styles: {
            palette: {
                window:         '#141a29',
                sourceBg:       '#1b2233',
                windowBorder:   '#caac47',
                tabIcon:        '#caac47',
                inactiveTabIcon:'#9BA4B5',
                menuIcons:      '#caac47',
                link:           '#caac47',
                action:         '#caac47',
                inProgress:     '#caac47',
                complete:       '#3ecf8e',
                error:          '#e5484d',
                textDark:       '#0a0d18',
                textLight:      '#E2E2E2'
            }
        }
    }, (error, result) => {
        if (error) {
            aviso('error', 'Error al subir', (error && error.message) || 'No se pudo subir la imagen.');
            return;
        }
        if (!result) return;
        if (result.event === 'success') {
            const url = result.info && result.info.secure_url;
            if (url && typeof onUrl === 'function') onUrl(optimizarUrlCloudinary(url));
        }
        if (result.event === 'queues-end') {
            aviso('exito', 'Subida lista', 'Las URLs se añadieron al campo de imágenes.');
        }
    });
    widget.open();
}

// Inserta `f_auto,q_auto` en la URL para que Cloudinary entregue WebP/AVIF
// al navegador que lo soporte (en vez de servir el .jpg/.png original).
// Si la URL ya trae transformaciones, no la duplica.
function optimizarUrlCloudinary(url) {
    if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
    if (url.includes('/upload/f_auto') || url.includes(',f_auto')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

function formatPrecio(p) {
    const n = Number(p) || 0;
    return '$' + n.toLocaleString('es-DO');
}

document.getElementById('buscar-prod').addEventListener('input', e => {
    state.busquedaProd = e.target.value.trim();
    renderProductos();
});
document.querySelectorAll('.filtros button').forEach(b => {
    b.addEventListener('click', () => {
        state.filtroModo = b.dataset.modo;
        document.querySelectorAll('.filtros button').forEach(x => x.classList.toggle('is-active', x === b));
        renderProductos();
    });
});
document.getElementById('btn-nuevo-prod').addEventListener('click', () => abrirEditorProducto(-1));

/* ─── Editor de producto (modal) ─── */
/* Etiquetas existentes en cualquier producto: el editor las muestra
   como chips para reutilizar la nomenclatura entre prendas. */
function obtenerTagsExistentes() {
	const set = new Set();
	(state.data.productos || []).forEach(p => {
		(p.tags || []).forEach(t => {
			const tag = String(t).trim().toLowerCase();
			if (tag) set.add(tag);
		});
	});
	return [...set].sort();
}

function abrirEditorProducto(indice) {
    const esNuevo = indice < 0;
    const p = esNuevo
        ? { nombre: '', precio: 0, categoria: '', modo: 'stack', tags: [], imagenes: [], detalles: {}, enlace: '', ventas: 0, interacciones: 0, pesoManual: 0 }
        : clone(state.data.productos[indice]);

    const detallesEntries = Object.entries(p.detalles || {});
    const detallesHTML = detallesEntries.map(([k, v]) => filaDetalle(k, v)).join('') || filaDetalle('', '');

    /* Chips de tags ya usados en otros productos — el dueño puede añadir o quitar con un click. */
    const tagsTodos    = obtenerTagsExistentes();
    const tagsActuales = new Set((p.tags || []).map(t => String(t).toLowerCase()));
    const tagsChipsHTML = tagsTodos.length
        ? `<p class="tags-chips-label">Etiquetas existentes — pulsa para añadir o quitar:</p><div class="tags-chips" id="f-tags-chips">${tagsTodos.map(t => `<button type="button" class="tag-chip${tagsActuales.has(t) ? ' is-active' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>`
        : `<p class="tags-chips-vacio">Aún no hay etiquetas registradas. Las que crees aquí estarán disponibles para reutilizar en próximas prendas.</p>`;

    const card = document.getElementById('modal-card');
    card.innerHTML = `
        <h2 id="modal-titulo">${esNuevo ? 'Nuevo producto' : 'Editar producto'}</h2>

        <div class="campo">
            <label>Nombre *</label>
            <input id="f-nombre" type="text" value="${esc(p.nombre)}" required>
        </div>

        <div class="campo">
            <label>Precio (en CUP, solo números) *</label>
            <input id="f-precio" type="number" min="0" step="1" value="${Number(p.precio) || 0}" required>
        </div>

        <div class="campo">
            <label>Categoría</label>
            <input id="f-categoria" type="text" value="${esc(p.categoria)}" placeholder="buzo, remera, pantalon, conjunto...">
            <div class="ayuda">Una sola palabra en minúsculas. Se agrupa por aquí en el panel "Categorías" de la web.</div>
        </div>

        <div class="campo">
            <label>Modo</label>
            <div class="modo-radios">
                <label><input type="radio" name="f-modo" value="stack" ${p.modo === 'stack' ? 'checked' : ''}> En Stack</label>
                <label><input type="radio" name="f-modo" value="encargue" ${p.modo === 'encargue' ? 'checked' : ''}> Encargue</label>
            </div>
        </div>

        <div class="campo">
            <label>Tags (separados por coma)</label>
            <input id="f-tags" type="text" value="${esc((p.tags || []).join(', '))}" placeholder="oversize, premium, urbano">
            ${tagsChipsHTML}
        </div>

        <div class="campo" id="campo-enlace" ${p.modo === 'encargue' ? '' : 'style="display:none"'}>
            <label>Enlace (solo encargue)</label>
            <input id="f-enlace" type="text" value="${esc(p.enlace || '')}" placeholder="https://...">
            <div class="ayuda">El enlace de donde viste esa prenda. Si no aplica, déjalo vacío.</div>
        </div>

        <div class="campo">
            <label>Imágenes (una URL por línea) *</label>
            <textarea id="f-imagenes" placeholder="https://imagen1.jpg&#10;https://imagen2.jpg">${esc((p.imagenes || []).join('\n'))}</textarea>
            <button id="btn-subir-img" class="btn-detalle-add" type="button">📤 Subir foto(s) a Cloudinary</button>
            <div class="ayuda">Sube desde tu dispositivo o pega URLs a mano. La primera imagen es la principal. Cloudinary las optimiza solo (WebP, máx. 1200px).</div>
        </div>

        <div class="campo">
            <label>Detalles (clave / valor)</label>
            <div id="f-detalles" class="detalles-list">${detallesHTML}</div>
            <button id="btn-detalle-add" class="btn-detalle-add" type="button">+ Añadir campo</button>
            <div class="ayuda">Por ejemplo: Talla → XL, Color → Naranja, Material → Algodón, Stock → 8 unidades.</div>
        </div>

        <div class="campo">
            <label>Peso manual (0–20)</label>
            <input id="f-peso-manual" type="number" min="0" step="1" value="${Number(p.pesoManual) || 0}">
            <div class="ayuda">Empuje extra para que el producto aparezca antes en "Más vendidos" y recomendaciones. 0 = neutral, 20 = máximo destacado.</div>
        </div>

        <div class="modal-acciones">
            <button class="btn-secundario" id="btn-cancelar" type="button">Cancelar</button>
            <button class="btn-confirmar"  id="btn-aplicar"  type="button">${esNuevo ? 'Crear' : 'Aplicar cambios'}</button>
        </div>
    `;

    // Mostrar/ocultar enlace según modo
    card.querySelectorAll('input[name="f-modo"]').forEach(r => r.addEventListener('change', () => {
        const sel = card.querySelector('input[name="f-modo"]:checked').value;
        card.querySelector('#campo-enlace').style.display = sel === 'encargue' ? '' : 'none';
    }));

    // Añadir/quitar detalles
    card.querySelector('#btn-detalle-add').addEventListener('click', () => {
        const lista = card.querySelector('#f-detalles');
        lista.insertAdjacentHTML('beforeend', filaDetalle('', ''));
        engancharBorrarDetalle(card);

    /* Chips de tags: añade/quita la etiqueta del input al pulsar. */
    const tagsInputEl = card.querySelector('#f-tags');
    card.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.dataset.tag;
            const lista = tagsInputEl.value.split(',').map(t => t.trim()).filter(Boolean);
            const idx = lista.findIndex(t => t.toLowerCase() === tag.toLowerCase());
            if (idx >= 0) {
                lista.splice(idx, 1);
                chip.classList.remove('is-active');
            } else {
                lista.push(tag);
                chip.classList.add('is-active');
            }
            tagsInputEl.value = lista.join(', ');
        });
    });
    /* Si el dueño escribe a mano en el input, mantén los chips sincronizados. */
    if (tagsInputEl) {
        tagsInputEl.addEventListener('input', () => {
            const enInput = new Set(tagsInputEl.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean));
            card.querySelectorAll('.tag-chip').forEach(chip => {
                chip.classList.toggle('is-active', enInput.has(chip.dataset.tag.toLowerCase()));
            });
        });
    }
    });
    engancharBorrarDetalle(card);

    card.querySelector('#btn-subir-img').addEventListener('click', () => {
        abrirSubidorCloudinary({ multiple: true }, (url) => {
            const ta = card.querySelector('#f-imagenes');
            const sep = ta.value && !ta.value.endsWith('\n') ? '\n' : '';
            ta.value += sep + url;
        });
    });

    card.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
    card.querySelector('#btn-aplicar').addEventListener('click', () => {
        const nuevo = leerFormularioProducto(card, esNuevo ? null : state.data.productos[indice]);
        if (!nuevo) return;
        if (esNuevo) state.data.productos.push(nuevo);
        else state.data.productos[indice] = nuevo;
        cerrarModal();
        marcarCambios();
        renderProductos();
        aviso('exito', esNuevo ? 'Producto creado' : 'Producto actualizado', 'Recuerda pulsar "Guardar en GitHub" para que se publique.');
    });

    abrirModal();
}

function filaDetalle(k, v) {
    return `
        <div class="detalle-row">
            <input class="d-k" type="text" placeholder="Clave (ej. Talla)" value="${esc(k)}">
            <input class="d-v" type="text" placeholder="Valor (ej. XL)" value="${esc(v)}">
            <button type="button" class="btn-del-detalle" aria-label="Quitar">✕</button>
        </div>
    `;
}
function engancharBorrarDetalle(card) {
    card.querySelectorAll('.btn-del-detalle').forEach(b => {
        if (b.dataset.h) return;
        b.dataset.h = '1';
        b.addEventListener('click', () => b.closest('.detalle-row').remove());
    });
}

function leerFormularioProducto(card, existente) {
    const nombre = card.querySelector('#f-nombre').value.trim();
    const precio = Number(card.querySelector('#f-precio').value);
    if (!nombre)        { aviso('error', 'Falta el nombre', 'El producto necesita un nombre.'); return null; }
    if (!Number.isFinite(precio) || precio < 0) { aviso('error', 'Precio inválido', 'Pon un número positivo.'); return null; }
    const imagenes = card.querySelector('#f-imagenes').value
        .split('\n').map(l => l.trim()).filter(Boolean);
    if (!imagenes.length) { aviso('error', 'Falta foto', 'Agrega al menos una URL de imagen.'); return null; }
    const tags = card.querySelector('#f-tags').value
        .split(',').map(t => t.trim()).filter(Boolean);
    const modo = card.querySelector('input[name="f-modo"]:checked').value;
    const enlace = modo === 'encargue' ? (card.querySelector('#f-enlace').value.trim() || 'none') : 'none';
    const detalles = {};
    card.querySelectorAll('.detalle-row').forEach(r => {
        const k = r.querySelector('.d-k').value.trim();
        const v = r.querySelector('.d-v').value.trim();
        if (k) detalles[k] = v;
    });
    const pesoManualRaw = Number(card.querySelector('#f-peso-manual')?.value);
    const pesoManual    = Number.isFinite(pesoManualRaw) && pesoManualRaw >= 0 ? pesoManualRaw : 0;
    return {
        nombre,
        precio,
        imagenes,
        categoria: card.querySelector('#f-categoria').value.trim() || 'otros',
        modo,
        enlace,
        tags,
        detalles,
        // Preservar contadores acumulados del producto existente (si se está editando).
        // Sin esto, cada edición reseteaba ventas/interacciones a 0.
        ventas:        existente ? (Number(existente.ventas) || 0)        : 0,
        interacciones: existente ? (Number(existente.interacciones) || 0) : 0,
        pesoManual
    };
}

function borrarProducto(indice) {
    const p = state.data.productos[indice];
    if (!p) return;
    if (!confirm(`¿Borrar el producto "${p.nombre}"? Esta acción solo se confirma al guardar en GitHub.`)) return;
    state.data.productos.splice(indice, 1);
    marcarCambios();
    renderProductos();
    aviso('info', 'Producto eliminado', 'Pulsa "Guardar en GitHub" para confirmar.');
}

/* ─── Outfits ─── */
function renderOutfits() {
    const cont = document.getElementById('lista-out');
    let items = state.data.outfits;
    if (state.busquedaOut) {
        const q = state.busquedaOut.toLowerCase();
        items = items.filter(o => (o.nombre || '').toLowerCase().includes(q));
    }
    if (!items.length) {
        cont.innerHTML = `<div class="vacio">No hay outfits.</div>`;
        return;
    }
    cont.innerHTML = items.map((o) => {
        const idx = state.data.outfits.indexOf(o);
        return `
            <div class="item" data-i="${idx}">
                <img class="item-thumb" src="${esc(o.imagen || '')}" alt="">
                <div class="item-info">
                    <div class="item-nombre">${esc(o.nombre || '(sin nombre)')}</div>
                    <div class="item-meta">
                        <span>${esc(o.estilo || '')}</span>
                        <span>${(o.prendas || []).length} prenda(s)</span>
                    </div>
                </div>
                <div class="item-acciones">
                    <button class="btn-edit-out" type="button" aria-label="Editar">✎</button>
                    <button class="btn-del-out"  type="button" aria-label="Borrar">🗑</button>
                </div>
            </div>
        `;
    }).join('');
    cont.querySelectorAll('.btn-edit-out').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.closest('.item').dataset.i);
        abrirEditorOutfit(i);
    }));
    cont.querySelectorAll('.btn-del-out').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.closest('.item').dataset.i);
        borrarOutfit(i);
    }));
    engancharErrorImagenes(cont);
}

document.getElementById('buscar-out').addEventListener('input', e => {
    state.busquedaOut = e.target.value.trim();
    renderOutfits();
});
document.getElementById('btn-nuevo-out').addEventListener('click', () => abrirEditorOutfit(-1));

function abrirEditorOutfit(indice) {
    const esNuevo = indice < 0;
    const o = esNuevo
        ? { nombre: '', estilo: '', descripcion: '', imagen: '', prendas: [] }
        : clone(state.data.outfits[indice]);
    const prendasHTML = (o.prendas || []).map(filaPrenda).join('') || filaPrenda({});

    const card = document.getElementById('modal-card');
    card.innerHTML = `
        <h2>${esNuevo ? 'Nuevo outfit' : 'Editar outfit'}</h2>
        <div class="campo"><label>Nombre *</label><input id="o-nombre" type="text" value="${esc(o.nombre)}" required></div>
        <div class="campo"><label>Estilo</label><input id="o-estilo" type="text" value="${esc(o.estilo)}" placeholder="Casual / Streetwear..."></div>
        <div class="campo"><label>Descripción</label><textarea id="o-desc" style="font-family:inherit;font-size:13.5px;">${esc(o.descripcion)}</textarea></div>
        <div class="campo">
            <label>Imagen principal (URL)</label>
            <input id="o-img" type="text" value="${esc(o.imagen)}" placeholder="https://...">
            <button id="btn-subir-img-out" class="btn-detalle-add" type="button" style="margin-top:6px">📤 Subir foto a Cloudinary</button>
        </div>
        <div class="campo">
            <label>Prendas del outfit</label>
            <div id="o-prendas" class="detalles-list">${prendasHTML}</div>
            <button id="btn-add-prenda" class="btn-detalle-add" type="button">+ Añadir prenda</button>
            <div class="ayuda">Cada prenda lleva el nombre exacto de un producto del catálogo y un punto X/Y (0-100) sobre la imagen.</div>
        </div>
        <div class="modal-acciones">
            <button class="btn-secundario" id="btn-cancelar" type="button">Cancelar</button>
            <button class="btn-confirmar"  id="btn-aplicar"  type="button">${esNuevo ? 'Crear' : 'Aplicar cambios'}</button>
        </div>
    `;

    engancharPrendaBorrar(card);
    card.querySelector('#btn-subir-img-out').addEventListener('click', () => {
        abrirSubidorCloudinary({ multiple: false }, (url) => {
            card.querySelector('#o-img').value = url;
        });
    });
    card.querySelector('#btn-add-prenda').addEventListener('click', () => {
        card.querySelector('#o-prendas').insertAdjacentHTML('beforeend', filaPrenda({}));
        engancharPrendaBorrar(card);
    });
    card.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
    card.querySelector('#btn-aplicar').addEventListener('click', () => {
        const nombre = card.querySelector('#o-nombre').value.trim();
        if (!nombre) { aviso('error', 'Falta nombre', 'El outfit necesita un nombre.'); return; }
        const prendas = [];
        card.querySelectorAll('.detalle-row').forEach(r => {
            const prod = r.querySelector('.p-prod').value.trim();
            if (!prod) return;
            prendas.push({
                producto: prod,
                puntoX:   Number(r.querySelector('.p-x').value) || 50,
                puntoY:   Number(r.querySelector('.p-y').value) || 50,
                etiqueta: r.querySelector('.p-eti').value.trim() || prod
            });
        });
        const nuevo = {
            nombre,
            estilo:      card.querySelector('#o-estilo').value.trim(),
            descripcion: card.querySelector('#o-desc').value.trim(),
            imagen:      card.querySelector('#o-img').value.trim(),
            prendas
        };
        if (esNuevo) state.data.outfits.push(nuevo);
        else state.data.outfits[indice] = nuevo;
        cerrarModal();
        marcarCambios();
        renderOutfits();
        aviso('exito', esNuevo ? 'Outfit creado' : 'Outfit actualizado', 'No olvides "Guardar en GitHub".');
    });

    abrirModal();
}

function filaPrenda(pr) {
    pr = pr || {};
    return `
        <div class="detalle-row">
            <input class="p-prod" type="text" placeholder="Nombre exacto del producto" value="${esc(pr.producto || '')}" style="flex:2">
            <input class="p-x"    type="number" min="0" max="100" placeholder="X" value="${pr.puntoX ?? 50}" style="flex:0 0 60px">
            <input class="p-y"    type="number" min="0" max="100" placeholder="Y" value="${pr.puntoY ?? 50}" style="flex:0 0 60px">
            <input class="p-eti"  type="text" placeholder="Etiqueta" value="${esc(pr.etiqueta || '')}" style="flex:1">
            <button type="button" class="btn-del-detalle" aria-label="Quitar">✕</button>
        </div>
    `;
}
function engancharPrendaBorrar(card) {
    card.querySelectorAll('.btn-del-detalle').forEach(b => {
        if (b.dataset.h) return;
        b.dataset.h = '1';
        b.addEventListener('click', () => b.closest('.detalle-row').remove());
    });
}
function borrarOutfit(indice) {
    const o = state.data.outfits[indice];
    if (!o) return;
    if (!confirm(`¿Borrar el outfit "${o.nombre}"?`)) return;
    state.data.outfits.splice(indice, 1);
    marcarCambios();
    renderOutfits();
    aviso('info', 'Outfit eliminado', 'Pulsa "Guardar en GitHub" para confirmar.');
}

/* ─── Modal helpers ─── */
function abrirModal() {
    const m = document.getElementById('modal');
    m.classList.add('is-active');
    document.addEventListener('keydown', escCierraModal);
    m.addEventListener('click', clickFueraModal);
}
function cerrarModal() {
    const m = document.getElementById('modal');
    m.classList.remove('is-active');
    document.removeEventListener('keydown', escCierraModal);
    m.removeEventListener('click', clickFueraModal);
}
function escCierraModal(e) { if (e.key === 'Escape') cerrarModal(); }
function clickFueraModal(e) { if (e.target.id === 'modal') cerrarModal(); }

/* ─── Aviso al salir si hay cambios sin guardar ─── */
window.addEventListener('beforeunload', (e) => {
    if (state.cambios) {
        e.preventDefault();
        e.returnValue = '';
    }
});

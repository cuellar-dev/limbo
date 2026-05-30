/*EEEEEEEEEEEEEEEEEE*/


const switchContainer = document.querySelector('.switch-container');

function debounce(fn, delay) {
	let t;
	return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

const estadoTienda = {
	productos: [],
	masonry: null,
	masonryRelayoutHandler: null,
	masonryListenersBound: false,
	headerScrollTriggerEnabled: false,
	carrito: [],          // carrito del modo "En Stack"
	carritoEncargue: [],  // carrito del modo "Encargue"
	productoDetalleActual: null
};

const PAGINA_LIMITE        = 20;
let paginaActual           = 0;
let isLoading              = false;
let hayMasProductos        = true;
let productosVisibles      = [];
let infiniteScrollObserver = null;

const MENSAJE_SIN_RESULTADOS       = 'No se encontraron resultados.';
const STORAGE_KEY_CARRITO          = 'levitad-carrito';
const STORAGE_KEY_CARRITO_ENCARGUE = 'levitad-carrito-encargue';
const STORAGE_KEY_MODAL_ENCARGUE   = 'levitad-modal-encargue-visto';
const STORAGE_KEY_ULTIMO_PEDIDO    = 'levitad-ultimo-pedido';
const PEDIDO_COOLDOWN_MS           = 3 * 60 * 1000; // 3 minutos entre pedidos
const WHATSAPP_OWNER_NUMBER        = '+5359271359';

/* ─── DUEÑOS / DESTINATARIOS DEL PEDIDO ───
   REEMPLAZA por los datos reales:
   - telefono: solo dígitos con código de país, SIN el signo +  (ej: 5359271359)
   - foto: archivo dentro de imagenes/  (pon ahí las fotos reales)            */
const DUENOS = [
	{ nombre: 'Angel',   genero: 'hombre', telefono: '5359271359', foto: 'imagenes/dueno.jpg' },{ nombre: 'Erika', genero: 'mujer',  telefono: '5350462333', foto: 'imagenes/duena.jpg' }
];
/* ─── ICONOS ─── */
const iconoCarrito = `
	<svg xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 24 24" class="carrito-add">
		<path d="m7,20c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Zm10-3c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Zm7-19v1h-4v4h-1v-4h-4v-1h4V0h1v4h4Zm-1.666,3h1.02l-1.598,8H6.019l.237,1.706c.103.738.74,1.294,1.485,1.294h12.259v1H7.741c-1.241,0-2.306-.927-2.476-2.157L3.244,2.294c-.103-.738-.74-1.294-1.485-1.294H0V0h1.759c1.241,0,2.306.927,2.476,2.157l.256,1.843h8.51v1H4.629l1.25,9h15.056l1.398-7Z"/>
	</svg>
`;

const iconoCarritoEncargue = `
	<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="carrito-add encargue-cart">
		<g style="stroke: currentColor; fill: none; stroke-linejoin: round; stroke-width: 2px;">
			<circle cx="32" cy="24" r="10"/>
			<path d="M32,14h0A10,10,0,0,1,22,24h0"/>
			<path d="M32,14h0A10,10,0,0,0,42,24h0"/>
			<path d="M44,56h6a4,4,0,0,0,4-4V50"/>
			<path d="M51,44h7a4,4,0,0,0,4-4V38H40.94"/>
			<path d="M58,44v2a4,4,0,0,1-4,4H49"/>
			<path d="M20,56H14a4,4,0,0,1-4-4V50"/>
			<path d="M13,44H6a4,4,0,0,1-4-4V38H23.06"/>
			<path d="M6,44v2a4,4,0,0,0,4,4h5"/>
			<path d="M32,34h0A12,12,0,0,1,44,46V62a0,0,0,0,1,0,0H20a0,0,0,0,1,0,0V46A12,12,0,0,1,32,34Z"/>
			<ellipse cx="32" cy="6" rx="11" ry="4"/>
			<line x1="38" x2="20" y1="36" y2="54"/>
			<line x1="41" x2="20" y1="39" y2="60"/>
		</g>
	</svg>
`;

const iconoAnadir = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="carrito-add anadir-encargue">
		<path fill="currentColor" d="m9.5,5.5c0,1.379,1.122,2.5,2.5,2.5s2.5-1.121,2.5-2.5-1.122-2.5-2.5-2.5-2.5,1.121-2.5,2.5Zm4,0c0,.827-.673,1.5-1.5,1.5s-1.5-.673-1.5-1.5.673-1.5,1.5-1.5,1.5.673,1.5,1.5Zm7,.5c-3.373,0-6.02,2.984-6.555,3.632-1.256.475-2.633.475-3.889,0-.535-.648-3.182-3.632-6.555-3.632C.918,6,.185,11.139.024,15.45c-.015.409.132.796.416,1.09.286.297.67.46,1.083.46.263,0,.477.214.477.5,0,.827.673,1.5,1.494,1.5.231.006.506.098.506.5v2c0,.099.036.186.086.264.069.315.174.623.353.905.514.807,1.392,1.288,2.346,1.288l10.428.043c.957,0,1.834-.481,2.348-1.288.191-.299.298-.628.364-.964.043-.074.075-.156.075-.248v-2c0-.275.224-.5.5-.5.827,0,1.5-.673,1.5-1.5,0-.275.224-.5.509-.5.412,0,.795-.162,1.079-.457.283-.294.43-.681.414-1.089-.134-3.531-.768-9.454-3.502-9.454ZM3.5,18c-.276,0-.5-.225-.5-.523,0-.814-.663-1.477-1.477-1.477-.139,0-.268-.055-.363-.153-.093-.097-.142-.225-.137-.359.192-5.156,1.165-8.487,2.477-8.487,2.712,0,5.005,2.377,5.669,3.136l-4.315,8.675c-.279-.583-.899-.811-1.354-.811Zm15.218,4.175c-.33.517-.892.825-1.503.825l-10.428-.043c-.613,0-1.176-.309-1.505-.825s-.371-1.157-.118-1.701l4.847-9.744c1.29.416,2.687.417,3.976,0l4.843,9.774c.259.556.217,1.196-.112,1.714Zm4.15-6.326c-.094.098-.221.151-.368.151-.827,0-1.5.673-1.5,1.5,0,.275-.224.5-.5.5-.596,0-1.107.352-1.349.856l-4.32-8.72c.663-.758,2.957-3.136,5.669-3.136,1.304,0,2.311,3.412,2.503,8.491.005.135-.043.262-.135.357ZM7.634,4.486c-.415-.445-.634-.96-.634-1.486,0-1.683,2.196-3,5-3s5,1.317,5,3c0,.526-.219,1.041-.634,1.486-.099.106-.232.16-.366.16-.122,0-.244-.044-.34-.134-.202-.188-.214-.504-.026-.706.243-.262.366-.533.366-.807,0-.946-1.643-2-4-2s-4,1.054-4,2c0,.273.123.545.366.807.188.202.176.519-.026.706-.202.188-.519.177-.707-.026Z"/>
	</svg>
`;

/* CAMBIO 1: check en dorado característico */
const iconoCarritoCheck = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="carrito-add">
		<path fill="var(--acento-dorado)" d="M10,17.414L5.293,12.707c-.389-.389-1.018-.389-1.407,0s-.389,1.018,0,1.407l5.707,5.707c.195.195.451.293.707.293s.512-.098.707-.293l10.707-10.707c.389-.389.389-1.018,0-1.407s-1.018-.389-1.407,0L10,17.414Z"/>
	</svg>
`;

/* CAMBIO 2: líneas alargadas al ~35% del viewBox (≈8.4 px sobre 24) */
const iconoAnadirConViento = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" class="carrito-add anadir-encargue">
		<path fill="currentColor" d="m9.5,5.5c0,1.379,1.122,2.5,2.5,2.5s2.5-1.121,2.5-2.5-1.122-2.5-2.5-2.5-2.5,1.121-2.5,2.5Zm4,0c0,.827-.673,1.5-1.5,1.5s-1.5-.673-1.5-1.5.673-1.5,1.5-1.5,1.5.673,1.5,1.5Zm7,.5c-3.373,0-6.02,2.984-6.555,3.632-1.256.475-2.633.475-3.889,0-.535-.648-3.182-3.632-6.555-3.632C.918,6,.185,11.139.024,15.45c-.015.409.132.796.416,1.09.286.297.67.46,1.083.46.263,0,.477.214.477.5,0,.827.673,1.5,1.494,1.5.231.006.506.098.506.5v2c0,.099.036.186.086.264.069.315.174.623.353.905.514.807,1.392,1.288,2.346,1.288l10.428.043c.957,0,1.834-.481,2.348-1.288.191-.299.298-.628.364-.964.043-.074.075-.156.075-.248v-2c0-.275.224-.5.5-.5.827,0,1.5-.673,1.5-1.5,0-.275.224-.5.509-.5.412,0,.795-.162,1.079-.457.283-.294.43-.681.414-1.089-.134-3.531-.768-9.454-3.502-9.454ZM3.5,18c-.276,0-.5-.225-.5-.523,0-.814-.663-1.477-1.477-1.477-.139,0-.268-.055-.363-.153-.093-.097-.142-.225-.137-.359.192-5.156,1.165-8.487,2.477-8.487,2.712,0,5.005,2.377,5.669,3.136l-4.315,8.675c-.279-.583-.899-.811-1.354-.811Zm15.218,4.175c-.33.517-.892.825-1.503.825l-10.428-.043c-.613,0-1.176-.309-1.505-.825s-.371-1.157-.118-1.701l4.847-9.744c1.29.416,2.687.417,3.976,0l4.843,9.774c.259.556.217,1.196-.112,1.714Zm4.15-6.326c-.094.098-.221.151-.368.151-.827,0-1.5.673-1.5,1.5,0,.275-.224.5-.5.5-.596,0-1.107.352-1.349.856l-4.32-8.72c.663-.758,2.957-3.136,5.669-3.136,1.304,0,2.311,3.412,2.503,8.491.005.135-.043.262-.135.357ZM7.634,4.486c-.415-.445-.634-.96-.634-1.486,0-1.683,2.196-3,5-3s5,1.317,5,3c0,.526-.219,1.041-.634,1.486-.099.106-.232.16-.366.16-.122,0-.244-.044-.34-.134-.202-.188-.214-.504-.026-.706.243-.262.366-.533.366-.807,0-.946-1.643-2-4-2s-4,1.054-4,2c0,.273.123.545.366.807.188.202.176.519-.026.706-.202.188-.519.177-.707-.026Z"/>
		<line x1="12" y1="21" x2="12" y2="30" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
		<line x1="8"  y1="21" x2="8"  y2="29" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
		<line x1="16" y1="21" x2="16" y2="29" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
	</svg>
`;

const formatPrecio = (precio) => {
	const valor = Number(precio) || 0;
	return `$${valor.toLocaleString('es-DO')}`;
};

/* Escape para inyecciones seguras dentro de innerHTML.
   Cualquier string que provenga de datos.json o del usuario debe pasar por aquí. */
function esc(s) {
	if (s === null || s === undefined) return '';
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/* ─── AVISOS / TOASTS ─── */
function mostrarAviso(tipo, mensaje, titulo) {
	const ICONOS = {
		exito:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16 9"/></svg>',
		error:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
		advertencia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
	};
	const t = ICONOS[tipo] ? tipo : 'advertencia';

	let cont = document.querySelector('.aviso-container');
	if (!cont) {
		cont = document.createElement('div');
		cont.className = 'aviso-container';
		document.body.appendChild(cont);
	}

	const el = document.createElement('div');
	el.className = `aviso aviso--${t}`;
	el.innerHTML = `
		<span class="aviso-icono">${ICONOS[t]}</span>
		<div class="aviso-cuerpo">
			${titulo ? '<span class="aviso-titulo"></span>' : ''}
			<span class="aviso-texto"></span>
		</div>
		<button class="aviso-cerrar" type="button" aria-label="Cerrar aviso">✕</button>
	`;
	if (titulo) el.querySelector('.aviso-titulo').textContent = titulo;
	el.querySelector('.aviso-texto').textContent = mensaje;
	cont.appendChild(el);

	requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));

	let cerrado = false;
	const cerrar = () => {
		if (cerrado) return;
		cerrado = true;
		clearTimeout(timer);
		el.classList.remove('is-visible');
		el.classList.add('is-saliendo');
		setTimeout(() => {
			el.remove();
			if (cont && !cont.children.length) cont.remove();
		}, 380);
	};

	el.querySelector('.aviso-cerrar').addEventListener('click', cerrar);
	const timer = setTimeout(cerrar, 4000);
}

/* ─── CAMBIO 4: helpers para saber qué carrito usar ─── */
function modoActual() {
	return document.body.classList.contains('is-encargue') ? 'encargue' : 'stack';
}
function carritoActivo() {
	return modoActual() === 'encargue' ? estadoTienda.carritoEncargue : estadoTienda.carrito;
}

/* ─── PERSISTENCIA ─── */
function guardarCarrito() {
	localStorage.setItem(STORAGE_KEY_CARRITO,          JSON.stringify(estadoTienda.carrito));
	localStorage.setItem(STORAGE_KEY_CARRITO_ENCARGUE, JSON.stringify(estadoTienda.carritoEncargue));
}

function cargarCarritoGuardado() {
	try {
		const stack    = localStorage.getItem(STORAGE_KEY_CARRITO);
		const encargue = localStorage.getItem(STORAGE_KEY_CARRITO_ENCARGUE);
		estadoTienda.carrito         = stack    ? (JSON.parse(stack)    || []) : [];
		estadoTienda.carritoEncargue = encargue ? (JSON.parse(encargue) || []) : [];
	} catch (e) {
		console.error('No se pudo recuperar el carrito:', e);
		estadoTienda.carrito         = [];
		estadoTienda.carritoEncargue = [];
	}
}

function obtenerCantidadCarrito() {
	return carritoActivo().reduce((t, i) => t + (i.cantidad || 1), 0);
}

function obtenerTotalCarrito() {
	return carritoActivo().reduce((t, i) => t + ((Number(i.precio) || 0) * (i.cantidad || 1)), 0);
}

function refrescarBadgeCarrito() {
	const badge = document.querySelector('.carrito-badge');
	if (badge) badge.textContent = String(obtenerCantidadCarrito());
}

/* Textos del panel según el modo */
const CARRITO_TEXTOS = {
	stack: {
		titulo:    'Tu Pedido',
		subtitulo: 'Productos en stock',
		vacio:     'Aún no agregaste nada.\nExplora el catálogo y suma lo que te guste.',
		vacioBadge:'🛍️',
		whatsapp:  'Enviar Pedido por WhatsApp',
		nota:      'Escríbenos para coordinar pago y entrega'
	},
	encargue: {
		titulo:    '¿Listo para Encargar?',
		subtitulo: 'Alimenta tu Outfit',
		vacio:     'Aún no elegiste nada para encargar.\nSelecciona las prendas que quieras encargar.',
		vacioBadge:'✦',
		whatsapp:  'Enviar encargo vía WhatsApp',
		nota:      'Coordinamos cada detalle juntos.'
	}
};
function actualizarTextosPanelCarrito() {
	const modo   = modoActual();
	const textos = CARRITO_TEXTOS[modo];

	const titulo    = document.querySelector('.carrito-panel-header h2');
	const subtitulo = document.querySelector('.carrito-panel-subtitulo');
	const whatsapp  = document.getElementById('carrito-whatsapp');
	const nota      = document.querySelector('.carrito-nota');

	if (titulo)    titulo.textContent    = textos.titulo;
	if (subtitulo) subtitulo.textContent = textos.subtitulo;
	if (whatsapp)  whatsapp.textContent  = textos.whatsapp;
	if (nota)      nota.textContent      = textos.nota;
}

function renderizarCarrito() {
	const lista = document.getElementById('carrito-lista');
	const vacio = document.getElementById('carrito-vacio');
	const total = document.getElementById('carrito-total');
	const btnWhatsApp = document.getElementById('carrito-whatsapp');
	if (!lista || !vacio || !total) return;

	const carrito = carritoActivo();
	const modo    = modoActual();
	const textos  = CARRITO_TEXTOS[modo];

	if (!carrito.length) {
		lista.innerHTML = '';
		vacio.hidden    = false;
		if(btnWhatsApp){
			btnWhatsApp.disabled = true;
			btnWhatsApp.style.opacity = "0.5"; // Opcional: para que se vea visualmente bloqueado
			btnWhatsApp.style.cursor = "not-allowed";
		}
		// Texto de vacío personalizado por modo
		vacio.innerHTML = `
			<span class="carrito-vacio-icono">${textos.vacioBadge}</span>
			${textos.vacio.replace('\n', '<br>')}
		`;
	} else {
		vacio.hidden    = true;
		if (btnWhatsApp) {
			btnWhatsApp.disabled = false;
			btnWhatsApp.style.opacity = "1";
			btnWhatsApp.style.cursor = "pointer";
		}
		lista.innerHTML = carrito.map((item, index) => {
			const nombreEsc = esc(item.nombre);
			const imgEsc = esc(
				item.imagen ||
				(estadoTienda.productos.find(p => p.nombre === item.nombre)?.imagenes?.[0]) ||
				''
			);
			return `
				<li class="carrito-item" data-carrito-index="${index}" role="button" tabindex="0" aria-label="Ver detalles de ${nombreEsc}">
					<img class="carrito-item-img" src="${imgEsc}" alt="${nombreEsc}">
					<div class="carrito-item-info">
						<span class="carrito-item-nombre">${nombreEsc}</span>
						<span class="carrito-item-precio">${formatPrecio(item.precio)}</span>
					</div>
					<button class="carrito-item-eliminar" type="button" aria-label="Eliminar ${nombreEsc}">✕</button>
				</li>
			`;
		}).join('');
	}

	total.textContent = formatPrecio(obtenerTotalCarrito());
	refrescarBadgeCarrito();
	actualizarTextosPanelCarrito();
	guardarCarrito();

	// Actualizar botones según el carrito activo
	const isEncargue = modo === 'encargue';
	document.querySelectorAll('.btn-anadir').forEach(btn => {
		const tarjeta = btn.closest('.tarjeta-producto');
		if (!tarjeta) return;
		const producto = productosVisibles[Number(tarjeta.dataset.productoId)];
		if (!producto) return;
		if (obtenerProductoEnCarrito(producto.nombre)) {
			marcarBotonComoAgregado(btn, isEncargue);
		} else {
			desmarcarBotonAgregado(btn, isEncargue);
		}
	});
}

function abrirCarrito() {
	const overlay = document.getElementById('carrito-overlay');
	const panel   = document.getElementById('carrito-panel');
	if (!overlay || !panel) return;
	document.body.classList.add('carrito-abierto');
	overlay.classList.add('is-active');
	panel.classList.add('is-active');
	overlay.setAttribute('aria-hidden', 'false');
	panel.setAttribute('aria-hidden',   'false');
	enfocarModal(panel);
}

function cerrarCarrito() {
	const overlay = document.getElementById('carrito-overlay');
	const panel   = document.getElementById('carrito-panel');
	if (!overlay || !panel) return;
	document.body.classList.remove('carrito-abierto');
	overlay.classList.remove('is-active');
	panel.classList.remove('is-active');
	overlay.setAttribute('aria-hidden', 'true');
	panel.setAttribute('aria-hidden',   'true');
}

function animarBotonAnadir(boton) {
	if (!boton) return;
	if (modoActual() === 'encargue') {
		boton.classList.remove('is-vuela');
		void boton.offsetWidth;
		boton.classList.add('is-vuela');
		setTimeout(() => boton.classList.remove('is-vuela'), 800);
	} else {
		boton.classList.remove('is-added');
		void boton.offsetWidth;
		boton.classList.add('is-added');
		setTimeout(() => boton.classList.remove('is-added'), 450);
	}
}

function obtenerProductoEnCarrito(nombre) {
	return carritoActivo().find(item => item.nombre === nombre);
}

function marcarBotonComoAgregado(boton) {
	if (!boton) return;
	boton.classList.add('is-agregado');
	boton.disabled = true;
	const stackEl    = boton.querySelector('.icono-stack');
	const encargueEl = boton.querySelector('.icono-encargue');
	if (stackEl) {
		stackEl.querySelector('svg')?.classList.add('icono-transicion');
		setTimeout(() => {
			stackEl.innerHTML = iconoCarritoCheck;
			stackEl.querySelector('svg')?.classList.add('icono-transicion');
		}, 100);
	}
	if (encargueEl) {
		encargueEl.querySelector('svg')?.classList.add('icono-transicion');
		setTimeout(() => {
			encargueEl.innerHTML = iconoAnadirConViento;
			encargueEl.querySelector('svg')?.classList.add('icono-transicion');
		}, 100);
	}
}

function desmarcarBotonAgregado(boton) {
	if (!boton) return;
	boton.classList.remove('is-agregado');
	boton.disabled = false;
	const stackEl    = boton.querySelector('.icono-stack');
	const encargueEl = boton.querySelector('.icono-encargue');
	if (stackEl) {
		stackEl.querySelector('svg')?.classList.add('icono-transicion');
		setTimeout(() => {
			stackEl.innerHTML = iconoCarrito;
			stackEl.querySelector('svg')?.classList.add('icono-transicion');
		}, 100);
	}
	if (encargueEl) {
		encargueEl.querySelector('svg')?.classList.add('icono-transicion');
		setTimeout(() => {
			encargueEl.innerHTML = iconoAnadir;
			encargueEl.querySelector('svg')?.classList.add('icono-transicion');
		}, 100);
	}
}

function agregarAlCarrito(producto, boton) {
	if (!producto) return;
	if (obtenerProductoEnCarrito(producto.nombre)) return;

	carritoActivo().push({
		nombre: producto.nombre,
		precio: Number(producto.precio) || 0,
		imagen: (Array.isArray(producto.imagenes) && producto.imagenes[0]) || producto.imagen || '',
		enlace: producto.enlace || 'none'
	});

	const isEncargue = modoActual() === 'encargue';
	animarBotonAnadir(boton);
	marcarBotonComoAgregado(boton, isEncargue);
	renderizarCarrito();
}

function eliminarDelCarrito(index, itemEl) {
	const carrito = carritoActivo();
	if (!Number.isInteger(index) || index < 0 || index >= carrito.length) return;

	const productoEliminado = carrito[index];

	// Si viene el elemento DOM, lo animamos antes de volver a renderizar
	if (itemEl) {
		itemEl.classList.add('is-removing');
		setTimeout(() => {
			carrito.splice(index, 1);
			desmarcarProductoEnGrid(productoEliminado.nombre);
			renderizarCarrito();
		}, 340); // 340ms > 320ms del transition más largo (max-height)
	} else {
		carrito.splice(index, 1);
		desmarcarProductoEnGrid(productoEliminado.nombre);
		renderizarCarrito();
	}
}

function desmarcarProductoEnGrid(nombre) {
	const isEncargue = modoActual() === 'encargue';
	document.querySelectorAll('.btn-anadir').forEach(btn => {
		const tarjeta = btn.closest('.tarjeta-producto');
		if (!tarjeta) return;
		const producto = productosVisibles[Number(tarjeta.dataset.productoId)];
		if (producto && producto.nombre === nombre) {
			desmarcarBotonAgregado(btn, isEncargue);
		}
	});
}

function vaciarCarrito() {
	const carrito = carritoActivo();
	if (!carrito.length) return;

	const lista = document.getElementById('carrito-lista');
	if (lista) {
		// Animamos todos los items a la vez con un pequeño escalonado
		const items = lista.querySelectorAll('.carrito-item');
		items.forEach((el, i) => {
			setTimeout(() => el.classList.add('is-removing'), i * 40);
		});
		const delay = items.length * 40 + 330;
		setTimeout(() => {
			const isEncargue = modoActual() === 'encargue';
			carrito.forEach(item => {
				document.querySelectorAll('.btn-anadir').forEach(btn => {
					const tarjeta = btn.closest('.tarjeta-producto');
					if (!tarjeta) return;
					const producto = productosVisibles[Number(tarjeta.dataset.productoId)];
					if (producto && producto.nombre === item.nombre) {
						desmarcarBotonAgregado(btn, isEncargue);
					}
				});
			});
			carrito.length = 0;
			renderizarCarrito();
		}, delay);
	} else {
		carrito.length = 0;
		renderizarCarrito();
	}
}

function construirMensajeWhatsApp() {
	const carrito    = carritoActivo();
	const esEncargue = modoActual() === 'encargue';

	if (!carrito.length) {
		return esEncargue
			? 'Hola Lévitad, quisiera encargar unas prendas. Cuando puedas me dices, gracias.'
			: 'Hola Lévitad, ando viendo unas prendas. Cuando puedas me avisas, dale.';
	}

	if (esEncargue) {
		const lineas = carrito.map(item => {
			const enlace = (item.enlace && item.enlace !== 'none')
				? `\n  Enlace: ${item.enlace}`
				: '';
			return `- ${item.nombre} (${formatPrecio(item.precio)})${enlace}`;
		}).join('\n');
		return `Hola Lévitad, quisiera encargar estas prendas:\n${lineas}\n\n¿Cómo coordinamos el encargo? Gracias.`;
	}

	const lineas = carrito.map(item => `- ${item.nombre} (${formatPrecio(item.precio)})`).join('\n');
	return `Hola Lévitad, me interesan estas prendas:\n${lineas}\n\n¿Dónde podemos vernos para verlas? Gracias.`;
}

async function enviarPedidoWhatsApp(numero) {
	if (carritoActivo().length === 0) return;
	const tel = numero || DUENOS[0].telefono;

	// El pedido va directo por WhatsApp; el mensaje ES el registro del pedido para el dueño.
	const url = `https://wa.me/${tel}?text=${encodeURIComponent(construirMensajeWhatsApp())}`;

	// Vaciar el carrito del modo activo (el pedido ya se envió)
	carritoActivo().length = 0;
	guardarCarrito();
	renderizarCarrito();

	// Marca para el cooldown: bloquea reenviar otro pedido durante PEDIDO_COOLDOWN_MS
	localStorage.setItem(STORAGE_KEY_ULTIMO_PEDIDO, String(Date.now()));

	// El aviso de éxito se muestra cuando el usuario VUELVE a la web (no ahora,
	// porque al abrir WhatsApp se va de la página y no lo vería)
	sessionStorage.setItem('levitad-pedido-ok', '1');

	window.open(url, '_blank', 'noopener,noreferrer');
}

const ICONO_GENERO = {
	mujer:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/><line x1="9" y1="18.5" x2="15" y2="18.5"/></svg>',
	hombre: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="14" r="6"/><line x1="14.5" y1="9.5" x2="20.5" y2="3.5"/><polyline points="15 3.5 20.5 3.5 20.5 9"/></svg>'
};
const ICONO_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.1.55 4.1 1.6 5.88L2 22l4.33-1.7a9.9 9.9 0 0 0 5.7 1.46h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.25.7-1.44 1.33-1.99 1.36-.53.04-1.02.23-3.43-.72-2.9-1.14-4.76-4.1-4.9-4.29-.14-.19-1.18-1.57-1.18-2.99 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18.01.42-.07.65.5.25.6.84 2.07.91 2.22.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.38-.42.51-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.6-.14.25.09 1.59.75 1.86.89.28.14.46.21.53.33.07.12.07.69-.18 1.39Z"/></svg>';

function abrirSelectorDueno() {
	if (carritoActivo().length === 0) return;
	if (document.getElementById('dueno-sheet')) return;

	const restante = PEDIDO_COOLDOWN_MS - (Date.now() - (Number(localStorage.getItem(STORAGE_KEY_ULTIMO_PEDIDO)) || 0));
	if (restante > 0) {
		const totalSeg = Math.ceil(restante / 1000);
		const min = Math.floor(totalSeg / 60);
		const seg = totalSeg % 60;
		mostrarAviso(
			'advertencia',
			`Ya hiciste un pedido hace un momento, puedes volver a hacerlo en ${min} minuto/s y ${String(seg).padStart(2, '0')} segundos`,
			'Ya hiciste un pedido'
		);
		return;
	}

	const el = document.createElement('div');
	el.id        = 'dueno-sheet';
	el.className = 'dueno-sheet-overlay';
	el.setAttribute('role', 'dialog');
	el.setAttribute('aria-modal', 'true');
	el.setAttribute('aria-label', 'Elige a quién enviar el pedido');

	const opciones = DUENOS.map(d => `
		<button class="dueno-opcion" type="button" data-tel="${d.telefono}">
			<span class="dueno-foto">
				<img src="${d.foto}" alt="${d.nombre}" loading="lazy"
					onerror="this.style.display='none';this.parentNode.classList.add('sin-foto')">
			</span>
			<span class="dueno-info">
				<span class="dueno-nombre">${d.nombre}</span>
				<span class="dueno-genero dueno-genero--${d.genero}">
					<span class="dueno-genero-ic">${ICONO_GENERO[d.genero] || ''}</span>
					${d.genero === 'mujer' ? 'Mujer' : 'Hombre'}
				</span>
			</span>
			<span class="dueno-wa">${ICONO_WA}</span>
		</button>
	`).join('');

	el.innerHTML = `
		<div class="dueno-sheet">
			<span class="dueno-sheet-handle"></span>
			<button class="dueno-sheet-cerrar" type="button" aria-label="Cerrar">✕</button>
			<h2 class="dueno-sheet-titulo">¿Con quién quieres coordinar?</h2>
			<p class="dueno-sheet-sub">Elige a quién enviarle tu pedido vía WhatsApp, según si prefieras un trato masculino o femenino para cerrar la compra.</p>
			<div class="dueno-opciones">${opciones}</div>
		</div>
	`;

	document.body.appendChild(el);

	let cerrado = false;
	const cerrar = () => {
		if (cerrado) return;
		cerrado = true;
		el.classList.add('is-closing');
		document.removeEventListener('keydown', onEsc);
		setTimeout(() => el.remove(), 420);
	};
	const onEsc = e => { if (e.key === 'Escape') cerrar(); };

	el.querySelector('.dueno-sheet-cerrar').addEventListener('click', cerrar);
	el.addEventListener('click', e => { if (e.target === el) cerrar(); });
	document.addEventListener('keydown', onEsc);

	el.querySelectorAll('.dueno-opcion').forEach(btn => {
		btn.addEventListener('click', () => {
			const tel = btn.dataset.tel;
			cerrar();
			enviarPedidoWhatsApp(tel);
		});
	});

	requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-active')));
	enfocarModal(el, el.querySelector('.dueno-opcion'));
}

function mostrarExitoPedidoSiPendiente() {
	if (sessionStorage.getItem('levitad-pedido-ok')) {
		sessionStorage.removeItem('levitad-pedido-ok');
		mostrarAviso('exito', 'Tu pedido fue enviado por WhatsApp. Pronto coordinamos el pago y la entrega.', '¡Pedido enviado!');
	}
}

// Al volver de WhatsApp: si el usuario regresa a la pestaña o el navegador recarga la página
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible') mostrarExitoPedidoSiPendiente();
});
mostrarExitoPedidoSiPendiente();

const carritoLista = document.getElementById('carrito-lista');
if (carritoLista) {
	const abrirDetalleDesdeCarrito = (item) => {
		const index   = Number(item?.dataset.carritoIndex);
		const entrada = carritoActivo()[index];
		if (!entrada) return;
		const producto = estadoTienda.productos.find(p => p.nombre === entrada.nombre);
		if (!producto) return;
		cerrarCarrito();
		setTimeout(() => abrirDetalles(producto), 420);
	};

	// Patrón anti-tap-accidental igual al usado en categorías/outfits/parati.
	// El click después de un swipe vertical (scroll del carrito) abría el detalle
	// del item donde el dedo aterrizaba — porque overscroll-behavior:contain
	// evita scroll-chaining pero el evento click sí dispara. Detectamos si hubo
	// movimiento y, si lo hubo, cancelamos el click.
	const carritoBody = carritoLista.closest('.carrito-panel-body');
	let _carritoTouchMoved = false, _carritoScrollY0 = 0;
	if (carritoBody) {
		carritoBody.addEventListener('touchstart', () => {
			_carritoTouchMoved = false;
			_carritoScrollY0   = carritoBody.scrollTop;
		}, { passive: true });
		carritoBody.addEventListener('touchmove', () => {
			_carritoTouchMoved = true;
		}, { passive: true });
		// Fallback: en iOS el touchmove puede no dispararse si el scroll lo maneja
		// el compositor. El evento scroll sí llega siempre.
		carritoBody.addEventListener('scroll', () => {
			if (Math.abs(carritoBody.scrollTop - _carritoScrollY0) > 6) _carritoTouchMoved = true;
		}, { passive: true });
	}

	carritoLista.addEventListener('click', (e) => {
		if (_carritoTouchMoved) { _carritoTouchMoved = false; return; }
		const botonEliminar = e.target.closest('.carrito-item-eliminar');
		if (botonEliminar) {
			const item  = botonEliminar.closest('.carrito-item');
			const index = Number(item?.dataset.carritoIndex);
			eliminarDelCarrito(index, item);
			return;
		}
		const item = e.target.closest('.carrito-item');
		if (item) abrirDetalleDesdeCarrito(item);
	});

	// Accesibilidad: Enter/Espacio sobre el item enfocado abre su detalle.
	// Solo si el foco está en el item (el botón eliminar se activa solo).
	carritoLista.addEventListener('keydown', (e) => {
		if (e.key !== 'Enter' && e.key !== ' ') return;
		const item = e.target.closest('.carrito-item');
		if (!item || e.target !== item) return;
		e.preventDefault();
		abrirDetalleDesdeCarrito(item);
	});
}

function crearTarjetaProducto(producto, index) {
	const nombreEsc = esc(producto.nombre);
	const etiquetas = Array.isArray(producto.tags)
		? producto.tags.map(tag => `<p class="etiquetas">#${esc(tag)}</p>`).join('')
		: '';
	const imgSrc = esc(
		(Array.isArray(producto.imagenes) && producto.imagenes[0]) || producto.imagen || ''
	);
	const yaEnCarrito   = Boolean(obtenerProductoEnCarrito(producto.nombre));
	const iconoStack    = yaEnCarrito ? iconoCarritoCheck    : iconoCarrito;
	const iconoEncargue = yaEnCarrito ? iconoAnadirConViento : iconoAnadir;
	const clasesBoton   = yaEnCarrito ? 'btn-anadir is-agregado' : 'btn-anadir';
	const deshabilitado = yaEnCarrito ? 'disabled' : '';

	const claseLoading = imgSrc ? ' is-loading' : '';
	// Las primeras 4 tarjetas son LCP (el usuario las ve sin scrollear). Las cargamos
	// con prioridad alta y sin lazy. El resto sigue lazy/async como antes.
	const esLcp = index < 4;
	const loadingAttr  = esLcp ? 'eager' : 'lazy';
	const priorityAttr = esLcp ? ' fetchpriority="high"' : '';
	return `
		<article class="tarjeta-producto" data-producto-id="${index}">
			<div class="imagen-contenedor${claseLoading}">
				<img class="img-producto" src="${imgSrc}" alt="${nombreEsc}" loading="${loadingAttr}" decoding="async"${priorityAttr}>
				<div class="sombra-interior"></div>
			</div>
			<div class="info-producto">
				<h3 class="nombre-producto"><button type="button" class="tarjeta-detalle-btn" aria-label="Ver detalles de ${nombreEsc}, ${formatPrecio(producto.precio)}">${nombreEsc}</button></h3>
				<div class="etiquetas-container">${etiquetas}</div>
				<div class="contenedor-row">
					<span class="precio">${formatPrecio(producto.precio)}</span>
					<button class="${clasesBoton}" type="button" aria-label="Agregar ${nombreEsc}" ${deshabilitado}>
						<span class="icono-stack">${iconoStack}</span>
						<span class="icono-encargue">${iconoEncargue}</span>
					</button>
				</div>
			</div>
		</article>
	`;
}

function inicializarMasonry() {
	const productosGrid = document.querySelector('.grid-productos');
	if (!productosGrid || typeof Masonry === 'undefined') return;

	if (!estadoTienda.masonryRelayoutHandler) {
		estadoTienda.masonryRelayoutHandler = () => requestAnimationFrame(() => {
			estadoTienda.masonry?.layout();
			// Refresca ScrollTrigger solo si el header animado está activo.
			if (estadoTienda.headerScrollTriggerEnabled && typeof ScrollTrigger !== 'undefined') {
				requestAnimationFrame(() => ScrollTrigger.refresh());
			}
		});
	}

	const relayout = estadoTienda.masonryRelayoutHandler;

	if (!estadoTienda.masonry) {
		estadoTienda.masonry = new Masonry(productosGrid, {
			itemSelector:       '.tarjeta-producto',
			columnWidth:        '.grid-sizer',
			gutter:             '.gutter-sizer',
			percentPosition:    true,
			resizeContainer:    true,
			transitionDuration: '0.25s'
		});
	} else {
		estadoTienda.masonry.reloadItems();
		estadoTienda.masonry.layout();
	}

	if (!estadoTienda.masonryListenersBound) {
		window.addEventListener('load', relayout);
		window.addEventListener('resize', debounce(relayout, 150));
		document.fonts?.ready.then(relayout);
		estadoTienda.masonryListenersBound = true;
	}

	// Reatach solo a imágenes del render actual (con once para no acumular).
	// Además quita la clase `is-loading` del contenedor cuando carga (o falla)
	// para que el skeleton-shimmer desaparezca.
	productosGrid.querySelectorAll('.img-producto').forEach(img => {
		const contenedor = img.closest('.imagen-contenedor');
		const desmarcar  = () => contenedor?.classList.remove('is-loading');
		if (img.complete && img.naturalHeight > 0) {
			desmarcar();
		} else {
			img.addEventListener('load',  () => { desmarcar(); relayout(); }, { once: true });
			img.addEventListener('error', () => { desmarcar(); relayout(); }, { once: true });
		}
	});

	setTimeout(relayout, 120);
}

function crearCentinelaYLoader() {
	const grid = document.querySelector('.grid-productos');
	if (!grid) return;
	document.getElementById('infinite-loader')?.remove();
	document.getElementById('centinela-scroll')?.remove();

	const loader = document.createElement('div');
	loader.id = 'infinite-loader';
	loader.className = 'infinite-loader';
	loader.setAttribute('aria-hidden', 'true');
	loader.innerHTML = `
		<span class="infinite-loader-dot"></span>
		<span class="infinite-loader-dot"></span>
		<span class="infinite-loader-dot"></span>
	`;

	const centinela = document.createElement('div');
	centinela.id = 'centinela-scroll';
	centinela.setAttribute('aria-hidden', 'true');

	grid.insertAdjacentElement('afterend', loader);
	loader.insertAdjacentElement('afterend', centinela);
}

function mostrarLoader(visible) {
	document.getElementById('infinite-loader')?.classList.toggle('is-visible', visible);
}

function configurarInfiniteScroll() {
	const centinela = document.getElementById('centinela-scroll');
	if (!centinela) return;
	if (infiniteScrollObserver) infiniteScrollObserver.disconnect();
	infiniteScrollObserver = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting && !isLoading) cargarMas();
	}, { threshold: 0.1 });
	infiniteScrollObserver.observe(centinela);
}

function cargarMas() {
	if (isLoading || !hayMasProductos) return;

	const offset = paginaActual * PAGINA_LIMITE;
	const lote   = productosVisibles.slice(offset, offset + PAGINA_LIMITE);

	if (!lote.length) {
		hayMasProductos = false;
		infiniteScrollObserver?.disconnect();
		return;
	}

	const grid = document.querySelector('.grid-productos');
	if (!grid || !estadoTienda.masonry) return;

	isLoading = true;
	mostrarLoader(true);

	setTimeout(() => {
		const nuevasTarjetas = [];
		lote.forEach((producto, i) => {
			const tmp = document.createElement('div');
			tmp.innerHTML = crearTarjetaProducto(producto, offset + i).trim();
			const tarjeta = tmp.firstElementChild;
			tarjeta.classList.add('is-entrando');
			grid.appendChild(tarjeta);
			nuevasTarjetas.push(tarjeta);
		});

		estadoTienda.masonry.appended(nuevasTarjetas);

		nuevasTarjetas.forEach(tarjeta => {
			tarjeta.querySelectorAll('.img-producto').forEach(img => {
				const contenedor = img.closest('.imagen-contenedor');
				const desmarcar  = () => contenedor?.classList.remove('is-loading');
				if (img.complete && img.naturalHeight > 0) {
					desmarcar();
				} else {
					img.addEventListener('load',  () => { desmarcar(); estadoTienda.masonry?.layout(); }, { once: true });
					img.addEventListener('error', () => { desmarcar(); estadoTienda.masonry?.layout(); }, { once: true });
				}
			});
		});

		paginaActual++;
		if (lote.length < PAGINA_LIMITE) {
			hayMasProductos = false;
			infiniteScrollObserver?.disconnect();
		}

		requestAnimationFrame(() => requestAnimationFrame(() => {
			isLoading = false;
			mostrarLoader(false);
			nuevasTarjetas.forEach((tarjeta, i) => {
				setTimeout(() => {
					tarjeta.classList.remove('is-entrando');
					tarjeta.classList.add('is-visible');
				}, i * 25);
			});
			// Relayout final tras el lote. Necesario porque las imágenes que ya
			// están en caché (gracias al prefetch en idle) disparan `desmarcar()`
			// sincrónicamente — esto quita el `min-height: 260px` del skeleton y
			// la tarjeta encoge. Pero Masonry posicionó las tarjetas en
			// `appended()` asumiendo la altura con skeleton, así que su tracker
			// de columna cree que son más altas y deja un hueco visible sobre la
			// siguiente tarjeta. Un layout() aquí recoloca con alturas reales.
			estadoTienda.masonry?.layout();
			if (estadoTienda.headerScrollTriggerEnabled && typeof ScrollTrigger !== 'undefined') {
				ScrollTrigger.refresh();
			}
		}));
	}, 80);
}

function obtenerEstadoSinResultados() {
	let el = document.getElementById('estado-sin-resultados');
	if (!el) {
		el = document.createElement('div');
		el.id        = 'estado-sin-resultados';
		el.className = 'estado-sin-resultados';
		el.setAttribute('role',      'status');
		el.setAttribute('aria-live', 'polite');
		el.innerHTML = `<p>${MENSAJE_SIN_RESULTADOS}</p>`;
		document.body.appendChild(el);
	}
	return el;
}

function mostrarEstadoSinResultados(mostrar) {
	obtenerEstadoSinResultados().classList.toggle('is-visible', mostrar);
}

function actualizarBotonBusqueda(boton) {
	if (boton) boton.setAttribute('aria-label', 'Limpiar búsqueda');
}

let _searchCloseTimer = null;

function abrirBuscador(searchBar, searchInput, searchSubmitBtn) {
	clearTimeout(_searchCloseTimer);
	_searchCloseTimer = null;
	searchBar.classList.remove('is-closing', 'is-header-hidden', 'is-scroll-hidden');
	searchBar.classList.add('is-active');
	actualizarBotonBusqueda(searchSubmitBtn);
	setTimeout(() => searchInput.focus(), 150);
	// NO ocultamos el header-nav: la visibilidad de las opciones la controla
	// únicamente el estado expandido/colapsado del header (GSAP). Antes se
	// forzaba nav-oculta al abrir el buscador, lo que escondía las opciones
	// aunque el header estuviera expandido.
}

function cerrarBuscador(searchBar, searchInput) {
	clearTimeout(_searchCloseTimer);
	searchBar.classList.add('is-closing');
	searchInput.value = '';
	filtrarProductos('');
	searchInput.blur();
	if (!document.getElementById('modal-producto')?.classList.contains('is-active')) {
		document.querySelector('.header-nav')?.classList.remove('nav-oculta');
	}
	_searchCloseTimer = setTimeout(() => {
		searchBar.classList.remove('is-active', 'is-closing');
		_searchCloseTimer = null;
	}, 420); // mayor que la transición más larga (380ms)
}

/* Oculta la barra de búsqueda preservando el texto del input y el filtro aplicado.
   La barra queda lógicamente "abierta" (mantiene is-active) pero invisible vía
   is-scroll-hidden. Al pulsar la lupa, abrirBuscador() quita is-scroll-hidden y
   la barra vuelve a aparecer con todo intacto.
   Lo usamos en dos triggers:
     - cuando el header colapsa al hacer scroll (si el input no tiene foco)
     - cuando el usuario toca cualquier punto fuera de la barra */
function ocultarBuscadorPreservandoEstado() {
	const searchBar = document.getElementById('search-bar');
	if (!searchBar?.classList.contains('is-active')) return;
	if (searchBar.classList.contains('is-scroll-hidden')) return;
	searchBar.classList.add('is-scroll-hidden');
	// Soltar foco — en móvil esto cierra el teclado virtual.
	document.getElementById('search-input')?.blur();
	// Reaparecer la nav del header (la habíamos ocultado al abrir).
	if (!document.getElementById('modal-producto')?.classList.contains('is-active')) {
		document.querySelector('.header-nav')?.classList.remove('nav-oculta');
	}
}

function renderizarProductos(productos, opciones = {}) {
	const { mostrarVacio = false } = opciones;
	const grid = document.querySelector('.grid-productos');
	if (!grid) return;

	if (infiniteScrollObserver) {
		infiniteScrollObserver.disconnect();
		infiniteScrollObserver = null;
	}

	productosVisibles = productos;
	paginaActual      = 0;
	isLoading         = false;
	hayMasProductos   = true;

	const savedY     = window.scrollY;
	const primerLote = productosVisibles.slice(0, PAGINA_LIMITE);

	grid.innerHTML = `
		<div class="grid-sizer"></div>
		<div class="gutter-sizer"></div>
		${primerLote.map((p, i) => crearTarjetaProducto(p, i)).join('')}
	`;
	mostrarEstadoSinResultados(mostrarVacio);
	inicializarMasonry();
	crearCentinelaYLoader();

	if (primerLote.length < PAGINA_LIMITE) {
		hayMasProductos = false;
	} else {
		paginaActual = 1;
		configurarInfiniteScroll();
	}

	// Restaurar scroll: el rebuild del DOM puede forzar al navegador a volver al top.
	// Si hay búsqueda activa, desplaza suavemente al inicio del grid (header colapsado visible).
	const _scrollTarget = estadoFiltros.termino
		? Math.max(100, window.innerHeight * 0.6 - 60)
		: savedY;

	if (_scrollTarget > 0 || savedY > 0) {
		requestAnimationFrame(() =>
			requestAnimationFrame(() =>
				window.scrollTo({ top: _scrollTarget, behavior: 'instant' })
			)
		);
	}
}

// --------- LA FUNCION DEL ALGORITMO DE PESO ----------//
//cogemos los productos que tenemos y lo ordenamos por un peso que le asignamos por sus ventas, sus interacciones y por el peso que le asignemos//
function ordenarPorPesoAleatorio(productos) {
	// aqui cogemos las interacciones que teniamos guardadas en el localstorage, si no habian, tomamos un arreglo vacio//

	const interaccionesLocales = JSON.parse(localStorage.getItem('levitad-interacciones') || '{}');
	// Aqui creamos un nuevo arreglo de productos creandole la propiedad peso, que se rige por las ventas y eso//
	const productosConPeso = productos.map(producto => {
		const ventas = producto.ventas || 0;
		const pesoManual = producto.pesoManual || 0;
		
		const interaccionesGlobales = producto.interacciones || 0;
		const interaccionesPersonales = interaccionesLocales[producto.nombre] || 0;
		const interaccionesTotales = interaccionesGlobales + interaccionesPersonales;

		// LA FORMULA DEL PESO//
		const pesoTotal = (ventas*3) + (interaccionesTotales*2) + (pesoManual*5);
		const bloquePeso = Math.floor(pesoTotal / 10) * 10;
		// Antes: `Math.random()` daba orden distinto en cada visita → rompía
		// el cache del HTML y confundía al usuario. Ahora un hash estable del
		// nombre desempata dentro del bloque: misma prenda siempre misma
		// posición, pero el orden dentro del bloque sigue siendo "variado".
		let h = 0;
		const n = producto.nombre || '';
		for (let i = 0; i < n.length; i++) h = ((h << 5) - h + n.charCodeAt(i)) | 0;
		const pesoFinal = bloquePeso + (Math.abs(h) % 1000) / 1000;
		//aqui retornamos todo el arrgelo original de producto pero con la propiedad _pesoOrdenamiento con el valor de pesoFinal//
		return { ...producto, _pesoOrdenamiento: pesoFinal };
	});
	// Luego aqui usamos lo que nos devolvio el .map, y lo ordenammos de mayor a menor basandonos en el peso que tendrian asignados cada uno //
	return productosConPeso.sort((a, b) => b._pesoOrdenamiento - a._pesoOrdenamiento);
}




/* Inyecta `f_auto,q_auto` en URLs de Cloudinary que no las tengan, para que
   Cloudinary entregue WebP/AVIF al navegador en vez del JPG/PNG original.
   Las URLs nuevas que NO se subieron desde el panel admin a veces no traen
   estas transformaciones — esto las arregla en el render. */
function optimizarUrlImagen(url) {
	if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
	if (url.includes('/upload/f_auto') || url.includes(',f_auto')) return url;
	return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

function optimizarImagenesProducto(p) {
	const out = { ...p };
	if (Array.isArray(p.imagenes)) out.imagenes = p.imagenes.map(optimizarUrlImagen);
	if (p.imagen) out.imagen = optimizarUrlImagen(p.imagen);
	return out;
}

async function cargarProductos() {
	try {
		const resp = await fetch('datos/datos.json', { cache: 'no-cache' });
		if (!resp.ok) throw new Error(`No se pudo leer datos.json (${resp.status})`);
		const data = await resp.json();
		const productosRaw = Array.isArray(data) ? data : (data.productos || []);
		const outfitsRaw   = Array.isArray(data) ? []   : (data.outfits   || []);
		// Optimizamos URLs antes de guardar en estado: todos los render leen ya optimizado.
		const productos = productosRaw.map(optimizarImagenesProducto);
		const outfits   = outfitsRaw.map(o => o.imagen
			? { ...o, imagen: optimizarUrlImagen(o.imagen) }
			: o
		);

		estadoTienda.productos = ordenarPorPesoAleatorio(productos);
		estadoTienda.outfits   = outfits;

		aplicarFiltros();
		prefetchImagenesEnIdle();
	} catch (error) {
		console.error('Error cargando productos:', error);
		mostrarAviso('error', 'No pudimos cargar los productos. Revisa tu conexión e intenta recargar la página.', 'Error de conexión');
	}
}

/* Después de cargar el catálogo, en momentos de inactividad del navegador,
   pide en segundo plano todas las imágenes que NO están aún en el DOM. Así
   el SW las cachea y la próxima navegación (filtrar, abrir detalle, scrollear)
   es instantánea. No corre en conexiones lentas o con "ahorro de datos". */
function prefetchImagenesEnIdle() {
	const conn = navigator.connection;
	if (conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
		return;
	}
	const ejecutar = () => {
		const urls = new Set();
		estadoTienda.productos.forEach(p => {
			if (Array.isArray(p.imagenes)) p.imagenes.forEach(u => u && urls.add(u));
			if (p.imagen) urls.add(p.imagen);
		});
		estadoTienda.outfits.forEach(o => { if (o.imagen) urls.add(o.imagen); });

		// Sacar las que el browser ya descargó (están en el DOM completas)
		document.querySelectorAll('img').forEach(img => {
			if (img.complete && img.naturalHeight > 0) {
				urls.delete(img.currentSrc || img.src);
			}
		});

		// Pedir de a una con espaciado (no saturar la red ni el SW)
		const lista = [...urls];
		let i = 0;
		const siguiente = () => {
			if (i >= lista.length) return;
			const img = new Image();
			img.decoding = 'async';
			const seguir = () => { i++; setTimeout(siguiente, 120); };
			img.onload = seguir;
			img.onerror = seguir;
			img.src = lista[i];
		};
		siguiente();
	};
	if ('requestIdleCallback' in window) {
		requestIdleCallback(ejecutar, { timeout: 5000 });
	} else {
		setTimeout(ejecutar, 2500);
	}
}

function cambiarIconosEncargue(isEncargue) {
	// Los iconos de los botones de producto son gestionados por CSS (body.is-encargue).
	// Solo actualizamos el icono del carrito en la barra de iconos.
	const carritoBtn = document.getElementById('carrito-btn');
	const carritoSvg = carritoBtn?.closest('svg');
	if (carritoBtn && carritoSvg) {
		carritoSvg.classList.add('icono-transicion');
		setTimeout(() => {
			if (isEncargue) {
				carritoSvg.setAttribute('viewBox', '0 0 64 64');
				carritoBtn.innerHTML = `
					<g style="stroke: currentColor; fill: none; stroke-linejoin: round; stroke-width: 2px;">
						<circle cx="32" cy="24" r="10"/>
						<path d="M32,14h0A10,10,0,0,1,22,24h0"/>
						<path d="M32,14h0A10,10,0,0,0,42,24h0"/>
						<path d="M44,56h6a4,4,0,0,0,4-4V50"/>
						<path d="M51,44h7a4,4,0,0,0,4-4V38H40.94"/>
						<path d="M58,44v2a4,4,0,0,1-4,4H49"/>
						<path d="M20,56H14a4,4,0,0,1-4-4V50"/>
						<path d="M13,44H6a4,4,0,0,1-4-4V38H23.06"/>
						<path d="M6,44v2a4,4,0,0,0,4,4h5"/>
						<path d="M32,34h0A12,12,0,0,1,44,46V62a0,0,0,0,1,0,0H20a0,0,0,0,1,0,0V46A12,12,0,0,1,32,34Z"/>
						<ellipse cx="32" cy="6" rx="11" ry="4"/>
						<line x1="38" x2="20" y1="36" y2="54"/>
						<line x1="41" x2="20" y1="39" y2="60"/>
					</g>`;
			} else {
				carritoSvg.setAttribute('viewBox', '0 0 24 24');
				carritoBtn.innerHTML = `
					<path d="m23.918,4H4.49l-.256-1.843c-.17-1.229-1.234-2.157-2.476-2.157H0v1h1.759c.745,0,1.383.556,1.485,1.294l2.021,14.549c.17,1.229,1.234,2.157,2.476,2.157h12.259v-1H7.741c-.745,0-1.383-.556-1.485-1.294l-.237-1.706h15.699l2.2-11ZM5.88,14l-1.25-9h18.068l-1.8,9H5.88Zm1.12,6c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Zm10-3c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"/>`;
			}
			carritoSvg.querySelector('svg')?.classList.add('icono-transicion');
		}, 150);
	}
}

/* ─────────────────────────────────────────────
   CAMBIO 3: MODAL DE BIENVENIDA AL MODO ENCARGUE
   (solo aparece la primera vez, guardado en localStorage)
───────────────────────────────────────────── */
function crearModalEncargue() {
	if (document.getElementById('modal-encargue')) return;

	const el = document.createElement('div');
	el.id        = 'modal-encargue';
	el.className = 'modal-encargue-overlay';
	el.setAttribute('role',              'dialog');
	el.setAttribute('aria-modal',        'true');
	el.setAttribute('aria-labelledby',   'modal-encargue-titulo');

	el.innerHTML = `
		<div class="modal-encargue-card">
			<div class="modal-encargue-glow"></div>

			<div class="modal-encargue-header">
				<svg class="modal-encargue-icono" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
					<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
						<circle cx="32" cy="22" r="10"/>
						<path d="M32,12h0A10,10,0,0,1,22,22h0"/>
						<path d="M32,12h0A10,10,0,0,0,42,22h0"/>
						<ellipse cx="32" cy="5" rx="11" ry="3.5"/>
						<path d="M32,32h0A12,12,0,0,1,44,44V60a0,0,0,0,1,0,0H20a0,0,0,0,1,0,0V44A12,12,0,0,1,32,32Z"/>
					</g>
				</svg>
				<span class="modal-encargue-badge">Modo Especial</span>
			</div>

			<h2 id="modal-encargue-titulo" class="modal-encargue-titulo">Modo Para Encargos</h2>
			<p class="modal-encargue-subtitulo">Un espacio para que encargues la ropa que no tenemos aun</p>

			<ul class="modal-encargue-lista">
				<li>
					<span class="encargue-li-icon">✦</span>
					<span>Prendas pedidas por usted, buscando alimentar sus Outifits</span>
				</li>
				<li>
					<span class="encargue-li-icon">✦</span>
					<span>Diseños únicos que no tenemos ahora mismo listos para la venta, pero pueden ser suyas</span>
				</li>
				<li>
					<span class="encargue-li-icon">✦</span>
					<span>Coordinamos por WhatsApp para cuadrar todos los detalles</span>
				</li>
			</ul>

			<div class="modal-encargue-divider"></div>

			<p class="modal-encargue-nota">
				Los artículos que selecciones acá se guardan separados de tu carrito habitual.
			</p>

			<button class="modal-encargue-btn" id="modal-encargue-cerrar">
				Entendido, explorar ✦
			</button>
			<label class="modal-encargue-no-mostrar">
				<input type="checkbox" id="modal-encargue-check">
				No mostrar de nuevo
			</label>
		</div>
	`;

	document.body.appendChild(el);

	const cerrar = () => {
		document.body.classList.remove('modal-encargue-abierto');
		const check = document.getElementById('modal-encargue-check');
		if (check && check.checked) {
			localStorage.setItem(STORAGE_KEY_MODAL_ENCARGUE, '1');
		}
		el.classList.add('is-closing');
		setTimeout(() => el.remove(), 420);
	};

	document.getElementById('modal-encargue-cerrar').addEventListener('click', cerrar);
	el.addEventListener('click', e => { if (e.target === el) cerrar(); });

	requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-active')));
	document.body.classList.add('modal-encargue-abierto');
	enfocarModal(el, document.getElementById('modal-encargue-cerrar'));
}

function mostrarModalEncargueUnaVez() {
	if (localStorage.getItem(STORAGE_KEY_MODAL_ENCARGUE)) return;
	setTimeout(crearModalEncargue, 350);
}

const estadoFiltros = {
	termino: '',
	tags:        new Set(),
	categorias:  new Set(),
	orden:       null
};

/* ─── SWITCH ─── */
if (switchContainer) {
	const switchIndicator = switchContainer.querySelector('.color-switch');
	const switchButtons   = Array.from(switchContainer.querySelectorAll('button'));

	const setActiveSwitch = (button) => {
		if (!switchIndicator || !button) return;

		const modoAnterior = document.body.classList.contains('is-encargue');

		// Reads primero — antes de cualquier write para evitar forced sync layout
		const containerRect = switchContainer.getBoundingClientRect();
		const buttonRect    = button.getBoundingClientRect();
		const indicadorX    = buttonRect.left - containerRect.left;

		// Writes
		switchButtons.forEach(btn => {
			btn.classList.remove('is-active');
			btn.setAttribute('aria-pressed', 'false');
		});
		button.classList.add('is-active');
		button.setAttribute('aria-pressed', 'true');

		const isEncargue = switchButtons.indexOf(button) === 1;
		const modoCambio = isEncargue !== modoAnterior;
		switchContainer.classList.toggle('is-encargue', isEncargue);
		document.body.classList.toggle('is-encargue',   isEncargue);

		switchIndicator.style.width     = `${buttonRect.width}px`;
		switchIndicator.style.transform = `translate(${indicadorX}px, -50%)`;

		cambiarIconosEncargue(isEncargue);

		// CAMBIO 4: re-renderizar con el carrito del modo activo
		renderizarCarrito();
		// Solo reconstruir la grilla si el modo cambió de verdad (evita flicker en cada resize)
		if (estadoTienda.productos.length > 0 && modoCambio) aplicarFiltros();

		// CAMBIO 3: modal solo la primera vez que se activa encargue
		if (isEncargue && modoCambio) mostrarModalEncargueUnaVez();
	};

	switchButtons.forEach(button => {
		button.addEventListener('click', () => setActiveSwitch(button));
	});

	if (switchButtons.length > 0) setActiveSwitch(switchButtons[0]);

	window.addEventListener('resize', debounce(() => {
		const active = switchContainer.querySelector('button.is-active') || switchButtons[0];
		if (active) setActiveSwitch(active);
	}, 150));
}

/* ─── MODAL DETALLE PRODUCTO ─── */
const modal     = document.getElementById('modal-producto');
const btnCerrar = document.querySelector('.btn-cerrar-modal');
let sliderImagenes = [];
let sliderActual   = 0;

function registrarInteraccion(nombreProducto) {
	const key = 'levitad-interacciones';
	const interacciones = JSON.parse(localStorage.getItem(key) || '{}');
	interacciones[nombreProducto] = (interacciones[nombreProducto] || 0) + 1;
	localStorage.setItem(key, JSON.stringify(interacciones));
}

function registrarTagsVistos(tags) {
	if (!Array.isArray(tags) || !tags.length) return;
	const key = 'levitad-tags-vistos';
	const datos = JSON.parse(localStorage.getItem(key) || '{}');
	tags.forEach(tag => { datos[tag] = (datos[tag] || 0) + 1; });
	localStorage.setItem(key, JSON.stringify(datos));
}

function registrarCategoriaVista(categoria) {
	if (!categoria) return;
	const key = 'levitad-categorias-vistas';
	const datos = JSON.parse(localStorage.getItem(key) || '{}');
	const cat = String(categoria).toLowerCase();
	datos[cat] = (datos[cat] || 0) + 1;
	localStorage.setItem(key, JSON.stringify(datos));
}

/* Mueve el foco del teclado dentro de un modal/panel al abrirlo.
   - Si se pasa `preferido`, enfoca ese elemento (ej. el botón de comprar).
   - Si no, hace el contenedor enfocable con tabindex="-1" (NO entra al
     orden de Tab, no se ve outline: el foco es programático, no de teclado)
     y lo enfoca. preventScroll evita saltos visuales. */
function enfocarModal(contenedor, preferido) {
	if (!contenedor) return;
	let objetivo = preferido;
	if (!objetivo) {
		if (!contenedor.hasAttribute('tabindex')) contenedor.setAttribute('tabindex', '-1');
		objetivo = contenedor;
	}
	requestAnimationFrame(() => requestAnimationFrame(() => {
		try { objetivo.focus({ preventScroll: true }); } catch (_) {}
	}));
}

function abrirDetalles(datos) {
	document.querySelector('.header-nav')?.classList.add('nav-oculta');
	registrarInteraccion(datos.nombre);
	registrarTagsVistos(datos.tags);
	registrarCategoriaVista(datos.categoria);

	estadoTienda.productoDetalleActual = datos;
	document.getElementById('modal-titulo').innerText = datos.nombre;
	document.getElementById('modal-precio').innerText = formatPrecio(datos.precio);

	const modalDetalles    = document.getElementById('modal-detalles');
	const especificaciones = Object.entries(datos.detalles || {});
	modalDetalles.innerHTML = especificaciones
		.map(([clave, valor]) => `
			<li class="detalle-item">
				<span class="detalle-label">${esc(clave)}:</span>
				<span class="detalle-valor">${esc(valor)}</span>
			</li>
		`).join('');

	const imagenes = Array.isArray(datos.imagenes) && datos.imagenes.length
		? datos.imagenes
		: (datos.imagen ? [datos.imagen] : []);
	renderizarSlider(imagenes, datos.nombre);

	// Sincroniza el botón con el estado real del carrito para este producto.
	// Sin esto, si el producto anterior se agregó, el botón queda disabled=true
	// y bloqueado para cualquier producto siguiente que se abra.
	const btnModal = document.getElementById('btn-comprar-ahora');
	if (btnModal) {
		const isEncargue = modoActual() === 'encargue';
		if (obtenerProductoEnCarrito(datos.nombre)) {
			marcarBotonComoAgregado(btnModal, isEncargue);
		} else {
			desmarcarBotonAgregado(btnModal, isEncargue);
		}
	}

	modal.style.display = 'flex';
	modal.setAttribute('aria-hidden', 'false');
	setTimeout(() => modal.classList.add('is-active'), 10);

	const _btnComprar = document.getElementById('btn-comprar-ahora');
	enfocarModal(modal, _btnComprar && !_btnComprar.disabled ? _btnComprar : null);
}

function cerrarModal() {
	modal.classList.remove('is-active');
	modal.setAttribute('aria-hidden', 'true');
	if (!document.getElementById('search-bar')?.classList.contains('is-active')) {
		document.querySelector('.header-nav')?.classList.remove('nav-oculta');
	}
	setTimeout(() => {
		modal.style.display = 'none';
	}, 500);
}

function irASlide(idx) {
	if (!sliderImagenes.length) return;
	sliderActual = Math.max(0, Math.min(idx, sliderImagenes.length - 1));
	const track = document.getElementById('modal-img-track');
	if (track) track.style.transform = `translateX(${-sliderActual * 100}%)`;
	document.querySelectorAll('#modal-slider-dots .modal-dot').forEach((d, i) => {
		d.classList.toggle('is-active', i === sliderActual);
	});
	const prev = document.getElementById('modal-slider-prev');
	const next = document.getElementById('modal-slider-next');
	if (prev) prev.classList.toggle('is-hidden', sliderActual === 0);
	if (next) next.classList.toggle('is-hidden', sliderActual === sliderImagenes.length - 1);
}

function renderizarSlider(imagenes, nombre) {
	sliderImagenes = imagenes;
	sliderActual   = 0;
	const track = document.getElementById('modal-img-track');
	const dots  = document.getElementById('modal-slider-dots');
	if (!track) return;

	track.innerHTML = imagenes.map(src => `
		<div class="modal-slide is-loading">
			<img src="${src}" alt="${nombre}" class="modal-slide-img" decoding="async">
		</div>
	`).join('');
	track.style.transform = 'translateX(0)';

	// Quitar el shimmer cuando la imagen carga (o falla). Mismo patrón que las
	// tarjetas del grid: si la imagen ya está completa (caché), desmarcamos al instante.
	track.querySelectorAll('.modal-slide-img').forEach(img => {
		const slide = img.closest('.modal-slide');
		const desmarcar = () => slide?.classList.remove('is-loading');
		if (img.complete && img.naturalHeight > 0) {
			desmarcar();
		} else {
			img.addEventListener('load',  desmarcar, { once: true });
			img.addEventListener('error', desmarcar, { once: true });
		}
	});

	const hasMult = imagenes.length > 1;
	if (dots) {
		dots.innerHTML = hasMult
			? imagenes.map((_, i) => `<span class="modal-dot${i === 0 ? ' is-active' : ''}"></span>`).join('')
			: '';
	}
	const prev = document.getElementById('modal-slider-prev');
	const next = document.getElementById('modal-slider-next');
	if (prev) prev.classList.toggle('is-hidden', true);
	if (next) next.classList.toggle('is-hidden', !hasMult);
}

/* ─── EVENT DELEGATION GRID ─── */
const grid = document.querySelector('.grid-productos');
if (grid) {
	let _gridTouchX = 0, _gridTouchY = 0, _gridTouchMoved = false;
	grid.addEventListener('touchstart', e => {
		_gridTouchX = e.touches[0].clientX;
		_gridTouchY = e.touches[0].clientY;
		_gridTouchMoved = false;
	}, { passive: true });
	grid.addEventListener('touchmove', e => {
		if (Math.abs(e.touches[0].clientX - _gridTouchX) > 10 ||
		    Math.abs(e.touches[0].clientY - _gridTouchY) > 10) {
			_gridTouchMoved = true;
		}
	}, { passive: true });
	// scroll horizontal de etiquetas: el scroll no burbujea, lo captamos en fase de captura
	grid.addEventListener('scroll', (e) => {
		if (e.target && e.target.classList && e.target.classList.contains('etiquetas-container')) {
			_gridTouchMoved = true;
		}
	}, { capture: true, passive: true });

	grid.addEventListener('click', (e) => {
		if (_gridTouchMoved) { _gridTouchMoved = false; return; }

		const tarjeta   = e.target.closest('.tarjeta-producto');
		const btnAnadir = e.target.closest('.btn-anadir');

		if (btnAnadir && tarjeta) {
			const producto = productosVisibles[Number(tarjeta.dataset.productoId)];
			if (producto) agregarAlCarrito(producto, btnAnadir);
			return;
		}

		if (tarjeta) {
			const producto = productosVisibles[Number(tarjeta.dataset.productoId)];
			if (producto) abrirDetalles(producto);
		}
	});

	// Accesibilidad por teclado: el foco aterriza en el .tarjeta-detalle-btn
	// (botón dentro del <h3>). Su Enter/Espacio nativo dispara un click que
	// burbujea hasta este grid y abre el detalle — no hace falta keydown manual.
}

/* ─── NAV DEL HEADER: interactivo y accesible por teclado ─── */
{
	const _navAcciones = {
		categorias: abrirCategoriasPanel,
		parati:     abrirParaTiPanel,
		outfits:    abrirOutfitsPanel,
		contacto:   abrirContactoPanel
	};
	document.querySelectorAll('.header-nav ul li[data-nav]').forEach(li => {
		const accion = _navAcciones[li.dataset.nav];
		if (typeof accion !== 'function') return;
		li.addEventListener('click', () => accion());
		li.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); accion(); }
		});
	});
}

if (btnCerrar && modal) {
	btnCerrar.addEventListener('click', cerrarModal);
	modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });
}

const btnSliderPrev = document.getElementById('modal-slider-prev');
const btnSliderNext = document.getElementById('modal-slider-next');
if (btnSliderPrev) btnSliderPrev.addEventListener('click', e => { e.stopPropagation(); irASlide(sliderActual - 1); });
if (btnSliderNext) btnSliderNext.addEventListener('click', e => { e.stopPropagation(); irASlide(sliderActual + 1); });

const trackEl = document.getElementById('modal-img-track');
	if (trackEl) {
		// Swipe táctil para pasar imágenes — misma lógica que los botones prev/next
		// (irASlide ±1), pero con arrastre en vivo y snap-back si el gesto es corto.
		let _startX = 0, _startY = 0, _deltaX = 0, _arrastrando = false, _anchoTrack = 1;
		// Detección de "tap" (toque sin arrastre): abre la imagen a pantalla completa.
		let _tapMoved = false, _tapStartX = 0, _tapStartY = 0;

		const _swipeInicio = (e) => {
			const t = e.touches[0];
			_tapStartX = t.clientX;
			_tapStartY = t.clientY;
			_tapMoved  = false;
			if (sliderImagenes.length <= 1) return;
			_startX = t.clientX;
			_startY = t.clientY;
			_deltaX = 0;
			_arrastrando = true;
			_anchoTrack = trackEl.offsetWidth || 1;
			trackEl.style.transition = 'none'; // seguir el dedo sin lag
		};

		const _swipeMover = (e) => {
			const _t0 = e.touches[0];
			if (_t0 && (Math.abs(_t0.clientX - _tapStartX) > 10 ||
			            Math.abs(_t0.clientY - _tapStartY) > 10)) _tapMoved = true;
			if (!_arrastrando) return;
			const t  = e.touches[0];
			const dx = t.clientX - _startX;
			const dy = t.clientY - _startY;
			// Si el gesto es claramente vertical, cancelar el swipe y soltar.
			if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
				_arrastrando = false;
				trackEl.style.transition = '';
				irASlide(sliderActual);
				return;
			}
			_deltaX = dx;
			const base = -sliderActual * 100;
			const pct  = (dx / _anchoTrack) * 100;
			trackEl.style.transform = `translateX(${base + pct}%)`;
		};

		const _swipeFin = () => {
			if (!_arrastrando) return;
			_arrastrando = false;
			trackEl.style.transition = ''; // vuelve a la transición del CSS
			const umbral = _anchoTrack * 0.18;
			if (_deltaX <= -umbral)      irASlide(sliderActual + 1);
			else if (_deltaX >= umbral)  irASlide(sliderActual - 1);
			else                          irASlide(sliderActual); // snap-back
		};

		// Tap sobre la imagen → abrir a pantalla completa con zoom.
		const _abrirDesdeTrack = () => {
			if (_tapMoved) { _tapMoved = false; return; }
			const src = sliderImagenes[sliderActual];
			if (!src) return;
			const imgEl = trackEl.children[sliderActual]?.querySelector('img');
			abrirLightbox(src, imgEl ? imgEl.alt : '');
		};

		trackEl.addEventListener('touchstart',  _swipeInicio, { passive: true });
		trackEl.addEventListener('touchmove',   _swipeMover,  { passive: true });
		trackEl.addEventListener('touchend',    _swipeFin,    { passive: true });
		trackEl.addEventListener('touchcancel', _swipeFin,    { passive: true });
		trackEl.addEventListener('click',       _abrirDesdeTrack);
	}

/* ─── BÚSQUEDA Y FILTROS ─── */

function aplicarFiltros() {
	const modo = modoActual();
	let resultado = estadoTienda.productos.filter(p => !p.modo || p.modo === modo);

	if (estadoFiltros.termino) {
		const t = estadoFiltros.termino.toLowerCase();
		resultado = resultado.filter(p =>
			p.nombre.toLowerCase().includes(t) ||
			(Array.isArray(p.tags) && p.tags.some(tag => tag.toLowerCase().includes(t)))
		);
	}

	if (estadoFiltros.tags.size > 0) {
		resultado = resultado.filter(p =>
			Array.isArray(p.tags) &&
			[...estadoFiltros.tags].every(tag => p.tags.includes(tag))
		);
	}

	if (estadoFiltros.categorias.size > 0) {
		resultado = resultado.filter(p =>
			p.categoria && estadoFiltros.categorias.has(String(p.categoria).toLowerCase())
		);
	}

	if (estadoFiltros.orden === 'precio-asc')  resultado.sort((a, b) => a.precio - b.precio);
	if (estadoFiltros.orden === 'precio-desc') resultado.sort((a, b) => b.precio - a.precio);
	if (estadoFiltros.orden === 'nombre')      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

	renderizarProductos(resultado, { mostrarVacio: resultado.length === 0 });
	actualizarIndicadorFiltros();
}

function filtrarProductos(termino) {
	estadoFiltros.termino = termino.trim();
	aplicarFiltros();
	actualizarIndicadorBusqueda();
}

function actualizarIndicadorFiltros() {
	const filterBtn = document.getElementById('filter-btn');
	if (!filterBtn) return;
	const hayFiltros = estadoFiltros.tags.size > 0 || estadoFiltros.categorias.size > 0 || estadoFiltros.orden !== null;
	filterBtn.classList.toggle('has-filters', hayFiltros);
	let dot = filterBtn.querySelector('.filter-dot');
	if (hayFiltros && !dot) {
		dot = document.createElement('span');
		dot.className = 'filter-dot';
		filterBtn.appendChild(dot);
	} else if (!hayFiltros && dot) {
		dot.remove();
	}
}

function actualizarIndicadorBusqueda() {
	const buscarBtn = document.getElementById('buscar-btn');
	if (!buscarBtn) return;
	const hayBusqueda = !!estadoFiltros.termino;
	let dot = buscarBtn.querySelector('.search-dot');
	if (hayBusqueda && !dot) {
		dot = document.createElement('span');
		dot.className = 'search-dot';
		buscarBtn.appendChild(dot);
	} else if (!hayBusqueda && dot) {
		dot.remove();
	}
}

function obtenerTodosLosTags() {
	const set = new Set();
	estadoTienda.productos.forEach(p => {
		if (Array.isArray(p.tags)) p.tags.forEach(t => set.add(t));
	});
	return [...set].sort();
}

function obtenerTodasLasCategorias() {
	const set = new Set();
	estadoTienda.productos.forEach(p => {
		if (p.categoria) set.add(String(p.categoria).toLowerCase());
	});
	return [...set].sort();
}

function abrirModalFiltros() {
	const existe = document.getElementById('modal-filtros');
	if (existe) { cerrarModalFiltros(); return; }

	const el = document.createElement('div');
	el.id        = 'modal-filtros';
	el.className = 'modal-filtros-overlay';
	el.setAttribute('role', 'dialog');
	el.setAttribute('aria-modal', 'true');

	const todos = obtenerTodosLosTags();
	const todasCats = obtenerTodasLasCategorias();

	el.innerHTML = `
		<div class="modal-filtros-card">
			<div class="modal-filtros-glow"></div>
			<div class="modal-filtros-header">
				<h3 class="modal-filtros-titulo">Filtrar</h3>
				<button class="modal-filtros-cerrar" id="modal-filtros-cerrar" aria-label="Cerrar filtros">✕</button>
			</div>
			<div class="modal-filtros-body">
				<div class="filtros-seccion">
					<p class="filtros-seccion-label">Ordenar por</p>
					<div class="filtros-orden-grid">
						${[
							{ val: '__null__', label: 'Relevancia' },
							{ val: 'precio-asc',  label: 'Precio ↑' },
							{ val: 'precio-desc', label: 'Precio ↓' },
							{ val: 'nombre',      label: 'Nombre A–Z' }
						].map(o => `
							<button class="filtros-orden-btn ${(estadoFiltros.orden === null && o.val === '__null__') || estadoFiltros.orden === o.val ? 'is-active' : ''}" data-orden="${o.val}">${o.label}</button>
						`).join('')}
					</div>
				</div>
				${todasCats.length ? `
				<div class="filtros-seccion">
					<p class="filtros-seccion-label">Categorías</p>
					<div class="filtros-tags-grid">
						${todasCats.map(cat => `
							<button class="filtros-tag-btn ${estadoFiltros.categorias.has(cat) ? 'is-active' : ''}" data-categoria="${cat}">${cat}</button>
						`).join('')}
					</div>
				</div>
				` : ''}
				<div class="filtros-seccion">
					<p class="filtros-seccion-label">Etiquetas</p>
					<div class="filtros-tags-grid">
						${todos.map(tag => `
							<button class="filtros-tag-btn ${estadoFiltros.tags.has(tag) ? 'is-active' : ''}" data-tag="${tag}">#${tag}</button>
						`).join('')}
					</div>
				</div>
			</div>
			<div class="modal-filtros-footer">
				<button class="filtros-btn-reset" id="filtros-reset">Limpiar todo</button>
				<button class="filtros-btn-aplicar" id="filtros-aplicar">Aplicar</button>
			</div>
		</div>
	`;

	document.body.appendChild(el);

	el.querySelector('#modal-filtros-cerrar').addEventListener('click', cerrarModalFiltros);
	el.addEventListener('click', e => { if (e.target === el) cerrarModalFiltros(); });

	el.querySelectorAll('.filtros-orden-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			el.querySelectorAll('.filtros-orden-btn').forEach(b => b.classList.remove('is-active'));
			btn.classList.add('is-active');
			estadoFiltros.orden = btn.dataset.orden === '__null__' ? null : btn.dataset.orden;
		});
	});

	el.querySelectorAll('.filtros-tag-btn[data-tag]').forEach(btn => {
		btn.addEventListener('click', () => {
			const tag = btn.dataset.tag;
			if (estadoFiltros.tags.has(tag)) {
				estadoFiltros.tags.delete(tag);
				btn.classList.remove('is-active');
			} else {
				estadoFiltros.tags.add(tag);
				btn.classList.add('is-active');
			}
		});
	});

	el.querySelectorAll('.filtros-tag-btn[data-categoria]').forEach(btn => {
		btn.addEventListener('click', () => {
			const cat = btn.dataset.categoria;
			if (estadoFiltros.categorias.has(cat)) {
				estadoFiltros.categorias.delete(cat);
				btn.classList.remove('is-active');
			} else {
				estadoFiltros.categorias.add(cat);
				btn.classList.add('is-active');
			}
		});
	});

	el.querySelector('#filtros-reset').addEventListener('click', () => {
		estadoFiltros.tags.clear();
		estadoFiltros.categorias.clear();
		estadoFiltros.orden = null;
		el.querySelectorAll('.filtros-tag-btn').forEach(b => b.classList.remove('is-active'));
		el.querySelectorAll('.filtros-orden-btn').forEach(b => b.classList.remove('is-active'));
		el.querySelector('[data-orden="__null__"]')?.classList.add('is-active');
	});

	el.querySelector('#filtros-aplicar').addEventListener('click', () => {
		aplicarFiltros();
		cerrarModalFiltros();
	});

	requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-active')));

	// Bloquear scroll del body mientras el modal está abierto.
	// Guardamos el overflow previo para restaurarlo exactamente al cerrar.
	el.dataset.bodyOverflow = document.body.style.overflow || '';
	document.body.style.overflow = 'hidden';
}

function cerrarModalFiltros() {
	const el = document.getElementById('modal-filtros');
	if (!el) return;
	// Restaurar scroll del body al cerrar.
	document.body.style.overflow = el.dataset.bodyOverflow || '';
	el.classList.add('is-closing');
	setTimeout(() => el.remove(), 350);
}

/* ── Menu hamburguesa ── */
/* ═══════════════════════════════════════════════════════════
   PATCH — Menú hamburguesa con footer premium
   + Footer de página

   En tu js.js, reemplazá la función initMenuHamburguesa()
   completa con esta versión.
═══════════════════════════════════════════════════════════ */

function initMenuHamburguesa() {
	const menuBtn = document.getElementById('menu-hamb');
	const ov      = document.getElementById('menu-nav-overlay');
	const panel   = document.getElementById('menu-nav-panel');
	if (!menuBtn || !ov || !panel) return;

	let _hambTouchMoved   = false;
	let _hambResetTimeout = null;
	let _scrollResetTimer = null;

	function abrirMenu() {
		if (panel.classList.contains('is-active')) return;
		_hambTouchMoved = false;
		menuBtn.classList.add('is-open');
		menuBtn.setAttribute('aria-expanded', 'true');
		menuBtn.setAttribute('aria-label', 'Cerrar menú');
		panel.style.display = 'flex';
		requestAnimationFrame(() => requestAnimationFrame(() => {
			ov.classList.add('is-active');
			panel.classList.add('is-active');
		}));
		enfocarModal(panel, panel.querySelector('.menu-nav-item'));
	}

	function cerrarMenu() {
		menuBtn.classList.remove('is-open');
		menuBtn.setAttribute('aria-expanded', 'false');
		menuBtn.setAttribute('aria-label', 'Abrir menú');
		ov.classList.remove('is-active');
		ov.classList.add('is-closing');
		panel.classList.remove('is-active');
		panel.classList.add('is-closing');
		setTimeout(() => {
			ov.classList.remove('is-closing');
			panel.classList.remove('is-closing');
			panel.style.display = '';
		}, 380);
	}

	panel.addEventListener('touchstart', () => { clearTimeout(_hambResetTimeout); }, { passive: true });
	panel.addEventListener('touchmove',  () => { _hambTouchMoved = true; },          { passive: true });
	panel.addEventListener('scroll',     () => {
		_hambTouchMoved = true;
		clearTimeout(_scrollResetTimer);
		_scrollResetTimer = setTimeout(() => { _hambTouchMoved = false; }, 300);
	}, { passive: true });
	panel.addEventListener('touchend',   () => {
		_hambResetTimeout = setTimeout(() => { _hambTouchMoved = false; }, 400);
	}, { passive: true });

	ov.addEventListener('click', cerrarMenu);

	document.querySelectorAll('.menu-nav-item').forEach(item => {
		item.addEventListener('contextmenu', e => e.preventDefault());
		item.addEventListener('click', e => {
			e.preventDefault();
			if (_hambTouchMoved) return;
			cerrarMenu();
		});
	});

	panel.querySelector('.menu-nav-item-contacto')?.addEventListener('click', () => {
		if (_hambTouchMoved) return;
		setTimeout(() => abrirContactoPanel(), 400);
	});
	panel.querySelector('.menu-nav-item-outfits')?.addEventListener('click', () => {
		if (_hambTouchMoved) return;
		setTimeout(() => abrirOutfitsPanel(), 400);
	});
	panel.querySelector('.menu-nav-item-parati')?.addEventListener('click', () => {
		if (_hambTouchMoved) return;
		setTimeout(() => abrirParaTiPanel(), 400);
	});
	panel.querySelector('.menu-nav-item-categorias')?.addEventListener('click', () => {
		if (_hambTouchMoved) return;
		setTimeout(() => abrirCategoriasPanel(), 400);
	});
	panel.querySelector('.menu-nav-item-sobre-levitad')?.addEventListener('click', () => {
		if (_hambTouchMoved) return;
		setTimeout(() => abrirSobreLevitadPanel(), 400);
	});
	panel.querySelector('[data-action="faq"]')?.addEventListener('click', () => {
		if (_hambTouchMoved) return;
		setTimeout(() => abrirFaqPanel(), 400);
	});
	panel.querySelector('#tema-toggle')?.addEventListener('click', (e) => {
		const esClaro = document.body.classList.toggle('is-light');
		localStorage.setItem('levitad-tema', esClaro ? 'light' : 'dark');
		e.currentTarget.setAttribute('aria-pressed', esClaro ? 'true' : 'false');
	});

	menuBtn.addEventListener('click', () =>
		panel.classList.contains('is-active') ? cerrarMenu() : abrirMenu()
	);
	menuBtn.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			panel.classList.contains('is-active') ? cerrarMenu() : abrirMenu();
		}
	});
}



/* ═══════════════════════════════════════════════════════════
   Panel de Contacto — vive en el HTML, JS solo activa/desactiva.
═══════════════════════════════════════════════════════════ */
function initContactoPanel() {
	const ov    = document.getElementById('contacto-overlay');
	const panel = document.getElementById('contacto-panel');
	if (!ov || !panel) return;

	ov.addEventListener('click', cerrarContactoPanel);
	panel.querySelector('.contacto-cerrar')?.addEventListener('click', cerrarContactoPanel);

	const form = panel.querySelector('#contacto-form');
	if (form) {
		form.addEventListener('submit', manejarEnvioContacto);
		form.querySelectorAll('input, textarea').forEach(el => {
			el.addEventListener('input', () => limpiarErrorCampo(el));
		});
	}
}

function abrirContactoPanel() {
	const ov    = document.getElementById('contacto-overlay');
	const panel = document.getElementById('contacto-panel');
	if (!ov || !panel || panel.classList.contains('is-active')) return;
	document.body.classList.add('contacto-abierto');
	panel.setAttribute('aria-hidden', 'false');
	requestAnimationFrame(() => requestAnimationFrame(() => {
		ov.classList.add('is-active');
		panel.classList.add('is-active');
	}));
	enfocarModal(panel);
}


function cerrarContactoPanel() {
	document.body.classList.remove('contacto-abierto');
	const ov    = document.getElementById('contacto-overlay');
	const panel = document.getElementById('contacto-panel');
	if (ov)    { ov.classList.remove('is-active');    ov.classList.add('is-closing');    setTimeout(() => ov.classList.remove('is-closing'),    380); }
	if (panel) { panel.classList.remove('is-active'); panel.classList.add('is-closing'); panel.setAttribute('aria-hidden', 'true'); setTimeout(() => panel.classList.remove('is-closing'), 380); }
}

function limpiarErrorCampo(el) {
	const err = el.closest('.contacto-campo')?.querySelector('.contacto-error');
	if (err) err.textContent = '';
	el.classList.remove('is-invalid');
}

function validarContacto({ nombre, email, mensaje }) {
	const errores = {};
	const nombreRe = /^[a-zA-ZÀ-ÿñÑ\s'\-\.]{2,60}$/;
	const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

	if (!nombre || nombre.length < 2) errores.nombre = 'Ingresa tu nombre.';
	else if (nombre.length > 60) errores.nombre = 'Máximo 60 caracteres.';
	else if (!nombreRe.test(nombre)) errores.nombre = 'El nombre contiene caracteres no permitidos.';

	if (!email) errores.email = 'Ingresa tu correo electrónico.';
	else if (email.length > 120) errores.email = 'Máximo 120 caracteres.';
	else if (!emailRe.test(email)) errores.email = 'Correo electrónico inválido.';

	if (!mensaje || mensaje.length < 5) errores.mensaje = 'El mensaje es demasiado corto.';
	else if (mensaje.length > 1000) errores.mensaje = 'Máximo 1000 caracteres.';

	return errores;
}

async function manejarEnvioContacto(e) {
	e.preventDefault();
	const form = e.currentTarget;
	const status = form.querySelector('.contacto-status');
	const submitBtn = form.querySelector('.contacto-submit');

	const honey = form.querySelector('input[name="_honey"]');
	if (honey && honey.value.trim() !== '') {
		// Bot detectado — fingir éxito sin enviar
		status.textContent = '¡Mensaje enviado! Te respondemos pronto.';
		status.className = 'contacto-status is-ok';
		form.reset();
		return;
	}

	const nombre  = form.nombre.value.trim();
	const email   = form.email.value.trim();
	const mensaje = form.mensaje.value.trim();

	// Limpiar errores previos
	form.querySelectorAll('.contacto-error').forEach(el => el.textContent = '');
	form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
	status.textContent = '';
	status.className = 'contacto-status';

	const errores = validarContacto({ nombre, email, mensaje });
	if (Object.keys(errores).length > 0) {
		Object.entries(errores).forEach(([campo, msg]) => {
			const errEl = form.querySelector(`[data-error-for="${campo}"]`);
			const inputEl = form.querySelector(`[name="${campo}"]`);
			if (errEl) errEl.textContent = msg;
			if (inputEl) inputEl.classList.add('is-invalid');
		});
		const primerInvalido = form.querySelector('.is-invalid');
		if (primerInvalido) primerInvalido.focus();
		return;
	}

	submitBtn.disabled = true;
	submitBtn.classList.add('is-loading');

	try {
		const res = await fetch('https://formsubmit.co/ajax/luisernesto.cuellar164@gmail.com', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				nombre,
				email,
				mensaje,
				_subject: `Nuevo contacto de ${nombre} — Lévitad`,
				_template: 'table',
				_captcha: 'false'
			})
		});

		const data = await res.json().catch(() => ({}));

		if (res.ok && (data.success === 'true' || data.success === true)) {
			status.textContent = '¡Mensaje enviado! Te responderemos a la brevedad.';
			status.className = 'contacto-status is-ok';
			form.reset();
		} else {
			throw new Error(data.message || 'Error al enviar el mensaje');
		}
	} catch (err) {
		status.textContent = 'No se pudo enviar el mensaje. Prueba de nuevo en unos minutos.';
		status.className = 'contacto-status is-error';
	} finally {
		submitBtn.disabled = false;
		submitBtn.classList.remove('is-loading');
	}
}



/* ═══════════════════════════════════════════════════════════
   Panel Sobre Lévitad — vive en el HTML, JS solo activa/desactiva.
═══════════════════════════════════════════════════════════ */
function initSobrePanel() {
	const panel = document.getElementById('sobre-panel');
	if (!panel) return;

	panel.querySelector('.sobre-cerrar')?.addEventListener('click', cerrarSobreLevitadPanel);
	panel.addEventListener('click', (e) => {
		if (e.target === panel) cerrarSobreLevitadPanel();
	});
}

function abrirSobreLevitadPanel() {
	const panel = document.getElementById('sobre-panel');
	if (!panel || panel.classList.contains('is-active')) return;
	document.body.classList.add('sobre-abierto');
	panel.setAttribute('aria-hidden', 'false');
	requestAnimationFrame(() => requestAnimationFrame(() => {
		panel.classList.add('is-active');
	}));
	enfocarModal(panel);
	document.addEventListener('keydown', _sobreLevitadEscHandler);
}

function _sobreLevitadEscHandler(e) {
	if (e.key === 'Escape') {
		const panel = document.getElementById('sobre-panel');
		if (panel?.classList.contains('is-active')) cerrarSobreLevitadPanel();
	}
}

function cerrarSobreLevitadPanel() {
	document.body.classList.remove('sobre-abierto');
	document.removeEventListener('keydown', _sobreLevitadEscHandler);
	const panel = document.getElementById('sobre-panel');
	if (panel) {
		panel.classList.remove('is-active');
		panel.classList.add('is-closing');
		panel.setAttribute('aria-hidden', 'true');
		setTimeout(() => panel.classList.remove('is-closing'), 420);
	}
}

/* ═══════════════════════════════════════════════════════════
   Panel Preguntas frecuentes (FAQ) — vive en el HTML.
   El acordeón es nativo (<details name="faq">), así que el JS
   solo abre/cierra el panel y conecta los accesos (menú, footer
   y CTA hacia Contacto).
═══════════════════════════════════════════════════════════ */
function initFaqPanel() {
	const ov    = document.getElementById('faq-overlay');
	const panel = document.getElementById('faq-panel');
	if (!panel) return;

	ov?.addEventListener('click', cerrarFaqPanel);
	panel.querySelector('.faq-cerrar')?.addEventListener('click', cerrarFaqPanel);

	// CTA "Escríbenos": cierra FAQ y abre el panel de Contacto.
	panel.querySelector('#faq-cta-contacto')?.addEventListener('click', () => {
		cerrarFaqPanel();
		setTimeout(() => abrirContactoPanel(), 420);
	});

	// Accesos desde el footer del sitio.
	document.getElementById('footer-faq-link')?.addEventListener('click', abrirFaqPanel);
	document.getElementById('footer-contacto-link')?.addEventListener('click', abrirContactoPanel);
}

function _faqEscHandler(e) {
	if (e.key === 'Escape') {
		const panel = document.getElementById('faq-panel');
		if (panel?.classList.contains('is-active')) cerrarFaqPanel();
	}
}

function abrirFaqPanel() {
	const ov    = document.getElementById('faq-overlay');
	const panel = document.getElementById('faq-panel');
	if (!panel || panel.classList.contains('is-active')) return;
	document.body.classList.add('faq-abierto');
	panel.setAttribute('aria-hidden', 'false');
	requestAnimationFrame(() => requestAnimationFrame(() => {
		ov?.classList.add('is-active');
		panel.classList.add('is-active');
	}));
	enfocarModal(panel);
	document.addEventListener('keydown', _faqEscHandler);
}

function cerrarFaqPanel() {
	document.body.classList.remove('faq-abierto');
	document.removeEventListener('keydown', _faqEscHandler);
	const ov    = document.getElementById('faq-overlay');
	const panel = document.getElementById('faq-panel');
	if (ov)    { ov.classList.remove('is-active');    ov.classList.add('is-closing');    setTimeout(() => ov.classList.remove('is-closing'),    380); }
	if (panel) { panel.classList.remove('is-active'); panel.classList.add('is-closing'); panel.setAttribute('aria-hidden', 'true'); setTimeout(() => panel.classList.remove('is-closing'), 380); }
}

/* Inyecta FAQPage JSON-LD leyendo las preguntas/respuestas del DOM,
   así el dato estructurado para Google coincide siempre con lo visible. */
function inyectarFaqJsonLd() {
	const items = document.querySelectorAll('#faq-panel .faq-item');
	if (!items.length) return;
	const faqs = [];
	items.forEach(item => {
		const q = item.querySelector('.faq-q')?.textContent.trim();
		const a = item.querySelector('.faq-a')?.textContent.trim();
		if (q && a) faqs.push({
			'@type': 'Question',
			name: q,
			acceptedAnswer: { '@type': 'Answer', text: a }
		});
	});
	if (!faqs.length) return;
	const data = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs };
	const script = document.createElement('script');
	script.type = 'application/ld+json';
	script.textContent = JSON.stringify(data);
	document.head.appendChild(script);
}

/* ═══════════════════════════════════════════════════════════════
   Modal Kuroma — créditos del desarrollador.
   Se dispara desde cualquier elemento con [data-kouma-trigger]
   (los dos enlaces "Kuroma" en el footer del sitio y del menú).
   La animación de cortina + draw está en CSS; aquí solo gestionamos
   las clases is-active / is-opening / is-closing y los listeners.
   ═══════════════════════════════════════════════════════════════ */
function initKoumaModal() {
	const modal = document.getElementById('kouma-modal');
	if (!modal) return;

	document.querySelectorAll('[data-kouma-trigger]').forEach(el => {
		el.addEventListener('click', (e) => {
			e.preventDefault();
			abrirKoumaModal();
		});
	});

	modal.querySelector('.kouma-modal__close')?.addEventListener('click', cerrarKoumaModal);

	// Click sobre la cortina (fondo) cierra. El contenido NO cierra al hacer click.
	modal.querySelector('.kouma-modal__curtain')?.addEventListener('click', cerrarKoumaModal);
}

function _koumaEscHandler(e) {
	if (e.key === 'Escape') cerrarKoumaModal();
}

function abrirKoumaModal() {
	const modal = document.getElementById('kouma-modal');
	if (!modal || modal.classList.contains('is-active')) return;

	modal.classList.remove('is-closing');
	modal.classList.add('is-active');
	modal.setAttribute('aria-hidden', 'false');
	// is-opening se aplica en el siguiente frame para que las animaciones disparen
	requestAnimationFrame(() => requestAnimationFrame(() => {
		modal.classList.add('is-opening');
	}));

	document.body.style.overflow = 'hidden';
	document.addEventListener('keydown', _koumaEscHandler);

	// Foco al botón cerrar tras la cortina (mejora a11y)
	setTimeout(() => {
		modal.querySelector('.kouma-modal__close')?.focus();
	}, 850);
}

function cerrarKoumaModal() {
	const modal = document.getElementById('kouma-modal');
	if (!modal || !modal.classList.contains('is-active')) return;

	modal.classList.remove('is-opening');
	modal.classList.add('is-closing');

	document.removeEventListener('keydown', _koumaEscHandler);

	// Tras la animación de salida, ocultar de verdad
	setTimeout(() => {
		modal.classList.remove('is-active', 'is-closing');
		modal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
	}, 520);
}


/* ═══════════════════════════════════════════════════════════
   Panel de Outfits — mostruario tipo lookbook.
   ───────────────────────────────────────────────────────────
   LÓGICA:
   - Cada outfit en datos.json tiene { imagen, prendas[] }, donde cada
     prenda referencia un producto por nombre + un punto (puntoX/Y en
     porcentaje) sobre la imagen.
   - El panel arma un carrusel horizontal (un slide por outfit). Cada
     slide divide la pantalla en dos: imagen a la izquierda con
     marcadores numerados sobre los puntos indicados, y a la derecha
     una columna con las cards de los productos del look.
   - Líneas punteadas SVG conectan cada marcador con su card. Se
     recalculan al renderizar, al hacer resize, y al cambiar de slide.
     En mobile (<= 720px) la imagen va arriba y las cards abajo, sin
     conectores — los marcadores se reemplazan por números visibles
     que coinciden con la numeración de las cards.
   - Click en una card abre el modal de detalle existente (abrirDetalles)
     reusando la lógica de carrito/precio/etc. Si el producto referenciado
     en datos.json no existe en estadoTienda.productos, la card se
     muestra como placeholder no clickable (no rompe).
   - El dorado de los marcadores y conectores usa var(--color-alas-principal)
     para que cambie automáticamente al activar encargues, y los fondos
     usan variables temáticas para alternar oscuro/claro.

   NOTA SOBRE PERSONAJE 2D vs FOTO:
   Decidí mantener foto real (o mockup tipo editorial) en lugar de
   personaje 2D. Un personaje cartoon rompe el lenguaje premium del
   resto de la web (tipografías serif, dorados envejecidos, paleta
   sobria). El campo `imagen` es solo una URL — cuando haya producción
   fotográfica real, se reemplaza sin tocar lógica.
═══════════════════════════════════════════════════════════ */
function abrirOutfitsPanel() {
	if (document.getElementById('outfits-panel')) return;
	document.body.classList.add('outfits-abierto');

	const outfits = (estadoTienda.outfits || []);
	if (!outfits.length) return;

	const ov = document.createElement('div');
	ov.id = 'outfits-overlay';
	ov.className = 'outfits-overlay';

	const panel = document.createElement('div');
	panel.id = 'outfits-panel';
	panel.className = 'outfits-panel';

	// Mapa rápido nombre → producto (para cards y para abrir el detalle)
	const mapaProductos = new Map(
		(estadoTienda.productos || []).map(p => [p.nombre, p])
	);

	// HTML de cada slide ─────────────────────────────────────────
	const slidesHTML = outfits.map((outfit, idx) => {
		const markersHTML = outfit.prendas.map((pr, i) => `
			<span class="outfit-marker" data-idx="${i}"
			      style="left:${pr.puntoX}%;top:${pr.puntoY}%">
				<span class="outfit-marker-num">${i + 1}</span>
			</span>
		`).join('');

		const cardsHTML = outfit.prendas.map((pr, i) => {
			const prod = mapaProductos.get(pr.producto);
			const img  = (Array.isArray(prod?.imagenes) && prod.imagenes[0]) || prod?.imagen || 'imagenes/sudadera.jpg';
			const nom  = prod?.nombre || pr.producto;
			const cat  = prod?.categoria ? prod.categoria.charAt(0).toUpperCase() + prod.categoria.slice(1) : (pr.etiqueta || '');
			const prec = prod ? formatPrecio(prod.precio) : '';
			const noProd = prod ? '' : 'is-placeholder';
			return `
				<button class="outfit-prenda ${noProd}" data-idx="${i}"
				        data-producto="${nom.replace(/"/g, '&quot;')}"
				        ${prod ? '' : 'disabled aria-disabled="true"'}>
					<span class="outfit-prenda-num">${i + 1}</span>
					<span class="outfit-prenda-img" style="background-image:url('${img}')"></span>
					<span class="outfit-prenda-info">
						<span class="outfit-prenda-cat">${cat}</span>
						<span class="outfit-prenda-nombre">${nom}</span>
						${prec ? `<span class="outfit-prenda-precio">${prec}</span>` : ''}
					</span>
					<span class="outfit-prenda-arrow">→</span>
				</button>
			`;
		}).join('');

		return `
			<article class="outfit-slide" data-outfit-id="${outfit.id}" data-slide="${idx}">
				<div class="outfit-imagen-wrap">
					<div class="outfit-imagen" style="background-image:url('${outfit.imagen}')"></div>
					<div class="outfit-markers">${markersHTML}</div>
				</div>

				<aside class="outfit-detalle">
					<header class="outfit-detalle-head">
						<span class="outfit-detalle-eyebrow">Look ${String(idx + 1).padStart(2, '0')}</span>
						<h3 class="outfit-detalle-titulo">${outfit.nombre}</h3>
						<p class="outfit-detalle-estilo">${outfit.estilo}</p>
						<p class="outfit-detalle-desc">${outfit.descripcion}</p>
					</header>
					<div class="outfit-prendas-lista">${cardsHTML}</div>
					<button class="outfit-llevar-todo" data-outfit-idx="${idx}" type="button">
						<svg class="outfit-llevar-todo-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<circle cx="9" cy="21" r="1"></circle>
							<circle cx="20" cy="21" r="1"></circle>
							<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"></path>
						</svg>
						<span class="outfit-llevar-todo-text">Llevar todo el look al carrito</span>
						<span class="outfit-llevar-todo-chevron" aria-hidden="true">→</span>
					</button>
				</aside>

				<svg class="outfit-conectores" aria-hidden="true"></svg>
			</article>
		`;
	}).join('');

	const dotsHTML = outfits.map((_, i) =>
		`<button class="outfits-dot ${i === 0 ? 'is-active' : ''}" data-go="${i}" aria-label="Ir al look ${i + 1}"></button>`
	).join('');

	panel.innerHTML = `
		<button class="outfits-cerrar" aria-label="Cerrar outfits">✕</button>
		<div class="outfits-glow"></div>

		<header class="outfits-header">
			<span class="outfits-eyebrow">Looks completos</span>
			<h2 class="outfits-titulo">Outfits</h2>
			<p class="outfits-sub">Inspiración armada con prendas reales de la tienda.</p>
		</header>

		<div class="outfits-carousel">
			<button class="outfits-nav outfits-prev" aria-label="Anterior">‹</button>
			<div class="outfits-viewport">
				<div class="outfits-track">${slidesHTML}</div>
			</div>
			<button class="outfits-nav outfits-next" aria-label="Siguiente">›</button>
		</div>

		<div class="outfits-dots">${dotsHTML}</div>
	`;

	document.body.appendChild(ov);
	document.body.appendChild(panel);

	requestAnimationFrame(() => requestAnimationFrame(() => {
		ov.classList.add('is-active');
		panel.classList.add('is-active');
	}));
	enfocarModal(panel);

	// ─── Carrusel ──────────────────────────────────────────────
	const track = panel.querySelector('.outfits-track');
	const dots  = panel.querySelectorAll('.outfits-dot');
	let idxActual = 0;

	function irA(i) {
		idxActual = Math.max(0, Math.min(outfits.length - 1, i));
		track.style.transform = `translateX(-${idxActual * 100}%)`;
		dots.forEach((d, di) => d.classList.toggle('is-active', di === idxActual));
	}

	panel.querySelector('.outfits-prev').addEventListener('click', () => irA(idxActual - 1));
	panel.querySelector('.outfits-next').addEventListener('click', () => irA(idxActual + 1));
	dots.forEach(d => d.addEventListener('click', () => irA(Number(d.dataset.go))));

	// ─── Click en card → abre el detalle del producto ─────────
	let _outfitsTouchMoved = false;
	track.addEventListener('touchstart', () => { _outfitsTouchMoved = false; }, { passive: true });
	track.addEventListener('touchmove',  () => { _outfitsTouchMoved = true;  }, { passive: true });
	// Scroll en cualquier descendiente (outfit-detalle, etc.) — captura porque scroll no burbujea
	panel.addEventListener('scroll', () => { _outfitsTouchMoved = true; }, { passive: true, capture: true });
	track.addEventListener('click', (e) => {
		if (_outfitsTouchMoved) { _outfitsTouchMoved = false; return; }
		// El botón "Llevar todo" tiene su propio handler — no abrir detalles
		if (e.target.closest('.outfit-llevar-todo')) return;
		const card = e.target.closest('.outfit-prenda');
		if (!card || card.disabled) return;
		const prod = mapaProductos.get(card.dataset.producto);
		if (!prod) return;
		cerrarOutfitsPanel();
		setTimeout(() => abrirDetalles(prod), 420);
	});

	// ─── Botón "Llevar todo el look al carrito" ──────────────
	panel.querySelectorAll('.outfit-llevar-todo').forEach(btn => {
		const textEl = btn.querySelector('.outfit-llevar-todo-text');
		const textoOriginal = textEl ? textEl.textContent : '';
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			if (_outfitsTouchMoved) { _outfitsTouchMoved = false; return; }
			if (btn.classList.contains('is-busy')) return;
			const idx = Number(btn.dataset.outfitIdx);
			const outfit = outfits[idx];
			if (!outfit) return;

			let agregadas = 0;
			outfit.prendas.forEach(pr => {
				const prod = mapaProductos.get(pr.producto);
				if (!prod) return;
				if (obtenerProductoEnCarrito(prod.nombre)) return;
				agregarAlCarrito(prod, null);
				agregadas++;
				// Sincroniza el botón correspondiente en el grid del catálogo
				document.querySelectorAll('.btn-anadir').forEach(b => {
					const t = b.closest('.tarjeta-producto');
					if (!t) return;
					const p = productosVisibles[Number(t.dataset.productoId)];
					if (p && p.nombre === prod.nombre) marcarBotonComoAgregado(b);
				});
			});

			btn.classList.add('is-busy', 'is-added');
			if (textEl) {
				textEl.textContent = agregadas > 0
					? (agregadas === 1 ? '1 prenda agregada' : `${agregadas} prendas agregadas`)
					: 'Ya están en el carrito';
			}
			setTimeout(() => {
				btn.classList.remove('is-busy', 'is-added');
				if (textEl) textEl.textContent = textoOriginal;
			}, 1800);
		});
	});

	// ─── Cerrar ───────────────────────────────────────────────
	ov.addEventListener('click', cerrarOutfitsPanel);
	panel.querySelector('.outfits-cerrar').addEventListener('click', cerrarOutfitsPanel);

	// ─── Swipe táctil para móviles ────────────────────────────
	let touchX0 = null;
	const viewport = panel.querySelector('.outfits-viewport');
	viewport.addEventListener('touchstart', (e) => { touchX0 = e.touches[0].clientX; }, { passive: true });
	viewport.addEventListener('touchend',   (e) => {
		if (touchX0 == null) return;
		const dx = e.changedTouches[0].clientX - touchX0;
		if (Math.abs(dx) > 50) irA(idxActual + (dx < 0 ? 1 : -1));
		touchX0 = null;
	});
}

function cerrarOutfitsPanel() {
	document.body.classList.remove('outfits-abierto');
	const ov    = document.getElementById('outfits-overlay');
	const panel = document.getElementById('outfits-panel');
	if (ov)    { ov.classList.add('is-closing');    setTimeout(() => ov.remove(),    380); }
	if (panel) { panel.classList.add('is-closing'); setTimeout(() => panel.remove(), 380); }
}


/* ═══════════════════════════════════════════════════════════
   Footer de página — se inyecta dinámicamente al cargar.
   Llamá initFooter() dentro de DOMContentLoaded.
═══════════════════════════════════════════════════════════ */
function initFooter() {
	const year = new Date().getFullYear();
	const footerYear     = document.getElementById('footer-year');
	const menuFooterYear = document.getElementById('menu-footer-year');
	if (footerYear)     footerYear.textContent     = year;
	if (menuFooterYear) menuFooterYear.textContent = year;
}

/* ─── INIT ─── */

function initTema() {
	const esClaro = localStorage.getItem('levitad-tema') === 'light';
	if (esClaro) document.body.classList.add('is-light');
	// El #tema-toggle vive dentro del menú hamburguesa; cuando initTema corre
	// puede no existir aún. Si existe, sincronizamos el aria-pressed inicial.
	document.getElementById('tema-toggle')?.setAttribute('aria-pressed', esClaro ? 'true' : 'false');
}

/* ── Header Nav Links ── */
function initHeaderNavLinks() {
	const navItems = document.querySelectorAll('.header-nav li');
	if (!navItems.length) return;

	navItems.forEach(item => {
		item.addEventListener('click', (e) => {
			e.preventDefault();
			const text = item.textContent.trim().toUpperCase();
			
			// Abrir el panel correspondiente según el texto
			setTimeout(() => {
				if (text.includes('CATEGOR')) {
					abrirCategoriasPanel();
				} else if (text.includes('PARA TI')) {
					abrirParaTiPanel();
				} else if (text.includes('OUTFITS')) {
					abrirOutfitsPanel();
				} else if (text.includes('CONTACTO')) {
					abrirContactoPanel();
				}
			}, 100);
		});
	});
}

document.addEventListener('DOMContentLoaded', () => {
	initTema();
	cargarCarritoGuardado();
	renderizarCarrito();
	cargarProductos();
	initFooter();
	const buscarBtn       = document.getElementById('buscar-btn');
	const searchBar       = document.getElementById('search-bar');
	const searchInput     = document.getElementById('search-input');
	const searchSubmitBtn = document.getElementById('search-submit-btn');
	const filterBtn       = document.getElementById('filter-btn');
	const carritoWrapper  = document.querySelector('.carrito-wrapper');
	const carritoOverlay  = document.getElementById('carrito-overlay');
	const carritoCerrar   = document.getElementById('carrito-cerrar');
	const carritoWhatsapp = document.getElementById('carrito-whatsapp');
	const btnComprarAhora = document.getElementById('btn-comprar-ahora');

	if (searchSubmitBtn) actualizarBotonBusqueda(searchSubmitBtn);

	if (buscarBtn && searchBar && searchInput && searchSubmitBtn) {
		buscarBtn.addEventListener('click', () => {
			const barHidden = !searchBar.classList.contains('is-active') ||
			                   searchBar.classList.contains('is-scroll-hidden');
			if (barHidden) {
				abrirBuscador(searchBar, searchInput, searchSubmitBtn);
				return;
			}
			searchInput.focus();
		});

		searchInput.addEventListener('input',    e => filtrarProductos(e.target.value));
		searchInput.addEventListener('keypress', e => {
			if (e.key === 'Enter') { e.preventDefault(); filtrarProductos(e.target.value); }
		});

		searchSubmitBtn.addEventListener('click', () =>
			cerrarBuscador(searchBar, searchInput)
		);

		if (filterBtn) {
			filterBtn.addEventListener('click', abrirModalFiltros);
		}

		// Tocar fuera de la barra oculta el buscador preservando texto y filtro.
		// Excluimos clicks dentro de la propia barra y sobre la lupa (que ya
		// gestiona su propio toggle de apertura/foco).
		document.addEventListener('click', (e) => {
			if (!searchBar.classList.contains('is-active')) return;
			if (searchBar.classList.contains('is-scroll-hidden')) return;
			if (searchBar.contains(e.target)) return;
			if (e.target.closest('#buscar-btn')) return;
			ocultarBuscadorPreservandoEstado();
		});
	}

	initMenuHamburguesa();
	initContactoPanel();
	initSobrePanel();
	initFaqPanel();
	inyectarFaqJsonLd();
	initKoumaModal();
	initHeaderNavLinks();
	initLightbox();
	initCompartir();

	if (carritoWrapper)  carritoWrapper.addEventListener('click',  abrirCarrito);
	if (carritoWrapper)  carritoWrapper.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirCarrito(); }
	});
	if (carritoOverlay)  carritoOverlay.addEventListener('click',  cerrarCarrito);
	if (carritoCerrar)   carritoCerrar.addEventListener('click',   cerrarCarrito);
	if (carritoWhatsapp) carritoWhatsapp.addEventListener('click', abrirSelectorDueno);

	const carritoVaciar = document.getElementById('carrito-vaciar');
	if (carritoVaciar) carritoVaciar.addEventListener('click', vaciarCarrito);

	if (btnComprarAhora) {
		btnComprarAhora.addEventListener('click', () => {
			if (estadoTienda.productoDetalleActual) {
				agregarAlCarrito(estadoTienda.productoDetalleActual, btnComprarAhora);
				cerrarModal();
			}
		});
	}

	// Service Worker: cachea imágenes (Cloudinary + locales) para que las
	// próximas visitas las carguen del disco. Ver sw.js.
	// Solo intercepta requests de imagen; no afecta nada más.
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('sw.js').catch(() => {});
	}
});

/* ─── HEADER SCROLL ─── */
const header = document.getElementById('header');

/* Función robusta para inyectar alas: reintentos automáticos si fallan */
function injectWingsIntoHeader() {
	const title     = header?.querySelector('h1');
	const leftWing  = document.querySelector('.ala-izquierda');
	const rightWing = document.querySelector('.ala-derecha');

	// Si encuentra ambas alas, las inyecta en el h1
	if (title && leftWing && rightWing) {
		leftWing.setAttribute('aria-hidden',  'true');
		rightWing.setAttribute('aria-hidden', 'true');
		title.insertBefore(leftWing, title.firstChild);
		title.appendChild(rightWing);
		return true; // Éxito
	}
	return false; // Falló - reintentar después
}

// Intenta inyectar las alas inmediatamente
let wingsInjected = injectWingsIntoHeader();

// Si falla, reintentar cada 100ms hasta 10 veces (1 segundo máximo)
if (!wingsInjected) {
	let retryCount = 0;
	const retryInterval = setInterval(() => {
		if (injectWingsIntoHeader()) {
			clearInterval(retryInterval);
			wingsInjected = true;
		}
		retryCount++;
		if (retryCount >= 10) {
			clearInterval(retryInterval);
			console.warn('⚠️ No se pudieron inyectar las alas del header después de 1 segundo. Los SVG pueden no estar parseados.');
		}
	}, 100);
}

if (header) {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const disableHeaderAnimation = prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined';

	if (disableHeaderAnimation) {
		estadoTienda.headerScrollTriggerEnabled = false;
		if (prefersReducedMotion) {
			// Honor reduced motion: show collapsed static header
			header.classList.add('is-collapsed');
			header.classList.remove('is-expanded');
		} else {
			// If animation libs missing, keep header in default (non-collapsed) state
			header.classList.remove('is-expanded');
		}
	} else {
		gsap.registerPlugin(ScrollTrigger);
		estadoTienda.headerScrollTriggerEnabled = true;

	/* normalizeScroll() eliminado: secuestraba el touch-scroll de la página y
		   desactivaba el pull-to-refresh nativo del navegador (la página no se podía
		   recargar arrastrando hacia abajo en móvil). El jitter de la barra de URL
		   en iOS ya lo cubre ignoreMobileResize. */

		// Ignora resize causados por la barra de URL móvil (solo cambia altura, no ancho).
		ScrollTrigger.config({ ignoreMobileResize: true });

	const logoArea        = header.querySelector('.logo-area');
	const h1El            = header.querySelector('h1');
	const headerNav       = header.querySelector('.header-nav');
	const iconosContainer = header.querySelector('.iconos-container');
	const searchBar       = document.getElementById('search-bar');

	// Caché del ancho del header para el translateX del logo (en px, no %)
	let headerW = header.clientWidth;

	// Altura expandida en px (cacheada para evitar lecturas dinámicas).
	// El header en CSS está fijo en 45vh — JS no la anima ya.
	let expandedH = window.innerHeight * 0.45;

	// scrollDist coincide con la distancia natural hasta que el sticky se ancla
	// (CSS top: calc(70px - 45vh)). Así la animación termina justo cuando el header
	// se queda fijo arriba con solo 70px visibles. Evita un "salto" al final.
	const getScrollDist = () => Math.max(140, expandedH - 70);

	// Y final para los hijos: desplazamiento desde el centro del header (45vh)
	// hasta el centro de los 70px visibles cuando está pegado en el top.
	const collapsedYOffset = () => (header.offsetHeight - 70) / 2;

	// Ajuste fino para logo-area: compensa el padding asimétrico 16/28 de
	// .header-container (la flex-centering real no está en el centro exacto).
	const logoYOffset = () => (header.offsetHeight - 58) / 2;

	// Caché del tema actual — se actualiza cuando body cambia de clase
	// Esto evita DOM read (classList.contains) en cada frame del onUpdate
	let currentThemeIsLight = document.body.classList.contains('is-light');

	// Observa cambios de clase en body para actualizar caché automáticamente
	new MutationObserver(() => {
		currentThemeIsLight = document.body.classList.contains('is-light');
	}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

	// Caché de booleanos de threshold para evitar classList.toggle redundante cada frame
	let lastExpandedState = null;

	// ── Timeline scrubbed ────────────────────────────────────────────────────────
	// scrub:0.3 → con animaciones puramente GPU (transforms+opacity) podemos usar
	// un scrub más ajustado sin lag. Antes 0.5 compensaba el reflow del height.
	const tl = gsap.timeline({
		defaults: { ease: 'none' },
		scrollTrigger: {
			trigger: document.documentElement,
			start:   'top top',
			end:     () => `+=${getScrollDist()}`,
			scrub:   0.3,
			invalidateOnRefresh: true,

			onEnter:     () => header.classList.add('is-collapsed'),
			onLeaveBack: () => header.classList.remove('is-collapsed'),

			onUpdate: (self) => {
				const p = self.progress;

				// CSS variables para el alpha del fondo y borde (computa el browser).
				if (currentThemeIsLight) {
					header.style.setProperty('--header-bg-alpha',     (0.90 + 0.10 * p).toFixed(3));
					header.style.setProperty('--header-border-alpha', (0.12 + 0.18 * p).toFixed(3));
				} else {
					header.style.setProperty('--header-bg-alpha',     (0.85 + 0.15 * p).toFixed(3));
					header.style.setProperty('--header-border-alpha', (0.10 + 0.20 * p).toFixed(3));
				}

				// is-expanded (alas decorativas): toggle solo cuando cruza el threshold
				const expanded = p <= 0.18;
				if (expanded !== lastExpandedState) {
					lastExpandedState = expanded;
					header.classList.toggle('is-expanded', expanded);
					// Cuando el header sale del estado expandido (empieza a colapsar),
					// ocultamos el buscador preservando lo que el usuario haya tecleado
					// y el filtro aplicado. Se reabre intacto al pulsar la lupa.
					// Excepción: si el input tiene foco, no lo ocultamos — el teclado
					// virtual en móvil puede causar scroll falso y romper la edición.
					if (!expanded) {
						const searchInput = document.getElementById('search-input');
						if (!searchInput || document.activeElement !== searchInput) {
							ocultarBuscadorPreservandoEstado();
						}
					}
				}

				// Hamburguesa: no clickeable mientras sea invisible (p < 0.65)
				if (hambWrap) hambWrap.style.pointerEvents = p >= 0.65 ? 'auto' : 'none';
			},
		},
	});

	// ── Animaciones GPU-only (transforms + opacity) ──────────────────────────────
	// ANTES: animábamos `height` y `paddingTop/paddingBottom` → reflow del documento
	//        entero cada frame. Masonry abajo tenía que recalcular posiciones,
	//        causando lag del scroll mientras la animación corría.
	// AHORA: el header tiene `height: 45vh` fijo y `top: calc(70px - 45vh)` sticky,
	//        así que se ancla naturalmente cuando solo quedan 70px visibles.
	//        Solo animamos transforms y opacity → 100% GPU compositing, cero reflow.

	// Logo: traslada hacia abajo (zona visible al colapsar) + a la izquierda.
	// El offset compensa el alto entero del header para llevar al h1 al centro
	// de los 70px visibles, más el ajuste por el nav que ocupa layout abajo.
	tl.fromTo(logoArea,
		{ y: 24, x: 0 },
		{
			y: () => logoYOffset() + (logoArea.offsetHeight - h1El.offsetHeight) / 2,
			x: () => -headerW * 0.25,
		},
		0
	);

	// h1: desplazamiento horizontal y escala (eje vertical lo maneja logoArea)
	tl.fromTo(h1El,
		{ x: 6, scale: 1    },
		{ x: 0, scale: 0.78 },
		0
	);

	// Nav: opacity fade out
	if (headerNav) {
		tl.fromTo(headerNav, { opacity: 1 }, { opacity: 0 }, 0);
	}

	// Iconos: se deslizan con el colapso del header desde su posición natural
	// (top:50% sin offset) hasta el centro de los 70px visibles.
	// Opacidad separada: completa al 65% del scroll — antes y en sync con el SVG.
	if (iconosContainer) {
		tl.fromTo(iconosContainer,
			{ y: 0, scale: 0.92 },
			{ y: () => collapsedYOffset() - iconosContainer.offsetHeight / 2, scale: 1 },
			0
		);
		tl.fromTo(iconosContainer, { opacity: 0 }, { opacity: 1, duration: 0.65 }, 0);
	}

	// Carrito: arco suave en Y relativo al contenedor — la lupa no se mueve, el carrito
	// sube ~12px a mitad de la animación y vuelve. Simula no-uniformidad orgánica.
	const carritoWrapper = header.querySelector('.carrito-wrapper');
	if (carritoWrapper && iconosContainer) {
		tl.fromTo(carritoWrapper, { y: 0 }, { y: -70, duration: 0.5, ease: 'power1.out' }, 0);
		tl.to(carritoWrapper, { y: 0, duration: 0.5, ease: 'power1.in' }, 0.5);
	}

	// Hamburguesa (wrapper fijo): misma posición visual de arranque que iconosContainer
	// (centro = H/2 + IC/2 desde viewport), misma trayectoria y mismo fade-in al 65%.
	const hambWrap = document.getElementById('menu-hamb-wrap');
	if (hambWrap) {
		const hambFromY = iconosContainer
			? () => (header.offsetHeight + iconosContainer.offsetHeight - hambWrap.offsetHeight) * 0.5
			: () => header.offsetHeight * 0.5;
		tl.fromTo(hambWrap, { y: hambFromY }, { y: 0 }, 0);
		tl.fromTo(hambWrap, { opacity: 0 }, { opacity: 1, duration: 0.65 }, 0);
	}

	/* ── INICIALIZACIÓN: Fuerza el estado expandido en la primera carga ── */
	/* El header sale expandido (scroll en 0), pero GSAP aún no ha ejecutado onUpdate.
	   Sin esto, las alas y .header-nav permanecen ocultos hasta el primer scroll.
	   Esto simula el estado inicial correcto: p=0, por tanto expanded=true */
	lastExpandedState = true;
	header.classList.add('is-expanded');
	// La hamburguesa solo aparece visible cuando el header colapsa (p >= 0.65).
	// El onUpdate apaga su pointer-events bajo ese umbral, pero como no corre
	// hasta el primer scroll, en la primera carga el wrap queda tocable
	// aunque esté invisible. Forzamos el estado inicial aquí.
	if (hambWrap) hambWrap.style.pointerEvents = 'none';
	if (searchBar) {
		searchBar.classList.remove('is-scroll-hidden');
	}
	/* Fin: Ahora en la primera carga ya se ven alas y nav correctamente */
	}

}

/* ═══════════════════════════════════════════════════════════
   Panel Para Ti — recomendaciones según actividad del usuario
═══════════════════════════════════════════════════════════ */
function abrirParaTiPanel() {
	if (document.getElementById('parati-panel')) return;

	const tagsRaw  = JSON.parse(localStorage.getItem('levitad-tags-vistos') || '{}');
	const catsRaw  = JSON.parse(localStorage.getItem('levitad-categorias-vistas') || '{}');
	const interRaw = JSON.parse(localStorage.getItem('levitad-interacciones') || '{}');

	const modo     = modoActual();
	const universo = (estadoTienda.productos || []).filter(p => !p.modo || p.modo === modo);

	// ── Motor de afinidad ─────────────────────────────────────────────
	// Cada prenda recibe un puntaje según cuánto coincide con lo que el
	// usuario miró: tags (peso alto), categoría (medio) e interacción
	// directa con la prenda (bajo). Luego se normaliza a un "% para ti"
	// en el rango 70–99 para que toda recomendación se sienta acertada.
	const PESO_TAG = 3, PESO_CAT = 2, PESO_INT = 1;
	const scored = universo.map(p => {
		let score = 0;
		if (Array.isArray(p.tags)) {
			p.tags.forEach(t => { if (tagsRaw[t]) score += tagsRaw[t] * PESO_TAG; });
		}
		const cat = p.categoria ? String(p.categoria).toLowerCase() : '';
		if (cat && catsRaw[cat]) score += catsRaw[cat] * PESO_CAT;
		if (interRaw[p.nombre])  score += interRaw[p.nombre] * PESO_INT;
		return { p, score };
	}).filter(x => x.score > 0)
	  .sort((a, b) => b.score - a.score);

	const maxScore  = scored.length ? scored[0].score : 0;
	const matchPct  = s => maxScore ? Math.max(70, Math.min(99, Math.round(70 + 29 * (s / maxScore)))) : 0;
	const pctDe     = nombre => {
		const e = scored.find(x => x.p.nombre === nombre);
		return e ? matchPct(e.score) : 0;
	};

	const tagsOrden = Object.entries(tagsRaw).sort(([, a], [, b]) => b - a).map(([t]) => t);
	const totalActividad = Object.values(tagsRaw).reduce((a, b) => a + b, 0)
	                     + Object.values(catsRaw).reduce((a, b) => a + b, 0);

	const ov = document.createElement('div');
	ov.id = 'parati-overlay';
	ov.className = 'parati-overlay';

	const panel = document.createElement('div');
	panel.id = 'parati-panel';
	panel.className = 'parati-panel';

	const escAttr = s => String(s).replace(/"/g, '&quot;');
	const imgDe   = p => (Array.isArray(p.imagenes) && p.imagenes[0]) || p.imagen || '';

	const cardHTML = (p, pct) => `
		<button class="parati-card" data-producto="${escAttr(p.nombre)}">
			<span class="parati-card-img" style="background-image:url('${imgDe(p)}')">
				${pct ? `<span class="parati-card-match">${pct}%</span>` : ''}
			</span>
			<span class="parati-card-info">
				<span class="parati-card-nombre">${p.nombre}</span>
				<span class="parati-card-precio">${formatPrecio(p.precio)}</span>
			</span>
		</button>
	`;

	let bodyHTML;
	if (!scored.length) {
		bodyHTML = `
			<div class="parati-vacio">
				<span class="parati-vacio-icono">✦</span>
				<p class="parati-vacio-texto">Todavía no conocemos tu estilo.<br>Explora algunas prendas y armaremos tu selección.</p>
				<button class="parati-vacio-cta" type="button">Explorar la tienda</button>
			</div>
		`;
	} else {
		const hero    = scored[0].p;
		const heroPct = matchPct(scored[0].score);
		const heroHTML = `
			<section class="parati-hero-wrap">
				<button class="parati-hero" data-producto="${escAttr(hero.nombre)}">
					<span class="parati-hero-media" style="background-image:url('${imgDe(hero)}')"></span>
					<span class="parati-hero-scrim"></span>
					<span class="parati-hero-content">
						<span class="parati-hero-badge"><span class="parati-match-dot"></span>${heroPct}% para ti</span>
						<span class="parati-hero-nombre">${hero.nombre}</span>
						<span class="parati-hero-foot">
							<span class="parati-hero-precio">${formatPrecio(hero.precio)}</span>
							<span class="parati-hero-cta">Ver prenda<svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
						</span>
					</span>
				</button>
			</section>
		`;

		// Carrusel "mejores coincidencias": del 2.º al 11.º mejor puntaje.
		const topResto = scored.slice(1, 11);
		const topHTML = topResto.length ? `
			<section class="parati-seccion">
				<div class="parati-seccion-head">
					<span class="parati-seccion-icon">✶</span>
					<h3 class="parati-seccion-titulo">Tus mejores coincidencias</h3>
				</div>
				<div class="parati-cards">
					${topResto.map(e => cardHTML(e.p, matchPct(e.score))).join('')}
				</div>
			</section>
		` : '';

		// Filas por tag: "Porque viste #tag", sin repetir la prenda hero.
		const usado = {};
		const MAX_APARICIONES = 2;
		const seccionesTags = tagsOrden.map(tag => {
			const prods = universo.filter(p =>
				p.nombre !== hero.nombre &&
				Array.isArray(p.tags) && p.tags.includes(tag) &&
				(usado[p.nombre] || 0) < MAX_APARICIONES
			).slice(0, 12);
			if (!prods.length) return '';
			prods.forEach(p => { usado[p.nombre] = (usado[p.nombre] || 0) + 1; });
			return `
				<section class="parati-seccion">
					<div class="parati-seccion-head">
						<h3 class="parati-seccion-titulo">Porque viste <span class="parati-tag">#${tag}</span></h3>
					</div>
					<div class="parati-cards">
						${prods.map(p => cardHTML(p, pctDe(p.nombre))).join('')}
					</div>
				</section>
			`;
		}).filter(Boolean).join('');

		bodyHTML = heroHTML + topHTML + seccionesTags;
	}

	const metaHTML = totalActividad
		? `<span class="parati-meta"><span class="parati-meta-dot"></span>Basado en tu actividad reciente</span>`
		: '';

	panel.innerHTML = `
		<button class="parati-cerrar" aria-label="Cerrar Para Ti">✕</button>
		<header class="parati-header">
			<span class="parati-eyebrow">Selección personal</span>
			<h2 class="parati-titulo">Para Ti</h2>
			${metaHTML}
		</header>
		<div class="parati-body">${bodyHTML}</div>
	`;

	document.body.appendChild(ov);
	document.body.appendChild(panel);
	document.body.classList.add('parati-abierto');

	requestAnimationFrame(() => requestAnimationFrame(() => {
		ov.classList.add('is-active');
		panel.classList.add('is-active');
	}));
	enfocarModal(panel);

	function cerrar() {
		ov.classList.add('is-closing');
		panel.classList.add('is-closing');
		document.body.classList.remove('parati-abierto');
		setTimeout(() => { ov.remove(); panel.remove(); }, 380);
	}

	panel.querySelector('.parati-cerrar').addEventListener('click', cerrar);
	ov.addEventListener('click', cerrar);
	panel.querySelector('.parati-vacio-cta')?.addEventListener('click', cerrar);

	let _paratiTouchMoved = false, _paratiScrollY0 = 0;
	const paratiBody = panel.querySelector('.parati-body');
	if (paratiBody) {
		paratiBody.addEventListener('touchstart', () => {
			_paratiTouchMoved = false;
			_paratiScrollY0   = paratiBody.scrollTop;
		}, { passive: true });
		paratiBody.addEventListener('touchmove', () => {
			_paratiTouchMoved = true;
		}, { passive: true });
		paratiBody.addEventListener('scroll', () => {
			if (Math.abs(paratiBody.scrollTop - _paratiScrollY0) > 6) _paratiTouchMoved = true;
		}, { passive: true });
	}

	// Mismo patrón anti-tap-accidental para el scroll horizontal de cada fila.
	panel.querySelectorAll('.parati-cards').forEach(row => {
		let _paratiScrollX0 = 0;
		row.addEventListener('touchstart', () => {
			_paratiTouchMoved = false;
			_paratiScrollX0 = row.scrollLeft;
		}, { passive: true });
		row.addEventListener('scroll', () => {
			if (Math.abs(row.scrollLeft - _paratiScrollX0) > 6) _paratiTouchMoved = true;
		}, { passive: true });
	});

	const abrirProd = nombre => {
		if (_paratiTouchMoved) { _paratiTouchMoved = false; return; }
		const prod = estadoTienda.productos.find(p => p.nombre === nombre);
		if (!prod) return;
		cerrar();
		setTimeout(() => abrirDetalles(prod), 420);
	};

	panel.querySelectorAll('.parati-card, .parati-hero').forEach(btn => {
		btn.addEventListener('click', () => abrirProd(btn.dataset.producto));
	});
}

/* ═══════════════════════════════════════════════════════════
   Panel Categor&#237;as — explorar prendas por categor&#237;a y ranking
═══════════════════════════════════════════════════════════ */
function abrirCategoriasPanel() {
	if (document.getElementById('categorias-panel')) return;

	const productos = estadoTienda.productos || [];

	const masVendidos = [...productos]
		.filter(p => (p.ventas || 0) > 0)
		.sort((a, b) => (b.ventas || 0) - (a.ventas || 0))
		.slice(0, 6);

	const porCategoria = {};
	productos.forEach(p => {
		const cat = (p.categoria || 'otros').toLowerCase();
		if (!porCategoria[cat]) porCategoria[cat] = [];
		porCategoria[cat].push(p);
	});

	const ICONOS_CAT = {
		buzo: '&#9671;', pantalon: '&#9645;', remera: '&#9651;', camisa: '&#9672;',
		campera: '&#9670;', top: '&#9661;', short: '&#9641;', conjunto: '&#9673;',
		chaleco: '&#11041;', otros: '&#10022;'
	};
	const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

	const ov = document.createElement('div');
	ov.id = 'categorias-overlay';
	ov.className = 'categorias-overlay';

	const panel = document.createElement('div');
	panel.id = 'categorias-panel';
	panel.className = 'categorias-panel';

	const cardHTML = (p, rank) => `
		<button class="cat-card" data-producto="${p.nombre.replace(/"/g, '&quot;')}">
			${rank ? `<span class="cat-card-rank">#${rank}</span>` : ''}
			<span class="cat-card-img" style="background-image:url('${(Array.isArray(p.imagenes) && p.imagenes[0]) || p.imagen || ''}')"></span>
			<span class="cat-card-info">
				<span class="cat-card-nombre">${p.nombre}</span>
				<span class="cat-card-precio">${formatPrecio(p.precio)}</span>
			</span>
		</button>
	`;

	let bodyHTML = '';

	if (!productos.length) {
		bodyHTML = `
			<div class="cat-vacio">
				<p class="cat-vacio-icono">&#10022;</p>
				<p class="cat-vacio-texto">A&#250;n no hay prendas para mostrar.</p>
			</div>
		`;
	} else {
		const categorias = Object.keys(porCategoria).sort();

		const masVendidosHTML = masVendidos.length ? `
			<section class="cat-seccion cat-seccion-destacada">
				<div class="cat-seccion-head">
					<span class="cat-seccion-icon">&#9733;</span>
					<h3 class="cat-seccion-titulo">M&#225;s vendidos</h3>
					<span class="cat-seccion-meta">Top ${masVendidos.length}</span>
				</div>
				<div class="cat-cards">
					${masVendidos.map((p, i) => cardHTML(p, i + 1)).join('')}
				</div>
			</section>
		` : '';

		const chipsHTML = `
			<nav class="cat-chips" aria-label="Saltar a categor&#237;a">
				${categorias.map(c => `
					<button class="cat-chip" data-target="cat-sec-${c}">${cap(c)}</button>
				`).join('')}
			</nav>
		`;

		const seccionesHTML = categorias.map(c => {
			const items = porCategoria[c];
			return `
				<section class="cat-seccion" id="cat-sec-${c}">
					<div class="cat-seccion-head">
						<span class="cat-seccion-icon">${ICONOS_CAT[c] || ICONOS_CAT.otros}</span>
						<h3 class="cat-seccion-titulo">${cap(c)}</h3>
						<span class="cat-seccion-meta">${items.length} ${items.length === 1 ? 'prenda' : 'prendas'}</span>
					</div>
					<div class="cat-cards">
						${items.map(p => cardHTML(p)).join('')}
					</div>
				</section>
			`;
		}).join('');

		bodyHTML = masVendidosHTML + chipsHTML + seccionesHTML;
	}

	panel.innerHTML = `
		<button class="cat-cerrar" aria-label="Cerrar">&#10005;</button>
		<header class="cat-header">
			<span class="cat-eyebrow">Explorar</span>
			<h2 class="cat-titulo">Categor&#237;as</h2>
			<p class="cat-sub">Descubre prendas por estilo y popularidad.</p>
		</header>
		<div class="cat-body">${bodyHTML}</div>
	`;

	document.body.appendChild(ov);
	document.body.appendChild(panel);
	document.body.classList.add('categorias-abierto');

	requestAnimationFrame(() => requestAnimationFrame(() => {
		ov.classList.add('is-active');
		panel.classList.add('is-active');
	}));
	enfocarModal(panel);

	function cerrar() {
		ov.classList.add('is-closing');
		panel.classList.add('is-closing');
		document.body.classList.remove('categorias-abierto');
		setTimeout(() => { ov.remove(); panel.remove(); }, 380);
	}

	panel.querySelector('.cat-cerrar').addEventListener('click', cerrar);
	ov.addEventListener('click', cerrar);

	const body = panel.querySelector('.cat-body');
	// Offset = altura aprox. del .cat-header sticky (140px). Restamos esto al
	// scrollTop para que el título de la sección no quede tapado por el header.
	const CAT_HEADER_OFFSET = 140;
	panel.querySelectorAll('.cat-chip').forEach(chip => {
		chip.addEventListener('click', () => {
			const target = panel.querySelector('#' + chip.dataset.target);
			if (target && body) {
				const destino = Math.max(0, target.offsetTop - CAT_HEADER_OFFSET);
				body.scrollTo({ top: destino, behavior: 'smooth' });
			}
		});
	});

	let _catTouchMoved = false, _catScrollY0 = 0;
	if (body) {
		body.addEventListener('touchstart', () => {
			_catTouchMoved = false;
			_catScrollY0   = body.scrollTop;
		}, { passive: true });
		body.addEventListener('touchmove', () => {
			_catTouchMoved = true;
		}, { passive: true });
		// scroll: señal definitiva aunque touchmove no se dispare (iOS compositor scroll)
		body.addEventListener('scroll', () => {
			if (Math.abs(body.scrollTop - _catScrollY0) > 6) _catTouchMoved = true;
		}, { passive: true });
	}

	// Mismo patrón para scroll horizontal en cada fila .cat-cards
	panel.querySelectorAll('.cat-cards').forEach(row => {
		let _catScrollX0 = 0;
		row.addEventListener('touchstart', () => {
			_catTouchMoved = false;
			_catScrollX0 = row.scrollLeft;
		}, { passive: true });
		row.addEventListener('scroll', () => {
			if (Math.abs(row.scrollLeft - _catScrollX0) > 6) _catTouchMoved = true;
		}, { passive: true });
	});

	panel.querySelectorAll('.cat-card').forEach(btn => {
		btn.addEventListener('click', () => {
			if (_catTouchMoved) { _catTouchMoved = false; return; }
			const prod = estadoTienda.productos.find(p => p.nombre === btn.dataset.producto);
			if (!prod) return;
			cerrar();
			setTimeout(() => abrirDetalles(prod), 420);
		});
	});
}

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX — imagen del producto a pantalla completa con zoom
   - Pellizco (pinch) con dos dedos para hacer zoom en móvil.
   - Arrastre con un dedo para desplazar cuando hay zoom.
   - Doble toque / doble clic para alternar el zoom.
   - Rueda del ratón para zoom en escritorio.
   Se abre tocando la imagen del slider en el modal de detalle.
   ═══════════════════════════════════════════════════════════ */
let _lbScale = 1, _lbTx = 0, _lbTy = 0;

function _lbAplicar() {
	const img = document.getElementById('lightbox-img');
	if (!img) return;
	img.style.transform = `translate(${_lbTx}px, ${_lbTy}px) scale(${_lbScale})`;
	img.classList.toggle('is-zoomed', _lbScale > 1.02);
}

function _lbClamp() {
	const vp  = document.getElementById('lightbox-viewport');
	const img = document.getElementById('lightbox-img');
	if (!vp || !img) return;
	// getBoundingClientRect ya refleja la escala aplicada; limitamos el paneo
	// para que la imagen no se aleje más allá de sus propios bordes.
	const rect = img.getBoundingClientRect();
	const maxX = Math.max(0, (rect.width  - vp.clientWidth)  / 2);
	const maxY = Math.max(0, (rect.height - vp.clientHeight) / 2);
	_lbTx = Math.max(-maxX, Math.min(maxX, _lbTx));
	_lbTy = Math.max(-maxY, Math.min(maxY, _lbTy));
}

function _lbReset() {
	_lbScale = 1; _lbTx = 0; _lbTy = 0;
	_lbAplicar();
}

function _lbToggleZoom() {
	_lbScale = _lbScale > 1.02 ? 1 : 2.5;
	_lbTx = 0; _lbTy = 0;
	_lbClamp();
	_lbAplicar();
}

function abrirLightbox(src, alt) {
	const lb  = document.getElementById('lightbox');
	const img = document.getElementById('lightbox-img');
	if (!lb || !img) return;
	img.src = src;
	img.alt = alt || '';
	_lbReset();
	lb.classList.add('is-active');
	lb.setAttribute('aria-hidden', 'false');
	const hint = document.getElementById('lightbox-hint');
	if (hint) {
		hint.classList.remove('is-hidden');
		clearTimeout(abrirLightbox._t);
		abrirLightbox._t = setTimeout(() => hint.classList.add('is-hidden'), 2200);
	}
}

function cerrarLightbox() {
	const lb  = document.getElementById('lightbox');
	const img = document.getElementById('lightbox-img');
	if (!lb || !lb.classList.contains('is-active')) return;
	lb.classList.remove('is-active');
	lb.setAttribute('aria-hidden', 'true');
	setTimeout(() => { if (img) { img.src = ''; img.style.transform = ''; } }, 300);
}

function initLightbox() {
	const lb   = document.getElementById('lightbox');
	const vp   = document.getElementById('lightbox-viewport');
	const img  = document.getElementById('lightbox-img');
	const btnX = document.getElementById('lightbox-cerrar');
	if (!lb || !vp || !img) return;

	const MIN = 1, MAX = 4;
	const clamp = (v) => Math.max(MIN, Math.min(MAX, v));
	const dist  = (a, b) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

	// ── Cerrar ──
	if (btnX) btnX.addEventListener('click', cerrarLightbox);
	// Tap/clic en el fondo (no sobre la imagen) cierra el visor.
	lb.addEventListener('click', (e) => {
		if (e.target === lb || e.target === vp) cerrarLightbox();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') cerrarLightbox();
	});

	// ── Gestos táctiles ──
	let startDist = 0, startScale = 1;
	let panning = false, pinching = false, moved = false;
	let sx = 0, sy = 0, tx0 = 0, ty0 = 0, lastTap = 0;

	vp.addEventListener('touchstart', (e) => {
		if (e.touches.length === 2) {
			pinching = true; panning = false; moved = true;
			startDist  = dist(e.touches[0], e.touches[1]) || 1;
			startScale = _lbScale;
		} else if (e.touches.length === 1) {
			moved = false;
			sx = e.touches[0].clientX;
			sy = e.touches[0].clientY;
			if (_lbScale > 1) { panning = true; tx0 = _lbTx; ty0 = _lbTy; }
		}
	}, { passive: true });

	vp.addEventListener('touchmove', (e) => {
		if (pinching && e.touches.length === 2) {
			const d = dist(e.touches[0], e.touches[1]);
			_lbScale = clamp(startScale * (d / startDist));
			_lbClamp(); _lbAplicar();
			e.preventDefault();
		} else if (e.touches.length === 1) {
			const t = e.touches[0];
			if (Math.abs(t.clientX - sx) > 8 || Math.abs(t.clientY - sy) > 8) moved = true;
			if (panning) {
				_lbTx = tx0 + (t.clientX - sx);
				_lbTy = ty0 + (t.clientY - sy);
				_lbClamp(); _lbAplicar();
				e.preventDefault();
			}
		}
	}, { passive: false });

	vp.addEventListener('touchend', (e) => {
		if (e.touches.length > 0) return;
		const wasPinching = pinching;
		pinching = false; panning = false;
		if (_lbScale < 1.02) _lbReset();
		if (wasPinching || moved) { lastTap = 0; return; }
		// Toque limpio → detectar doble toque para alternar zoom.
		const now = Date.now();
		if (now - lastTap < 300) { _lbToggleZoom(); lastTap = 0; }
		else lastTap = now;
	});

	// ── Escritorio: rueda para zoom, doble clic para alternar, arrastre para paneo ──
	vp.addEventListener('wheel', (e) => {
		e.preventDefault();
		const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
		_lbScale = clamp(_lbScale * factor);
		if (_lbScale <= 1.02) { _lbReset(); return; }
		_lbClamp(); _lbAplicar();
	}, { passive: false });

	img.addEventListener('dblclick', (e) => { e.preventDefault(); _lbToggleZoom(); });

	let mouseDown = false, mx = 0, my = 0, mtx = 0, mty = 0;
	img.addEventListener('mousedown', (e) => {
		if (_lbScale <= 1) return;
		mouseDown = true; mx = e.clientX; my = e.clientY; mtx = _lbTx; mty = _lbTy;
		e.preventDefault();
	});
	window.addEventListener('mousemove', (e) => {
		if (!mouseDown) return;
		_lbTx = mtx + (e.clientX - mx);
		_lbTy = mty + (e.clientY - my);
		_lbClamp(); _lbAplicar();
	});
	window.addEventListener('mouseup', () => { mouseDown = false; });
}

/* ═══════════════════════════════════════════════════════════
   COMPARTIR — botón del menú hamburguesa
   Usa la Web Share API nativa (móvil) y, si no existe, copia el
   enlace al portapapeles con feedback en el propio botón.
   ═══════════════════════════════════════════════════════════ */
function initCompartir() {
	const btn = document.getElementById('btn-compartir');
	if (!btn) return;
	const label = btn.querySelector('.menu-nav-compartir-label');
	const textoOriginal = label ? label.textContent : '';

	btn.addEventListener('click', async () => {
		const datos = {
			title: 'Lévitad',
			text:  'Lévitad — Prendas que elevan',
			url:   window.location.href
		};
		if (navigator.share) {
			try { await navigator.share(datos); } catch (_) { /* el usuario canceló */ }
			return;
		}
		try {
			await navigator.clipboard.writeText(datos.url);
			if (label) {
				label.textContent = '¡Enlace copiado!';
				clearTimeout(initCompartir._t);
				initCompartir._t = setTimeout(() => { label.textContent = textoOriginal; }, 1800);
			}
		} catch (_) {
			window.prompt('Copia el enlace:', datos.url);
		}
	});
}

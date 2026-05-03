const switchContainer = document.querySelector('.switch-container');
const estadoTienda = {
	productos: [],
	masonry: null,
	carrito: [],          // carrito del modo "En Stack"
	carritoEncargue: [],  // carrito del modo "Encargue"
	productoDetalleActual: null
};

const MENSAJE_SIN_RESULTADOS       = 'No se encontraron resultados.';
const STORAGE_KEY_CARRITO          = 'levitad-carrito';
const STORAGE_KEY_CARRITO_ENCARGUE = 'levitad-carrito-encargue';
const STORAGE_KEY_MODAL_ENCARGUE   = 'levitad-modal-encargue-visto';
const WHATSAPP_OWNER_NUMBER        = '+5359271359';

/* ─── LOCK / UNLOCK BODY SCROLL ────────────────────────────────────────────
   Función centralizada para bloquear el scroll de fondo cuando un modal
   o panel está abierto. Guarda scrollY y compensa con padding-right para
   que el contenido no "brinque" al desaparecer la barra de scroll.
   Referencia de conteo: soporta apertura apilada (modal dentro de carrito, etc.)
─────────────────────────────────────────────────────────────────────────── */
let _scrollLockCount = 0;
let _scrollLockY     = 0;

function lockBodyScroll() {
	if (_scrollLockCount === 0) {
		_scrollLockY = window.scrollY;
		const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
		document.body.style.overflow   = 'hidden';
		document.body.style.position   = 'fixed';
		document.body.style.top        = `-${_scrollLockY}px`;
		document.body.style.width      = '100%';
		if (scrollbarW > 0) {
			document.body.style.paddingRight = `${scrollbarW}px`;
		}
	}
	_scrollLockCount++;
	window.pauseHeaderScroll?.();
}

function unlockBodyScroll() {
	if (_scrollLockCount <= 0) return;
	_scrollLockCount--;
	if (_scrollLockCount === 0) {
		document.body.style.overflow    = '';
		document.body.style.position    = '';
		document.body.style.top         = '';
		document.body.style.width       = '';
		document.body.style.paddingRight = '';
		window.scrollTo({ top: _scrollLockY, behavior: 'instant' });
		window.resumeHeaderScroll?.();
	}
}

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
		nota:      'Escribenos para coordinar pago y entrega'
	},
	encargue: {
		titulo:    'Listo para Encargar ?',
		subtitulo: 'Alimente su Outfit',
		vacio:     'Aún no elegiste nada para encargar.\nSelecciona las prendas que quiera encargar',
		vacioBadge:'✦',
		whatsapp:  'Enviar Encargue por WhatsApp',
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
		lista.innerHTML = carrito.map((item, index) => `
			<li class="carrito-item" data-carrito-index="${index}">
				<img class="carrito-item-img" src="${item.imagen}" alt="${item.nombre}">
				<div class="carrito-item-info">
					<span class="carrito-item-nombre">${item.nombre}</span>
					<span class="carrito-item-precio">${formatPrecio(item.precio)}</span>
				</div>
				<button class="carrito-item-eliminar" type="button" aria-label="Eliminar ${item.nombre}">✕</button>
			</li>
		`).join('');
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
		const producto = estadoTienda.productos[Number(tarjeta.dataset.productoId)];
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
	overlay.classList.add('is-active');
	panel.classList.add('is-active');
	overlay.setAttribute('aria-hidden', 'false');
	panel.setAttribute('aria-hidden',   'false');
	document.body.classList.add('carrito-abierto');
	lockBodyScroll();
}

function cerrarCarrito() {
	const overlay = document.getElementById('carrito-overlay');
	const panel   = document.getElementById('carrito-panel');
	if (!overlay || !panel) return;
	overlay.classList.remove('is-active');
	panel.classList.remove('is-active');
	overlay.setAttribute('aria-hidden', 'true');
	panel.setAttribute('aria-hidden',   'true');
	document.body.classList.remove('carrito-abierto');
	unlockBodyScroll();
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

function marcarBotonComoAgregado(boton, isEncargue) {
	if (!boton) return;
	boton.classList.add('is-agregado');
	boton.disabled = true;
	const svg = boton.querySelector('svg');
	if (svg) {
		svg.classList.add('icono-transicion');
		setTimeout(() => {
			boton.innerHTML = isEncargue ? iconoAnadirConViento : iconoCarritoCheck;
			boton.querySelector('svg')?.classList.add('icono-transicion');
		}, 100);
	}
}

function desmarcarBotonAgregado(boton, isEncargue) {
	if (!boton) return;
	boton.classList.remove('is-agregado');
	boton.disabled = false;
	const svg = boton.querySelector('svg');
	if (svg) {
		svg.classList.add('icono-transicion');
		setTimeout(() => {
			boton.innerHTML = isEncargue ? iconoAnadir : iconoCarrito;
			boton.querySelector('svg')?.classList.add('icono-transicion');
		}, 100);
	}
}

function agregarAlCarrito(producto, boton) {
	if (!producto) return;
	if (obtenerProductoEnCarrito(producto.nombre)) return;

	carritoActivo().push({
		nombre: producto.nombre,
		precio: Number(producto.precio) || 0,
		imagen: producto.imagen || ''
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
		// Esperamos que la animación CSS termine (200ms) antes de actualizar la lista
		setTimeout(() => {
			carrito.splice(index, 1);
			desmarcarProductoEnGrid(productoEliminado.nombre);
			renderizarCarrito();
		}, 210);
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
		const producto = estadoTienda.productos[Number(tarjeta.dataset.productoId)];
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
		const delay = items.length * 40 + 210;
		setTimeout(() => {
			const isEncargue = modoActual() === 'encargue';
			carrito.forEach(item => {
				document.querySelectorAll('.btn-anadir').forEach(btn => {
					const tarjeta = btn.closest('.tarjeta-producto');
					if (!tarjeta) return;
					const producto = estadoTienda.productos[Number(tarjeta.dataset.productoId)];
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
	const carrito = carritoActivo();
	if (!carrito.length) {
		return 'Hola Lévitad quiero comprar estos productos:\n\nDonde podemos quedar para hacer ver el producto y realizar la compra?';
	}
	const productosTexto = carrito.map(item => `${item.nombre} ${formatPrecio(item.precio)}`).join(' ');
	return `Hola Lévitad quiero comprar estos productos:\n${productosTexto}\n\nDonde podemos quedar para hacer ver el producto y realizar la compra?`;
}

function enviarPedidoWhatsApp() {
	if (carritoActivo().length === 0) return;
	const url = `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(construirMensajeWhatsApp())}`;
	window.open(url, '_blank', 'noopener,noreferrer');
}

const carritoLista = document.getElementById('carrito-lista');
if (carritoLista) {
	carritoLista.addEventListener('click', (e) => {
		const botonEliminar = e.target.closest('.carrito-item-eliminar');
		if (!botonEliminar) return;
		const item  = botonEliminar.closest('.carrito-item');
		const index = Number(item?.dataset.carritoIndex);
		eliminarDelCarrito(index, item);
	});
}

function crearTarjetaProducto(producto, index) {
	const etiquetas   = Array.isArray(producto.tags)
		? producto.tags.map(tag => `<p class="etiquetas">#${tag}</p>`).join('')
		: '';
	const isEncargue  = modoActual() === 'encargue';
	const yaEnCarrito = Boolean(obtenerProductoEnCarrito(producto.nombre));
	const iconoBoton  = yaEnCarrito
		? (isEncargue ? iconoAnadirConViento : iconoCarritoCheck)
		: (isEncargue ? iconoAnadir          : iconoCarrito);
	const clasesBoton   = yaEnCarrito ? 'btn-anadir is-agregado' : 'btn-anadir';
	const deshabilitado = yaEnCarrito ? 'disabled' : '';

	return `
		<article class="tarjeta-producto" data-producto-id="${index}">
			<div class="imagen-contenedor">
				<img class="img-producto" src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" decoding="async">
				<div class="sombra-interior"></div>
			</div>
			<div class="info-producto">
				<h3 class="nombre-producto">${producto.nombre}</h3>
				<div class="etiquetas-container">${etiquetas}</div>
				<div class="contenedor-row">
					<span class="precio">${formatPrecio(producto.precio)}</span>
					<button class="${clasesBoton}" type="button" aria-label="Agregar ${producto.nombre}" ${deshabilitado}>
						${iconoBoton}
					</button>
				</div>
			</div>
		</article>
	`;
}

function inicializarMasonry() {
	const productosGrid = document.querySelector('.grid-productos');
	if (!productosGrid || typeof Masonry === 'undefined') return;

	if (estadoTienda.masonry) estadoTienda.masonry.destroy();

	estadoTienda.masonry = new Masonry(productosGrid, {
		itemSelector:       '.tarjeta-producto',
		columnWidth:        '.grid-sizer',
		gutter:             '.gutter-sizer',
		percentPosition:    true,
		resizeContainer:    true,
		transitionDuration: '0.25s'
	});

	const relayout = () => requestAnimationFrame(() => estadoTienda.masonry?.layout());
	window.addEventListener('load',   relayout);
	window.addEventListener('resize', relayout);
	document.fonts?.ready.then(relayout);
	productosGrid.querySelectorAll('.img-producto').forEach(img => {
		if (!img.complete) img.addEventListener('load', relayout, { once: true });
	});
	setTimeout(relayout, 120);
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
	window.scrollToHeaderCollapsed?.();
	setTimeout(() => searchInput.focus(), 150);
}

function cerrarBuscador(searchBar, searchInput, searchSubmitBtn) {
	clearTimeout(_searchCloseTimer);
	searchBar.classList.add('is-closing');
	searchInput.value = '';
	filtrarProductos('');
	searchInput.blur();
	_searchCloseTimer = setTimeout(() => {
		searchBar.classList.remove('is-active', 'is-closing');
		_searchCloseTimer = null;
	}, 420); // mayor que la transición más larga (380ms)
}

function renderizarProductos(productos, opciones = {}) {
	const { mostrarVacio = false } = opciones;
	const grid = document.querySelector('.grid-productos');
	if (!grid) return;

	const savedY = window.scrollY;

	grid.innerHTML = `
		<div class="grid-sizer"></div>
		<div class="gutter-sizer"></div>
		${productos.map((p, i) => crearTarjetaProducto(p, i)).join('')}
	`;
	mostrarEstadoSinResultados(mostrarVacio);
	inicializarMasonry();

	// Restaurar scroll: el rebuild del DOM puede forzar al navegador a volver al top
	if (savedY > 0) {
		requestAnimationFrame(() =>
			requestAnimationFrame(() =>
				window.scrollTo({ top: savedY, behavior: 'instant' })
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
		const pesoFinal = bloquePeso + Math.random() // Agrega un componente aleatorio dentro del bloque de peso
		//aqui retornamos todo el arrgelo original de producto pero con la propiedad _pesoOrdenamiento con el valor de pesoFinal//
		return { ...producto, _pesoOrdenamiento: pesoFinal };
	});
	// Luego aqui usamos lo que nos devolvio el .map, y lo ordenammos de mayor a menor basandonos en el peso que tendrian asignados cada uno //
	return productosConPeso.sort((a, b) => b._pesoOrdenamiento - a._pesoOrdenamiento);
}




async function cargarProductos() {
	try {
		const response = await fetch('datos/datos.json');
		if (!response.ok) throw new Error(`No se pudo leer datos.json (${response.status})`);
		const productos = await response.json();
		const productosSeguros = Array.isArray(productos) ? productos : [];
		estadoTienda.productos = ordenarPorPesoAleatorio(productosSeguros);

		renderizarProductos(estadoTienda.productos);
	} catch (error) {
		console.error('Error cargando productos:', error);
	}
}

function cambiarIconosEncargue(isEncargue) {
	document.querySelectorAll('.btn-anadir').forEach(btn => {
		const svg = btn.querySelector('svg');
		if (!svg) return;
		svg.classList.add('icono-transicion');
		setTimeout(() => {
			if (btn.classList.contains('is-agregado')) {
				btn.innerHTML = isEncargue ? iconoAnadirConViento : iconoCarritoCheck;
			} else {
				btn.innerHTML = isEncargue ? iconoAnadir : iconoCarrito;
			}
			btn.querySelector('svg')?.classList.add('icono-transicion');
		}, 150);
	});

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

			<h2 id="modal-encargue-titulo" class="modal-encargue-titulo">Modo Encargue</h2>
			<p class="modal-encargue-subtitulo">Un espacio para pedir la ropa que anheles</p>

			<ul class="modal-encargue-lista">
				<li>
					<span class="encargue-li-icon">✦</span>
					<span>Prendas pedidas por usted, buscando alimentar sus Outifits</span>
				</li>
				<li>
					<span class="encargue-li-icon">✦</span>
					<span>Diseños únicos que no tenemos en el stock habitual, pero pueden ser suyas</span>
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
		</div>
	`;

	document.body.appendChild(el);

	const cerrar = () => {
		el.classList.add('is-closing');
		setTimeout(() => el.remove(), 420);
	};

	document.getElementById('modal-encargue-cerrar').addEventListener('click', cerrar);
	el.addEventListener('click', e => { if (e.target === el) cerrar(); });

	requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-active')));
}

function mostrarModalEncargueUnaVez() {
	if (localStorage.getItem(STORAGE_KEY_MODAL_ENCARGUE)) return;
	localStorage.setItem(STORAGE_KEY_MODAL_ENCARGUE, '1');
	setTimeout(crearModalEncargue, 350);
}

/* ─── SWITCH ─── */
if (switchContainer) {
	const switchIndicator = switchContainer.querySelector('.color-switch');
	const switchButtons   = Array.from(switchContainer.querySelectorAll('button'));

	const setActiveSwitch = (button) => {
		if (!switchIndicator || !button) return;

		switchButtons.forEach(btn => btn.classList.remove('is-active'));
		button.classList.add('is-active');

		const isEncargue    = switchButtons.indexOf(button) === 1;
		switchContainer.classList.toggle('is-encargue', isEncargue);
		document.body.classList.toggle('is-encargue',   isEncargue);

		const containerRect = switchContainer.getBoundingClientRect();
		const buttonRect    = button.getBoundingClientRect();
		const indicadorX    = buttonRect.left - containerRect.left;

		switchIndicator.style.width     = `${buttonRect.width}px`;
		switchIndicator.style.transform = `translate(${indicadorX}px, -50%)`;

		cambiarIconosEncargue(isEncargue);

		// CAMBIO 4: re-renderizar con el carrito del modo activo
		renderizarCarrito();

		// CAMBIO 3: modal solo la primera vez que se activa encargue
		if (isEncargue) mostrarModalEncargueUnaVez();
	};

	switchButtons.forEach(button => {
		button.addEventListener('click', () => setActiveSwitch(button));
	});

	if (switchButtons.length > 0) setActiveSwitch(switchButtons[0]);

	window.addEventListener('resize', () => {
		const active = switchContainer.querySelector('button.is-active') || switchButtons[0];
		if (active) setActiveSwitch(active);
	});
}

/* ─── MODAL DETALLE PRODUCTO ─── */
const modal     = document.getElementById('modal-producto');
const btnCerrar = document.querySelector('.btn-cerrar-modal');

function registrarInteraccion(nombreProducto) {
	const key = 'levitad-interacciones';
	const interacciones = JSON.parse(localStorage.getItem(key) || '{}');
	// Sumamos 1 a la interacción de este producto
	interacciones[nombreProducto] = (interacciones[nombreProducto] || 0) + 1;
	localStorage.setItem(key, JSON.stringify(interacciones));
}

function abrirDetalles(datos) {
	registrarInteraccion(datos.nombre);

	estadoTienda.productoDetalleActual = datos;
	document.getElementById('modal-titulo').innerText = datos.nombre;
	document.getElementById('modal-precio').innerText = formatPrecio(datos.precio);

	const modalDetalles    = document.getElementById('modal-detalles');
	const especificaciones = Object.entries(datos.detalles || {});
	modalDetalles.innerHTML = especificaciones
		.map(([clave, valor]) => `
			<li class="detalle-item">
				<span class="detalle-label">${clave}:</span>
				<span class="detalle-valor">${valor}</span>
			</li>
		`).join('');

	const modalImg = document.getElementById('modal-img');
	if (datos.imagen) {
		modalImg.style.backgroundImage    = `url("${datos.imagen}")`;
		modalImg.style.backgroundSize     = 'contain';
		modalImg.style.backgroundRepeat   = 'no-repeat';
		modalImg.style.backgroundPosition = 'center';
	} else {
		modalImg.style.backgroundImage = 'none';
	}

	modal.style.display = 'flex';
	setTimeout(() => modal.classList.add('is-active'), 10);
	lockBodyScroll();
}

function cerrarModal() {
	modal.classList.remove('is-active');
	setTimeout(() => {
		modal.style.display = 'none';
		unlockBodyScroll();
	}, 500);
}

/* ─── EVENT DELEGATION GRID ─── */
const grid = document.querySelector('.grid-productos');
if (grid) {
	grid.addEventListener('click', (e) => {
		const tarjeta   = e.target.closest('.tarjeta-producto');
		const btnAnadir = e.target.closest('.btn-anadir');

		if (btnAnadir && tarjeta) {
			const producto = estadoTienda.productos[Number(tarjeta.dataset.productoId)];
			if (producto) agregarAlCarrito(producto, btnAnadir);
			return;
		}

		if (tarjeta) {
			const producto = estadoTienda.productos[Number(tarjeta.dataset.productoId)];
			if (producto) abrirDetalles(producto);
		}
	});
}

if (btnCerrar && modal) {
	btnCerrar.addEventListener('click', cerrarModal);
	modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });
}

/* ─── BÚSQUEDA Y FILTROS ─── */

const estadoFiltros = {
	termino: '',
	tags:    new Set(),
	orden:   null
};

function aplicarFiltros() {
	let resultado = [...estadoTienda.productos];

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
	const hayFiltros = estadoFiltros.tags.size > 0 || estadoFiltros.orden !== null;
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

function abrirModalFiltros() {
	const existe = document.getElementById('modal-filtros');
	if (existe) { cerrarModalFiltros(); return; }

	const el = document.createElement('div');
	el.id        = 'modal-filtros';
	el.className = 'modal-filtros-overlay';
	el.setAttribute('role', 'dialog');
	el.setAttribute('aria-modal', 'true');

	const todos = obtenerTodosLosTags();

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

	el.querySelectorAll('.filtros-tag-btn').forEach(btn => {
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

	el.querySelector('#filtros-reset').addEventListener('click', () => {
		estadoFiltros.tags.clear();
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
}

function cerrarModalFiltros() {
	const el = document.getElementById('modal-filtros');
	if (!el) return;
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
	if (!menuBtn) return;

	function abrirMenu() {
		if (document.getElementById('menu-nav-panel')) return;
		menuBtn.classList.add('is-open');

		const ov = document.createElement('div');
		ov.id        = 'menu-nav-overlay';
		ov.className = 'menu-nav-overlay';

		const panel = document.createElement('div');
		panel.id        = 'menu-nav-panel';
		panel.className = 'menu-nav-panel';

		panel.innerHTML = `
			<div class="menu-nav-glow"></div>

			<!-- MARCA -->
			<div class="menu-nav-header">
				<span class="menu-nav-marca">LÉVITAD</span>
			</div>

			<!-- LINKS -->
			<nav class="menu-nav-links">
				<a class="menu-nav-item" href="#">
					<span class="menu-nav-num">01</span>
					<span class="menu-nav-text">Productos</span>
					<span class="menu-nav-arrow">→</span>
				</a>
				<a class="menu-nav-item" href="#">
					<span class="menu-nav-num">02</span>
					<span class="menu-nav-text">Colecciones</span>
					<span class="menu-nav-arrow">→</span>
				</a>
				<a class="menu-nav-item" href="#">
					<span class="menu-nav-num">03</span>
					<span class="menu-nav-text">Encargues</span>
					<span class="menu-nav-arrow">→</span>
				</a>
				<a class="menu-nav-item menu-nav-item-contacto" href="#" data-action="contacto">
					<span class="menu-nav-num">04</span>
					<span class="menu-nav-text">Contacto</span>
					<span class="menu-nav-arrow">→</span>
				</a>
			</nav>

			<!-- FOOTER DEL MENÚ -->
			<footer class="menu-nav-footer">

				<!-- Slogan -->
				<p class="menu-nav-tagline">Prendas que elevan.</p>

				<!-- Redes sociales -->
				<div class="menu-nav-redes">
					<a href="https://instagram.com/levitad" target="_blank" rel="noopener noreferrer"
					   class="menu-nav-red" aria-label="Instagram">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.6"/>
							<circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/>
							<circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
						</svg>
						<span>Instagram</span>
					</a>
					<a href="https://wa.me/5490000000000" target="_blank" rel="noopener noreferrer"
					   class="menu-nav-red" aria-label="WhatsApp">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.418A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
							<path d="M8.5 9.5c.5 1 1.5 3 3.5 4s3-1 3-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
						</svg>
						<span>WhatsApp</span>
					</a>
				</div>

				<!-- Divider -->
				<div class="menu-nav-divider"></div>

				<!-- Créditos -->
				<div class="menu-nav-creditos">
					<span class="menu-nav-dev">
						Hecho con ♡ desde
						<a href="#" class="menu-nav-dev-link">La Casita</a>
					</span>
					<span class="menu-nav-copy">© ${new Date().getFullYear()} Lévitad. Todos los derechos reservados.</span>
				</div>

			</footer>
		`;
		
		document.body.appendChild(ov);
		document.body.appendChild(panel);
		document.body.classList.add('carrito-abierto', 'menu-open');
		lockBodyScroll();

		ov.addEventListener('click', cerrarMenu);
		requestAnimationFrame(() => requestAnimationFrame(() => {
			ov.classList.add('is-active');
			panel.classList.add('is-active');
		}));
		itemsNoTocar = document.querySelectorAll('.menu-nav-item');
		itemsNoTocar.forEach(item => {
			item.addEventListener('contextmenu', function(e) {
				e.preventDefault();
			});
		});

		const contactoBtn = panel.querySelector('.menu-nav-item-contacto');
		if (contactoBtn) {
			contactoBtn.addEventListener('click', (e) => {
				e.preventDefault();
				abrirContactoPanel();
			});
		}
	}

	function cerrarMenu() {
		menuBtn.classList.remove('is-open');
		document.body.classList.remove('carrito-abierto', 'menu-open');
		const ov    = document.getElementById('menu-nav-overlay');
		const panel = document.getElementById('menu-nav-panel');
		if (ov)    { ov.classList.add('is-closing');    setTimeout(() => ov.remove(),    380); }
		if (panel) { panel.classList.add('is-closing'); setTimeout(() => panel.remove(), 380); }
		unlockBodyScroll();
	}

	menuBtn.addEventListener('click', () =>
		menuBtn.classList.contains('is-open') ? cerrarMenu() : abrirMenu()
	);
}


/* ═══════════════════════════════════════════════════════════
   Panel de Contacto — formulario que se inyecta al hacer click
   en "Contacto" desde el menú hamburguesa.
═══════════════════════════════════════════════════════════ */
function abrirContactoPanel() {
	if (document.getElementById('contacto-panel')) return;

	const ov = document.createElement('div');
	ov.id        = 'contacto-overlay';
	ov.className = 'contacto-overlay';

	const panel = document.createElement('div');
	panel.id        = 'contacto-panel';
	panel.className = 'contacto-panel';

	panel.innerHTML = `
		<button class="contacto-cerrar" aria-label="Cerrar contacto">✕</button>

		<div class="contacto-glow"></div>

		<header class="contacto-header">
			<span class="contacto-eyebrow">Hablemos</span>
			<h2 class="contacto-titulo">Contacto</h2>
			<p class="contacto-sub">Contanos qué tenés en mente y te respondemos a la brevedad.</p>
		</header>

		<form class="contacto-form" id="contacto-form" novalidate autocomplete="on">
			<div class="contacto-campo">
				<label for="contacto-nombre">Nombre</label>
				<input id="contacto-nombre" name="nombre" type="text"
				       required minlength="2" maxlength="60"
				       autocomplete="name" placeholder="Tu nombre" />
				<span class="contacto-error" data-error-for="nombre"></span>
			</div>

			<div class="contacto-campo">
				<label for="contacto-email">Correo electrónico</label>
				<input id="contacto-email" name="email" type="email"
				       required maxlength="120"
				       autocomplete="email" placeholder="tucorreo@dominio.com" />
				<span class="contacto-error" data-error-for="email"></span>
			</div>

			<div class="contacto-campo">
				<label for="contacto-mensaje">Mensaje</label>
				<textarea id="contacto-mensaje" name="mensaje" rows="5"
				          required minlength="5" maxlength="1000"
				          placeholder="Escribí tu mensaje..."></textarea>
				<span class="contacto-error" data-error-for="mensaje"></span>
			</div>

			<!-- Honeypot anti-spam (oculto al usuario) -->
			<div class="contacto-hp" aria-hidden="true">
				<label>No completar
					<input type="text" name="_honey" tabindex="-1" autocomplete="off" />
				</label>
			</div>

			<button type="submit" class="contacto-submit">
				<span class="contacto-submit-text">Enviar mensaje</span>
				<span class="contacto-submit-loader" aria-hidden="true"></span>
			</button>

			<p class="contacto-status" role="status" aria-live="polite"></p>
		</form>

		<div class="contacto-pattern" aria-hidden="true"></div>
	`;

	document.body.appendChild(ov);
	document.body.appendChild(panel);
	document.body.classList.add('contacto-abierto');
	lockBodyScroll();

	requestAnimationFrame(() => requestAnimationFrame(() => {
		ov.classList.add('is-active');
		panel.classList.add('is-active');
	}));

	ov.addEventListener('click', cerrarContactoPanel);
	panel.querySelector('.contacto-cerrar').addEventListener('click', cerrarContactoPanel);

	const form = panel.querySelector('#contacto-form');
	form.addEventListener('submit', manejarEnvioContacto);

	form.querySelectorAll('input, textarea').forEach(el => {
		el.addEventListener('input', () => limpiarErrorCampo(el));
	});
}

function cerrarContactoPanel() {
	const ov    = document.getElementById('contacto-overlay');
	const panel = document.getElementById('contacto-panel');
	document.body.classList.remove('contacto-abierto');
	if (ov)    { ov.classList.add('is-closing');    setTimeout(() => ov.remove(),    380); }
	if (panel) { panel.classList.add('is-closing'); setTimeout(() => panel.remove(), 380); }
	unlockBodyScroll();
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

	if (!nombre || nombre.length < 2) errores.nombre = 'Ingresá tu nombre.';
	else if (nombre.length > 60) errores.nombre = 'Máximo 60 caracteres.';
	else if (!nombreRe.test(nombre)) errores.nombre = 'El nombre contiene caracteres no permitidos.';

	if (!email) errores.email = 'Ingresá tu correo electrónico.';
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
		status.textContent = 'No se pudo enviar el mensaje. Probá de nuevo en unos minutos.';
		status.className = 'contacto-status is-error';
	} finally {
		submitBtn.disabled = false;
		submitBtn.classList.remove('is-loading');
	}
}


/* ═══════════════════════════════════════════════════════════
   Footer de página — se inyecta dinámicamente al cargar.
   Llamá initFooter() dentro de DOMContentLoaded.
═══════════════════════════════════════════════════════════ */
function initFooter() {
	// Evitar duplicados
	if (document.getElementById('site-footer')) return;

	const footer = document.createElement('footer');
	footer.id        = 'site-footer';
	footer.className = 'site-footer';

	footer.innerHTML = `
		<div class="site-footer-glow"></div>

		<div class="site-footer-inner">

			<!-- Columna marca -->
			<div class="footer-col footer-col-marca">
				<h2 class="footer-logo">LÉVIT<span class="logo-a">A
                        <svg class="halo-icon" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <filter id="halo-glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="1.5" result="blur"/>
                                    <feFlood class="halo-glow-color" result="glow-color"/>
                                    <feComposite in="glow-color" in2="blur" operator="in" result="colored-blur"/>
                                    <feMerge>
                                        <feMergeNode in="colored-blur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <path class="halo-path" d="M20,25 A30,12 0 1,1 75,22" fill="none" stroke-width="8" stroke-linecap="round" filter="url(#halo-glow)" />
                        </svg>
                    </span>D</h2>
				<p class="footer-slogan">Prendas que elevan.</p>
			</div>

			<!-- Columna redes -->
			<div class="footer-col footer-col-redes">
				<p class="footer-col-titulo">Síguenos</p>
				<div class="footer-redes">
					<a href="https://instagram.com/levitad" target="_blank" rel="noopener noreferrer"
					   class="footer-red" aria-label="Instagram">
						<svg viewBox="0 0 24 24" fill="none">
							<rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.6"/>
							<circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/>
							<circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
						</svg>
						<span>Instagram</span>
					</a>
					<a href="https://wa.me/5490000000000" target="_blank" rel="noopener noreferrer"
					   class="footer-red" aria-label="WhatsApp">
						<svg viewBox="0 0 24 24" fill="none">
							<path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.418A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
							<path d="M8.5 9.5c.5 1 1.5 3 3.5 4s3-1 3-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
						</svg>
						<span>WhatsApp</span>
					</a>
				</div>
			</div>

		</div>

		<!-- Barra inferior -->
		<div class="site-footer-bottom">
			<span class="footer-copy">© ${new Date().getFullYear()} Lévitad. Todos los derechos reservados.</span>
			<span class="footer-dev">
				Diseñado por <a href="#" class="footer-dev-link">La Casita</a>
			</span>
		</div>
	`;

	// Insertar al final del body, antes de los SVG de alas si existen
	document.body.appendChild(footer);
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
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
			cerrarBuscador(searchBar, searchInput, searchSubmitBtn)
		);

		if (filterBtn) {
			filterBtn.addEventListener('click', abrirModalFiltros);
		}
	}

	initMenuHamburguesa();

	if (carritoWrapper)  carritoWrapper.addEventListener('click',  abrirCarrito);
	if (carritoOverlay)  carritoOverlay.addEventListener('click',  cerrarCarrito);
	if (carritoCerrar)   carritoCerrar.addEventListener('click',   cerrarCarrito);
	if (carritoWhatsapp) carritoWhatsapp.addEventListener('click', enviarPedidoWhatsApp);

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
});

/* ─── HEADER SCROLL ─── */
const header = document.getElementById('header');
let headerWasCollapsed = false;

const title     = header?.querySelector('h1');
const leftWing  = document.querySelector('.ala-izquierda');
const rightWing = document.querySelector('.ala-derecha');

if (title && leftWing && rightWing) {
	leftWing.setAttribute('aria-hidden',  'true');
	rightWing.setAttribute('aria-hidden', 'true');
	title.insertBefore(leftWing, title.firstChild);
	title.appendChild(rightWing);
}

if (header) {
	// Referencias cacheadas — se leen una sola vez para no hacer querySelector en cada frame
	const headerContainer  = header.querySelector('.header-container');
	const logoArea         = header.querySelector('.logo-area');
	const h1El             = header.querySelector('h1');
	const headerNav        = header.querySelector('.header-nav');
	const iconosContainer  = header.querySelector('.iconos-container');
	const searchBar        = document.getElementById('search-bar');

	// Constantes de altura (equivalen a las antiguas variables CSS --h-grande / --h-pequena)
	const H_SMALL = 70; // px — altura colapsada
	const H_BIG_VH = 0.45; // 45vh — altura expandida

	// ── Cache de viewport ───────────────────────────────────────────────
	// En mobile, la barra de URL del navegador se muestra/oculta al scrollear,
	// lo que cambia window.innerHeight constantemente y genera "saltos" en la
	// animación si recalculamos hBig en cada frame. Cacheamos hBig y solo lo
	// recalculamos cuando cambia el ANCHO (rotación / cambio real de viewport).
	let lastWidth   = window.innerWidth;
	let vhCached    = window.innerHeight;
	let hBigCached  = vhCached * H_BIG_VH;

	let lastP    = -1; // evita recalcular si el progreso no cambió
	let ticking  = false;
	let pausado  = false;

	function applyHeaderStyles(p) {
		if (Math.abs(p - lastP) < 0.001) return; // sin cambio visible
		lastP = p;

		const isCollapsed = p >= 0.9;
		const isExpanded  = p <= 0.18;

		// ── Clases de estado (para estilos CSS estructurales: flex-direction, etc.)
		header.classList.toggle('is-collapsed', isCollapsed);
		header.classList.toggle('is-expanded',  isExpanded);

		if (isCollapsed)     headerWasCollapsed = true;
		else if (isExpanded) headerWasCollapsed = false;

		// ── Altura del header (usa hBigCached, no window.innerHeight, para evitar jitter por la barra del navegador móvil)
		header.style.height = `${hBigCached - (hBigCached - H_SMALL) * p}px`;
		header.style.setProperty('--p', p.toFixed(3));

		// ── Fondo y borde
		header.style.background       = `rgba(17, 21, 34, ${(0.85 + 0.15 * p).toFixed(3)})`;
		header.style.borderBottomColor = `rgba(202, 172, 71, ${(0.10 + 0.20 * p).toFixed(3)})`;

		// ── Nav-links: desaparecen rápido
		if (headerNav) {
			headerNav.style.opacity = Math.max(0, 1 - p * 2.5).toFixed(3);
		}

		// ── Iconos: aparecen después de que empieza el scroll
		if (iconosContainer) {
			const ip = Math.min(1, Math.max(0, (p - 0.18) / 0.82)); // 0→1 entre p=0.18 y p=1
			iconosContainer.style.opacity   = ip.toFixed(3);
			iconosContainer.style.transform =
				`translateY(${(-50 + 10 * (1 - ip)).toFixed(2)}%) scale(${(0.92 + 0.08 * ip).toFixed(3)})`;
		}

		// ── Propiedades que cambian sólo en el rango no-colapsado
		//    Cuando is-collapsed, se borran los estilos inline y el CSS de la clase toma el control
		if (isCollapsed) {
			if (headerContainer) {
				headerContainer.style.paddingTop    = '';
				headerContainer.style.paddingBottom = '';
			}
			if (logoArea)  logoArea.style.transform  = '';
			if (h1El)      h1El.style.transform      = '';
		} else {
			if (headerContainer) {
				headerContainer.style.paddingTop    = `${(6  + 10 * (1 - p)).toFixed(1)}px`;
				headerContainer.style.paddingBottom = `${(10 + 18 * (1 - p)).toFixed(1)}px`;
			}
			if (logoArea) {
				logoArea.style.transform =
					`translateY(${(24 * (1 - p)).toFixed(2)}px) translateX(${(-25 * p).toFixed(2)}%)`;
			}
			if (h1El) {
				// Antes: animábamos font-size + letter-spacing en cada frame, lo que
				// fuerza recálculo de LAYOUT (text shaping) — carísimo en mobile.
				// Ahora: una única transform con scale + translate. Solo capa de
				// compositing, sin reflow. La escala 1 → ~0.78 reproduce el cambio
				// visual de 36px → 28px que tenía el font-size original.
				const scale = (1 - 0.22 * p);
				h1El.style.transform =
					`translateX(${(6 * (1 - p)).toFixed(2)}px) scale(${scale.toFixed(3)})`;
			}
		}

		// ── Buscador: se oculta visualmente al scrollear pero no borra la búsqueda
		if (searchBar) {
			if (p > 0.2) {
				searchBar.classList.add('is-scroll-hidden');
			} else {
				searchBar.classList.remove('is-scroll-hidden');
			}
		}
	}

	function scheduleUpdate() {
		if (ticking || pausado) return;
		ticking = true;
		requestAnimationFrame(() => {
			const rangoScroll = Math.max(140, vhCached * 0.18);
			const p = Math.min(1, Math.max(0, window.scrollY / rangoScroll));
			applyHeaderStyles(p);
			ticking = false;
		});
	}

	// ── API pública: pausar/reanudar la animación del header ───────────
	// Se llama desde abrirModal, abrirCarrito, abrirMenu, abrirContactoPanel, etc.
	// Cuando un panel bloquea el body con overflow:hidden o position:fixed,
	// esto evita que cambios de viewport (barra de URL móvil, scroll-lock,
	// teclado virtual) disparen falsamente is-collapsed/is-expanded.
	window.pauseHeaderScroll = () => { pausado = true; };
	window.resumeHeaderScroll = () => {
		if (!pausado) return;
		pausado = false;
		lastP = -1;
		scheduleUpdate();
	};

	// Scroll exacto al punto donde termina la animación del header (header en modo normal)
	window.scrollToHeaderCollapsed = () => {
		const threshold = Math.max(140, vhCached * 0.18);
		if (window.scrollY < threshold) {
			window.scrollTo({ top: threshold, behavior: 'smooth' });
		}
	};

	window.addEventListener('scroll', scheduleUpdate, { passive: true });

	// resize: en móvil, mostrar/ocultar la barra del navegador dispara resize
	// con la MISMA anchura pero altura distinta. Eso causaba saltos visuales
	// recalculando hBig en cada cambio. Solo recalculamos si cambió el ANCHO.
	window.addEventListener('resize', () => {
		const w = window.innerWidth;
		if (w === lastWidth) return; // ignora cambios solo de altura (URL bar móvil)
		lastWidth   = w;
		vhCached    = window.innerHeight;
		hBigCached  = vhCached * H_BIG_VH;
		lastP       = -1;
		scheduleUpdate();
	}, { passive: true });

	// orientationchange sí es un cambio real → forzamos recálculo completo
	window.addEventListener('orientationchange', () => {
		lastWidth   = window.innerWidth;
		vhCached    = window.innerHeight;
		hBigCached  = vhCached * H_BIG_VH;
		lastP       = -1;
		scheduleUpdate();
	}, { passive: true });
	scheduleUpdate(); // estado inicial
}

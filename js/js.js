const switchContainer = document.querySelector('.switch-container');
const estadoTienda = {
	productos: [],
	masonry: null,
	carrito: [],
	productoDetalleActual: null
};

const MENSAJE_SIN_RESULTADOS = 'No se encontraron resultados.';
const STORAGE_KEY_CARRITO = 'levitad-carrito';
const WHATSAPP_OWNER_NUMBER = '5490000000000';

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

const iconoCarritoPrincipal = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path d="m23.918,4H4.49l-.256-1.843c-.17-1.229-1.234-2.157-2.476-2.157H0v1h1.759c.745,0,1.383.556,1.485,1.294l2.021,14.549c.17,1.229,1.234,2.157,2.476,2.157h12.259v-1H7.741c-.745,0-1.383-.556-1.485-1.294l-.237-1.706h15.699l2.2-11ZM5.88,14l-1.25-9h18.068l-1.8,9H5.88Zm1.12,6c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Zm10-3c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"/>
	</svg>
`;

const iconoCarritoCheck = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="carrito-add">
		<path fill="currentColor" d="M10,17.414L5.293,12.707c-.389-.389-1.018-.389-1.407,0s-.389,1.018,0,1.407l5.707,5.707c.195.195.451.293.707.293s.512-.098.707-.293l10.707-10.707c.389-.389.389-1.018,0-1.407s-1.018-.389-1.407,0L10,17.414Z"/>
	</svg>
`;

const iconoAnadirConViento = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="carrito-add anadir-encargue">
		<path fill="currentColor" d="m9.5,5.5c0,1.379,1.122,2.5,2.5,2.5s2.5-1.121,2.5-2.5-1.122-2.5-2.5-2.5-2.5,1.121-2.5,2.5Zm4,0c0,.827-.673,1.5-1.5,1.5s-1.5-.673-1.5-1.5.673-1.5,1.5-1.5,1.5.673,1.5,1.5Zm7,.5c-3.373,0-6.02,2.984-6.555,3.632-1.256.475-2.633.475-3.889,0-.535-.648-3.182-3.632-6.555-3.632C.918,6,.185,11.139.024,15.45c-.015.409.132.796.416,1.09.286.297.67.46,1.083.46.263,0,.477.214.477.5,0,.827.673,1.5,1.494,1.5.231.006.506.098.506.5v2c0,.099.036.186.086.264.069.315.174.623.353.905.514.807,1.392,1.288,2.346,1.288l10.428.043c.957,0,1.834-.481,2.348-1.288.191-.299.298-.628.364-.964.043-.074.075-.156.075-.248v-2c0-.275.224-.5.5-.5.827,0,1.5-.673,1.5-1.5,0-.275.224-.5.509-.5.412,0,.795-.162,1.079-.457.283-.294.43-.681.414-1.089-.134-3.531-.768-9.454-3.502-9.454ZM3.5,18c-.276,0-.5-.225-.5-.523,0-.814-.663-1.477-1.477-1.477-.139,0-.268-.055-.363-.153-.093-.097-.142-.225-.137-.359.192-5.156,1.165-8.487,2.477-8.487,2.712,0,5.005,2.377,5.669,3.136l-4.315,8.675c-.279-.583-.899-.811-1.354-.811Zm15.218,4.175c-.33.517-.892.825-1.503.825l-10.428-.043c-.613,0-1.176-.309-1.505-.825s-.371-1.157-.118-1.701l4.847-9.744c1.29.416,2.687.417,3.976,0l4.843,9.774c.259.556.217,1.196-.112,1.714Zm4.15-6.326c-.094.098-.221.151-.368.151-.827,0-1.5.673-1.5,1.5,0,.275-.224.5-.5.5-.596,0-1.107.352-1.349.856l-4.32-8.72c.663-.758,2.957-3.136,5.669-3.136,1.304,0,2.311,3.412,2.503,8.491.005.135-.043.262-.135.357ZM7.634,4.486c-.415-.445-.634-.96-.634-1.486,0-1.683,2.196-3,5-3s5,1.317,5,3c0,.526-.219,1.041-.634,1.486-.099.106-.232.16-.366.16-.122,0-.244-.044-.34-.134-.202-.188-.214-.504-.026-.706.243-.262.366-.533.366-.807,0-.946-1.643-2-4-2s-4,1.054-4,2c0,.273.123.545.366.807.188.202.176.519-.026.706-.202.188-.519.177-.707-.026Z"/>
		<path fill="currentColor" d="M12,20c-.276,0-.5.224-.5.5v1c0,.276.224.5.5.5s.5-.224.5-.5v-1c0-.276-.224-.5-.5-.5Z"/>
		<path fill="currentColor" d="M8,20c-.276,0-.5.224-.5.5v.5c0,.276.224.5.5.5s.5-.224.5-.5v-.5c0-.276-.224-.5-.5-.5Z"/>
		<path fill="currentColor" d="M16,20c-.276,0-.5.224-.5.5v.5c0,.276.224.5.5.5s.5-.224.5-.5v-.5c0-.276-.224-.5-.5-.5Z"/>
	</svg>
`;

const formatPrecio = (precio) => {
	const valor = Number(precio) || 0;
	return `$${valor.toLocaleString('es-DO')}`;
};

function guardarCarrito() {
	localStorage.setItem(STORAGE_KEY_CARRITO, JSON.stringify(estadoTienda.carrito));
}

function cargarCarritoGuardado() {
	try {
		const guardado = localStorage.getItem(STORAGE_KEY_CARRITO);
		if (!guardado) return;

		const carrito = JSON.parse(guardado);
		estadoTienda.carrito = Array.isArray(carrito) ? carrito : [];
	} catch (error) {
		console.error('No se pudo recuperar el carrito:', error);
		estadoTienda.carrito = [];
	}
}

function obtenerCantidadCarrito() {
	return estadoTienda.carrito.reduce((total, item) => total + (item.cantidad || 1), 0);
}

function obtenerTotalCarrito() {
	return estadoTienda.carrito.reduce((total, item) => total + ((Number(item.precio) || 0) * (item.cantidad || 1)), 0);
}

function refrescarBadgeCarrito() {
	const badge = document.querySelector('.carrito-badge');
	if (badge) {
		badge.textContent = String(obtenerCantidadCarrito());
	}
}

function renderizarCarrito() {
	const lista = document.getElementById('carrito-lista');
	const vacio = document.getElementById('carrito-vacio');
	const total = document.getElementById('carrito-total');

	if (!lista || !vacio || !total) return;

	if (!estadoTienda.carrito.length) {
		lista.innerHTML = '';
		vacio.hidden = false;
	} else {
		vacio.hidden = true;
			lista.innerHTML = estadoTienda.carrito.map((item, index) => `
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
	guardarCarrito();
	
	// Actualizar estado visual de los botones
	const isEncargue = document.body.classList.contains('is-encargue');
	const botonesAnadir = document.querySelectorAll('.btn-anadir');
	botonesAnadir.forEach(btn => {
		const tarjeta = btn.closest('.tarjeta-producto');
		if (tarjeta) {
			const idProducto = Number(tarjeta.dataset.productoId);
			const producto = estadoTienda.productos[idProducto];
			if (producto) {
				if (obtenerProductoEnCarrito(producto.nombre)) {
					marcarBotonComoAgregado(btn, isEncargue);
				} else {
					desmarcarBotonAgregado(btn, isEncargue);
				}
			}
		}
	});
}

function abrirCarrito() {
	const overlay = document.getElementById('carrito-overlay');
	const panel = document.getElementById('carrito-panel');
	if (!overlay || !panel) return;

	overlay.classList.add('is-active');
	panel.classList.add('is-active');
	overlay.setAttribute('aria-hidden', 'false');
	panel.setAttribute('aria-hidden', 'false');
	document.body.classList.add('carrito-abierto');
}

function cerrarCarrito() {
	const overlay = document.getElementById('carrito-overlay');
	const panel = document.getElementById('carrito-panel');
	if (!overlay || !panel) return;

	overlay.classList.remove('is-active');
	panel.classList.remove('is-active');
	overlay.setAttribute('aria-hidden', 'true');
	panel.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('carrito-abierto');
}

function animarBotonAnadir(boton) {
	if (!boton) return;
	const isEncargue = document.body.classList.contains('is-encargue');
	
	if (isEncargue) {
		// Animación de vuelo para encargue
		boton.classList.remove('is-vuela');
		void boton.offsetWidth;
		boton.classList.add('is-vuela');
		setTimeout(() => boton.classList.remove('is-vuela'), 800);
	} else {
		// Animación original
		boton.classList.remove('is-added');
		void boton.offsetWidth;
		boton.classList.add('is-added');
		setTimeout(() => boton.classList.remove('is-added'), 450);
	}
}

function obtenerProductoEnCarrito(nombre) {
	return estadoTienda.carrito.find(item => item.nombre === nombre);
}

function marcarBotonComoAgregado(boton, isEncargue) {
	if (!boton) return;
	boton.classList.add('is-agregado');
	boton.disabled = true;
	
	const svg = boton.querySelector('svg');
	if (svg) {
		svg.classList.add('icono-transicion');
		setTimeout(() => {
			if (isEncargue) {
				boton.innerHTML = iconoAnadirConViento;
			} else {
				boton.innerHTML = iconoCarritoCheck;
			}
			const newSvg = boton.querySelector('svg');
			if (newSvg) {
				newSvg.classList.add('icono-transicion');
			}
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
			if (isEncargue) {
				boton.innerHTML = iconoAnadir;
			} else {
				boton.innerHTML = iconoCarrito;
			}
			const newSvg = boton.querySelector('svg');
			if (newSvg) {
				newSvg.classList.add('icono-transicion');
			}
		}, 100);
	}
}

function agregarAlCarrito(producto, boton) {
	if (!producto) return;
	
	// Verificar si el producto ya está en el carrito
	if (obtenerProductoEnCarrito(producto.nombre)) {
		return; // No hacer nada si ya existe
	}

	estadoTienda.carrito.push({
		nombre: producto.nombre,
		precio: Number(producto.precio) || 0,
		imagen: producto.imagen || ''
	});
	
	const isEncargue = document.body.classList.contains('is-encargue');
	animarBotonAnadir(boton);
	marcarBotonComoAgregado(boton, isEncargue);
	renderizarCarrito();
}

function eliminarDelCarrito(index) {
	if (!Number.isInteger(index) || index < 0 || index >= estadoTienda.carrito.length) return;

	const productoEliminado = estadoTienda.carrito[index];
	estadoTienda.carrito.splice(index, 1);
	
	// Desmarcar el botón del producto eliminado
	const botonesAnadir = document.querySelectorAll('.btn-anadir');
	const isEncargue = document.body.classList.contains('is-encargue');
	botonesAnadir.forEach(btn => {
		const tarjeta = btn.closest('.tarjeta-producto');
		if (tarjeta) {
			const idProducto = Number(tarjeta.dataset.productoId);
			const producto = estadoTienda.productos[idProducto];
			if (producto && producto.nombre === productoEliminado.nombre) {
				desmarcarBotonAgregado(btn, isEncargue);
			}
		}
	});
	
	renderizarCarrito();
}

function construirMensajeWhatsApp() {
	if (!estadoTienda.carrito.length) {
		return 'Hola Lévitad quiero comprar estos productos:\n\nDonde podemos quedar para hacer ver el producto y realizar la compra?';
	}

	const productosTexto = estadoTienda.carrito.map((item) => `${item.nombre} ${formatPrecio(item.precio)}`).join(' ');
	return `Hola Lévitad quiero comprar estos productos:\n${productosTexto}\n\nDonde podemos quedar para hacer ver el producto y realizar la compra?`;
}

function enviarPedidoWhatsApp() {
	const url = `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(construirMensajeWhatsApp())}`;
	window.open(url, '_blank', 'noopener,noreferrer');
}

const carritoLista = document.getElementById('carrito-lista');
if (carritoLista) {
	carritoLista.addEventListener('click', (e) => {
		const botonEliminar = e.target.closest('.carrito-item-eliminar');
		if (!botonEliminar) return;

		const item = botonEliminar.closest('.carrito-item');
		const index = Number(item?.dataset.carritoIndex);
		eliminarDelCarrito(index);
	});
}

function crearTarjetaProducto(producto, index) {
	const etiquetas = Array.isArray(producto.tags)
		? producto.tags.map((tag) => `<p class="etiquetas">#${tag}</p>`).join('')
		: '';

	const isEncargue = document.body.classList.contains('is-encargue');
	const iconoBtnAnadir = isEncargue ? iconoAnadir : iconoCarrito;
	const yaEnCarrito = Boolean(obtenerProductoEnCarrito(producto.nombre));
	const iconoBoton = yaEnCarrito
		? (isEncargue ? iconoAnadirConViento : iconoCarritoCheck)
		: iconoBtnAnadir;
	const clasesBoton = yaEnCarrito ? 'btn-anadir is-agregado' : 'btn-anadir';
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

	if (estadoTienda.masonry) {
		estadoTienda.masonry.destroy();
	}

	estadoTienda.masonry = new Masonry(productosGrid, {
		itemSelector: '.tarjeta-producto',
		columnWidth: '.grid-sizer',
		gutter: '.gutter-sizer',
		percentPosition: true,
		resizeContainer: true,
		transitionDuration: '0.25s'
	});

	const relayoutMasonry = () => {
		requestAnimationFrame(() => estadoTienda.masonry?.layout());
	};

	window.addEventListener('load', relayoutMasonry);
	window.addEventListener('resize', relayoutMasonry);

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(relayoutMasonry);
	}

	const gridImages = productosGrid.querySelectorAll('.img-producto');
	gridImages.forEach((img) => {
		if (!img.complete) {
			img.addEventListener('load', relayoutMasonry, { once: true });
		}
	});

	setTimeout(relayoutMasonry, 120);
}

function obtenerEstadoSinResultados() {
	let estadoVacio = document.getElementById('estado-sin-resultados');

	if (!estadoVacio) {
		estadoVacio = document.createElement('div');
		estadoVacio.id = 'estado-sin-resultados';
		estadoVacio.className = 'estado-sin-resultados';
		estadoVacio.setAttribute('role', 'status');
		estadoVacio.setAttribute('aria-live', 'polite');
		estadoVacio.innerHTML = `
			<p>${MENSAJE_SIN_RESULTADOS}</p>
		`;
		document.body.appendChild(estadoVacio);
	}

	return estadoVacio;
}

function mostrarEstadoSinResultados(mostrar) {
	const estadoVacio = obtenerEstadoSinResultados();
	estadoVacio.classList.toggle('is-visible', mostrar);
}

function actualizarBotonBusqueda(boton) {
	if (!boton) return;

	boton.setAttribute('aria-label', 'Limpiar búsqueda');
}

function abrirBuscador(searchBar, searchInput, searchSubmitBtn) {
	searchBar.classList.remove('is-closing');
	searchBar.classList.remove('is-header-hidden');
	searchBar.classList.add('is-active');
	actualizarBotonBusqueda(searchSubmitBtn);
	setTimeout(() => searchInput.focus(), 150);
}

function cerrarBuscador(searchBar, searchInput, searchSubmitBtn) {
	searchBar.classList.add('is-closing');
	searchInput.value = '';
	filtrarProductos('');
	searchInput.blur();

	const finalizarCierre = () => {
		searchBar.classList.remove('is-active', 'is-closing');
		searchBar.removeEventListener('transitionend', finalizarCierre);
	};

	searchBar.addEventListener('transitionend', finalizarCierre);
}

function renderizarProductos(productos, opciones = {}) {
	const { mostrarVacio = false } = opciones;
	const grid = document.querySelector('.grid-productos');
	if (!grid) return;

	const tarjetas = productos.map((producto, index) => crearTarjetaProducto(producto, index)).join('');
	grid.innerHTML = `
		<div class="grid-sizer"></div>
		<div class="gutter-sizer"></div>
		${tarjetas}
	`;

	mostrarEstadoSinResultados(mostrarVacio);

	inicializarMasonry();
}

async function cargarProductos() {
	try {
		const response = await fetch('datos/datos.json');
		if (!response.ok) {
			throw new Error(`No se pudo leer datos.json (${response.status})`);
		}

		const productos = await response.json();
		estadoTienda.productos = Array.isArray(productos) ? productos : [];
		renderizarProductos(estadoTienda.productos);
	} catch (error) {
		console.error('Error cargando productos:', error);
	}
}

function cambiarIconosEncargue(isEncargue) {
	// Cambiar iconos en tarjetas de productos
	const botonesAnadir = document.querySelectorAll('.btn-anadir');
	botonesAnadir.forEach((btn) => {
		const svg = btn.querySelector('svg');
		if (svg) {
			// Agregar clase de transición
			svg.classList.add('icono-transicion');
			
			setTimeout(() => {
				// Si el producto está agregado, mostrar el icono de estado
				if (btn.classList.contains('is-agregado')) {
					if (isEncargue) {
						btn.innerHTML = iconoAnadirConViento;
					} else {
						btn.innerHTML = iconoCarritoCheck;
					}
				} else {
					if (isEncargue) {
						btn.innerHTML = iconoAnadir;
					} else {
						btn.innerHTML = iconoCarrito;
					}
				}
				const newSvg = btn.querySelector('svg');
				if (newSvg) {
					newSvg.classList.add('icono-transicion');
				}
			}, 150);
		}
	});

	// Cambiar iconos del carrito en header
	const carritoBtn = document.getElementById('carrito-btn');
	const carritoSvg = carritoBtn ? carritoBtn.closest('svg') : null;
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
			const newSvg = carritoSvg.parentElement.querySelector('svg');
			if (newSvg) {
				newSvg.classList.add('icono-transicion');
			}
		}, 150);
	}
}

if (switchContainer) {
	const switchIndicator = switchContainer.querySelector('.color-switch');
	const switchButtons = Array.from(switchContainer.querySelectorAll('button'));

	const setActiveSwitch = (button) => {
		if (!switchIndicator || !button) return;

		switchButtons.forEach((btn) => btn.classList.remove('is-active'));
		button.classList.add('is-active');
		const isEncargue = switchButtons.indexOf(button) === 1;
		switchContainer.classList.toggle('is-encargue', isEncargue);
		document.body.classList.toggle('is-encargue', isEncargue);

		const containerRect = switchContainer.getBoundingClientRect();
		const buttonRect = button.getBoundingClientRect();
		const buttonCenterX = (buttonRect.left - containerRect.left) + (buttonRect.width / 2);
		const indicatorX = buttonCenterX - (buttonRect.width / 2);

		switchIndicator.style.width = `${buttonRect.width}px`;
		switchIndicator.style.transform = `translate(${indicatorX}px, -50%)`;

		// Cambiar iconos cuando se cambia de color
		cambiarIconosEncargue(isEncargue);
	};

	switchButtons.forEach((button) => {
		button.addEventListener('click', () => setActiveSwitch(button));
	});

	// Estado inicial: primer boton activo
	if (switchButtons.length > 0) {
		setActiveSwitch(switchButtons[0]);
	}

	window.addEventListener('resize', () => {
		const activeButton = switchContainer.querySelector('button.is-active') || switchButtons[0];
		if (activeButton) {
			setActiveSwitch(activeButton);
		}
	});
}

/* VENTANAS MODAL*/
// Lógica de la Modal de Detalles
const modal = document.getElementById('modal-producto');
const btnCerrar = document.querySelector('.btn-cerrar-modal');

// Función para abrir la modal con datos
function abrirDetalles(datos) {
	estadoTienda.productoDetalleActual = datos;
	document.getElementById('modal-titulo').innerText = datos.nombre;
	document.getElementById('modal-precio').innerText = formatPrecio(datos.precio);

	const modalDetalles = document.getElementById('modal-detalles');
	const especificaciones = Object.entries(datos.detalles || {});
	modalDetalles.innerHTML = especificaciones
		.map(
			([clave, valor]) => `
				<li class="detalle-item">
					<span class="detalle-label">${clave}:</span>
					<span class="detalle-valor">${valor}</span>
				</li>
			`
		)
		.join('');

	const modalImg = document.getElementById('modal-img');
	if (datos.imagen) {
		modalImg.style.backgroundImage = `url("${datos.imagen}")`;
		modalImg.style.backgroundSize = 'contain';
		modalImg.style.backgroundRepeat = 'no-repeat';
		modalImg.style.backgroundPosition = 'center';
	} else {
		modalImg.style.backgroundImage = 'none';
	}

	modal.style.display = 'flex';
	setTimeout(() => modal.classList.add('is-active'), 10);
	document.body.style.overflow = 'hidden';
}

// Función para cerrar
function cerrarModal() {
    modal.classList.remove('is-active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 500);
}

// Event Delegation para los productos
const grid = document.querySelector('.grid-productos');
if (grid) {
	grid.addEventListener('click', (e) => {
		const tarjeta = e.target.closest('.tarjeta-producto');
		const btnAnadir = e.target.closest('.btn-anadir');

		if (btnAnadir && tarjeta) {
			const idProducto = Number(tarjeta.dataset.productoId);
			const producto = estadoTienda.productos[idProducto];
			if (producto) {
				agregarAlCarrito(producto, btnAnadir);
			}
			return;
		}

		if (tarjeta) {
			const idProducto = Number(tarjeta.dataset.productoId);
			const producto = estadoTienda.productos[idProducto];
			if (producto) {
				abrirDetalles(producto);
			}
		}
	});
}

// Eventos de cierre
if (btnCerrar && modal) {
	btnCerrar.addEventListener('click', cerrarModal);
	modal.addEventListener('click', (e) => {
		if (e.target === modal) cerrarModal();
	});
}

/* BÚSQUEDA Y FILTRADO */
function filtrarProductos(termino) {
	const terminoLower = termino.toLowerCase().trim();
	
	if (!terminoLower) {
		// Si no hay término de búsqueda, mostrar todos
		renderizarProductos(estadoTienda.productos, { mostrarVacio: false });
		return;
	}

	// Filtrar productos que coincidan con el nombre
	const productosFiltrados = estadoTienda.productos.filter(producto => 
		producto.nombre.toLowerCase().includes(terminoLower)
	);

	renderizarProductos(productosFiltrados, { mostrarVacio: productosFiltrados.length === 0 });
}
document.addEventListener('DOMContentLoaded', () => {
	cargarCarritoGuardado();
	renderizarCarrito();
	cargarProductos();

	// Inicializar búsqueda
	const buscarBtn = document.getElementById('buscar-btn');
	const searchBar = document.getElementById('search-bar');
	const searchInput = document.getElementById('search-input');
	const searchSubmitBtn = document.getElementById('search-submit-btn');
	const filterBtn = document.getElementById('filter-btn');
	const carritoWrapper = document.querySelector('.carrito-wrapper');
	const carritoOverlay = document.getElementById('carrito-overlay');
	const carritoCerrar = document.getElementById('carrito-cerrar');
	const carritoWhatsapp = document.getElementById('carrito-whatsapp');
	const btnComprarAhora = document.getElementById('btn-comprar-ahora');

	if (searchSubmitBtn) {
		actualizarBotonBusqueda(searchSubmitBtn);
	}

	if (buscarBtn && searchBar && searchInput && searchSubmitBtn) {
		// Abrir barra de búsqueda
		buscarBtn.addEventListener('click', () => {
			if (!searchBar.classList.contains('is-active')) {
				abrirBuscador(searchBar, searchInput, searchSubmitBtn);
				return;
			}

			searchInput.focus();
		});

		// Búsqueda en tiempo real
		searchInput.addEventListener('input', (e) => {
			filtrarProductos(e.target.value);
		});

		// Permitir presionar Enter para buscar
		searchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				filtrarProductos(e.target.value);
			}
		});

		// Botón de envío de búsqueda
		searchSubmitBtn.addEventListener('click', () => {
			cerrarBuscador(searchBar, searchInput, searchSubmitBtn);
		});

		// Botón de filtro (puede expandirse con más opciones en futuro)
		if (filterBtn) {
			filterBtn.addEventListener('click', () => {
				// Placeholder para futura funcionalidad de filtros avanzados
				console.log('Filtros avanzados en desarrollo');
			});
		}
	}

	if (carritoWrapper) {
		carritoWrapper.addEventListener('click', abrirCarrito);
	}

	if (carritoOverlay) {
		carritoOverlay.addEventListener('click', cerrarCarrito);
	}

	if (carritoCerrar) {
		carritoCerrar.addEventListener('click', cerrarCarrito);
	}

	if (carritoWhatsapp) {
		carritoWhatsapp.addEventListener('click', enviarPedidoWhatsApp);
	}

	if (btnComprarAhora) {
		btnComprarAhora.addEventListener('click', () => {
			if (estadoTienda.productoDetalleActual) {
				agregarAlCarrito(estadoTienda.productoDetalleActual, btnComprarAhora);
				cerrarModal();
			}
		});
	}
});
// Cosa pa header
// Cosa pa header
// Motor de Scroll para el Header dinámico
const header = document.getElementById('header');
let headerWasCollapsed = false;

const title = header ? header.querySelector('h1') : null;
const leftWing = document.querySelector('.ala-izquierda');
const rightWing = document.querySelector('.ala-derecha');

if (title && leftWing && rightWing) {
	leftWing.setAttribute('aria-hidden', 'true');
	rightWing.setAttribute('aria-hidden', 'true');
	title.insertBefore(leftWing, title.firstChild);
	title.appendChild(rightWing);
}

if (header) {
	const updateHeaderProgress = () => {
		const scrollActual = window.scrollY;
		const searchBar = document.getElementById('search-bar');
		const searchInput = document.getElementById('search-input');
		const searchSubmitBtn = document.getElementById('search-submit-btn');

		// Menor rango = necesita menos scroll para colapsar/volver.
		const rangoScroll = Math.max(140, window.innerHeight * 0.18);
		const progreso = Math.min(1, Math.max(0, scrollActual / rangoScroll));

		header.style.setProperty('--p', progreso.toFixed(3));

		const isCollapsed = progreso >= 0.9;
		const isExpanded = progreso <= 0.18;

		header.classList.toggle('is-collapsed', isCollapsed);
		header.classList.toggle('is-expanded', isExpanded);

		// Registramos si el header llegó a estar pequeño
		if (isCollapsed) {
			headerWasCollapsed = true;
		} else if (isExpanded) {
			headerWasCollapsed = false;
		}

		// --- LÓGICA DE BÚSQUEDA CORREGIDA ---
		if (searchBar && searchInput && searchSubmitBtn && searchBar.classList.contains('is-active') && !searchBar.classList.contains('is-closing')) {
			
			// 1. Lo que pediste: Si venimos desde abajo (header pequeño) y subimos 
			// hasta que la animación del header pasa la mitad (--p <= 0.5)
			if (headerWasCollapsed && progreso <= 0.5) {
				cerrarBuscador(searchBar, searchInput, searchSubmitBtn);
				headerWasCollapsed = false; // Reseteamos el estado
			}
			
			// 2. Control inverso: Si abriste el buscador estando arriba del todo, 
			// y empiezas a bajar, lo cerramos suavemente al pasar de 0.2 
			// (para que no se quede flotando mientras el header se encoge)
			else if (!headerWasCollapsed && progreso > 0.2) {
				cerrarBuscador(searchBar, searchInput, searchSubmitBtn);
			}
		}
	};

	window.addEventListener('scroll', updateHeaderProgress, { passive: true });
	window.addEventListener('resize', updateHeaderProgress);
	updateHeaderProgress();
}
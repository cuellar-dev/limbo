const switchContainer = document.querySelector('.switch-container');
const estadoTienda = {
	productos: [],
	masonry: null
};

const iconoCarrito = `
	<svg xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 24 24" class="carrito-add">
		<path d="m7,20c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Zm10-3c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Zm7-19v1h-4v4h-1v-4h-4v-1h4V0h1v4h4Zm-1.666,3h1.02l-1.598,8H6.019l.237,1.706c.103.738.74,1.294,1.485,1.294h12.259v1H7.741c-1.241,0-2.306-.927-2.476-2.157L3.244,2.294c-.103-.738-.74-1.294-1.485-1.294H0V0h1.759c1.241,0,2.306.927,2.476,2.157l.256,1.843h8.51v1H4.629l1.25,9h15.056l1.398-7Z"/>
	</svg>
`;

const formatPrecio = (precio) => {
	const valor = Number(precio) || 0;
	return `$${valor.toLocaleString('es-DO')}`;
};

function crearTarjetaProducto(producto, index) {
	const etiquetas = Array.isArray(producto.tags)
		? producto.tags.map((tag) => `<p class="etiquetas">#${tag}</p>`).join('')
		: '';

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
					<button class="btn-anadir" aria-label="Agregar ${producto.nombre}">
						${iconoCarrito}
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

function renderizarProductos(productos) {
	const grid = document.querySelector('.grid-productos');
	if (!grid) return;

	const tarjetas = productos.map((producto, index) => crearTarjetaProducto(producto, index)).join('');
	grid.innerHTML = `
		<div class="grid-sizer"></div>
		<div class="gutter-sizer"></div>
		${tarjetas}
	`;

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

if (switchContainer) {
	const switchIndicator = switchContainer.querySelector('.color-switch');
	const switchButtons = Array.from(switchContainer.querySelectorAll('button'));

	const setActiveSwitch = (button) => {
		if (!switchIndicator || !button) return;

		switchButtons.forEach((btn) => btn.classList.remove('is-active'));
		button.classList.add('is-active');
		switchContainer.classList.toggle('is-encargue', switchButtons.indexOf(button) === 1);

		const containerRect = switchContainer.getBoundingClientRect();
		const buttonRect = button.getBoundingClientRect();
		const buttonCenterX = (buttonRect.left - containerRect.left) + (buttonRect.width / 2);
		const indicatorX = buttonCenterX - (buttonRect.width / 2);

		switchIndicator.style.width = `${buttonRect.width}px`;
		switchIndicator.style.transform = `translate(${indicatorX}px, -50%)`;
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
	modalImg.style.setProperty('--modal-image-url', datos.imagen ? `url("${datos.imagen}")` : 'none');

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

		if (tarjeta && !btnAnadir) {
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

document.addEventListener('DOMContentLoaded', () => {
	cargarProductos();
});
// Cosa pa header
// Motor de Scroll para el Header dinámico
const header = document.getElementById('header');

if (header) {
	const updateHeaderProgress = () => {
		const scrollActual = window.scrollY;

		// Menor rango = necesita menos scroll para colapsar/volver.
		const rangoScroll = Math.max(140, window.innerHeight * 0.18);
		const progreso = Math.min(1, Math.max(0, scrollActual / rangoScroll));

		header.style.setProperty('--p', progreso.toFixed(3));

		// Estados robustos para evitar depender de selectores [style*="..."]
		header.classList.toggle('is-collapsed', progreso >= 0.9);
		header.classList.toggle('is-expanded', progreso <= 0.18);
	};

	window.addEventListener('scroll', updateHeaderProgress, { passive: true });
	window.addEventListener('resize', updateHeaderProgress);
	updateHeaderProgress();
}
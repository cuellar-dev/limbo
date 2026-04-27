const switchContainer = document.querySelector('.switch-container');

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

// Relacionado a la libreria Masonry.js
const productosGrid = document.querySelector('.grid-productos');

if (productosGrid && typeof Masonry !== 'undefined') {
	const masonry = new Masonry(productosGrid, {
		itemSelector: '.tarjeta-producto',
		columnWidth: '.grid-sizer',
		gutter: '.gutter-sizer',
		percentPosition: true,
		resizeContainer: true,
		transitionDuration: '0.25s'
	});

	const relayoutMasonry = () => {
		requestAnimationFrame(() => masonry.layout());
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
/* VENTANAS MODAL*/
// Lógica de la Modal de Detalles
const modal = document.getElementById('modal-producto');
const btnCerrar = document.querySelector('.btn-cerrar-modal');

// Función para abrir la modal con datos
function abrirDetalles(datos) {
    document.getElementById('modal-titulo').innerText = datos.nombre;
    document.getElementById('modal-precio').innerText = datos.precio;
	const modalImg = document.getElementById('modal-img');
	modalImg.style.setProperty('--modal-image-url', datos.imagen ? `url("${datos.imagen}")` : 'none');
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('is-active'), 10);
    document.body.style.overflow = 'hidden'; // Bloquea scroll fondo
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
if(grid) {
    grid.addEventListener('click', (e) => {
        const tarjeta = e.target.closest('.tarjeta-producto');
        const btnAnadir = e.target.closest('.btn-anadir');

        if (tarjeta && !btnAnadir) {
            const nombre = tarjeta.querySelector('.nombre-producto').innerText;
            const precio = tarjeta.querySelector('.precio').innerText;
			const imgProducto = tarjeta.querySelector('.img-producto');
			const imagen = (imgProducto?.currentSrc || imgProducto?.getAttribute('src') || '').trim();
            
            abrirDetalles({ nombre, precio, imagen });
        }
    });
}

// Eventos de cierre
btnCerrar.addEventListener('click', cerrarModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
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
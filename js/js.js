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

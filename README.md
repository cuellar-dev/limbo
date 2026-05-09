# Lévitad

Tienda web estática para mostrar prendas, ver detalles de producto, armar pedidos y enviar la compra por WhatsApp.

## Qué incluye

- Catálogo de productos cargado desde `datos/datos.json`
- Vista de detalles en modal
- Buscador de productos
- Carrito de compra con persistencia en `localStorage`
- Dos modos de pedido: `En Stack` y `Encargue`
- Envío del pedido por WhatsApp
- Diseño responsive con animaciones y grid tipo Masonry

## Tecnologías

- HTML5
- CSS3
- JavaScript vanilla
- [Masonry](https://masonry.desandro.com/) vía CDN
- [GSAP](https://gsap.com/) vía CDN
- [ScrollTrigger](https://gsap.com/scrolltrigger/) vía CDN

## Estructura del proyecto

```text
Lévitad/
├── index.html
├── Css/
│   ├── style.css
│   └── angel.css
├── js/
│   ├── js.js
│   └── angel.js
├── datos/
│   └── datos.json
├── imagenes/
└── Fuentes/
```

## Cómo correrlo localmente

Como es un proyecto estático, no necesita instalación de dependencias.

### Opción 1: Live Server en VS Code

1. Abrí el proyecto en VS Code.
2. Instalá la extensión **Live Server** si no la tenés.
3. Hacé clic derecho sobre `index.html`.
4. Elegí **Open with Live Server**.

### Opción 2: servidor local simple

En la carpeta raíz del proyecto:

```powershell
python -m http.server 5500
```

Luego abrí:

```text
http://localhost:5500
```

## Cómo editar el catálogo

Los productos se cargan desde `datos/datos.json`.

Cada producto usa una estructura parecida a esta:

```json
{
  "nombre": "Buzo Oversize Nube Oxidada",
  "precio": 48900,
  "imagen": "imagenes/sudadera.jpg",
  "categoria": "buzo",
  "tags": ["oversize", "unisex", "urbano"],
  "detalles": {
    "Talla": "XL",
    "Color": "Naranja oxidado",
    "Stock": "8 unidades"
  }
}
```

Si querés agregar productos nuevos:

1. Abrí `datos/datos.json`.
2. Copiá un objeto existente.
3. Cambiá nombre, precio, imagen, tags y detalles.
4. Verificá que el JSON siga siendo válido.

## Funcionalidades principales

- El catálogo se arma dinámicamente desde el JSON.
- El buscador filtra por nombre.
- El modal muestra imagen, precio y especificaciones.
- El carrito guarda productos en `localStorage`.
- El botón de WhatsApp arma el mensaje con el pedido actual.
- El proyecto usa dos carritos separados:
  - `En Stack` para stock disponible
  - `Encargue` para pedidos especiales

## Dependencias externas

El sitio carga recursos desde CDN, así que necesitás conexión a internet para ver todo correctamente:

- `https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js`
- `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`
- `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js`

## Cómo subirlo a GitHub

Si el repositorio ya está conectado al remoto `origin`, los pasos son estos:

```powershell
git status
git add README.md
git commit -m "docs: add project README"
git push origin main
```

Si todavía no tenés remoto configurado:

```powershell
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## Cómo publicarlo en GitHub Pages

1. Subí el proyecto a GitHub.
2. Entrá al repositorio en GitHub.
3. Andá a **Settings** > **Pages**.
4. En **Build and deployment**, elegí:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
5. Guardá los cambios.
6. Esperá a que GitHub genere la URL pública.

## Despliegue alternativo

También podés publicar el sitio en:

- Netlify
- Vercel
- Cloudflare Pages

Como no hay backend ni build step, podés subir la carpeta completa directamente.

## Notas importantes

- Las imágenes deben existir en la ruta definida en `datos/datos.json`.
- Si cambiás nombres de archivos, revisá también las rutas en HTML, CSS y JS.
- El enlace de WhatsApp usa el número configurado en `js/js.js`.

## Autor

Lévitad
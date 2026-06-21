# Lévitad — E‑commerce (PWA) with a Git‑based admin panel

> Repository name: `limbo` · Product/brand: **Lévitad** — a clothing store and import‑to‑order shop based in Sancti Spíritus, Cuba.

A complete, **mobile‑first** web store to browse clothing, view product details, build an order and check out via **WhatsApp**. It includes a custom **admin panel** that manages the catalog using the **GitHub REST API as a serverless backend** — no traditional database server required.

> 🔗 **Live demo:** https://cuellar-dev.github.io/limbo/
> 📱 **Designed mobile‑first** — best viewed on a phone (it doesn't break on desktop, but the experience is built for mobile).

## Storefront features

- 🛍️ Dynamic **catalog** loaded from `datos/datos.json` (products and "outfits").
- 🔎 **Product search** and a **detail modal** with image zoom, price and specs.
- 🛒 **Shopping cart** with `localStorage` persistence and **two order modes**: `Disponible` (in‑stock items) and `Encargos` (special orders imported from abroad).
- 📲 **WhatsApp checkout**: the order is turned into a ready‑to‑send WhatsApp message to coordinate delivery and payment.
- 🎨 **Custom UI** with a Masonry grid, light/dark theme, custom fonts and GSAP‑style animations.
- ⚡ **PWA**: service worker (`sw.js`) + web manifest (`site.webmanifest`) for installability and caching.
- 🔍 **SEO‑ready**: `sitemap.xml`, `robots.txt`, semantic markup and an FAQ section.

## Admin panel — a Git‑based CMS (the interesting part)

Instead of standing up a separate server, the admin panel (`panel-*.html` + `js/admin.js`) turns **GitHub itself into the backend**:

- 🔐 **Token authentication** with a GitHub Personal Access Token (entered by the admin, never hardcoded).
- 💾 **Reads and writes `datos/datos.json` through the GitHub Contents API** — create, edit and delete products and outfits from a UI.
- 🔁 **Optimistic concurrency**: it tracks the file `sha` and warns if the file changed on GitHub before saving, to avoid overwriting data.
- 🛡️ **Session‑scoped security**: the token is validated against the repo before use and kept only in `sessionStorage` (cleared when invalid or when the session ends).
- 🚀 On save, the change is committed to the repo and **GitHub Pages republishes the store automatically** (~1 min).

This is the same idea behind Git‑based CMSs (Decap/Netlify CMS): the data lives in the repo as JSON and the site is fully static, so it can be hosted for free with no database to maintain.

> **Note on `backend/`:** while building this project I also explored a **PocketBase** backend (kept in `backend/` with its Docker/Fly.io config and migrations) as a learning exercise. The **production version intentionally uses the GitHub‑API approach above**, so that folder is not required to run the store.

## Tech stack

- **Frontend:** HTML5, CSS3, JavaScript (vanilla), Masonry, PWA (Service Worker + Manifest)
- **"Backend":** GitHub REST API (Contents API) used as a serverless data layer
- **Tooling:** asset conversion script (`scripts/convert-assets.js`), minified CSS/JS builds
- **Explored (not in production):** PocketBase + Docker + Fly.io + Litestream (`backend/`)

## Project structure

```
limbo/
├── index.html            # storefront
├── panel-*.html          # admin panel (Git-based CMS)
├── Css/                  # styles (style.css + minified build)
├── js/                   # js.js (storefront), admin.js (panel), vendor/
├── datos/datos.json      # catalog data (the "database")
├── imagenes/ , Fuentes/  # assets and custom fonts
├── sw.js , site.webmanifest, robots.txt, sitemap.xml
├── scripts/              # build/asset helpers
└── backend/              # PocketBase experiment (not used in production)
```

## Run it locally

Static frontend — no build step required:

```bash
python -m http.server 5500
# then open http://localhost:5500
```

Or use the **Live Server** extension in VS Code. Some libraries load from a CDN, so an internet connection is needed.

## Author

**Luis Ernesto Cuellar del Castillo** (a.k.a. *Kuroma*) — [@cuellar-dev](https://github.com/cuellar-dev)
Designed and developed end‑to‑end — no templates.

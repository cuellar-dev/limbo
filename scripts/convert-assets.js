/* Convierte las fuentes TTF que usa el CSS a WOFF2 y la imagen
   sudadera.jpg a WebP. Idempotente: si el destino ya existe y es
   más nuevo que el origen, salta.

   Uso: node scripts/convert-assets.js
*/

const fs    = require('fs');
const path  = require('path');
const ttf2woff2 = require('ttf2woff2');
const sharp    = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const FUENTES_TTF = [
    'Fuentes/The Foregen Regular.ttf',
    'Fuentes/Quicksand/Quicksand-VariableFont_wght.ttf',
    'Fuentes/josefin-sans/JosefinSans-Bold.ttf'
];
const IMAGENES_WEBP = [
    { src: 'imagenes/sudadera.jpg', dst: 'imagenes/sudadera.webp', quality: 78 }
];

function necesitaActualizar(src, dst) {
    if (!fs.existsSync(dst)) return true;
    return fs.statSync(src).mtimeMs > fs.statSync(dst).mtimeMs;
}

async function convertirFuentes() {
    for (const rel of FUENTES_TTF) {
        const src = path.join(ROOT, rel);
        const dst = src.replace(/\.ttf$/i, '.woff2');
        if (!fs.existsSync(src)) {
            console.warn(`[fuente] ORIGEN NO EXISTE: ${rel}`);
            continue;
        }
        if (!necesitaActualizar(src, dst)) {
            console.log(`[fuente] ya actualizado: ${path.basename(dst)}`);
            continue;
        }
        const buf = fs.readFileSync(src);
        const woff2 = ttf2woff2(buf);
        fs.writeFileSync(dst, woff2);
        const ratio = ((1 - woff2.length / buf.length) * 100).toFixed(1);
        console.log(`[fuente] ${path.basename(src)} -> ${path.basename(dst)}  (-${ratio}%)`);
    }
}

async function convertirImagenes() {
    for (const { src: relSrc, dst: relDst, quality } of IMAGENES_WEBP) {
        const src = path.join(ROOT, relSrc);
        const dst = path.join(ROOT, relDst);
        if (!fs.existsSync(src)) {
            console.warn(`[imagen] ORIGEN NO EXISTE: ${relSrc}`);
            continue;
        }
        if (!necesitaActualizar(src, dst)) {
            console.log(`[imagen] ya actualizado: ${path.basename(dst)}`);
            continue;
        }
        await sharp(src).webp({ quality }).toFile(dst);
        const tamSrc = fs.statSync(src).size;
        const tamDst = fs.statSync(dst).size;
        const ratio = ((1 - tamDst / tamSrc) * 100).toFixed(1);
        console.log(`[imagen] ${path.basename(src)} -> ${path.basename(dst)}  (-${ratio}%)`);
    }
}

(async () => {
    await convertirFuentes();
    await convertirImagenes();
})();

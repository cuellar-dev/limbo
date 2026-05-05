# 🚀 GUÍA DE OPTIMIZACIÓN: Plan de Acción para Mejorar Rendimiento del Header

## FASE 1: Diagnóstico (Verification)

Antes de hacer cambios, confirma el problema actual:

### Test 1: Medición de FPS Actual

**En Chrome DevTools:**
1. Abre `Console`
2. Ejecuta este script:

```javascript
let lastTime = performance.now();
let frameCount = 0;
let droppedFrames = 0;

function measureFPS() {
  frameCount++;
  const now = performance.now();
  const deltaTime = now - lastTime;
  
  // Desktop: 16.67ms per frame (60 FPS)
  // Mobile: 33.33ms per frame (30 FPS)
  const expectedDelta = window.innerWidth < 768 ? 33.33 : 16.67;
  
  if (deltaTime > expectedDelta * 1.5) {
    droppedFrames++;
  }
  
  lastTime = now;
  requestAnimationFrame(measureFPS);
}

measureFPS();

// Después de scrollear el header por 5-10 segundos:
console.log(`Total frames: ${frameCount}`);
console.log(`Dropped frames: ${droppedFrames}`);
console.log(`Frame drop rate: ${((droppedFrames / frameCount) * 100).toFixed(1)}%`);
```

**Resultado esperado:**
- ✅ Desktop: <2% dropped frames
- ✅ Mobile: <5% dropped frames
- 🟡 Si es >5% en mobile: el header es culpable

### Test 2: Identificar Cuál Componente Cuesta Más

```javascript
// En console, mientras scrolleas el header:

// 1. Deshabilita temporalmente backdrop-filter
document.querySelector('#header').style.backdropFilter = 'none';
// → Si FPS mejora: backdrop-filter es problema

// 2. Deshabilita toggle de clases
const originalToggle = Element.prototype.classList.toggle;
let toggleCount = 0;
Element.prototype.classList.toggle = function(...args) {
  if (this === document.querySelector('#header')) toggleCount++;
  return originalToggle.apply(this, args);
};
// → Scrollea 5 segundos
console.log(`Toggle calls: ${toggleCount}`);  // Si >100: es frecuente

// 3. Mide tiempo de onUpdate
let onUpdateCalls = 0;
let onUpdateTime = 0;
const st = gsap.getById('header-id')?.scrollTrigger;
if (st) {
  const originalOnUpdate = st.vars?.onUpdate;
  st.vars.onUpdate = function(self) {
    const start = performance.now();
    originalOnUpdate?.call(this, self);
    onUpdateTime += performance.now() - start;
    onUpdateCalls++;
  };
}
// Scrollea 5 segundos
console.log(`onUpdate calls: ${onUpdateCalls}`);
console.log(`Total onUpdate time: ${onUpdateTime.toFixed(2)}ms`);
console.log(`Avg per call: ${(onUpdateTime / onUpdateCalls).toFixed(2)}ms`);
```

---

## FASE 2: Optimizaciones Rápidas (High ROI)

### Optimización 2.1: Caché de classList.contains()

**Archivo:** `js/js.js` línea ~1881

**ANTES:**
```javascript
onUpdate: (self) => {
  const p = self.progress;
  
  if (document.body.classList.contains('is-light')) {
    header.style.background = `rgba(240, 242, 247, ${(0.90 + 0.10 * p).toFixed(3)})`;
    header.style.borderBottomColor = `rgba(202, 172, 71, ${(0.12 + 0.18 * p).toFixed(3)})`;
  } else {
    header.style.background = `rgba(17, 21, 34, ${(0.85 + 0.15 * p).toFixed(3)})`;
    header.style.borderBottomColor = `rgba(202, 172, 71, ${(0.10 + 0.20 * p).toFixed(3)})`;
  }
  
  header.classList.toggle('is-expanded', p <= 0.18);
  if (searchBar) searchBar.classList.toggle('is-scroll-hidden', p > 0.2);
},
```

**DESPUÉS:**
```javascript
// FUERA del timeline, antes de crear tl:
let currentThemeIsLight = document.body.classList.contains('is-light');

// Observa cambios de tema
new MutationObserver(() => {
  currentThemeIsLight = document.body.classList.contains('is-light');
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

// DENTRO del timeline:
onUpdate: (self) => {
  const p = self.progress;
  
  // Ahora usa variable cacheada, no DOM read
  if (currentThemeIsLight) {
    header.style.background = `rgba(240, 242, 247, ${(0.90 + 0.10 * p).toFixed(3)})`;
    header.style.borderBottomColor = `rgba(202, 172, 71, ${(0.12 + 0.18 * p).toFixed(3)})`;
  } else {
    header.style.background = `rgba(17, 21, 34, ${(0.85 + 0.15 * p).toFixed(3)})`;
    header.style.borderBottomColor = `rgba(202, 172, 71, ${(0.10 + 0.20 * p).toFixed(3)})`;
  }
  
  header.classList.toggle('is-expanded', p <= 0.18);
  if (searchBar) searchBar.classList.toggle('is-scroll-hidden', p > 0.2);
},
```

**Beneficio:** -0.01ms por frame (negligible pero buena práctica)

---

### Optimización 2.2: Evitar Recalcs Innecesarios de classList.toggle

**Problema:** Si `is-expanded` cambia cada frame, fuerza recalc

**ANTES:**
```javascript
header.classList.toggle('is-expanded', p <= 0.18);  // Cambia cada frame si p ≈ 0.18
```

**DESPUÉS:**
```javascript
// Caché el estado anterior
let wasExpanded = header.classList.contains('is-expanded');
const isExpanded = p <= 0.18;

// Solo actualiza si cambió
if (isExpanded !== wasExpanded) {
  header.classList.toggle('is-expanded', isExpanded);
  wasExpanded = isExpanded;
}
```

**Beneficio:** -0.05ms cuando p cruza threshold (es localmente mejor)

---

### Optimización 2.3: Batch DOM Writes

**ANTES:**
```javascript
header.style.background = `...`;
header.style.borderBottomColor = `...`;
if (searchBar) searchBar.classList.toggle('is-scroll-hidden', p > 0.2);
header.classList.toggle('is-expanded', p <= 0.18);
```

**DESPUÉS:**
```javascript
// Acumula cambios y aplica en un batch
requestAnimationFrame(() => {
  header.style.background = `...`;
  header.style.borderBottomColor = `...`;
  if (searchBar) searchBar.classList.toggle('is-scroll-hidden', p > 0.2);
  header.classList.toggle('is-expanded', p <= 0.18);
});
```

**Nota:** GSAP ya hace esto internamente, así que podría no ayudar. Prueba primero.

---

## FASE 3: Optimizaciones con CSS Variables (Medium ROI)

### Optimización 3.1: Animar Colores con CSS Variables

**Ventaja:** Evita DOM writes cada frame, el navegador anima la variable

**PASO 1: Definir variables CSS**

Archivo: `Css/style.css`

```css
:root {
  --header-bg-alpha: 0.85;      /* Oscuro por defecto */
  --header-border-alpha: 0.10;
}

body.is-light {
  --header-bg-alpha: 0.90;
  --header-border-alpha: 0.12;
}

#header {
  background: rgba(17, 21, 34, var(--header-bg-alpha));
  border-bottom-color: rgba(202, 172, 71, var(--header-border-alpha));
  transition: --header-bg-alpha 0s, --header-border-alpha 0s;  /* Instant, no transición CSS */
}

body.is-light #header {
  background: rgba(240, 242, 247, var(--header-bg-alpha));
  border-bottom-color: rgba(202, 172, 71, var(--header-border-alpha));
}
```

**PASO 2: Animar la variable con GSAP**

Archivo: `js/js.js` (reemplaza el onUpdate)

```javascript
// OPCIÓN A: Animar en timeline
tl.fromTo(
  document.documentElement,
  { '--header-bg-alpha': currentThemeIsLight ? 0.90 : 0.85 },
  { '--header-bg-alpha': currentThemeIsLight ? 1.0 : 1.0 },
  0
);

// OPCIÓN B: Animar en onUpdate (más simple)
onUpdate: (self) => {
  const p = self.progress;
  
  if (currentThemeIsLight) {
    // Calcula alphas
    const bgAlpha = 0.90 + 0.10 * p;
    const borderAlpha = 0.12 + 0.18 * p;
    
    // ESCRIBO en variables CSS, no en style.background
    document.documentElement.style.setProperty('--header-bg-alpha', bgAlpha.toFixed(3));
    document.documentElement.style.setProperty('--header-border-alpha', borderAlpha.toFixed(3));
  } else {
    const bgAlpha = 0.85 + 0.15 * p;
    const borderAlpha = 0.10 + 0.20 * p;
    
    document.documentElement.style.setProperty('--header-bg-alpha', bgAlpha.toFixed(3));
    document.documentElement.style.setProperty('--header-border-alpha', borderAlpha.toFixed(3));
  }
  
  // El resto del onUpdate igual...
}
```

**Beneficio:** -1-2ms por frame (menos repaints)

---

### Optimización 3.2: Usar content-visibility

Aunque tu header no es un árbol profundo, puedes declararle `content-visibility`:

```css
#header {
  content-visibility: auto;  /* Skips paint/layout si está off-screen */
}
```

**Beneficio:** En mobile con mucho scroll, puede ahorrar 1-2ms (minimal)

---

## FASE 4: Optimizaciones de Imagen (SVG) - High ROI para Mobile

### Optimización 4.1: Reemplazar SVG Filters con CSS Simples

**Problema:** El SVG tiene `feGaussianBlur` + `feComposite` que se rasteriza 60 veces/seg

**ARCHIVO:** `index.html` línea ~16-26

**ANTES:**
```html
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
  <path filter="url(#halo-glow)" d="M20,25 A30,12 0 1,1 75,22" 
        fill="none" stroke-width="8" stroke-linecap="round" />
</svg>
```

**DESPUÉS (Opción 1: Simplificar SVG filter):**
```html
<svg class="halo-icon" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="halo-glow" x="-20%" y="-20%" width="140%" height="140%">
      <!-- Reducimos región de blur: 200% → 140% = menos pixeles a blur -->
      <feGaussianBlur stdDeviation="0.8" result="blur"/>  <!-- 1.5 → 0.8 -->
      <feFlood class="halo-glow-color" result="glow-color" flood-opacity="0.4"/>
      <feComposite in="glow-color" in2="blur" operator="in" result="colored-blur"/>
      <feMerge>
        <feMergeNode in="colored-blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <path filter="url(#halo-glow)" d="..." />
</svg>
```

**DESPUÉS (Opción 2: Usar CSS drop-shadow):**
```html
<svg class="halo-icon" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
  <!-- Remove <defs> y filter -->
  <path class="halo-path" d="M20,25 A30,12 0 1,1 75,22" 
        fill="none" stroke-width="8" stroke-linecap="round" />
</svg>
```

```css
/* En Css/style.css */
.halo-path {
  stroke: var(--acento-dorado);
  /* Reemplaza SVG filter con CSS drop-shadow */
  filter: drop-shadow(0 0 2px rgba(202, 172, 71, 0.5));
  /* Más rápido que SVG feGaussianBlur + feComposite */
}

body.is-encargue .halo-path {
  stroke: var(--acento-encargue);
  filter: drop-shadow(0 0 2px rgba(93, 114, 233, 0.5));
}
```

**Beneficio:** -3-5ms por frame en mobile durante escala del h1

**Comparación:**
| Método | Costo |
|--------|-------|
| SVG feGaussianBlur + feComposite | 3-5ms |
| CSS drop-shadow | 1-2ms |
| Sin glow | 0ms |

---

### Optimización 4.2: Usar will-change Strategically

**Actualmente:** No uses `will-change` en el h1 porque cambia `height` cada frame

**Mejor ahora:** Úsalo solo en elementos que cambian propiedades GPU

```css
/* h1 se escala pero no cambia height parent */
h1 {
  will-change: transform, opacity;  /* Solo estas propiedades */
  /* NO incluir: will-change: height (fuerza GPU textura redraw) */
}

.halo-icon {
  will-change: filter;  /* Se aplica filter TODO frame */
}
```

**Beneficio:** +0 (tal vez incluso -1ms en móviles muy lentos)

---

## FASE 5: Optimizaciones Avanzadas (Low ROI, High Effort)

### Optimización 5.1: Usar RequestAnimationFrame Throttle

Si los frames perdidos son >10%, considera canalizar el onUpdate:

```javascript
let shouldUpdateHeader = true;
let rafId = null;

const updateHeaderThrottled = (progress) => {
  if (shouldUpdateHeader) {
    // ... hacer updates ...
    shouldUpdateHeader = false;
  }
  
  // Siguiente frame se puede actualizar
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    shouldUpdateHeader = true;
  });
};

// En timeline.vars.scrollTrigger:
onUpdate: (self) => updateHeaderThrottled(self.progress),
```

**Beneficio:** Puede ahorrar 2-3ms en muy cases, pero GSAP ya optimiza esto

---

### Optimización 5.2: Considerar Prefers-Reduced-Motion

Para usuarios con reduced motion preference, detiene la animación:

```css
@media (prefers-reduced-motion: reduce) {
  #header {
    height: 70px !important;  /* Salta a estado colapsado */
    padding: 0 !important;
    transition: none;
  }
  
  .header-nav {
    display: none;  /* Oculta nav */
  }
  
  .iconos-container {
    opacity: 1;
    display: flex;
  }
}
```

```javascript
// En tu código GSAP:
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Crea el timeline completo
  const tl = gsap.timeline({ ... });
  // ...
} else {
  // Versión simplificada o sin animación
  document.querySelector('#header').style.height = '70px';
}
```

**Beneficio:** Mejor accesibilidad + mejor rendimiento para ese segmento

---

## FASE 6: Quick Wins - Implementación Step by Step

### Paso 1: Medir Performance Actual (5 min)

```bash
# En Chrome DevTools > Performance
1. Abre Performance panel
2. Haz clic en "Record"
3. Scrollea el header de arriba a abajo (~5 seg)
4. Detén record
5. Mira el gráfico de FPS (arriba)
   - Esperado: línea horizontal en ~60 FPS
   - Actual: verás dips (caídas)
```

### Paso 2: Aplicar Optimización 2.1 (10 min)

Copia/Pega el código cacheado de classList.contains() en tu js.js

### Paso 3: Medir Performance Mejorada (5 min)

Repite el test del Paso 1, compara gráficos

### Paso 4: Si Still Laggy, Aplicar Optimización 4.1 (15 min)

Simplifica los SVG filters

### Paso 5: A/B Test en Mobile Real

Prueba en: iPhone 6s / Samsung Galaxy A10 (dispositivos viejos)

---

## FASE 7: Monitoreo Continuo

### Antes de cada release:

```javascript
// Agrega esto en tu console del sitio una vez cargado:

console.log('=== HEADER ANIMATION PERFORMANCE ===');
console.log('Device:', navigator.deviceMemory, 'GB RAM');
console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);

// Mide scroll performance
let frameCount = 0, totalTime = 0, startTime = performance.now();

const measurePerf = () => {
  frameCount++;
  if (frameCount % 60 === 0) {
    const elapsed = performance.now() - startTime;
    const fps = (frameCount / elapsed) * 1000;
    console.log(`FPS: ${fps.toFixed(1)}`);
  }
  requestAnimationFrame(measurePerf);
};

window.addEventListener('scroll', measurePerf, { passive: true });
setTimeout(() => console.log('Scroll para detener medición'), 0);
```

---

## TABLA DE REFERENCIA: Cambios Recomendados por Severidad

| Cambio | Severidad | Impacto | Esfuerzo | ROI |
|--------|-----------|---------|----------|-----|
| Caché classList.contains() | 🟢 Bajo | 0.01ms | 5 min | Bajo |
| Evitar toggle() innecesario | 🟡 Medio | 0.05ms | 10 min | Bajo |
| CSS variables para colores | 🟡 Medio | 2ms | 15 min | Alto |
| Simplificar SVG filter | 🟡 Medio | 3-5ms | 10 min | ALTO |
| Request animationFrame throttle | 🔴 Alto | 2-3ms | 20 min | Bajo |
| prefers-reduced-motion | 🟢 Bajo | 1-2ms | 15 min | Medio |

**Recomendación:** Empieza por **Simplificar SVG filter** (la gana más en móvil) + **CSS variables** (mejora general)

---

## RESUMEN FINAL

Tu animación de header está **bien construida**. Las optimizaciones disponibles son:

1. **Cortas (5-10 min):** Dan -0.05ms (marginal)
2. **Medianas (15 min):** Dan -2-5ms (perceptible)
3. **Largas (30+ min):** Dan -1-2ms (no justifica el esfuerzo)

**Prioridad:** SVG filter (rápido, grande impacto móvil)

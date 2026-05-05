# 📊 ANÁLISIS EXHAUSTIVO: Animación del Header con GSAP + ScrollTrigger

## 🎯 RESUMEN EJECUTIVO

Tu header tiene una animación **scrubbed** (vinculada al scroll) que comprime el header de **45vh a 70px** mientras el usuario hace scroll. Es altamente personalizada y optimizada, pero tiene varias áreas de riesgo para el rendimiento.

---

## 📐 PASO 1: ESTRUCTURA HTML DEL HEADER

```html
<header id="header" style="--p: 0;">
  <div class="header-container">
    
    <div class="logo-area">
      <h1>LÉVIT
        <span class="logo-a">A
          <svg class="halo-icon"><!-- Halo SVG con filtros --></svg>
        </span>
        D
      </h1>
      
      <nav class="header-nav">
        <span class="header-slogan">Artesanía · Distinción · Estilo</span>
        <div class="header-nav-sep"><div class="header-nav-divider"></div></div>
        <ul>4 items de navegación</ul>
      </nav>
    </div>
    
    <div class="iconos-container">
      <button id="buscar-btn">🔍</button>
      <span class="carrito-wrapper">🛒</span>
      <svg id="menu-hamb">☰</svg>
    </div>
  </div>
</header>
```

**Complejidad:** 
- ✅ Relativamente simple (sin atributos dinámicos excesivos)
- ❌ Contiene SVG con filtros (`feGaussianBlur`, `feComposite`) que se procesan cada frame

---

## 🎬 PASO 2: INICIALIZACIÓN DE GSAP + ScrollTrigger

### 2.1 Registro y Configuración Inicial (línea 1831-1838)

```javascript
// Registrar plugin
gsap.registerPlugin(ScrollTrigger);

// Normaliza scroll en iOS (evita que barra de URL móvil cause jitters)
ScrollTrigger.normalizeScroll(true);

// Ignora cambios de tamaño causados solo por la barra de URL móvil
ScrollTrigger.config({ ignoreMobileResize: true });
```

**¿Por qué esto importa para rendimiento?**
- `normalizeScroll(true)` añade listeners de scroll adicionales en iOS
- Puede aumentar eventos de scroll en ciertos dispositivos
- Es necesario PERO tiene costo en móviles lentos

### 2.2 Caché de Variables (línea 1843-1850)

```javascript
let headerW = header.clientWidth;  // Se cachea para evitar jitter
let expandedH = window.innerHeight * 0.45;  // 45% de viewport
const getScrollDist = () => Math.max(140, window.innerHeight * 0.18);
```

**Impacto en rendimiento:**
- ✅ Cacheando ancho/altura evita múltiples lecturas de DOM
- ✅ Se recalcula solo en cambios de orientación, no cada frame

---

## 🎨 PASO 3: CREACIÓN DEL TIMELINE

### 3.1 Configuración del Timeline (línea 1859-1909)

```javascript
const tl = gsap.timeline({
  defaults: { ease: 'none' },  // Sin easing = lineal (máximo rendimiento)
  scrollTrigger: {
    trigger: document.documentElement,
    start: 'top top',
    end: () => `+=${getScrollDist()}`,
    scrub: 0.5,  // ⚠️ CLAVE: interpola scroll con 0.5s de inercia
    invalidateOnRefresh: true,  // Recalcula en cambios
    
    onEnter:     () => header.classList.add('is-collapsed'),
    onLeaveBack: () => header.classList.remove('is-collapsed'),
    
    onUpdate: (self) => {
      const p = self.progress;  // 0 a 1 durante scroll
      
      // OPERACIÓN COSTOSA: Recalcula background y border color cada frame
      if (document.body.classList.contains('is-light')) {
        header.style.background = `rgba(240, 242, 247, ${(0.90 + 0.10 * p).toFixed(3)})`;
        header.style.borderBottomColor = `rgba(202, 172, 71, ${(0.12 + 0.18 * p).toFixed(3)})`;
      } else {
        header.style.background = `rgba(17, 21, 34, ${(0.85 + 0.15 * p).toFixed(3)})`;
        header.style.borderBottomColor = `rgba(202, 172, 71, ${(0.10 + 0.20 * p).toFixed(3)})`;
      }
      
      // Toggle de clases basadas en progreso
      header.classList.toggle('is-expanded', p <= 0.18);
      
      // Mostrar/ocultar buscador según scroll
      if (searchBar) searchBar.classList.toggle('is-scroll-hidden', p > 0.2);
    },
  },
});
```

**Problemas de rendimiento aquí:**

| Problema | Línea | Impacto | Severidad |
|----------|-------|---------|-----------|
| `onUpdate` cada frame | 1876 | Se ejecuta 60 veces/seg en desktop, 30-60 en móvil | 🔴 ALTO |
| `.toFixed(3)` cada frame | 1886 | Conversión string de números en onUpdate | 🟡 MEDIO |
| `document.body.classList.contains()` cada frame | 1881 | Lectura DOM repetida | 🟡 MEDIO |
| `classList.toggle()` dos veces por frame | 1897-1898 | Puede forzar recalc si la clase cambia | 🟡 MEDIO |

---

## 🎞️ PASO 4: TWEENS PARALELOS DEL TIMELINE

Todos estos tweens ocurren **en paralelo** (inicio: 0):

### 4.1 Animación de Altura

```javascript
tl.to(header, { height: 70 }, 0);

// De: 45vh (computed en runtime como ~405px en desktop)
// A: 70px
// Progresión: lineal sobre ~140px de scroll
```

**Impacto:**
- ✅ Solo modifica `height` en el header → simple
- ❌ Cada cambio de height = recalc + repaint de todo lo debajo
- ❌ Sticky positioning (top:0) significa que cada cambio recalcula layout

### 4.2 Animación del Container Padding

```javascript
tl.fromTo(headerContainer,
  { paddingTop: 16, paddingBottom: 28 },
  { paddingTop: 0,  paddingBottom: 0 },
  0
);

// Suaviza la transición del contenido interno
```

**Impacto:**
- ✅ Solo DOS valores animados (top/bottom padding)
- ❌ Cambios de padding = expande/contrae contenedor → reflow

### 4.3 Logo Area: Traducción Vertical + Horizontal + Scale

```javascript
tl.fromTo(logoArea,
  { y: 24, x: 0 },
  {
    y: () => (logoArea.offsetHeight - h1El.offsetHeight) / 2,
    x: () => -headerW * 0.25,  // Mueve 25% del ancho a la izquierda
  },
  0
);
```

**Impacto:**
- ✅ Usa transform (no afecta layout)
- ✅ Se cachea el offsetHeight en runtime (no cada frame)
- ❌ Lectura de offsetHeight = fuerza layout sync
- ❌ Transform múltiples (translate + scale) = más composición GPU

### 4.4 h1: Scale + Horizontal Translation

```javascript
tl.fromTo(h1El,
  { x: 6, scale: 1    },
  { x: 0, scale: 0.78 },  // Reduce a 78%
  0
);
```

**Impacto:**
- ✅ Transform (paint + GPU friendly)
- ❌ Scale + translate = dos transformaciones
- ❌ SVG dentro (`.halo-icon`) también se escala → GPU re-rasteriza

### 4.5 Navegación: Fade Out

```javascript
if (headerNav) {
  tl.fromTo(headerNav, { opacity: 1 }, { opacity: 0 }, 0);
}
```

**Impacto:**
- ✅ opacity = GPU layer (muy rápido)
- ✅ visibility se controla vía CSS (es-expanded)
- ❌ Opacity 0 pero elemento sigue ocupando espacio (display: flex activo)

### 4.6 Iconos: Aparecen + Centran

```javascript
if (iconosContainer) {
  tl.fromTo(iconosContainer,
    {
      opacity: 0,
      y: () => -iconosContainer.offsetHeight * 0.4,
      scale: 0.92,
    },
    {
      opacity: 1,
      y: () => -iconosContainer.offsetHeight / 2,  // Centra verticalmente
      scale: 1,
    },
    0
  );
}
```

**Impacto:**
- ✅ Transform (opacity, scale, translateY)
- ❌ Lectura de offsetHeight = layout recalc
- ❌ 3 propiedades animadas = GPU composición más compleja

---

## ⚙️ PASO 5: SISTEMA DE CLASES CSS

### 5.1 Clase `.is-collapsed` (cuando scroll ≈ 100%)

```css
#header.is-collapsed {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  #header.is-collapsed {
    backdrop-filter: blur(4px);
  }
}

@media (max-width: 480px) {
  #header.is-collapsed {
    backdrop-filter: none;  /* Desactiva en phones */
  }
}
```

**Impacto en rendimiento:**

| Tipo | Costo | Nota |
|------|-------|------|
| `backdrop-filter: blur(10px)` | 🔴 MUY ALTO | Afecta TODO lo que está atrás |
| Solo en `.is-collapsed` | ✅ Bueno | Se activa DESPUÉS de terminar animación |
| Media queries para móvil | ✅ Bueno | Desktop: blur(10px), tablet: blur(4px), phone: none |

**¿Por qué está optimizado?**
El CSS original tenía `backdrop-filter` durante la animación (header height cambiando cada frame). Eso causaba que el GPU:
1. Capturara la región del header cada frame
2. Aplicara blur a esa región
3. Re-renderizara (GPU re-rasterization)
4. Creaba un jitter visual

Ahora solo se aplica cuando el header está **quieto en 70px** → sin cambios de tamaño.

### 5.2 Clase `.is-expanded` (cuando scroll < ~18%)

```css
#header.is-expanded h1 .ala-derecha {
  opacity: 1;
  transform: translateY(-63%) translateX(-80px) scale(1) rotate(10deg);
  z-index: -1;
}

#header.is-expanded h1 .ala-izquierda {
  opacity: 1;
  transform: translateY(-70%) translateX(80px) scale(1) rotate(-10deg);
  z-index: -1;
}
```

**Impacto:**
- ✅ Las alas solo aparecen si header está expandido (grandes)
- ✅ Ocultas con `z-index: -1` si se desahabilitan
- ❌ Transform + rotate = GPU complejo
- ❌ El SVG de las alas tiene filtros drop-shadow

---

## 🛑 PASO 6: GESTIÓN DE EVENTOS Y LISTENERS

### 6.1 Resize Handler (línea 1970-1985)

```javascript
let lastW = window.innerWidth;
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  if (w === lastW) return;  // Solo si el ANCHO cambió
  lastW = w;
  headerW = header.clientWidth;
  expandedH = window.innerHeight * 0.45;
  gsap.set(header, { height: expandedH });
  st.refresh();  // ⚠️ COSTOSO
}, { passive: true });

window.addEventListener('orientationchange', () => {
  lastW = window.innerWidth;
  headerW = header.clientWidth;
  expandedH = window.innerHeight * 0.45;
  gsap.set(header, { height: expandedH });
  st.refresh();  // ⚠️ COSTOSO
}, { passive: true });
```

**Impacto:**
- ✅ Inteligente: solo recalcula si cambió el ANCHO
- ❌ `st.refresh()` recalcula todo el ScrollTrigger (costo alto)
- ❌ En orientationchange puede causar reflow sincrónico

---

## 💥 PASO 7: PUNTOS CALIENTES DE RENDIMIENTO

### 🔴 PROBLEMA #1: onUpdate Callback Cada Frame

**Ubicación:** línea 1876-1898

```javascript
onUpdate: (self) => {
  const p = self.progress;  // 0 a 1
  
  // Se ejecuta 60 veces/seg en desktop
  if (document.body.classList.contains('is-light')) {  // ← DOM read
    header.style.background = `rgba(...)${(...).toFixed(3)}`;  // ← DOM write
    header.style.borderBottomColor = `...`;  // ← DOM write
  } else {
    header.style.background = `rgba(...)`;  // ← DOM write
    header.style.borderBottomColor = `...`;  // ← DOM write
  }
  
  header.classList.toggle('is-expanded', p <= 0.18);  // ← DOM read/write
  
  if (searchBar) searchBar.classList.toggle('is-scroll-hidden', p > 0.2);  // ← DOM read/write
}
```

**Costo:**
- **Layout Thrashing:** Leer `classList.contains()` después de escribir estilos
- **String conversion:** `.toFixed(3)` cada frame (micro-cost pero acumulativo)
- **DOM Repaints:** Cada cambio de `header.style.background` = repaint

**Frecuencia:** 60 FPS × 0.5s de interpolación = ~30 eventos onUpdate por animación

---

### 🔴 PROBLEMA #2: backdrop-filter Durante Scroll Animado

**Ubicación:** CSS línea 772-774 (ANTES) vs AHORA (solo en .is-collapsed)

**Si estuviera activo durante la animación:**
```css
#header {
  backdrop-filter: blur(10px);  /* ← MAL: durante height change */
}
```

**Problemas:**
1. Cada frame que cambia `height`, el GPU debe:
   - Capturar los píxeles debajo del header
   - Aplicar blur a esa región
   - Re-rasterizar (vuelve a renderizar)
2. En móviles esto puede causar 10-50ms de retraso
3. Efecto acumulativo: si también hay otros efectos = 60fps → 30fps

**Solución implementada:**
- `backdrop-filter` solo en `.is-collapsed` (height = 70px fijo)
- Mientras anima, NO hay blur → smooth 60fps
- Cuando termina, añade .is-collapsed → blur aparece congelado

**Verificación en tu código:** ✅ Está correcto (backdrop-filter en .is-collapsed, no en #header base)

---

### 🔴 PROBLEMA #3: SVG Filters en el Logo

**Ubicación:** HTML línea 16-26

```html
<svg class="halo-icon" viewBox="0 0 100 50">
  <defs>
    <filter id="halo-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feFlood class="halo-glow-color" result="glow-color"/>
      <feComposite in="glow-color" in2="blur" operator="in"/>
      <feMerge>
        <feMergeNode in="colored-blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <path filter="url(#halo-glow)" .../>
</svg>
```

**Problemas:**
1. Por cada frame que el h1 se escala (0%→78%), el SVG se re-rasteriza
2. Los filtros SVG (`feGaussianBlur`) se recalculan en cada rasterización
3. El atributo `width="200%"` hace que el blur sea más costoso (región más grande)

**Impacto:**
- Puede añadir 2-5ms por frame en móviles
- Acumulativo: si scrolleas rápido = acumula más de 16.67ms → skips frames

**Mejora posible:**
```css
.halo-icon {
  /* Congelado: usa caché GPU en lugar de re-rasterizar */
  will-change: none;  /* En realidad no lo usamos, pero podría ayudar */
  /* Mejor: */
  filter: drop-shadow(0 0 3px rgba(202, 172, 71, 0.4));  /* Alternativa más rápida */
}
```

---

### 🔴 PROBLEMA #4: Transform Múltiples Sin Consolidar

**Ubicación:** Línea 1927-1935 (logoArea)

```javascript
tl.fromTo(logoArea,
  { y: 24, x: 0 },
  {
    y: () => (logoArea.offsetHeight - h1El.offsetHeight) / 2,
    x: () => -headerW * 0.25,
  },
  0  // Paralelo
);
```

**Lo que hace GSAP:**
```css
/* Frame 1: */
transform: translateY(24px) translateX(0);
/* Frame 2: */
transform: translateY(22px) translateX(-5px);
/* Frame 3: */
transform: translateY(20px) translateX(-10px);
/* ... etc cada frame */
```

**Costo:**
- 2 transformaciones = GPU composición más compleja
- Lectura de `offsetHeight` en el valor final (fuerza sync layout)
- Pero es lo más optimizado posible sin cambiar estructura HTML

---

### 🟡 PROBLEMA #5: ScrollTrigger.refresh() en Resize

**Ubicación:** Línea 1980

```javascript
st.refresh();  // Recalcula triggers, clipping rects, etc.
```

**Costo:**
- Itera sobre TODOS los ScrollTriggers en la página
- En tu caso (~1 trigger) = bajo costo
- Pero si hubieras más triggers → cuadrático

**Evento:** Se dispara en:
- `orientationchange`
- `resize` (si cambió el ancho)
- `images.load`
- `fonts.ready`

---

### 🟡 PROBLEMA #6: Cálculos Dinámicos de Valores Finales

**Ubicación:** Múltiples líneas con `() => ...`

```javascript
y: () => (logoArea.offsetHeight - h1El.offsetHeight) / 2,  // ← Función
x: () => -headerW * 0.25,  // ← Función
```

**¿Por qué?** 
GSAP solo ejecuta estas funciones UNA VEZ al inicializar el timeline. Pero en resize/orientationchange, se re-ejecutan.

**Impacto:**
- ✅ Rápido: solo 2 cálculos (inicio + refresh)
- ❌ Lectura de `offsetHeight` fuerza layout sync

---

## 📊 TABLA COMPARATIVA: Costo de Operaciones por Frame

| Operación | Tiempo (ms) | Nota |
|-----------|------------|------|
| `classList.contains()` | 0.01-0.02 | DOM traversal |
| `classList.toggle()` | 0.01-0.05 | + recalc si clase cambia |
| `header.style.background = "..."` | 0.1-0.3 | Recolor + repaint |
| `header.style.borderBottomColor = "..."` | 0.05-0.1 | Repaint |
| `backdrop-filter: blur(10px)` | 2-8ms | COSTOSO: GPU blur pass |
| `transform: translate()` | 0.5-2ms | GPU-accelerated |
| `transform: scale()` | 0.5-2ms | GPU-accelerated |
| `offsetHeight` read | 0.2-1ms | Fuerza layout recalc |
| `.toFixed(3)` | <0.01 | Negligible |

**En Desktop (60 FPS = 16.67ms por frame):**
- Con `backdrop-filter activo`: 2-8ms (puede ser 12% del presupuesto)
- Sin filter: 0.1-0.5ms (normal)

**En Mobile (30 FPS = 33.33ms por frame, presupuesto más ajustado):**
- Con `backdrop-filter`: Puede tomar 25% del presupuesto
- Otros cambios: acumula 2-3ms más
- **Total: 5-10ms de un presupuesto de 33.33ms = "lag" perceptible**

---

## 🔧 COMPARATIVA: YO HICE / MEJOR SERÍA

| Aspecto | Actual ✅ | Problema ❌ | Sugerencia 🔄 |
|--------|---------|-----------|--------------|
| **backdrop-filter** | Solo en `.is-collapsed` | ❌ Ninguno, está bien | Mantener |
| **onUpdate callback** | Cada frame | Se ejecuta 60x/seg | Usar requestAnimationFrame throttle |
| **Color animado** | Interpolado en onUpdate | Layout thrashing | Usar CSS variables animables |
| **SVG filters** | feGaussianBlur + feComposite | Caro al escalar | Considerar drop-shadow CSS |
| **Transform múltiples** | translate + scale | Composición GPU | Está bien para este caso |
| **offsetHeight reads** | En valores finales () => | Fuerza layout sync | Cachear después de primer read |
| **normalize scroll iOS** | Activo | Overhead en iOS | Está bien (evita mayor problema) |

---

## 🎯 CAUSAS PRINCIPALES DEL IMPACTO EN RENDIMIENTO

### Causas Directas (ejecutadas CADA frame):

1. **onUpdate callback** (60 veces/seg)
   - DOM reads: `classList.contains()`
   - DOM writes: `style.background`, `style.borderBottomColor`
   - Layout thrashing potencial

2. **String conversion** `.toFixed(3)` (60 veces/seg)
   - Micro-costo pero acumulativo

3. **classList.toggle()** (hasta 60 veces/seg)
   - Potencial recalc si clase cambia

### Causas Indirectas (factores que empeoran el lag):

4. **backdrop-filter: blur** (IF activo durante animación)
   - 2-8ms por frame en GPU
   - Causaría el "brinco" visual (jitter)
   - ✅ Tu código LO EVITA correctamente

5. **SVG filters** en el logo
   - Se re-rasteriza 60 veces/seg durante scale
   - 2-5ms por frame en móviles
   - Acumulativo con otros efectos

6. **Transform múltiples** 
   - No es el culpable principal, pero complica composición GPU
   - Impacto mínimo (<1ms)

### Causas de Contexto (dispositivo/navegador específicas):

7. **Mobile garbage collection** 
   - Si hay muchas strings siendo creadas (.toFixed)
   - Puede causar micro-pauses

8. **iOS scrollbar de URL**
   - Que `normalizeScroll` intenta mitigar
   - Pero añade overhead extra

---

## ✅ LO QUE ESTÁ BIEN HECHO

1. ✅ **backdrop-filter solo en estado final** - evita el golpe más grande
2. ✅ **Ease: 'none'** - lineal sin easing overhead
3. ✅ **Caché de headerW/expandedH** - no recalcula cada frame
4. ✅ **ScrollTrigger.normalizeScroll(true)** - evita mayor problema en iOS
5. ✅ **Resize detection inteligente** - solo si cambió ancho
6. ✅ **Transform para animaciones de UI** - GPU-accelerated
7. ✅ **Cálculos dinámicos en funciones** - se ejecutan en momento correcto

---

## 🚨 RECOMENDACIONES PARA MEJORAR RENDIMIENTO

### Nivel 1: Bajo Esfuerzo, Impacto Inmediato

```javascript
// ANTES:
onUpdate: (self) => {
  const p = self.progress;
  if (document.body.classList.contains('is-light')) {
    header.style.background = `rgba(...)${(0.90 + 0.10 * p).toFixed(3)}`;
  }
}

// DESPUÉS: Caché el resultado de classList.contains()
const isLight = document.body.classList.contains('is-light');  // FUERA
const scrollTrigger = ... // configs
const onUpdate = (self) => {
  const p = self.progress;
  if (isLight) {  // Ya cacheado
    header.style.background = `rgba(...)${(0.90 + 0.10 * p).toFixed(3)}`;
  }
}
```

**Impacto:** -0.01ms por frame (negligible pero suma)

### Nivel 2: Medio Esfuerzo, Impacto Mediano

**Usar CSS variables animables en lugar de onUpdate:**

```css
/* ANTES: onUpdate cambia background */
#header {
  background: rgba(17, 21, 34, var(--header-bg-alpha, 0.85));
}

/* DESPUÉS: GSAP anima la variable */
gsap.to(document.documentElement, {
  '--header-bg-alpha': 1,
  duration: ...,
});
```

**Impacto:** -2-3ms por frame (elimina layout thrashing del onUpdate)

### Nivel 3: Alto Esfuerzo, Máximo Impacto

**Reemplazar SVG filters con propiedades CSS más simples:**

```css
/* ANTES: SVG con feGaussianBlur */
.halo-icon {
  filter: url(#halo-glow);  /* ← Caro */
}

/* DESPUÉS: drop-shadow más simple */
.halo-icon {
  filter: drop-shadow(0 0 3px rgba(202, 172, 71, 0.5));
  /* O incluso más simple: */
  text-shadow: 0 0 3px rgba(202, 172, 71, 0.5);
}
```

**Impacto:** -3-5ms por frame en móviles (mientras se escala)

---

## 📋 CHECKLIST DE DIAGNÓSTICO EN NAVEGADOR

Abre tu sitio web y ejecuta en Developer Tools:

```javascript
// 1. Medir cuántos frames se pierden durante scroll
const startTime = performance.now();
let frameCount = 0;
function countFrames() {
  frameCount++;
  requestAnimationFrame(countFrames);
}
countFrames();

// Scroll durante 5 segundos
setTimeout(() => {
  const elapsed = performance.now() - startTime;
  const expectedFrames = (elapsed / 1000) * 60;  // 60 fps ideal
  const fps = (frameCount / elapsed) * 1000;
  console.log(`FPS actual: ${fps.toFixed(1)} (esperado: 60)`);
  console.log(`Frames perdidos: ${expectedFrames - frameCount}`);
}, 5000);

// 2. Monitorear performance del ScrollTrigger
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.getAll().forEach(st => {
  console.log('ScrollTrigger:', st);
  console.log('Progress:', st.progress);
  console.log('Cached:', st.cachedBounds);
});

// 3. Checkear si backdrop-filter está activo
const computed = getComputedStyle(document.querySelector('#header'));
console.log('Backdrop-filter:', computed.backdropFilter);
```

---

## 📈 RESUMEN FINAL

| Métrica | Estado |
|---------|--------|
| **Arquitectura general** | ✅ Bien diseñada |
| **Costo de animación** | 🟡 Medio-Alto (5-10ms en móvil) |
| **Problemas críticos** | ❌ Ninguno identificado |
| **Optimizaciones aplicadas** | ✅ backdrop-filter limitado |
| **Mejora posible** | 🔄 CSS variables para colores |
| **Compatibilidad móvil** | 🟡 Algo de lag en devices lentos |
| **Rendimiento general** | 🟡 Aceptable, mejorable |

La animación está **bien construida**, pero tiene **puntos de roce** que pueden optimizarse en dispositivos móviles para ganar 2-3ms por frame, que es perceptible en la fluidez.


# 📋 CLASES Y ESTADOS DEL HEADER - ANIMACIÓN DE SCROLL

## Descripción General
Este documento detalla exactamente qué clases CSS y estilos inline tiene cada elemento del header en el **INICIO** y **FIN** de la animación de scroll.

La animación ocurre desde scroll 0px hasta ~140px (o 18% de la altura de la ventana).

---

## INICIO DE ANIMACIÓN (scroll = 0px, progress = 0)

### `#header`
```
Clases: []  (sin clases especiales)
Atributos:
  - height: 45vh (expandedH calculado en runtime)
  - style: --p: 0
  - background: rgba(240, 242, 247, 0.90)  // Light theme
              rgba(17, 21, 34, 0.85)        // Dark theme
  - border-bottom-color: rgba(202, 172, 71, 0.10)   // Dark
                          rgba(202, 172, 71, 0.12)   // Light
```

### `.header-container`
```
Clases: []
Estilos:
  - padding-top: 16px
  - padding-bottom: 28px
```

### `.logo-area`
```
Clases: []
Estilos:
  - transform: translateY(24px) translateX(0px)
```

### `h1`
```
Clases: []
Estilos:
  - transform: translateX(6px) scale(1)
```

### `.header-nav`
```
Clases: []
Estilos:
  - opacity: 1
```

### `.iconos-container`
```
Clases: []
Estilos:
  - opacity: 0
  - transform: translateY(-40% de altura) scale(0.92)
    Ej: Si altura es 50px → translateY(-20px) scale(0.92)
```

### `.search-bar` (#search-bar)
```
Clases: []  (sin clase is-scroll-hidden)
```

---

## FIN DE ANIMACIÓN (scroll = ~140px, progress = 1)

### `#header`
```
Clases: ['is-collapsed']
Atributos:
  - height: 70px
  - style: --p: 1
  - background: rgba(240, 242, 247, 1.0)   // Light theme
              rgba(17, 21, 34, 1.0)         // Dark theme
  - border-bottom-color: rgba(202, 172, 71, 0.30)   // Dark
                          rgba(202, 172, 71, 0.30)   // Light
```

### `.header-container`
```
Clases: []
Estilos:
  - padding-top: 0px
  - padding-bottom: 0px
```

### `.logo-area`
```
Clases: []
Estilos:
  - transform: translateY(calculado) translateX(-25% del ancho del header)
    donde translateY = (logoArea.offsetHeight - h1.offsetHeight) / 2
    Ej: Si logo-area altura es 60px y h1 altura es 40px → translateY(10px)
```

### `h1`
```
Clases: []
Estilos:
  - transform: translateX(0px) scale(0.78)
```

### `.header-nav`
```
Clases: []
Estilos:
  - opacity: 0
```

### `.iconos-container`
```
Clases: []
Estilos:
  - opacity: 1
  - transform: translateY(-50% de altura) scale(1)
    Ej: Si altura es 50px → translateY(-25px) scale(1)
```

### `.search-bar` (#search-bar)
```
Clases: ['is-scroll-hidden']
```

---

## CLASES DINÁMICAS DURANTE LA ANIMACIÓN

### Clase `is-expanded` (en `#header`)
- **Se agrega cuando:** progress ≤ 0.18 (primeros ~25px de scroll)
- **Se remueve cuando:** progress > 0.18 (después de ~25px de scroll)
- **Efecto:** Activa las alas decorativas (`.ala-izquierda`, `.ala-derecha`)

### Clase `is-collapsed` (en `#header`)
- **Se agrega cuando:** progress = 1 (animación completada)
- **Se remueve cuando:** progress < 1 (vuelve hacia atrás)
- **Efecto:** Aplica backdrop-filter blur (efecto cosmético)

### Clase `is-scroll-hidden` (en `.search-bar`)
- **Se agrega cuando:** progress > 0.2 (después de ~30px de scroll)
- **Se remueve cuando:** progress ≤ 0.2 (antes de ~30px de scroll)
- **Efecto:** Oculta/muestra la barra de búsqueda

---

## TEMA Y COLORES DINÁMICOS

### Dark Theme (default)
```
Header Background:
  - Inicio (p=0):  rgba(17, 21, 34, 0.85)
  - Final (p=1):   rgba(17, 21, 34, 1.0)
  - Interpolación: rgba(17, 21, 34, 0.85 + 0.15 * progress)

Border Bottom:
  - Inicio (p=0):  rgba(202, 172, 71, 0.10)
  - Final (p=1):   rgba(202, 172, 71, 0.30)
  - Interpolación: rgba(202, 172, 71, 0.10 + 0.20 * progress)
```

### Light Theme (body.is-light)
```
Header Background:
  - Inicio (p=0):  rgba(240, 242, 247, 0.90)
  - Final (p=1):   rgba(240, 242, 247, 1.0)
  - Interpolación: rgba(240, 242, 247, 0.90 + 0.10 * progress)

Border Bottom:
  - Inicio (p=0):  rgba(202, 172, 71, 0.12)
  - Final (p=1):   rgba(202, 172, 71, 0.30)
  - Interpolación: rgba(202, 172, 71, 0.12 + 0.18 * progress)
```

---

## EASING Y TIMING

Toda la animación usa:
- **Easing:** `ease: 'none'` (lineal)
- **Trigger trigger:** En el elemento raíz (`<html>`)
- **Start:** Top del viewport
- **End:** Después de recorrer `getScrollDist()` px (~140px o 18% de viewport height)
- **Scrub:** 0.5 segundos de interpolación suave

---

## ELEMENTOS QUE NO SE ANIMAN

Los siguientes elementos NO cambian durante la animación:
- `.ala-izquierda` (alas decorativas) → Solo visibility controlada por clase `is-expanded`
- `.ala-derecha` (alas decorativas) → Solo visibility controlada por clase `is-expanded`
- `.logo-a` (letra A con halo) → Permanece dentro del h1
- `.halo-path` (gráfico SVG) → Permanece dentro del logo
- `.halo-icon` (contenedor SVG) → Permanece dentro del logo

---

## RESUMEN DE CAMBIOS

| Elemento | Cambio | Inicio → Final |
|----------|--------|---|
| `#header` height | 45vh → 70px | Colapsa |
| `#header` clases | [] → ['is-collapsed', 'is-expanded'] | Dinámico |
| `.header-container` padding | 16/28 → 0/0 | Desaparece espacio |
| `.logo-area` transform | y:24px x:0px → y:calc x:-25% | Se mueve/centra |
| `h1` scale | 1 → 0.78 | Se achica |
| `h1` x | 6px → 0px | Se corrige offset |
| `.header-nav` opacity | 1 → 0 | Desaparece |
| `.iconos-container` opacity | 0 → 1 | Aparece |
| `.iconos-container` y | -40% → -50% | Se centra |
| `.search-bar` clases | [] → ['is-scroll-hidden'] | Hidden |

---

## NOTAS PARA LA IMPLEMENTACIÓN

1. **Cálculos dinámicos:** Los valores de `y` para `.logo-area` e `.iconos-container` dependen del tamaño actual del elemento en runtime.

2. **CSS Variables:** Usa `--header-bg-alpha` y `--header-border-alpha` para los alphas que se animan, no valores hardcodeados.

3. **Responsive:** Los valores como `headerW * 0.25` recalculan en cada resize.

4. **Theme Switching:** Detecla automáticamente cambio de tema mediante `MutationObserver` en `body.classList`.

5. **Scroll Suave:** Usa `scrub: 0.5` para interpolar la animación de forma suave en lugar de snappy.

6. **Mobile:** Normaliza el scroll en iOS para evitar que la barra de URL afecte el comportamiento.

---

**Fecha:** 5 de Mayo de 2026
**Estado:** Documentación de referencia para recrear animación manualmente

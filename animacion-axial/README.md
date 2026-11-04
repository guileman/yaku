# Animación interactiva — Turbina axial LH 140 (Yaku Energía)

**Abrir:** doble clic en `index.html` (funciona sin servidor, por `file://`) o subir la carpeta a cualquier hosting.
Todo es local (three.js r187 en `libs/`, sin CDN).

### Por qué hay un build
Chrome/Edge bloquean, en páginas abiertas con doble clic (`file://`, origen `null`), los `<script type="module">`,
el `importmap` y los `fetch` de archivos locales (error CORS). La versión anterior quedaba con «Cargando modelo 3D…»
para siempre. Ahora `index.html` usa solo scripts clásicos generados desde `src/`:

- `js/app.bundle.js` — `src/` + three.js empaquetados (esbuild, IIFE). **No editar a mano.**
- `js/modelo-axial-lh140.js` — `models/axial-lh140.glb` embebido en base64 (`window.YAKU_MODELOS`). **No editar.**

Por `http(s)` se descarga `models/axial-lh140.glb` con progreso real; si falla (404, MIME `.glb` no configurado
en el hosting…) o se abre por `file://`, se usa la copia embebida y se decodifica con `GLTFLoader.parse`.
La carga muestra barra con porcentaje; si falla o tarda más de 60 s aparece un aviso con la causa, una sugerencia y
«Reintentar». Sin WebGL 2 se muestra la imagen fija con la causa (recorrido y calculadora siguen funcionando).

### Regenerar después de cambiar el código o el GLB
Requiere Node.js 18+ (una sola vez `npm install` en esta carpeta):
```
npm install
npm run build        # regenera js/app.bundle.js y js/modelo-*.js
```
Después de cada cambio en `src/` o en `models/` hay que volver a correr `npm run build`.

## Estructura
- `src/engine/` motor reutilizable: `viewer.js` (visor, resaltado, despiece, corte, etiquetas, cámara),
  `model-source.js` (obtiene el GLB por http o embebido), `tour.js` (recorrido por pasos), `physics.js` (P = ρgQHη, tabla de catálogo, triángulo de Euler), `triangle.js` (SVG).
- `src/turbines/axial-lh140.js` datos de la LH 140: piezas, pasos/textos, tabla del folleto, medición, entorno (canal/pileta/caño) y flujo.
- `src/main.js` arma la UI; elige la turbina con `?turbina=axial`.
- `models/axial-lh140.glb` modelo web generado del CAD (fuente del build; también se sirve por http).
- `build.mjs` / `package.json` script de build. `node_modules/` no hace falta subirlo al hosting.

## Regenerar el GLB (desde `CAD\Axial LH 2.2.3.stp`)
```
pip install cadquery-ocp trimesh fast-simplification numpy
python tools/step2glb.py "Axial LH 2.2.3.stp" raw.glb 0.2      # STEP -> glTF (OCCT, mm -> m, Y arriba)
python tools/build_glb.py raw.glb models/axial-lh140.glb       # agrupa piezas, materiales, decimación
npm run build                                                  # vuelve a embeber el GLB
```
`build_glb.py` define el agrupamiento (función `classify`), los materiales y el presupuesto de triángulos por pieza.
Si cambia el ensamble, revisá los nombres de instancia (algunas salen como `=>[0:1:1:xx]`).

## Agregar la Pelton
1. Generar `models/pelton-x1.glb` con el mismo pipeline (adaptar `classify` a sus piezas: rodete, cucharas, inyector/aguja, carcasa, eje, generador).
2. Copiar `src/turbines/axial-lh140.js` como `src/turbines/pelton-x1.js` y cambiar: `PIEZAS`, `GIRATORIAS`, `PASOS`, `SITIO` (tabla/mediciones de la Pelton), `entorno()` (tubería forzada, carcasa), `fuenteModelo` (`pelton-x1`) y `flujo()` (chorro libre → cuchara → descarga). Para el triángulo, usar u = ω·r del rodete y c1 = √(2gH).
3. Registrar en `src/main.js`: `pelton: () => import('./turbines/pelton-x1.js')`, correr `npm run build` y abrir `index.html?turbina=pelton`.

## Pruebas
`python tools/test_app.py` (Playwright + Chromium/SwiftShader; sin argumentos abre `index.html` por `file://`, o pasar una URL http): captura cada paso, prueba sliders, botones, despiece y corte y lista errores de consola.

La carpeta `js/` vieja (`js/main.js`, `js/engine/`, `js/turbines/`) quedó obsoleta: el código está en `src/`. Se puede borrar.

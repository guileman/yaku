# Yaku Energía — sitio comercial: faltantes y dudas

Todo lo que dice "Consultar" en el sitio está listado acá. Los datos técnicos salen de los folletos y de las planillas de ensayo; no se inventó nada.

## 1. Datos que faltan para poder vender

| # | Dato | Dónde aparece hoy |
|---|------|-------------------|
| 1 | **Precio** de LH 140, Pelton Cube 230, accesorios (diversor, inversor, baterías, cañería) y de instalación / estudio de viabilidad | Fichas, comparativa, FAQ ("Consultar") |
| 2 | **Garantía** y servicio posventa (repuestos, rodamientos, etc.) | Fichas ("Consultar") |
| 3 | **Stock / plazo de entrega / envíos** (zonas, costo, embalaje) | Fichas, FAQ |
| 4 | **Formas de pago y facturación** | Contacto (“consultar”) |
| 5 | **Alcance exacto del suministro** del LH 140 (¿incluye cable, soporte Omega, diversor?) y de la Pelton (¿incluye válvulas, mirilla, manómetro, boquillas de qué diámetros?). Los folletos solo dicen que la Pelton se entrega sin rectificador, diversor, resistor, cargador, baterías e inversor | “Qué incluye y qué no” |
| 6 | **Dimensiones de la Pelton Cube 230** (alto × ancho × fondo). Solo hay render, sin cotas | Ficha Pelton ("Consultar") |
| 7 | **Estado de la protección del LH 140**: número de solicitud INPI, si es patente, modelo de utilidad o modelo/diseño industrial y fecha. En el sitio dice "Diseño con protección en trámite" | Ficha LH 140 |
| 8 | **Nombre comercial definitivo** de la Pelton: aparece como "Pelton 230" (folleto), "Pelton Cube 230" (docx/imagen) y "Pelton X1" (carpeta). El sitio usa **Pelton Cube 230** | Todo el sitio |
| 9 | **WhatsApp**: se usó 341-15-6904961 (de los folletos) como +54 9 341 690-4961. Confirmar que es el WhatsApp comercial. Se edita en `js/data.js` → `CONFIG.WHATSAPP` | Formulario, footer |
| 10 | **Email**: se tomó `info@yakuenergia.com` del sitio previo (junto a un teléfono de relleno). Confirmar. Se edita en `js/data.js` → `CONFIG.EMAIL` | Formulario, footer, JSON-LD |
| 11 | **Dominio definitivo** para `canonical`, Open Graph y JSON-LD (puse https://www.yakuenergia.com/, tomado del folleto) | `<head>` de index.html |
| 12 | **Fotos**: instalaciones reales terminadas (con autorización de los clientes), fotos del Pelton Cube fabricado (hoy hay render, corte 3D y un prototipo a campo), foto del ingeniero | Galerías, "Sobre nosotros" |
| 13 | **Más ensayos**: del Pelton solo hay una curva (20 m, boquilla 9 mm, 1,2 L/s); del LH 140 hay 1,0 m y 1,6 m con prototipos. Faltan ensayos de la versión comercial y a otras caídas | Gráficos "Resultados medidos" |
| 14 | **Biografía / trayectoria** para "Sobre Yaku Energía" (el texto actual es mínimo; no se nombra universidad) | Sección Nosotros |
| 15 | **Comparativa de costos solar vs. hidro** del PDF "Ventajas comparativas": tiene precios en pesos sin fecha, por eso no se incluyó. Si se actualiza, se puede sumar | — |
| 16 | **Animaciones**: `animacion-axial/index.html` (el botón ya apunta ahí) y `animacion-pelton/index.html` (hoy "Próximamente"; para activarlo, poner la ruta en `CONFIG.ANIM.pelton`) | Botones "Ver cómo funciona" |

## 2. Inconsistencias detectadas entre documentos (revisar antes de publicar)

1. **Potencia del LH 140**: folleto dice 50–600 W; "LH-140 Instalación.pdf" dice 50–200 W. El sitio usa 50–600 W (coincide con la tabla, máx. 597 W).
2. **Tabla del LH 140 no monótona**: 3 m con 25 L/s = 273 W, menos que 2,5 m con 25 L/s = 288 W; y 2 m con 20 L/s = 125 W, menos que 1,5 m con 20 L/s = 136 W. Además hay mesetas (91, 223, 349 W) sin explicación en el folleto.
3. **Ensayos del LH 140 vs. tabla**: a 1,0 m y ~25 L/s se midieron 59–70 W (tabla: 91 W). A 1,6 m (23,9–29 L/s) se midieron 162–196 W y coincide con la tabla de 1,5 m (178–223 W). El sitio muestra ambas cosas.
4. **Velocidad de trabajo 600–900 rpm** (folleto) vs. planillas: en el ensayo de dic-2020 las rpm calculadas llegan a 5.800 (factor kHz→rpm de 3,38) y en el de ene-2021 son 692–1.007 rpm (factor 2,5). Las rpm de dic-2020 no se publican.
5. **Pelton: dos tablas de potencia distintas**: folleto ("potencia máxima", p. ej. 87 W a 20 m y 1 L/s) vs. "Turbina Pelton revisado.pdf" (77 W; ~13 % menos). El sitio usa la del folleto y lo rotula como "potencia máxima". Además la tabla del revisado tiene un probable error (55 m, 0,5 L/s = "11" W) y una celda "XX".
6. **Ensayo Pelton**: 65 W máx. a 20 m, boquilla 9 mm, 1,2 L/s y 100 m de manguera, contra ≈107 W (folleto) o ≈95 W (revisado) interpolados. El caudal 1,2 L/s figura constante en toda la planilla (¿medido o calculado?).
7. **Pelton, rango**: folleto dice "ideal 30 a 100 m" y "desnivel 5 a 100 m"; las tablas llegan solo a 50 m (folleto) / 60 m (revisado) y a 3 L/s, mientras la ficha declara hasta 5 L/s.
8. **Pelton, potencia máxima**: el documento revisado dice "hasta 1000 W/hora" (unidad incorrecta) y a la vez que arriba de 800 W conviene más de una central; la tabla llega a 603 W (folleto) o 753 W (revisado).
9. **Presión máxima**: "10 kg/cm² (150 PSI)"; 10 kg/cm² equivale a ≈142 PSI.
10. **Tabla de diámetros de boquilla** (documento revisado) da valores a 5 m con 0,5 y 1 L/s donde la tabla de potencia marca "X". No se publicó la tabla de boquillas.
11. **Erratas en folletos**: "PCV" (por PVC), "fibra de virio" (por vidrio), "Diversor/Divertor". Se corrigieron en el sitio. En "Ventajas" se usa "200 Wh" donde corresponde "200 W".
12. **Tensión**: folleto 50–380 V según configuración; "Instalación.pdf" dice que ronda los 300 V. El sitio usa el rango del folleto.
13. Los PDF/formularios de la carpeta de patente contienen DNI/CUIT del titular: **no se usaron** y no conviene publicarlos.

## 3. Cómo se calcularon las eficiencias de referencia (calculadora)

Eficiencia global = potencia eléctrica / (ρ·g·Q·H). Mejor punto de cada ensayo: LH 140 a 1,0 m, ≈28 %; a 1,6 m, ≈48 % (los puntos de poco caudal dan mucho menos: 2–25 %); Pelton (20 m, 1,2 L/s), ≈28 %. Con las tablas de folleto, 37–51 % aprox. La calculadora arranca en 40 % y es editable; son valores derivados de esos datos, no una especificación.

## 4. Notas técnicas del sitio

- Sin dependencias externas: fuentes Fraunces e IBM Plex (licencia OFL) embebidas en `assets/fonts/`.
- Configuración editable en `js/data.js` (WhatsApp, email, links de animaciones, tablas y mediciones).
- `og.jpg` y el JSON-LD usan URLs absolutas del dominio (punto 11).
- `animacion-axial/index.html` todavía no existe: el botón del LH 140 dará 404 hasta que se cree.

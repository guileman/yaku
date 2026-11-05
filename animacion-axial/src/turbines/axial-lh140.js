// Definición por datos de la turbina AXIAL LH 140 (Yaku Energía).
// Para otra turbina (p. ej. Pelton) se crea un archivo hermano con la misma forma:
// { id, titulo, modelo, piezas, giratorias, pasos, sitio, entorno(), flujo() }
import * as THREE from 'three';
import { G, velocityTriangle } from '../engine/physics.js';

// ---------------------------------------------------------------------------
// Fuentes (todas del usuario, carpeta E:\PROYECTOS\YAKU)
// ---------------------------------------------------------------------------
export const FUENTES = {
  folleto: 'LH 140 Folleto .pdf',
  instalacion: 'LH-140 Instalacion.pdf',
  ventajas: 'LH-140 Ventajas comparativas.pdf',
  cad: 'CAD\\Axial LH 2.2.3.stp (ensamble Inventor)',
  lista: 'CAD\\LH 140 R0\\Lista de materiales.xlsx',
  medicion: 'LH 140\\MEDICIONES\\Caudal fijo.xlsx (03/12/2020)',
  dims: 'Fotos LH 2.2.3\\Dimensiones.JPG y Patente\\Dibujos.pdf',
};

// ---------------------------------------------------------------------------
// Piezas: id = nombre de nodo en models/axial-lh140.glb
// explode: desplazamiento [m] en despiece; cut: se corta en la vista en corte; anchor: punto de etiqueta [m]
// ---------------------------------------------------------------------------
export const PIEZAS = {
  cubierta:       { nombre: 'Cubierta', cad: 'Cubierta + Anclaje de cubierta (×3)', explode: [0, 0.331, 0], cut: true, anchor: [0.13, 0.57, 0.09],
                    desc: 'Tapa superior que protege al generador. Ø330 mm × 150 mm de alto (plano de dimensiones).' },
  rotor_gen:      { nombre: 'Rotor del generador', cad: 'LG inverter motor › ROTOR + Imán (×12)', explode: [0, 0.23, 0], cut: true, anchor: [0.15, 0.50, 0.03],
                    desc: 'Rotor exterior con imanes permanentes. Gira solidario al eje y envuelve al estator.' },
  estator:        { nombre: 'Estator bobinado', cad: 'LG inverter motor › Estator + Posicionador de Estator', explode: [0, 0.158, 0], cut: true, anchor: [-0.12, 0.49, 0.03],
                    desc: 'Parte fija del generador con las bobinas donde se induce la tensión trifásica.' },
  acople:         { nombre: 'Acople estriado y hub', cad: 'Estriado (suplemento estriado) + Hub motor original', explode: [0, 0.187, 0], cut: true, anchor: [0.0, 0.53, 0.04],
                    desc: 'Transmite el par del eje al rotor del generador a través del hub original del motor.' },
  disco_motor:    { nombre: 'Disco porta motor', cad: 'Disco motor AL', explode: [0, 0.094, 0], cut: true, anchor: [0.155, 0.445, 0.0],
                    desc: 'Disco de aluminio que soporta el estator sobre la columna.' },
  rodamiento:     { nombre: 'Rodamiento superior', cad: 'RODAMIENTO 6204 ZZ (47×20×14)', explode: [0, 0.065, 0], cut: true, anchor: [0.0, 0.44, 0.0],
                    desc: 'Rodamiento rígido de bolillas 6204 ZZ que guía el eje en la parte superior.' },
  columna:        { nombre: 'Columna (chasis)', cad: 'CAÑO PVC Ø75 E3.6 + accesorios Cepex 05_07/05_09/05_15/05_25 + Tapa', explode: [0, 0.0, 0], cut: true, anchor: [0.045, 0.30, 0.0],
                    desc: 'Caño de PVC Ø75 con accesorios Cepex: une el distribuidor con el generador y aloja el eje.' },
  eje:            { nombre: 'Eje', cad: 'Eje + Seeger Ø20/Ø22', explode: [0, 0.0, 0], anchor: [0.0, 0.21, 0.0],
                    desc: 'Eje de acero inoxidable (barra 304L de 25,4 mm según lista de materiales). Lleva la hélice abajo y el rotor del generador arriba.' },
  buje:           { nombre: 'Buje inferior sumergido', cad: 'Buje inferior Ø20×40', explode: [0, -0.043, 0], cut: true, anchor: [0.0, 0.03, 0.0],
                    desc: 'Cojinete de deslizamiento que trabaja sumergido y guía el eje cerca de la hélice.' },
  disco_superior: { nombre: 'Disco superior', cad: 'Disco superior AL_2', explode: [0, 0.022, 0], cut: true, anchor: [0.15, 0.12, 0.0],
                    desc: 'Disco de aluminio que cierra el distribuidor por arriba y fija los deflectores.' },
  deflectores:    { nombre: 'Distribuidor (8 deflectores)', cad: 'Deflector AL 3 (×8)', explode: [0, -0.072, 0], anchor: [0.115, 0.055, 0.04],
                    desc: 'Álabes directrices curvos y fijos: orientan el agua y le dan giro antes de la hélice.' },
  disco_inferior: { nombre: 'Disco inferior y camisa', cad: 'Disco inferior AL', explode: [0, -0.144, 0], cut: true, anchor: [0.075, -0.06, 0.0],
                    desc: 'Base de aluminio Ø300 que apoya en la pileta; su camisa cónica rodea a la hélice.' },
  burlete:        { nombre: 'Burlete de base', cad: 'Burlete EPDM 30306 RB', explode: [0, -0.173, 0], cut: true, anchor: [0.155, 0.0, 0.0],
                    desc: 'Sello de goma EPDM entre el disco inferior y el fondo de la pileta.' },
  helice:         { nombre: 'Hélice Ø140', cad: 'Helice SEEDOO 271000215', explode: [0, -0.245, 0], anchor: [0.055, -0.035, 0.02],
                    desc: 'Rotor axial de 3 álabes y Ø140 mm (hélice comercial según el CAD). Convierte la energía del agua en par.' },
  cono:           { nombre: 'Cono de salida y tuercas', cad: 'Cono salida helice + Tuerca M12 DIN 439 (×2)', explode: [0, -0.317, 0], anchor: [0.0, -0.105, 0.0],
                    desc: 'Cierra el cubo de la hélice y la fija al eje; ordena el flujo a la salida.' },
  // --- entorno procedural (esquema, no forma parte del CAD) ---
  canal:          { nombre: 'Canal de entrada', procedural: true, cut: true, anchor: [0.75, 0.1, 0.0], noHighlight: true,
                    desc: 'Esquema ilustrativo. Puede ser de cemento, chapa o madera impermeabilizada; abierto o cerrado (uno o varios caños).' },
  represa:        { nombre: 'Represa y toma', procedural: true, cut: true, anchor: [1.31, 0.50, 0.0], noHighlight: true,
                    desc: 'Esquema ilustrativo. La represa (dique) acumula el agua y fija el nivel de arranque; la toma lleva compuerta y reja filtro (para que no entren hojas ni palos) y alimenta el canal de entrada.' },
  pileta:         { nombre: 'Pileta de turbina', procedural: true, cut: true, anchor: [-0.2, 0.0, -0.22], noHighlight: true,
                    desc: 'Esquema ilustrativo (según Canal.png): ensanche redondo al final del canal, fondo plano, más de 500 mm de lado y agujero de 200 mm donde baja la hélice.' },
  agua:           { nombre: 'Agua (nivel h)', procedural: true, cut: true, noPick: true, noHighlight: true },
  canio_salida:   { nombre: 'Caño de salida Ø200', procedural: true, cut: true, anchor: [0.105, -0.55, 0.0], noHighlight: true,
                    desc: 'Esquema ilustrativo. Diámetro interno 200 mm; su extremo inferior siempre debajo del nivel de agua inferior.' },
  nivel_inferior: { nombre: 'Nivel inferior', procedural: true, cut: true, anchor: [0.45, -0.96, 0.3], noHighlight: true,
                    desc: 'Esquema ilustrativo. El salto H es la diferencia entre el nivel de la pileta y este nivel.' },
};

export const GIRATORIAS = ['helice', 'cono', 'eje', 'acople', 'rotor_gen'];
export const SENTIDO_GIRO = -1; // sentido de giro del rotor y del agua (horario visto desde arriba); invertido a pedido respecto del 1.er build

// ---------------------------------------------------------------------------
// Datos del sitio y de la máquina (de los documentos)
// ---------------------------------------------------------------------------
export const SITIO = {
  // Tabla del folleto: potencia [W] según salto H [m] y caudal Q [L/s]; null = "X" (fuera de operación)
  tabla: {
    H: [1, 1.5, 2, 2.5, 3],
    Q: [15, 20, 25, 30, 35, 40],
    P: [
      [49, 69, 91, 91, 91, 91],
      [null, 136, 178, 223, 223, 223],
      [null, 125, 231, 288, 349, 349],
      [null, null, 288, 357, 431, 493],
      [null, null, 273, 422, 507, 597],
    ],
  },
  defaults: { Q: 25, H: 1.6 },   // ejemplo del documento "Ventajas comparativas": 1,6 m y ~25 L/s -> ~200 W
  medicion: { Q: 24.18, H: 1.01, n: 310, V: 282, I: 0.28, R: 62, P: 78.96, fecha: '03/12/2020', lugar: 'Dique Christoph' },
  rotor: { D: 0.140, dh: 0.055 },   // Ø140 (plano/patente); cubo ≈ Ø55 medido sobre el modelo CAD
  rpmFolleto: [600, 900],
  etaEjemplo: 0.40,                 // solo si (Q,H) cae fuera de la tabla -> se marca "ejemplo"
  hAgua: 0.20,                      // nivel h en pileta: valor ilustrativo
};

/** rpm estimadas: n ∝ √H, calibradas con la medición real (310 rpm a 1,01 m, carga 62 Ω) */
export function rpmEstimada(H) { const m = SITIO.medicion; return m.n * Math.sqrt(Math.max(H, 0.05) / m.H); }

// ---------------------------------------------------------------------------
// Recorrido guiado
// ---------------------------------------------------------------------------
const VISTA_GENERAL = { pos: [1.45, 0.62, 1.8], target: [0.12, 0.05, 0] };
export const VISTA_DESPIECE = { pos: [1.75, 0.55, 2.05], target: [0, 0.16, 0] };
export const PASOS = [
  {
    id: 'intro', kicker: 'LH 140 · Yaku Energía', titulo: 'Una turbina axial para generar en casa',
    cuerpo: `<p>La <strong>LH 140</strong> es una turbina hidráulica <strong>de tipo axial</strong> para autogeneración eléctrica a pequeña escala. Pesa <strong>16 kg</strong>: una sola persona la apoya en la pileta o la retira para mantenimiento (o para evitar robos).</p>
      <p>Está hecha con PVC, aluminio, acero inoxidable y fibra de vidrio. Según el salto y el caudal del lugar entrega <strong>de 50 a 600 W</strong>. Mide Ø330 × 695 mm.</p>
      <p class="hint">Rotá con un dedo o el mouse, acercá con pellizco o rueda. Tocá una pieza para ver qué es.</p>`,
    fuente: 'Folleto LH 140 · plano de dimensiones',
    camara: VISTA_GENERAL, foco: null, corte: false, flujo: true,
    etiquetas: ['cubierta', 'columna', 'deflectores', 'helice', 'canio_salida', 'canal'],
  },
  {
    id: 'llegada', kicker: 'Paso 1', titulo: 'El agua llega a la pileta',
    cuerpo: `<p>La LH 140 va <strong>montada en el canal</strong>, con el <strong>eje vertical</strong>. Una <strong>represa</strong> (dique) acumula el agua; por la <strong>toma</strong> —con compuerta y reja filtro— pasa al <strong>canal de entrada</strong> y corre por él (cemento, chapa o madera impermeabilizada; abierto o cerrado con uno o varios caños) hasta la <strong>pileta de turbina</strong>, un ensanche redondo al final del canal.</p>
      <p>La pileta es abierta, de <strong>fondo plano</strong>, de más de 500 mm, con un <strong>agujero de 200 mm</strong> en el fondo. La turbina simplemente se apoya sobre ese agujero: el burlete de EPDM sella contra el fondo y la hélice queda metida en el caño de bajada.</p>
      <p>Acá el agua va lenta y rodea a la turbina por todos lados: su energía es casi toda <em>altura</em> (energía potencial).</p>`,
    fuente: 'LH-140 Instalación · Canal.png · Instalacion.png — represa, canal y pileta dibujados como esquema',
    camara: { pos: [3.0, 1.55, 2.35], target: [0.82, -0.04, 0.0] },
    foco: ['represa', 'canal', 'pileta', 'agua', 'burlete', 'disco_inferior'], corte: false, flujo: true,
    etiquetas: ['represa', 'canal', 'pileta', 'burlete'],
  },
  {
    id: 'distribuidor', kicker: 'Paso 2', titulo: 'El distribuidor le da giro al agua',
    cuerpo: `<p>Desde la pileta, el agua entra <strong>radialmente</strong> (de afuera hacia el eje) por todo el perímetro, entre el disco superior y el disco inferior. Los <strong>8 deflectores curvos</strong> (fijos) forman el distribuidor: guían el agua y le imprimen una <strong>componente tangencial</strong> <i>c<sub>u</sub></i> antes de la hélice.</p>
      <p>Al acercarse al centro el paso se achica: el agua se acelera y el giro se intensifica, porque se conserva el momento angular (<i>r·c<sub>u</sub></i> ≈ constante).</p>`,
    fuente: 'CAD Axial LH 2.2.3 · la conservación del momento angular es una explicación general',
    camara: { pos: [0.42, 0.30, 0.50], target: [0, 0.045, 0] },
    foco: ['deflectores', 'disco_superior'], corte: false, flujo: true,
    etiquetas: ['deflectores', 'disco_superior', 'disco_inferior'], ocultar: ['agua'],
  },
  {
    id: 'rotor', kicker: 'Paso 3', titulo: 'La hélice transforma el giro en par',
    cuerpo: `<p>Después del distribuidor el flujo pasa de <strong>radial a axial</strong>: dobla 90° y baja, siempre girando, en sentido <strong>axial</strong> (vertical) a través de la <strong>hélice de Ø140 mm y 3 álabes</strong>, alojada en la camisa del disco inferior.</p>
      <p>Cada álabe trabaja como un ala: el flujo relativo <i>w</i> genera sustentación y su componente tangencial empuja al álabe. Dicho con Euler: la hélice le <em>saca el giro</em> al agua (<i>c<sub>u1</sub></i> → <i>c<sub>u2</sub></i> ≈ 0) y ese cambio de momento angular es el par en el eje:</p>
      <p class="eq">T = ρ · Q · r · (c<sub>u1</sub> − c<sub>u2</sub>)</p>
      <p>Mirá el triángulo de velocidades abajo: cambia con el caudal y el salto.</p>`,
    fuente: 'CAD (Helice SEEDOO 271000215) · teoría de Euler: explicación general de turbinas axiales',
    camara: { pos: [0.30, 0.02, 0.36], target: [0, -0.045, 0] },
    foco: ['helice', 'cono'], corte: true, flujo: true, triangulo: true,
    etiquetas: ['helice', 'disco_inferior', 'cono'], ocultar: ['agua'],
  },
  {
    id: 'eje', kicker: 'Paso 4', titulo: 'El eje sube el par hasta el generador',
    cuerpo: `<p>El par viaja por el <strong>eje de acero inoxidable</strong> (barra 304L de 25,4 mm) que corre por dentro de la <strong>columna</strong> de caño PVC Ø75 con accesorios Cepex: el chasis que une distribuidor y generador.</p>
      <p>Abajo, un <strong>buje sumergido</strong> (Ø20×40) guía el eje cerca de la hélice; arriba, un <strong>rodamiento 6204 ZZ</strong>. El <strong>acople estriado</strong> conecta el eje con el hub original del motor.</p>
      <p>Así el generador queda <strong>seco, por encima del agua</strong>, y solo la hélice trabaja sumergida.</p>`,
    fuente: 'CAD Axial LH 2.2.3 · Lista de materiales LH 140 R0',
    camara: { pos: [0.62, 0.42, 0.78], target: [0, 0.22, 0] },
    foco: ['eje', 'columna', 'buje', 'rodamiento', 'acople'], corte: true, flujo: false,
    etiquetas: ['eje', 'columna', 'buje', 'rodamiento', 'acople'],
  },
  {
    id: 'generador', kicker: 'Paso 5', titulo: 'El generador convierte el giro en electricidad',
    cuerpo: `<p>Arriba está el <strong>generador trifásico de imanes permanentes</strong>: un motor LG Inverter de <strong>rotor exterior</strong> usado como generador. El rotor con imanes gira con el eje alrededor del <strong>estator bobinado</strong>, fijo sobre el disco porta motor.</p>
      <p>El campo de los imanes barre las bobinas e induce tensión (ley de Faraday). Salida: <strong>trifásica de 50 a 380 V</strong> y <strong>0,2 a 3 A</strong> según la configuración, con una velocidad de trabajo de <strong>600 a 900 rpm</strong>.</p>`,
    fuente: 'Folleto LH 140 · CAD (LG inverter motor)',
    camara: { pos: [0.40, 0.78, 0.55], target: [0, 0.48, 0] },
    foco: ['rotor_gen', 'estator', 'disco_motor', 'acople'], corte: true, flujo: false,
    etiquetas: ['rotor_gen', 'estator', 'disco_motor', 'cubierta'],
  },
  {
    id: 'salida', kicker: 'Paso 6', titulo: 'La columna de agua y la salida',
    cuerpo: `<p>Debajo de la hélice el agua sale <strong>verticalmente hacia abajo</strong> por el <strong>caño de salida</strong> redondo (Ø interno 200 mm; plástico, chapa o cemento), sellado al fondo de la pileta, hasta el nivel inferior. Su extremo <strong>siempre tiene que quedar sumergido</strong>: así se forma la <strong>columna hidráulica</strong> que mueve la hélice.</p>
      <p>Por eso el <strong>salto H</strong> se mide entre el nivel de la pileta y el nivel inferior, aunque la turbina esté arriba: el caño trabaja como <em>tubo de aspiración</em> y la depresión bajo la hélice aprovecha casi todo el desnivel.</p>
      <p>Por continuidad, en el caño (más área) el agua baja más lento que en la hélice.</p>`,
    fuente: 'LH-140 Instalación · Canal.png · LH diagrama.png · tubo de aspiración: explicación general',
    camara: { pos: [1.45, -0.15, 1.75], target: [0, -0.45, 0] },
    foco: ['canio_salida', 'nivel_inferior', 'helice'], corte: false, flujo: true,
    etiquetas: ['canio_salida', 'nivel_inferior', 'pileta'],
  },
  {
    id: 'electrico', kicker: 'Paso 7', titulo: 'De la turbina a la casa',
    cuerpo: `<p>El generador entrega unos <strong>300 V</strong> al <strong>diversor / cargador PWM</strong>, que regula la carga de las <strong>baterías</strong> (12, 24 o 48 V). Con las baterías llenas, el excedente va a una <strong>resistencia calefactora</strong> que puede calentar agua.</p>
      <p>El <strong>inversor</strong> pasa la continua de las baterías a <strong>220 V alterna</strong>. Como la turbina genera <strong>día y noche</strong>, el banco de baterías puede ser mucho más chico que en un sistema solar; también se pueden sumar paneles al mismo banco.</p>
      <div class="flowchart" role="list" aria-label="Cadena eléctrica">
        <span role="listitem">Turbina<br><small>3~ ≈300 V</small></span><i aria-hidden="true">→</i>
        <span role="listitem">Diversor PWM<br><small>+ resistencia</small></span><i aria-hidden="true">→</i>
        <span role="listitem">Baterías<br><small>12/24/48 V</small></span><i aria-hidden="true">→</i>
        <span role="listitem">Inversor<br><small>220 V ~</small></span><i aria-hidden="true">→</i>
        <span role="listitem">Consumo</span>
      </div>`,
    fuente: 'LH-140 Instalación (montaje eléctrico) · esquema de conexión · Ventajas comparativas',
    camara: VISTA_GENERAL, foco: null, corte: false, flujo: true,
    etiquetas: ['cubierta'],
  },
];

// ---------------------------------------------------------------------------
// Entorno procedural (esquema de instalación: canal, pileta, agua, caño, nivel inferior)
// ---------------------------------------------------------------------------
export const GEO = { rPileta: 0.32, pozo: 0.32, piso: -0.006, espesor: 0.05, rCanio: 0.10, yFinCanio: -1.05, canalAncho: 0.40, canalLargo: 1.0, pared: 0.34,
  // represa al inicio del canal (esquema)
  dique: { espesor: 0.12, semiAncho: 0.66, alto: 0.58, embalseLargo: 0.62, hEmbalse: 0.42, apertura: 0.20 } };
/** posición x de la cara de aguas abajo de la represa (= fin del canal) */
export const xDique = () => Math.sqrt(GEO.rPileta ** 2 - (GEO.canalAncho / 2) ** 2) + GEO.canalLargo;

export function entorno(viewer) {
  const g = GEO;
  const concreto = () => new THREE.MeshStandardMaterial({ color: 0x76817e, roughness: 0.92, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const aguaMat = (op = 0.16) => new THREE.MeshStandardMaterial({ color: 0x2a9cc4, roughness: 0.1, metalness: 0, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });

  // Referencia: Fotos LH 2.2.3\\Canal.png (planta "ojo de cerradura": pileta redonda D1 al final del canal de ancho B)
  // y "En posicion iso.JPG". Pileta y canal forman un solo recinto con fondo plano y agujero Ø200.
  const R = g.rPileta, b = g.canalAncho / 2, L = g.canalLargo, xa = Math.sqrt(R * R - b * b), th = Math.asin(b / R);
  const planta = () => {
    const sh = new THREE.Shape();
    sh.moveTo(xa, b); sh.lineTo(xa + L, b); sh.lineTo(xa + L, -b); sh.lineTo(xa, -b);
    sh.absarc(0, 0, R, -th, th, true);
    return sh;
  };
  const pileta = new THREE.Group(); pileta.name = 'pileta';
  const sh = planta();
  const hole = new THREE.Path(); hole.absarc(0, 0, g.rCanio, 0, Math.PI * 2, true); sh.holes.push(hole);
  const losa = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: g.espesor, bevelEnabled: false, curveSegments: 56 }), concreto());
  losa.rotation.x = Math.PI / 2; losa.position.y = g.piso; pileta.add(losa);
  // pared curva de la pileta (abierta hacia el canal)
  const arco = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.015, R + 0.015, g.pared, 64, 1, true, Math.PI / 2 + th, 2 * Math.PI - 2 * th), concreto());
  arco.position.y = g.piso + g.pared / 2; pileta.add(arco);
  viewer.addPart('pileta', pileta, PIEZAS.pileta);

  // Canal de entrada (+x): paredes laterales
  const canal = new THREE.Group(); canal.name = 'canal';
  [-1, 1].forEach(sg => { const m = new THREE.Mesh(new THREE.BoxGeometry(L, g.pared, 0.03), concreto()); m.position.set(xa + L / 2, g.piso + g.pared / 2, sg * (b + 0.015)); canal.add(m); });
  // flecha de sentido del agua sobre el canal
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 3), new THREE.MeshBasicMaterial({ color: 0x5fd3f0, transparent: true, opacity: 0.85 }));
  fl.rotation.z = Math.PI / 2; fl.position.set(xa + L * 0.72, g.piso + SITIO.hAgua + 0.03, 0); canal.add(fl);
  viewer.addPart('canal', canal, PIEZAS.canal);

  // Represa al inicio del canal: muro con toma (compuerta + reja), alas laterales y embalse
  const dq = g.dique, x0 = xDique(), xm = x0 + dq.espesor / 2, zMax = dq.semiAncho;
  const represa = new THREE.Group(); represa.name = 'represa';
  const caja = (sx, sy, sz, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); represa.add(m); return m; };
  const yb = g.piso, zl = (zMax - b);           // ancho de cada tramo de muro a los lados de la toma
  [-1, 1].forEach(sg => caja(dq.espesor, dq.alto, zl, xm, yb + dq.alto / 2, sg * (b + zl / 2), concreto()));
  caja(dq.espesor, dq.alto - dq.apertura, 2 * b, xm, yb + dq.apertura + (dq.alto - dq.apertura) / 2, 0, concreto()); // dintel sobre la toma
  [-1, 1].forEach(sg => caja(dq.embalseLargo, dq.alto, 0.03, x0 + dq.espesor + dq.embalseLargo / 2, yb + dq.alto / 2, sg * zMax, concreto())); // alas
  caja(dq.espesor + dq.embalseLargo, 0.05, 2 * zMax, x0 + (dq.espesor + dq.embalseLargo) / 2, yb - 0.025, 0, concreto());   // fondo
  // compuerta (chapa) levantada: deja pasar justo el tirante del canal
  const acero = new THREE.MeshStandardMaterial({ color: 0x5b6f7a, roughness: 0.45, metalness: 0.6, transparent: true, opacity: 0.9 });
  caja(0.025, 0.26, 2 * b - 0.02, x0 + dq.espesor + 0.02, yb + dq.apertura + 0.13, 0, acero);
  [-1, 1].forEach(sg => caja(0.04, dq.alto - 0.04, 0.03, x0 + dq.espesor + 0.02, yb + (dq.alto - 0.04) / 2, sg * (b + 0.015), acero)); // guías
  const vol = caja(0.1, 0.04, 2 * b + 0.06, x0 + dq.espesor + 0.02, yb + dq.alto - 0.02, 0, acero); vol.scale.set(1, 1, 1); // travesaño del husillo
  const husillo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 10), acero); husillo.position.set(x0 + dq.espesor + 0.02, yb + dq.alto - 0.1, 0); represa.add(husillo);
  // reja filtro delante de la toma (barras verticales)
  for (let k = 0; k < 9; k++) { const z = -b + 0.02 + k * (2 * b - 0.04) / 8; const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, dq.apertura + 0.02, 8), acero); bar.position.set(x0 + dq.espesor + 0.09, yb + (dq.apertura + 0.02) / 2, z); represa.add(bar); }
  [yb + 0.02, yb + dq.apertura].forEach(y => caja(0.012, 0.012, 2 * b, x0 + dq.espesor + 0.09, y, 0, acero));
  // agua embalsada (nivel más alto que el del canal)
  const emb = new THREE.Mesh(new THREE.BoxGeometry(dq.embalseLargo - 0.03, dq.hEmbalse, 2 * zMax - 0.04), aguaMat(0.14));
  emb.position.set(x0 + dq.espesor + dq.embalseLargo / 2, yb + dq.hEmbalse / 2, 0); represa.add(emb);
  viewer.addPart('represa', represa, PIEZAS.represa);

  // Agua en pileta + canal (nivel h)
  const agua = new THREE.Group(); agua.name = 'agua';
  const h = SITIO.hAgua;
  const av = new THREE.Mesh(new THREE.ExtrudeGeometry(planta(), { depth: h, bevelEnabled: false, curveSegments: 56 }), aguaMat(0.13));
  av.rotation.x = -Math.PI / 2; av.position.y = g.piso; av.scale.set(0.985, 0.985, 1); agua.add(av);
  viewer.addPart('agua', agua, PIEZAS.agua);

  // Caño de salida Ø200 + agua interior
  const canio = new THREE.Group(); canio.name = 'canio_salida';
  const yTop = g.piso - g.espesor, len = yTop - g.yFinCanio;
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(g.rCanio + 0.005, g.rCanio + 0.005, len, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xb9c3c6, roughness: 0.4, metalness: 0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  tubo.position.y = yTop - len / 2; canio.add(tubo);
  const aguaTubo = new THREE.Mesh(new THREE.CylinderGeometry(g.rCanio - 0.002, g.rCanio - 0.002, len, 40, 1, true), aguaMat(0.12));
  aguaTubo.position.y = tubo.position.y; canio.add(aguaTubo);
  // anillos de borde para leer la forma del caño
  [yTop, g.yFinCanio].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(g.rCanio + 0.005, 0.004, 8, 48), new THREE.MeshStandardMaterial({ color: 0xd8e0e2, roughness: 0.5 })); r.rotation.x = Math.PI / 2; r.position.y = y; canio.add(r); });
  viewer.addPart('canio_salida', canio, PIEZAS.canio_salida);

  // Nivel inferior (agua de restitución)
  const inf = new THREE.Group(); inf.name = 'nivel_inferior';
  const yN = g.yFinCanio + 0.16;
  const sup = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.24, 1.2), aguaMat(0.15)); sup.position.set(0.25, yN - 0.12, 0); inf.add(sup);
  const lecho = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 1.3), concreto()); lecho.position.set(0.25, yN - 0.26, 0); inf.add(lecho);
  viewer.addPart('nivel_inferior', inf, PIEZAS.nivel_inferior);

  // Cota de salto H (línea + texto como sprite)
  const cota = new THREE.Group();
  const xC = -0.55;
  const lm = new THREE.LineBasicMaterial({ color: 0xf2a33a });
  const pts = [new THREE.Vector3(xC, g.piso + h, 0), new THREE.Vector3(xC, yN, 0)];
  cota.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lm));
  [g.piso + h, yN].forEach(y => cota.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xC - 0.04, y, 0), new THREE.Vector3(xC + 0.04, y, 0)]), lm)));
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const cx = cv.getContext('2d');
  cx.fillStyle = '#f2a33a'; cx.font = 'italic 600 44px Georgia, serif'; cx.textAlign = 'center'; cx.fillText('H', 64, 46);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true }));
  sp.scale.set(0.12, 0.06, 1); sp.position.set(xC - 0.07, (g.piso + h + yN) / 2, 0); cota.add(sp);
  viewer.scene.add(cota);
  viewer.extras = { cota };
  return { cota };
}

// ---------------------------------------------------------------------------
// Flujo de agua: trazos (streaks) con cinemática coherente con continuidad y momento angular
// ---------------------------------------------------------------------------
export function flujo(viewer, { n = 2200 } = {}) {
  const g = GEO, h = SITIO.hAgua, rot = SITIO.rotor;
  const N = n;
  const st = new Int8Array(N), R = new Float32Array(N), PHI = new Float32Array(N), Y = new Float32Array(N),
    X = new Float32Array(N), Z = new Float32Array(N), rr = new Float32Array(N), rp = new Float32Array(N), yf = new Float32Array(N), life = new Float32Array(N);
  const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
  const pos = new Float32Array(N * 6), col = new Float32Array(N * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false; lines.renderOrder = 5;
  viewer.scene.add(lines);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const rIn = rot.dh / 2 + 0.004, rOut = rot.D / 2 - 0.004;
  const xD = xDique();
  function spawn(i, anywhere = false) {
    rr[i] = Math.sqrt(rnd(rIn * rIn, rOut * rOut));      // radio de paso por la hélice (área uniforme)
    rp[i] = Math.sqrt(Math.random()) * (g.rCanio - 0.008); // radio en el caño
    yf[i] = rnd(0.012, 0.10);                               // altura de paso por el distribuidor
    life[i] = 0;
    if (Math.random() < 0.3) {          // entra por el canal
      st[i] = 0; X[i] = anywhere ? rnd(g.pozo, xD + 0.6) : xD + 0.55;
      const emb = X[i] > xD; Z[i] = emb ? rnd(-0.55, 0.55) : rnd(-0.17, 0.17); Y[i] = rnd(0.01, (emb ? g.dique.hEmbalse : h) - 0.01);
    } else {                             // desde la periferia de la pileta
      st[i] = 1; PHI[i] = rnd(0, Math.PI * 2); R[i] = anywhere ? rnd(0.16, 0.30) : rnd(0.27, 0.30); Y[i] = rnd(0.01, h - 0.01);
    }
  }
  for (let i = 0; i < N; i++) spawn(i, true);

  let S = { Q: 0.025, H: 1.6, n: 390, cu1: 2, cm: 2 };
  function setState(s) { S = s; }

  function step(dt) {
    const Q = Math.max(S.Q, 0.002);
    const vCanal = Q / (g.canalAncho * h);
    const cm = S.cm, cu1 = S.cu1, rm = (rot.D + rot.dh) / 4, Gam = cu1 * rm;
    const vPipe = Q / (Math.PI * g.rCanio * g.rCanio);
    const b = 0.11;
    for (let i = 0; i < N; i++) {
      let dr = 0, dphi = 0, dy = 0;
      switch (st[i]) {
        case 0: { // canal (cartesiano)
          const dx = X[i] - xD;
          if (dx > 0) {                      // embalse: lento, converge hacia la toma y baja al tirante del canal
            const sx = THREE.MathUtils.clamp(dx / 0.55, 0, 1);
            vx[i] = -vCanal * (0.3 + 0.7 * (1 - sx)); vy[i] = (yf[i] - Y[i]) * (0.3 + 2.2 * (1 - sx)); vz[i] = -Z[i] * (0.15 + 1.4 * (1 - sx));
            if (Math.abs(Z[i]) > 0.18 && dx < 0.1) Z[i] *= 0.9;
          } else { vx[i] = -vCanal; vy[i] = (yf[i] - Y[i]) * 0.3; vz[i] = -Z[i] * 0.15; }
          X[i] += vx[i] * dt; Y[i] += vy[i] * dt; Z[i] += vz[i] * dt;
          if (X[i] < g.pozo - 0.04) { st[i] = 1; R[i] = Math.hypot(X[i], Z[i]); PHI[i] = Math.atan2(X[i], Z[i]); }
          continue;
        }
        case 1: { // pileta: flujo radial hacia la turbina (continuidad: v = Q / (2π r h))
          dr = -Q / (2 * Math.PI * R[i] * h); dy = (yf[i] - Y[i]) * 0.8;
          if (R[i] < 0.155) st[i] = 2; break;
        }
        case 2: { // distribuidor: radial + giro creciente
          dr = -Q / (2 * Math.PI * R[i] * b) * 1.4;
          const s = THREE.MathUtils.clamp((0.155 - R[i]) / (0.155 - 0.075), 0, 1);
          const cu = (0.25 + 0.75 * s) * Gam / R[i];
          dphi = cu / R[i]; dy = (yf[i] - Y[i]) * 2;
          if (R[i] < 0.075) st[i] = 3; break;
        }
        case 3: { // giro de 90°: baja hacia la hélice conservando r·cu
          dy = -Math.max(cm * 0.7, 0.25); dr = (rr[i] - R[i]) * 9;
          dphi = (Gam / Math.max(R[i], 0.02)) / Math.max(R[i], 0.02);
          if (Y[i] < 0.0) st[i] = 4; break;
        }
        case 4: { // hélice: axial cm, el giro cae de cu1 a ~0 (energía entregada al rotor)
          dy = -cm; dr = (rr[i] - R[i]) * 9;
          const k = THREE.MathUtils.clamp(-Y[i] / 0.084, 0, 1);
          const cu = (Gam / rr[i]) * (1 - k) + 0.08 * cu1 * k;
          dphi = cu / Math.max(R[i], 0.02);
          if (Y[i] < -0.09) st[i] = 5; break;
        }
        case 5: { // caño de salida: más área -> más lento; giro residual que se amortigua
          dy = -vPipe; dr = (rp[i] - R[i]) * 2.5;
          dphi = 0.08 * cu1 * Math.exp(-(-0.09 - Y[i]) * 3) / Math.max(R[i], 0.02);
          if (Y[i] < g.yFinCanio) { st[i] = 6; life[i] = 0; } break;
        }
        case 6: { // nivel inferior: se abre y frena
          dy = -vPipe * 0.25 * Math.exp(-life[i] * 3); dr = 0.12 + vPipe * 0.3 * Math.exp(-life[i] * 2); life[i] += dt;
          if (life[i] > 1.6) { spawn(i); continue; } break;
        }
      }
      R[i] += dr * dt; PHI[i] += dphi * dt * SENTIDO_GIRO; Y[i] += dy * dt;
      const s = Math.sin(PHI[i]), c = Math.cos(PHI[i]);
      X[i] = R[i] * s; Z[i] = R[i] * c;
      const vt = R[i] * dphi * SENTIDO_GIRO;
      vx[i] = dr * s + vt * c; vz[i] = dr * c - vt * s; vy[i] = dy;
    }
  }

  const cA = new THREE.Color(0x1d5f8a), cB = new THREE.Color(0x5fd3f0), cC = new THREE.Color(0xf4fbff), tmp = new THREE.Color();
  function write() {
    for (let i = 0; i < N; i++) {
      const sp = Math.hypot(vx[i], vy[i], vz[i]);
      const tr = Math.min(0.05, 0.012 + sp * 0.022) / Math.max(sp, 1e-4);
      const j = i * 6;
      pos[j] = X[i]; pos[j + 1] = Y[i]; pos[j + 2] = Z[i];
      pos[j + 3] = X[i] - vx[i] * tr; pos[j + 4] = Y[i] - vy[i] * tr; pos[j + 5] = Z[i] - vz[i] * tr;
      const t = Math.min(sp / 3.0, 1);
      if (t < 0.5) tmp.copy(cA).lerp(cB, t * 2); else tmp.copy(cB).lerp(cC, (t - 0.5) * 2);
      const fade = st[i] === 6 ? Math.max(0, 1 - life[i] / 1.6) : 1;
      col[j] = tmp.r * fade; col[j + 1] = tmp.g * fade; col[j + 2] = tmp.b * fade;
      col[j + 3] = tmp.r * 0.08 * fade; col[j + 4] = tmp.g * 0.08 * fade; col[j + 5] = tmp.b * 0.08 * fade;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  }

  return {
    object: lines, setState,
    warmup(sec = 14) { for (let t = 0; t < sec; t += 0.04) step(0.04); write(); },
    update(dt) { const sub = dt > 0.02 ? 2 : 1; for (let k = 0; k < sub; k++) step(dt / sub); write(); },
    set visible(v) { lines.visible = v; }, get visible() { return lines.visible; },
  };
}

/** Estado físico completo a partir de Q [L/s], H [m] y η */
export function estadoFisico(QLs, H, eta) {
  const n = rpmEstimada(H);
  const tri = velocityTriangle({ Q: QLs / 1000, H, n, D: SITIO.rotor.D, dh: SITIO.rotor.dh, etaH: eta });
  return { Q: QLs / 1000, H, n, cm: tri.cm, cu1: tri.cu1, tri, omega: 2 * Math.PI * n / 60 };
}

export default {
  id: 'axial-lh140', titulo: 'LH 140 · Turbina axial', modelo: 'models/axial-lh140.glb',
  // url: GLB descargado por http(s) · script/clave: copia embebida en base64 (la genera «npm run build»), usada en file://
  fuenteModelo: { url: 'models/axial-lh140.glb', script: 'js/modelo-axial-lh140.js', clave: 'axial-lh140' },
  vistaDespiece: VISTA_DESPIECE, piezas: PIEZAS, giratorias: GIRATORIAS, sentido: SENTIDO_GIRO, pasos: PASOS, sitio: SITIO, fuentes: FUENTES,
  entorno, flujo, estadoFisico, rpmEstimada,
};

/* ==========================================================================
   Yaku Energía — configuración y datos técnicos
   --------------------------------------------------------------------------
   Todo lo que se puede querer editar sin tocar el resto del sitio está acá.
   Los datos técnicos provienen de los folletos y de las planillas de ensayo
   (ver FALTANTES.md para las dudas detectadas entre documentos).
   ========================================================================== */

window.YAKU = {};

/* ---------- CONFIGURACIÓN (editar acá) ---------------------------------- */
YAKU.CONFIG = {
  // Formato internacional, solo dígitos: 54 (Argentina) + 9 (celular) + 341 + número.
  // Fuente: folletos "Contacto: 341-15-6904961". CONFIRMAR que es el WhatsApp comercial.
  WHATSAPP: "5493416904961",
  WHATSAPP_VISIBLE: "+54 9 341 690-4961",
  TELEFONO_FOLLETO: "341-15-6904961",
  // Tomado del sitio previo (Website/index.html). CONFIRMAR.
  EMAIL: "info@yakuenergia.com",
  WEB: "www.yakuenergia.com",
  // Animaciones interactivas. null = "Próximamente".
  ANIM: {
    axial: "animacion-axial/index.html",
    pelton: null            // cuando exista: "animacion-pelton/index.html"
  }
};

/* ---------- FÍSICA ------------------------------------------------------ */
YAKU.RHO = 1000;   // kg/m3
YAKU.G = 9.81;     // m/s2

/* ---------- TABLA DE POTENCIAS LH 140 (folleto) -------------------------
   Potencia [W] para una turbina. Filas: salto [m]; columnas: caudal [L/s].
   null = celda "X" del folleto (fuera de rango). */
YAKU.LH_TABLE = {
  q: [15, 20, 25, 30, 35, 40],
  h: [1, 1.5, 2, 2.5, 3],
  p: [
    [49,   69,   91,  91,  91,  91],   // 1 m
    [null, 136,  178, 223, 223, 223],  // 1,5 m
    [null, 125,  231, 288, 349, 349],  // 2 m
    [null, null, 288, 357, 431, 493],  // 2,5 m
    [null, null, 273, 422, 507, 597]   // 3 m
  ]
};

/* ---------- TABLA DE POTENCIAS PELTON (folleto "Pelton 230") ------------
   "Potencia máximum en Vatio". star=true -> versión con 2 boquillas. */
YAKU.PELTON_TABLE = {
  q: [0.5, 1, 1.5, 2, 2.5, 3],
  h: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
  p: [
    [null, null, 27,  null, null, null],   // 5
    [17,   39,   62,  87,   null, null],   // 10
    [27,   62,   100, 137,  174,  null],   // 15
    [39,   87,   137, 187,  238,  290],    // 20
    [50,   112,  174, 238,  303,  367],    // 25
    [62,   137,  212, 290,  367,  446],    // 30
    [74,   162,  251, 342,  433,  525],    // 35
    [87,   187,  290, 393,  499,  603],    // 40
    [100,  212,  329, 446,  564,  null],   // 45
    [112,  238,  367, 499,  null, null]    // 50
  ],
  star: [
    [0,0,1,0,0,0],
    [0,0,1,1,0,0],
    [0,0,0,1,1,0],
    [0,0,0,1,1,1],
    [0,0,0,1,1,1],
    [0,0,0,0,1,1],
    [0,0,0,0,1,1],
    [0,0,0,0,1,1],
    [0,0,0,0,1,0],
    [0,0,0,1,0,0]
  ]
};

/* ---------- MEDICIONES (ensayos de prototipo) -----------------------------
   LH 140 — planillas "Caudal fijo.xlsx", "62Ohm.xlsx" (dique, 03/12/2020, salto 101 cm)
            y "Mediciones 61,6 Ohm Agustin" / "fijo caudal Agustin" (07/01/2021, salto 160 cm).
   Potencia = tensión x corriente sobre carga resistiva (potencia eléctrica entregada). */
YAKU.LH_TESTS = [
  {
    id: "lh-1m",
    label: "Ensayo a 1,01 m de caída · carga fija 62 Ω",
    fecha: "03/12/2020", salto: 1.01, carga: "62 Ω",
    pts: [ // Q [L/s], V [V], I [A], P [W]
      [7.4,  20,  0.07, 1.4],
      [11.6, 70,  0.13, 9.1],
      [13.0, 115, 0.17, 19.55],
      [19.2, 150, 0.19, 28.5],
      [19.7, 194, 0.22, 42.68],
      [22.8, 215, 0.23, 49.45],
      [24.3, 236, 0.25, 59],
      [26.5, 246, 0.25, 61.5],
      [24.8, 255, 0.26, 66.3],
      [25.3, 270, 0.26, 70.2]
    ]
  },
  {
    id: "lh-16m",
    label: "Ensayo a 1,60 m de caída · carga fija 61,6 Ω",
    fecha: "07/01/2021", salto: 1.60, carga: "61,6 Ω",
    pts: [
      [10.86, 70,  0.22, 15.4],
      [14.86, 153, 0.31, 47.4],
      [18.66, 259, 0.40, 103.6],
      [26.72, 389, 0.49, 190.6]
    ]
  }
];
/* Ensayo adicional a 1,60 m con carga variable y caudal alto (07/01/2021) */
YAKU.LH_TEST_EXTRA = {
  label: "Ensayo a 1,60 m · carga variable",
  fecha: "07/01/2021", salto: 1.60,
  pts: [ // Q, rpm, V, I, carga, P
    [23.87, 692,  295, 0.55, 46,   162.25],
    [28.24, 900,  384, 0.51, 55,   195.84],
    [25.87, 900,  390, 0.50, 61.6, 195],
    [29.10, 1007, 445, 0.42, 71,   186.9]
  ]
};

/* Pelton — "Mediciones Pelton boca 9mm casa VA.xlsx" / "Test Pelton.pdf" (07/12/2021)
   Boquilla 9 mm, salto 20 m, manguera 33 mm x 100 m, caudal indicado 1,2 L/s. */
YAKU.PELTON_TEST = {
  fecha: "07/12/2021", boquilla: 9, salto: 20, manguera: "33 mm × 100 m", caudal: 1.2,
  pts: [ // rpm, V, I, P, R[ohm]
    [960, 146,   0,     0,      null],
    [935, 101.8, 0.085, 8.653,  140],
    [890, 97.3,  0.18,  17.514, 55],
    [824, 86,    0.41,  35.26,  24],
    [795, 83,    0.5,   41.5,   19],
    [740, 76,    0.64,  48.64,  14],
    [695, 71.2,  0.78,  55.536, 11.2],
    [650, 66,    0.9,   59.4,   9.4],
    [629, 63.2,  0.975, 61.62,  8.45],
    [606, 59.9,  1.08,  64.692, 7.4],
    [584, 56.7,  1.15,  65.205, 7],
    [180, 9.5,   1.965, 18.667, 1.4]
  ]
};

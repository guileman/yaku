// Utilidades hidráulicas genéricas (sirven para axial, Pelton, etc.)
export const RHO = 1000;   // kg/m³ (agua)
export const G = 9.81;     // m/s²

/** Potencia hidráulica disponible [W]. Q en m³/s, H en m. */
export const hydraulicPower = (Q, H) => RHO * G * Q * H;

/**
 * Interpolación bilineal en una tabla de catálogo potencia(H, Q).
 * table = { H:[...asc], Q:[...asc], P:[[fila por H]...] } ; null = celda "X" (fuera de operación)
 * Devuelve { P, status: 'ok' | 'fuera_operacion' | 'extrapolado', Hc, Qc }
 */
export function interpTable(table, Q, H) {
  const clamp = (v, a) => Math.min(Math.max(v, a[0]), a[a.length - 1]);
  const Hc = clamp(H, table.H), Qc = clamp(Q, table.Q);
  const extrap = Hc !== H || Qc !== Q;
  const idx = (a, v) => { let i = 0; while (i < a.length - 2 && v > a[i + 1]) i++; return i; };
  const i = idx(table.H, Hc), j = idx(table.Q, Qc);
  const h0 = table.H[i], h1 = table.H[i + 1], q0 = table.Q[j], q1 = table.Q[j + 1];
  const th = (Hc - h0) / (h1 - h0), tq = (Qc - q0) / (q1 - q0);
  const c = [table.P[i][j], table.P[i][j + 1], table.P[i + 1][j], table.P[i + 1][j + 1]];
  // celdas "X": si la esquina más cercana es X -> fuera de operación
  const near = c[(th > 0.5 ? 2 : 0) + (tq > 0.5 ? 1 : 0)];
  if (near == null) return { P: null, status: 'fuera_operacion', Hc, Qc };
  // si alguna otra esquina es X, se reemplaza por la más cercana válida (borde de la zona operativa)
  const v = c.map(x => (x == null ? near : x));
  const P = (1 - th) * ((1 - tq) * v[0] + tq * v[1]) + th * ((1 - tq) * v[2] + tq * v[3]);
  return { P, status: extrap ? 'extrapolado' : 'ok', Hc, Qc };
}

/**
 * Triángulo de velocidades simplificado de una turbina axial en el radio medio.
 * Supone salida sin giro (cu2 = 0) y ecuación de Euler: η_h·g·H = u·(cu1 − cu2).
 * Q [m³/s], H [m], n [rpm], D y dh [m] (diámetro exterior y de cubo), etaH (0..1)
 */
export function velocityTriangle({ Q, H, n, D, dh, etaH }) {
  const A = Math.PI / 4 * (D * D - dh * dh);
  const cm = Q / A;                       // componente axial (meridiana)
  const rm = (D + dh) / 4;                // radio medio
  const u = 2 * Math.PI * n / 60 * rm;    // velocidad tangencial del álabe
  const cu2 = 0;
  const cu1 = u > 0.05 ? etaH * G * H / u + cu2 : 0;
  const deg = r => r * 180 / Math.PI;
  return {
    A, cm, rm, u, cu1, cu2,
    c1: Math.hypot(cu1, cm), c2: Math.hypot(cu2, cm),
    w1: Math.hypot(cu1 - u, cm), w2: Math.hypot(cu2 - u, cm),
    alpha1: deg(Math.atan2(cm, cu1)), beta1: deg(Math.atan2(cm, u - cu1)), beta2: deg(Math.atan2(cm, u - cu2)),
    torque: n > 0 ? etaH * RHO * G * Q * H / (2 * Math.PI * n / 60) : 0,
  };
}

export const fmt = (v, d = 0) => (v == null || !isFinite(v)) ? '—' : v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });

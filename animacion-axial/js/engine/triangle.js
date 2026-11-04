// Dibujo SVG de triángulos de velocidades (entrada 1 y salida 2), genérico.
import { fmt } from './physics.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };

export function drawTriangles(svg, tri) {
  const W = 340, H = 170; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.replaceChildren();
  const defs = el('defs');
  [['c', '#5fd3f0'], ['w', '#f2a33a'], ['u', '#e9eef0']].forEach(([id, c]) => {
    const m = el('marker', { id: 'ah-' + id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
    m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: c })); defs.appendChild(m);
  });
  svg.appendChild(defs);
  const maxV = Math.max(tri.u, Math.abs(tri.cu1), Math.abs(tri.cu1 - tri.u), tri.cm, 0.5);
  const k = 120 / Math.max(maxV * 1.25, tri.cm * 1.6);
  const one = (ox, cu, label) => {
    const oy = 28;
    const C = [ox + cu * k, oy + tri.cm * k], Wp = [ox + (cu - tri.u) * k, oy + tri.cm * k];
    const g = el('g');
    g.appendChild(el('text', { x: ox, y: 14, class: 'tri-title', 'text-anchor': 'middle' }, label));
    g.appendChild(el('line', { x1: ox, y1: oy, x2: C[0], y2: C[1], stroke: '#5fd3f0', 'stroke-width': 2.4, 'marker-end': 'url(#ah-c)' }));
    g.appendChild(el('line', { x1: ox, y1: oy, x2: Wp[0], y2: Wp[1], stroke: '#f2a33a', 'stroke-width': 2.4, 'marker-end': 'url(#ah-w)' }));
    g.appendChild(el('line', { x1: Wp[0], y1: Wp[1], x2: C[0], y2: C[1], stroke: '#e9eef0', 'stroke-width': 1.6, 'stroke-dasharray': '4 3', 'marker-end': 'url(#ah-u)' }));
    g.appendChild(el('circle', { cx: ox, cy: oy, r: 2.5, fill: '#e9eef0' }));
    g.appendChild(el('text', { x: (ox + C[0]) / 2 + 6, y: (oy + C[1]) / 2, class: 'tri-c' }, 'c'));
    g.appendChild(el('text', { x: (ox + Wp[0]) / 2 - 12, y: (oy + Wp[1]) / 2, class: 'tri-w' }, 'w'));
    g.appendChild(el('text', { x: (Wp[0] + C[0]) / 2 - 4, y: C[1] + 14, class: 'tri-u' }, 'u'));
    svg.appendChild(g);
  };
  one(W * 0.30, tri.cu1, 'Entrada (1)');
  one(W * 0.78, tri.cu2, 'Salida (2)');
  svg.appendChild(el('text', { x: 6, y: H - 4, class: 'tri-axis' }, '↓ axial · → sentido de giro'));
}

export function triangleLegend(tri) {
  return `u = ${fmt(tri.u, 2)} m/s · c<sub>m</sub> = ${fmt(tri.cm, 2)} m/s · c<sub>u1</sub> = ${fmt(tri.cu1, 2)} m/s · c<sub>u2</sub> ≈ 0`;
}

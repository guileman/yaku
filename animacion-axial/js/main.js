// Arranque de la app: elige la turbina (?turbina=axial | pelton…), arma visor, recorrido y calculadora.
import { Viewer, webglAvailable } from './engine/viewer.js';
import { Tour } from './engine/tour.js';
import { hydraulicPower, interpTable, fmt } from './engine/physics.js';
import { drawTriangles, triangleLegend } from './engine/triangle.js';

const TURBINAS = {
  axial: () => import('./turbines/axial-lh140.js'),
  // pelton: () => import('./turbines/pelton-x1.js'),   // ← agregar cuando esté el modelo
};

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const T = (await (TURBINAS[params.get('turbina')] || TURBINAS.axial)()).default;
const SITIO = T.sitio;

// ------------------------------------------------------------------ estado
const state = { Q: SITIO.defaults.Q, H: SITIO.defaults.H, medicion: false, slow: true, flow: true, explode: 0 };
let fis = null; // estado físico actual

// ------------------------------------------------------------------ visor
const hasGL = webglAvailable() && !params.has('nogl');
let viewer = null, tour = null, flow = null;
const ENV = Object.keys(T.piezas).filter(k => T.piezas[k].procedural);

if (hasGL) {
  viewer = new Viewer($('viewport'), { labelLayer: $('labels') });
  try {
    const { missing } = await viewer.load(T.modelo, T.piezas, f => { $('loader-fill').style.width = (f * 100).toFixed(0) + '%'; });
    if (missing.length) console.warn('Piezas sin geometría en el GLB:', missing);
  } catch (e) {
    console.error(e); $('loader-txt').textContent = 'No se pudo cargar el modelo 3D.';
  }
  T.entorno(viewer);
  flow = T.flujo(viewer, { n: viewer.isMobile ? 1300 : 2400 });
  const rot = T.giratorias.map(id => viewer.part(id)?.object).filter(Boolean);
  let ang = 0;
  viewer.onFrame(dt => {
    const ts = state.slow ? 0.25 : 1;
    if (fis) {
      ang += fis.omega * dt * ts * T.sentido;
      for (const o of rot) o.rotation.y = ang;
      if (flow.visible) flow.update(dt * ts);
    }
  });
  viewer.onPick = id => showInfo(id);
  viewer.onUserOrbit = () => tour?.playing && tour.stop();
  document.getElementById('loader').classList.add('done');
} else {
  $('loader').classList.add('done');
  $('fallback').hidden = false;
  document.querySelector('.toolbar').hidden = true;
}

// ------------------------------------------------------------------ calculadora
const inQ = $('in-q'), inH = $('in-h');
inQ.value = state.Q; inH.value = state.H;

function calcular() {
  const { Q, H } = state;
  const Ph = hydraulicPower(Q / 1000, H);
  let P, eta, nota, tag;
  const m = SITIO.medicion;
  if (state.medicion) {
    P = m.P; eta = P / hydraulicPower(m.Q / 1000, m.H);
    tag = '<span class="tag tag-ok">medido</span>';
    nota = `Medición del ${m.fecha} (${m.lugar}), válvula fija y carga de ${m.R} Ω: ${fmt(m.n)} rpm, ${fmt(m.V)} V, ${fmt(m.I, 2)} A → ${fmt(m.P, 1)} W eléctricos. η = P<sub>eléctrica</sub> / ρgQH (agua → cable).`;
  } else {
    const t = interpTable(SITIO.tabla, Q, H);
    if (t.status === 'ok') {
      P = t.P; eta = P / Ph; tag = '<span class="tag tag-ok">folleto</span>';
      nota = 'Potencia interpolada de la tabla del folleto LH 140 (caudal × salto). El η sale de esa tabla: η = P<sub>tabla</sub> / ρgQH.';
    } else if (t.status === 'extrapolado') {
      eta = t.P / hydraulicPower(t.Qc / 1000, t.Hc); P = Ph * eta;
      tag = '<span class="tag tag-ej">ejemplo</span>';
      nota = `Fuera de la tabla del folleto (válida de ${SITIO.tabla.H[0]} a ${SITIO.tabla.H.at(-1)} m y de ${SITIO.tabla.Q[0]} a ${SITIO.tabla.Q.at(-1)} L/s): se usa el η del borde de la tabla. <strong>Valor de ejemplo, no garantizado.</strong>`;
    } else {
      eta = SITIO.etaEjemplo; P = null;
      tag = '<span class="tag tag-warn">fuera de operación</span>';
      nota = `En la tabla del folleto esta combinación figura con «X»: la turbina no opera con tan poco caudal para ese salto. La animación usa η = ${fmt(eta * 100)} % <span class="tag tag-ej">ejemplo</span>.`;
    }
  }
  $('out-q').textContent = `${fmt(Q, 1)} L/s`;
  $('out-h').textContent = `${fmt(H, 2)} m`;
  $('r-ph').textContent = `${fmt(Ph)} W`;
  $('r-eta').innerHTML = `${fmt(eta * 100)} % ${tag}`;
  $('r-p').textContent = P == null ? '—' : `${fmt(P)} W`;
  $('r-e').textContent = P == null ? '—' : `${fmt(P * 24 / 1000, 1)} kWh`;
  fis = T.estadoFisico(Q, H, eta);
  $('r-n').innerHTML = `${fmt(fis.n)} rpm <span class="tag tag-ej">estimado</span>`;
  $('r-note').innerHTML = nota + ` Giro estimado escalando con √H la medición real (${m.n} rpm a ${fmt(m.H, 2)} m); el folleto indica ${SITIO.rpmFolleto[0]}–${SITIO.rpmFolleto[1]} rpm de trabajo.`;
  $('ro-rpm').textContent = fmt(fis.n);
  $('ro-p').textContent = P == null ? '—' : fmt(P);
  drawTriangles($('tri'), fis.tri);
  $('tri-legend').innerHTML = triangleLegend(fis.tri) + `<br>Par en el eje ≈ ${fmt(fis.tri.torque, 1)} N·m`;
  flow?.setState(fis);
}
inQ.addEventListener('input', () => { state.Q = +inQ.value; state.medicion = false; calcular(); });
inH.addEventListener('input', () => { state.H = +inH.value; state.medicion = false; calcular(); });
$('pr-folleto').addEventListener('click', () => { state.Q = SITIO.defaults.Q; state.H = SITIO.defaults.H; state.medicion = false; inQ.value = state.Q; inH.value = state.H; calcular(); });
$('pr-medicion').addEventListener('click', () => { const m = SITIO.medicion; state.Q = m.Q; state.H = m.H; state.medicion = true; inQ.value = m.Q; inH.value = m.H; calcular(); });
calcular();
flow?.warmup();

// ------------------------------------------------------------------ ficha de pieza
function showInfo(id) {
  const p = T.piezas[id]; if (!p || !p.desc) return;
  $('info-title').textContent = p.nombre;
  $('info-desc').textContent = p.desc;
  $('info-cad').textContent = p.cad || 'Esquema (no está en el CAD)';
  $('info').hidden = false;
  viewer?.setFocus([id], { ghostOpacity: 0.22 });
}
function closeInfo() { $('info').hidden = true; if (tour?.paso) viewer?.setFocus(tour.paso.foco); }
$('info-close').addEventListener('click', closeInfo);

// ------------------------------------------------------------------ recorrido
const dots = $('dots');
T.pasos.forEach((p, i) => {
  const li = document.createElement('li'); const b = document.createElement('button');
  b.type = 'button'; b.textContent = i === 0 ? '◎' : i; b.title = p.titulo; b.setAttribute('aria-label', `${p.kicker}: ${p.titulo}`);
  b.addEventListener('click', () => tour ? tour.go(i) : renderStep(p, i));
  li.appendChild(b); dots.appendChild(li);
});
function setChip(id, on) { $(id).setAttribute('aria-pressed', on ? 'true' : 'false'); }
function renderStep(p, i) {
  $('st-kicker').textContent = p.kicker; $('st-title').textContent = p.titulo;
  $('st-body').innerHTML = p.cuerpo; $('st-src').textContent = p.fuente;
  [...dots.querySelectorAll('button')].forEach((b, k) => k === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'));
  $('bt-prev').disabled = i === 0;
  $('bt-next').textContent = i === T.pasos.length - 1 ? 'Inicio ↺' : 'Siguiente ›';
  if (p.triangulo) $('tri-box').open = true;
  $('info').hidden = true;
}
const hooks = {
  onStep(p, i) {
    renderStep(p, i);
    state.flow = p.flujo !== false; applyFlow();
    setChip('tg-cut', !!p.corte);
    if (state.explode > 0) { $('explode').value = 0; setExplode(0); }
  },
  onPlay(on) { $('bt-play').setAttribute('aria-pressed', on); $('bt-play').textContent = on ? '❚❚ Pausa' : '▶ Reproducir'; },
};
if (viewer) { tour = new Tour(viewer, T.pasos, hooks); tour.go(0); }
else { let cur = 0; renderStep(T.pasos[0], 0); tour = { get paso() { return T.pasos[cur]; }, go(i) { cur = Math.max(0, Math.min(T.pasos.length - 1, i)); renderStep(T.pasos[cur], cur); }, next() { this.go(cur + 1); }, prev() { this.go(cur - 1); }, toggle() {}, get i() { return cur; } }; $('bt-play').disabled = true; }

$('bt-prev').addEventListener('click', () => tour.prev());
$('bt-next').addEventListener('click', () => tour.i === T.pasos.length - 1 ? tour.go(0) : tour.next());
$('bt-play').addEventListener('click', () => tour.toggle());
addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowRight') { tour.next(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { tour.prev(); e.preventDefault(); }
  else if (e.key === ' ' && !e.target.matches('button, summary')) { tour.toggle(); e.preventDefault(); }
  else if (e.key === 'Escape') closeInfo();
});

// ------------------------------------------------------------------ barra de herramientas
function applyFlow() { if (flow) flow.visible = state.flow && state.explode < 0.02; setChip('tg-flow', state.flow); }
function setExplode(t) {
  if (viewer && state.explode < 0.02 && t >= 0.02 && T.vistaDespiece) viewer.flyTo(T.vistaDespiece, 1);
  state.explode = t; viewer?.setExplode(t);
  if (viewer?.extras?.cota) viewer.extras.cota.visible = t < 0.02;
  ENV.forEach(id => viewer?.setVisible(id, t < 0.02 && !(tour?.paso?.ocultar || []).includes(id)));
  applyFlow();
}
$('explode').addEventListener('input', e => setExplode(+e.target.value));
$('tg-cut').addEventListener('click', () => { const on = !viewer.cutOn; viewer.setCut(on); setChip('tg-cut', on); });
$('tg-labels').addEventListener('click', () => { const on = !viewer.labelsOn; viewer.setLabelsOn(on); setChip('tg-labels', on); });
$('tg-flow').addEventListener('click', () => { state.flow = !state.flow; applyFlow(); });
$('tg-slow').addEventListener('click', () => { state.slow = !state.slow; setChip('tg-slow', state.slow); });
$('tg-reset').addEventListener('click', () => { const p = tour.paso; p?.camara && viewer.flyTo(p.camara, 0.9); });

// para pruebas automatizadas
window.__app = { viewer, tour, state, get fis() { return fis; }, calcular };
document.documentElement.dataset.ready = '1';

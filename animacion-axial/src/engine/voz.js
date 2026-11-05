// Lectura en voz alta de los pasos con la síntesis de voz del navegador (Web Speech API).
// No usa servicios externos ni descarga nada: la voz es la que trae el sistema (Windows, Android, iOS, macOS).

/** Convierte el HTML de un paso en texto fácil de leer en voz alta */
export function textoParaVoz(html) {
  const d = document.createElement('div'); d.innerHTML = html;
  d.querySelectorAll('.eq, .flowchart, small').forEach(e => e.remove());
  let t = d.textContent;
  const R = [
    [/Ø\s?/g, 'diámetro '], [/×/g, ' por '], [/≈/g, ' aproximadamente '],
    [/(\d)\s?mm\b/g, '$1 milímetros'], [/(\d)\s?kg\b/g, '$1 kilogramos'],
    [/(\d)\s?W\b/g, '$1 vatios'], [/(\d)\s?V\b/g, '$1 voltios'], [/(\d)\s?A\b/g, '$1 amperios'],
    [/\brpm\b/g, 'revoluciones por minuto'], [/L\/s/g, 'litros por segundo'], [/(\d)\s?m\b/g, '$1 metros'],
    [/(\d)\s?°/g, '$1 grados'], [/%/g, ' por ciento'], [/[—–·]/g, ', '], [/→/g, ', '], [/\s+/g, ' '],
  ];
  for (const [a, b] of R) t = t.replace(a, b);
  return t.trim();
}

function partir(texto, max = 200) {
  const frases = texto.split(/(?<=[.!?:;])\s+/), out = [];
  let cur = '';
  for (const f of frases) {
    if (cur && (cur + ' ' + f).length > max) { out.push(cur); cur = f; } else cur = cur ? cur + ' ' + f : f;
  }
  if (cur) out.push(cur);
  return out;
}

export function crearVoz() {
  const ss = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const ok = !!(ss && 'SpeechSynthesisUtterance' in window);
  const o = { disponible: ok, hablando: false, onCambio: null };
  if (!ok) return o;
  let voz = null, id = 0;
  const PREF = ['es-AR', 'es-419', 'es-MX', 'es-US', 'es-ES'];
  function elegir() {
    const es = ss.getVoices().filter(v => /^es([-_]|$)/i.test(v.lang));
    if (!es.length) { voz = null; return; }
    const pts = v => {
      const k = PREF.findIndex(p => v.lang.replace('_', '-').toLowerCase() === p.toLowerCase());
      return (k < 0 ? 0 : 10 - k) + (/natural|online|neural/i.test(v.name) ? 8 : 0) + (/google/i.test(v.name) ? 2 : 0);
    };
    voz = es.sort((a, b) => pts(b) - pts(a))[0];
  }
  elegir();
  ss.addEventListener?.('voiceschanged', elegir);
  const cambio = v => { o.hablando = v; o.onCambio?.(v); };
  o.parar = () => { id++; ss.cancel(); if (o.hablando) cambio(false); };
  o.hablar = (texto, { alTerminar } = {}) => {
    o.parar();
    const mi = id, trozos = partir(texto);
    if (!trozos.length) { alTerminar?.(); return; }
    const decir = k => {
      if (mi !== id) return;
      const u = new SpeechSynthesisUtterance(trozos[k]);
      if (voz) u.voice = voz;
      u.lang = voz ? voz.lang : 'es-AR'; u.rate = 1; u.pitch = 1;
      u.onstart = () => { if (mi === id && !o.hablando) cambio(true); };
      u.onend = () => { if (mi !== id) return; if (k + 1 < trozos.length) decir(k + 1); else { cambio(false); alTerminar?.(); } };
      u.onerror = e => { if (mi !== id) return; if (e.error === 'canceled' || e.error === 'interrupted') return; cambio(false); alTerminar?.(); };
      ss.speak(u);
    };
    setTimeout(() => decir(0), 60);   // Chrome ignora un speak() pegado a cancel()
  };
  return o;
}

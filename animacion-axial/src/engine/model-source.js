// Obtiene el GLB como ArrayBuffer, funcione la página por http(s) o abierta con doble clic (file://).
//  - http(s): fetch del .glb con progreso real; si falla (404, MIME no configurado, etc.) usa la copia embebida.
//  - file://: Chrome/Edge bloquean fetch/XHR a archivos locales (CORS, origen "null"), así que se usa
//    directamente la copia embebida: un <script> clásico (sí permitido en file://) que define
//    window.YAKU_MODELOS[clave] = "<GLB en base64>".

const espera = () => new Promise(r => setTimeout(r, 0));

export class ModelError extends Error {
  constructor(msg, { causa, sugerencia, detalle } = {}) { super(msg); this.causa = causa; this.sugerencia = sugerencia; this.detalle = detalle; }
}

async function descargar(url, onProgress, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${url}`);
  const total = +res.headers.get('content-length') || 0;
  if (!res.body || !total) return res.arrayBuffer();
  const reader = res.body.getReader(), partes = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    partes.push(value); n += value.length; onProgress(Math.min(n / total, 1));
  }
  const out = new Uint8Array(n); let o = 0;
  for (const p of partes) { out.set(p, o); o += p.length; }
  return out.buffer;
}

function cargarScript(src, signal) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    const fin = () => { s.onload = s.onerror = null; signal?.removeEventListener('abort', abort); };
    const abort = () => { fin(); s.remove(); reject(new DOMException('Tiempo de espera agotado', 'AbortError')); };
    s.onload = () => { fin(); resolve(); };
    s.onerror = () => { fin(); s.remove(); reject(new ModelError(`No se pudo leer ${src}`, {
      causa: `No se encontró o no se pudo leer el archivo ${src}, que contiene el modelo 3D.`,
      sugerencia: 'Verificá que la carpeta animacion-axial esté completa (subcarpeta js/) y tocá «Reintentar». Si falta, regenerala con «npm run build».',
    })); };
    signal?.addEventListener('abort', abort);
    document.head.appendChild(s);
  });
}

async function base64ABuffer(b64, onProgress) {
  const CH = 1 << 18; // 256 KiB de texto por tanda (múltiplo de 4)
  const bytes = new Uint8Array(Math.floor(b64.length * 3 / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0));
  let o = 0;
  for (let i = 0; i < b64.length; i += CH) {
    const bin = atob(b64.slice(i, i + CH));
    for (let k = 0; k < bin.length; k++) bytes[o++] = bin.charCodeAt(k);
    onProgress(Math.min((i + CH) / b64.length, 1));
    await espera();
  }
  return bytes.buffer;
}

async function embebido({ clave, script }, onProgress, signal) {
  const reg = (window.YAKU_MODELOS ||= {});
  if (!reg[clave]) {
    onProgress(0.05, 'Leyendo el modelo 3D…');
    await cargarScript(script, signal);
  }
  const b64 = reg[clave];
  if (typeof b64 !== 'string' || b64.length < 100) {
    throw new ModelError('Falta el archivo del modelo embebido.', {
      causa: `El archivo ${script} no está o está incompleto.`,
      sugerencia: 'Copiá de nuevo la carpeta animacion-axial completa (incluida la subcarpeta js/) o regenerala con «npm run build».',
    });
  }
  onProgress(0.6, 'Descomprimiendo…');
  const buf = await base64ABuffer(b64, f => onProgress(0.6 + 0.4 * f));
  return buf;
}

/**
 * @param fuente { url, clave, script }  url del .glb, clave en window.YAKU_MODELOS y ruta del .js embebido
 * @param onProgress (f 0..1, texto?)
 */
export async function obtenerGLB(fuente, onProgress, signal) {
  const remoto = /^https?:$/.test(location.protocol);
  if (remoto && fuente.url) {
    try {
      onProgress(0, 'Descargando el modelo 3D…');
      return await descargar(fuente.url, f => onProgress(f), signal);
    } catch (e) {
      if (signal?.aborted) throw e;
      console.warn('No se pudo descargar el GLB; uso la copia embebida.', e);
    }
  }
  return embebido(fuente, onProgress, signal);
}

// Reproductor de recorrido guiado: aplica pasos definidos por datos sobre el Viewer.
export class Tour {
  /**
   * @param viewer   instancia de Viewer
   * @param pasos    array de pasos { id, kicker, titulo, cuerpo, fuente, camara, foco, corte, flujo, etiquetas, ocultar, ... }
   * @param hooks    { onStep(paso, i), applyExtras(paso) }
   */
  constructor(viewer, pasos, hooks = {}) {
    this.v = viewer; this.pasos = pasos; this.hooks = hooks;
    this.i = -1; this.playing = false; this.timer = null; this.dwell = 11000;
    this._hidden = new Set();
  }
  get paso() { return this.pasos[this.i]; }
  go(i, { fly = true } = {}) {
    i = Math.max(0, Math.min(this.pasos.length - 1, i));
    this.i = i; const p = this.pasos[i];
    this._hidden.forEach(id => this.v.setVisible(id, true)); this._hidden.clear();
    (p.ocultar || []).forEach(id => { this.v.setVisible(id, false); this._hidden.add(id); });
    this.v.setFocus(p.foco);
    this.v.setCut(!!p.corte);
    this.v.setLabels(p.etiquetas || []);
    if (fly && p.camara) this.v.flyTo(p.camara);
    this.hooks.onStep?.(p, i);
    if (this.playing) this._arm();
  }
  next() { if (this.i < this.pasos.length - 1) this.go(this.i + 1); else if (this.playing) this.stop(); }
  prev() { this.go(this.i - 1); }
  play() { this.playing = true; this.hooks.onPlay?.(true); if (this.i >= this.pasos.length - 1) this.go(0); else this._arm(); }
  stop() { this.playing = false; clearTimeout(this.timer); this.hooks.onPlay?.(false); }
  toggle() { this.playing ? this.stop() : this.play(); }
  _arm() { clearTimeout(this.timer); this.timer = setTimeout(() => this.next(), this.dwell); }
}

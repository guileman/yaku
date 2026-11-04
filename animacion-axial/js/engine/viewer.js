// Motor de visor 3D genérico (independiente de la turbina).
// Carga un GLB con piezas nombradas, permite resaltar/atenuar, despiece, corte, etiquetas y viajes de cámara.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class Viewer {
  constructor(container, { labelLayer, background = 0x0f1b20, accent = 0xf2a33a } = {}) {
    this.container = container;
    this.labelLayer = labelLayer;
    this.accent = new THREE.Color(accent);
    this.parts = new Map();          // id -> { id, def, object, meshes, mats, basePos }
    this.frameHooks = [];
    this.focus = null;
    this.labelsOn = true;
    this.labelIds = [];
    this.explodeT = 0;
    this.cutOn = false;

    const isMobile = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
    this.isMobile = isMobile;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: !isMobile || devicePixelRatio < 2, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.localClippingEnabled = true;
    container.appendChild(r.domElement);
    r.domElement.setAttribute('aria-label', 'Vista 3D interactiva de la turbina. Arrastrá para rotar, pellizcá o usá la rueda para acercar.');
    r.domElement.setAttribute('role', 'img');

    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color(background);
    const pm = new THREE.PMREMGenerator(r);
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.55;
    s.add(new THREE.HemisphereLight(0xdfefff, 0x1a2a2e, 0.6));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.6); key.position.set(1.2, 2.2, 1.6); s.add(key);
    const rim = new THREE.DirectionalLight(0x9fd8ff, 0.8); rim.position.set(-1.5, 0.6, -1.2); s.add(rim);

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.01, 30);
    this.camera.position.set(1.2, 0.6, 1.4);
    const c = this.controls = new OrbitControls(this.camera, r.domElement);
    c.enableDamping = true; c.dampingFactor = 0.08;
    c.minDistance = 0.32; c.maxDistance = 4.5;
    c.target.set(0, 0.2, 0);
    c.addEventListener('start', () => { this._tween = null; this.onUserOrbit?.(); });

    this.cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    this.timer = new THREE.Timer(); this.timer.connect?.(document);
    this.raycaster = new THREE.Raycaster();

    this._resize = () => this.resize();
    new ResizeObserver(this._resize).observe(container);
    this.resize();
    this._bindPick();
    r.setAnimationLoop(() => this._frame());
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  /** Carga el GLB. partDefs: { idNodo: { nombre, explode:[x,y,z], cut:bool, anchor:[x,y,z], ... } } */
  async load(url, partDefs, onProgress) {
    const gltf = await new GLTFLoader().loadAsync(url, e => e.total && onProgress?.(e.loaded / e.total));
    const root = gltf.scene;
    const found = new Set();
    root.traverse(o => {
      if (!o.isMesh) return;
      // buscar el id de pieza: el propio nodo o el ancestro más cercano con definición
      let n = o, id = null;
      while (n) { if (partDefs[n.name]) { id = n.name; break; } n = n.parent; }
      if (!id) return;
      found.add(id);
      o.geometry = toCreasedNormals(o.geometry, THREE.MathUtils.degToRad(32));
      o.material = o.material.clone();
      o.material.side = THREE.DoubleSide;
    });
    this.scene.add(root);
    for (const id of found) {
      const obj = root.getObjectByName(id);
      this._register(id, obj, partDefs[id]);
    }
    this.model = root;
    return { root, missing: Object.keys(partDefs).filter(k => !found.has(k) && !partDefs[k].procedural) };
  }

  /** Registra una pieza procedural (entorno: pileta, caño, agua...) */
  addPart(id, object, def) { this.scene.add(object); this._register(id, object, def); }

  _register(id, object, def) {
    const meshes = [];
    object.traverse(o => { if (o.isMesh) meshes.push(o); });
    const mats = meshes.map(m => m.material);
    mats.forEach(m => {
      m.userData.base = { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite, emissive: m.emissive ? m.emissive.clone() : null, emissiveIntensity: m.emissiveIntensity ?? 1 };
      if (def.cut) m.clippingPlanes = [];
    });
    meshes.forEach(m => m.userData.partId = id);
    this.parts.set(id, { id, def, object, meshes, mats, basePos: object.position.clone(), ghost: 0, hl: 0, ghostTarget: 0, hlTarget: 0 });
  }

  part(id) { return this.parts.get(id); }

  /** Resalta un conjunto de piezas; el resto queda atenuado (si ghost=true). focus=null -> todo normal. */
  setFocus(ids, { ghost = true, ghostOpacity = 0.14 } = {}) {
    this.focus = ids && ids.length ? new Set(ids) : null;
    this.ghostOpacity = ghostOpacity;
    for (const p of this.parts.values()) {
      const inFocus = !this.focus || this.focus.has(p.id);
      p.ghostTarget = (!inFocus && ghost && !p.def.noGhost) ? 1 : 0;
      p.hlTarget = this.focus && inFocus && !p.def.noHighlight ? 1 : 0;
    }
  }

  setVisible(id, v) { const p = this.parts.get(id); if (p) p.object.visible = v; }

  setExplode(t) {
    this.explodeT = t;
    for (const p of this.parts.values()) {
      const e = p.def.explode; if (!e) continue;
      p.object.position.set(p.basePos.x + e[0] * t, p.basePos.y + e[1] * t, p.basePos.z + e[2] * t);
    }
  }

  setCut(on) {
    this.cutOn = on;
    for (const p of this.parts.values()) {
      if (!p.def.cut) continue;
      p.mats.forEach(m => { m.clippingPlanes = on ? [this.cutPlane] : []; m.needsUpdate = true; });
    }
  }

  /** Viaje de cámara suave */
  flyTo({ pos, target }, dur = 1.4) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 0.01;
    // en pantallas verticales (celular) alejar la cámara para que entre el mismo encuadre
    const a = this.camera.aspect, k = a < 1.2 ? 1 + (1.2 - a) * 0.75 : 1;
    const tg = new THREE.Vector3(...target), p1 = new THREE.Vector3(...pos).sub(tg).multiplyScalar(k).add(tg);
    this._tween = {
      t: 0, dur,
      p0: this.camera.position.clone(), p1,
      t0: this.controls.target.clone(), t1: new THREE.Vector3(...target),
    };
  }

  setLabels(ids) { this.labelIds = ids || []; this._buildLabels(); }
  setLabelsOn(on) { this.labelsOn = on; this.labelLayer && (this.labelLayer.hidden = !on); }

  _buildLabels() {
    if (!this.labelLayer) return;
    this.labelLayer.replaceChildren();
    this._labelEls = [];
    for (const id of this.labelIds) {
      const p = this.parts.get(id); if (!p || !p.def.anchor) continue;
      const b = document.createElement('button');
      b.className = 'hotspot';
      b.type = 'button';
      b.innerHTML = `<span class="dot" aria-hidden="true"></span><span class="txt">${p.def.nombre}</span>`;
      b.setAttribute('aria-label', `Pieza: ${p.def.nombre}. Ver detalle`);
      b.addEventListener('click', ev => { ev.stopPropagation(); this.onPick?.(id); });
      this.labelLayer.appendChild(b);
      this._labelEls.push({ el: b, p, v: new THREE.Vector3() });
    }
  }

  _updateLabels() {
    if (!this._labelEls || !this.labelsOn) return;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    for (const L of this._labelEls) {
      const a = L.p.def.anchor;
      L.v.set(a[0], a[1], a[2]).add(L.p.object.position).sub(L.p.basePos);
      L.v.project(this.camera);
      const vis = L.v.z < 1 && Math.abs(L.v.x) < 1.05 && Math.abs(L.v.y) < 1.05 && L.p.object.visible;
      L.el.style.display = vis ? '' : 'none';
      if (vis) L.el.style.transform = `translate(${(L.v.x * 0.5 + 0.5) * w}px, ${(-L.v.y * 0.5 + 0.5) * h}px)`;
    }
  }

  _bindPick() {
    const el = this.renderer.domElement; let down = null;
    el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const r = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const meshes = [];
      for (const p of this.parts.values()) if (p.object.visible && !p.def.noPick && p.ghost < 0.5) meshes.push(...p.meshes);
      const hits = this.raycaster.intersectObjects(meshes, false).filter(h => !this.cutOn || !h.object.material.clippingPlanes?.length || this.cutPlane.distanceToPoint(h.point) >= 0);
      if (hits.length) this.onPick?.(hits[0].object.userData.partId);
    });
  }

  onFrame(fn) { this.frameHooks.push(fn); }

  /** Para pruebas automatizadas: detiene el bucle y avanza n cuadros con dt fijo */
  pause() { this.renderer.setAnimationLoop(null); this._manualDt = 0.05; }
  resume() { this._manualDt = null; this.renderer.setAnimationLoop(() => this._frame()); }
  advance(n = 1, dt = 0.05) { this._manualDt = dt; for (let i = 0; i < n; i++) this._frame(); }

  _frame() {
    let dt, time;
    if (this._manualDt) { dt = this._manualDt; time = (this._mt = (this._mt || 0) + dt); }
    else { this.timer.update(); dt = Math.min(this.timer.getDelta(), 0.05); time = this.timer.getElapsed(); }
    if (this._tween) {
      const T = this._tween; T.t += dt / T.dur; const k = ease(Math.min(T.t, 1));
      this.camera.position.lerpVectors(T.p0, T.p1, k);
      this.controls.target.lerpVectors(T.t0, T.t1, k);
      if (T.t >= 1) this._tween = null;
    }
    // transiciones de atenuado/resaltado
    const pulse = 0.55 + 0.45 * Math.sin(time * 3.2);
    for (const p of this.parts.values()) {
      p.ghost += (p.ghostTarget - p.ghost) * Math.min(1, dt * 6);
      p.hl += (p.hlTarget - p.hl) * Math.min(1, dt * 6);
      for (const m of p.mats) {
        const b = m.userData.base;
        const op = b.opacity * (1 - p.ghost) + this.ghostOpacity * b.opacity * p.ghost;
        const tr = b.transparent || p.ghost > 0.01;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        m.opacity = op;
        m.depthWrite = b.depthWrite && p.ghost < 0.5;
        if (m.emissive && b.emissive) {
          m.emissive.copy(b.emissive).lerp(this.accent, p.hl * 0.55 * pulse);
          m.emissiveIntensity = b.emissiveIntensity + p.hl * 0.35 * pulse;
        }
      }
    }
    for (const fn of this.frameHooks) fn(dt, time);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this._updateLabels();
  }
}

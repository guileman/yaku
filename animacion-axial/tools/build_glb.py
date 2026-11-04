"""Paso 2 del pipeline: GLB crudo de OCCT -> GLB web con piezas agrupadas, nombradas,
materiales PBR propios y decimación. Uso: python3 build_glb.py raw.glb salida.glb"""
import sys, re, collections, json
import numpy as np, trimesh
from trimesh.visual.material import PBRMaterial
import fast_simplification

src, dst = sys.argv[1], sys.argv[2]
s = trimesh.load(src, force='scene')
g = s.graph

# --- 1) reunir primitivas por instancia de pieza (nombre de nodo OCCT sin sufijo) ---
inst = collections.OrderedDict()
for node in g.nodes_geometry:
    T, geom = g[node]
    m = s.geometry[geom]
    if not isinstance(m, trimesh.Trimesh) or len(m.faces) == 0:
        continue
    m = m.copy(); m.apply_transform(T)
    inst.setdefault(node.rsplit('_', 1)[0], []).append(m)

def radial(m):
    c = m.bounds.mean(axis=0); return float(np.hypot(c[0], c[2]))

# --- 2) clasificar instancias en grupos lógicos ---
def classify(name, ms):
    m = trimesh.util.concatenate(ms); y0, y1 = m.bounds[:, 1] * 1000
    n = name
    if n.startswith('Cubierta') or n.startswith('Anclaje'): return 'cubierta'
    if n.startswith('Helice'): return 'helice'
    if n.startswith('Cono salida') or n.startswith('TUERCA HEX M12'): return 'cono'
    if n.startswith('Eje'): return 'eje'
    if n.startswith('Estriado') or n == '=>[0:1:1:37]': return 'acople'           # suplemento estriado + hub motor original
    if n == '=>[0:1:1:21]' or n.startswith('Iman'): return 'rotor_gen'             # rotor exterior + imanes del motor LG
    if n.startswith('Estator') or n.startswith('Posicionador'): return 'estator'
    if n.startswith('Disco motor'): return 'disco_motor'
    if n.startswith('=>[0:1:1:32]'): return 'deflectores'                          # Deflector AL 3 (x8)
    if n.startswith('Disco superior'): return 'disco_superior'
    if n.startswith('Disco inferior') : return 'disco_inferior'
    if n.startswith('Burlete'): return 'burlete'
    if n == '=>[0:1:1:12]': return 'buje'                                          # Buje inferior Ø20x40 (sumergido)
    if n.startswith('RODAMIENTO') or n.startswith('ARALNDELA'): return 'rodamiento'
    if n.startswith(('CAÑO', '05_')) or n.startswith('TAPA'): return 'columna'
    # tornillería: según posición
    if 'SEEGER' in n: return 'eje'
    if 'DIN 933' in n and y0 > 490: return 'acople'      # bulones del hub (giran)
    if y0 > 420: return 'disco_motor'
    if y0 > 100: return 'disco_superior'
    return 'disco_inferior'

groups = collections.OrderedDict()
for name, ms in inst.items():
    groups.setdefault(classify(name, ms), []).extend(ms)

# --- 3) materiales ---
def mat(name, rgb, metal, rough, alpha=1.0):
    return PBRMaterial(name=name, baseColorFactor=[*rgb, alpha], metallicFactor=metal, roughnessFactor=rough, doubleSided=True)
M = {
  'fibra':   mat('fibra_vidrio_blanca', [0.86, 0.87, 0.86], 0.0, 0.42),
  'alu':     mat('aluminio',            [0.78, 0.80, 0.82], 0.9, 0.38),
  'alu2':    mat('aluminio_deflector',  [0.82, 0.84, 0.86], 0.95, 0.28),
  'pvc':     mat('pvc_negro',           [0.07, 0.075, 0.08], 0.0, 0.55),
  'inox':    mat('acero_inox',          [0.80, 0.80, 0.78], 1.0, 0.22),
  'helice':  mat('helice_inox',         [0.84, 0.82, 0.76], 1.0, 0.18),
  'rojo':    mat('rojo_cono',           [0.70, 0.06, 0.04], 0.2, 0.45),
  'cobre':   mat('cobre_bobinado',      [0.72, 0.42, 0.20], 1.0, 0.35),
  'acero':   mat('acero_oscuro',        [0.30, 0.31, 0.33], 0.9, 0.45),
  'goma':    mat('goma_epdm',           [0.04, 0.04, 0.04], 0.0, 0.8),
  'bronce':  mat('buje_polimero',       [0.85, 0.80, 0.62], 0.0, 0.5),
}
GM = {'cubierta':'fibra','helice':'helice','cono':'rojo','eje':'inox','acople':'acero','rotor_gen':'acero',
      'estator':'cobre','disco_motor':'alu','deflectores':'alu2','disco_superior':'alu','disco_inferior':'alu',
      'burlete':'goma','buje':'bronce','rodamiento':'inox','columna':'pvc'}
# objetivo de caras por grupo (decimación)
TARGET = {'rodamiento': 3000, 'rotor_gen': 14000, 'columna': 12000, 'burlete': 2400, 'estator': 8000,
          'acople': 8000, 'disco_motor': 10000, 'disco_superior': 14000, 'disco_inferior': 14000, 'cubierta': 9000}

out = trimesh.Scene()
stats = {}
for gname, ms in groups.items():
    m = trimesh.util.concatenate(ms)
    nf0 = len(m.faces)
    tgt = TARGET.get(gname)
    if tgt and nf0 > tgt:
        m.merge_vertices()
        v, f = fast_simplification.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32), 1 - tgt / len(m.faces))
        m = trimesh.Trimesh(v, f, process=True)
        m.merge_vertices()
    # normales: se recalculan con pliegue en el visor (toCreasedNormals); acá solo limpieza
    m.visual = trimesh.visual.TextureVisuals(material=M[GM[gname]])
    stats[gname] = (nf0, len(m.faces))
    out.add_geometry(m, node_name=gname, geom_name=gname)

out.export(dst)
for k, (a, b) in stats.items(): print(f"{k:15s} {a:7d} -> {b:7d}")
print("total", sum(b for a, b in stats.values()))

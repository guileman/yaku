// Build de la animación: genera los dos archivos que usa index.html (scripts clásicos, sin módulos ES),
// para que funcione con doble clic (file://) y también en cualquier hosting.
//   js/app.bundle.js          ← src/main.js + three.js (libs/three) empaquetado como IIFE
//   js/modelo-<id>.js         ← models/<id>.glb embebido en base64 (window.YAKU_MODELOS[id])
// Uso:  npm install   (una vez)   y luego   npm run build
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LIBS = join(ROOT, 'libs', 'three');
mkdirSync(join(ROOT, 'js'), { recursive: true });

// 'three' y 'three/addons/...' -> copia local en libs/three (misma resolución que el antiguo importmap)
const threeLocal = {
  name: 'three-local',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: join(LIBS, 'build', 'three.module.js') }));
    b.onResolve({ filter: /^three\/addons\// }, a => ({ path: join(LIBS, 'examples', 'jsm', a.path.slice('three/addons/'.length)) }));
  },
};

// 1) modelos embebidos
for (const f of readdirSync(join(ROOT, 'models')).filter(f => f.toLowerCase().endsWith('.glb'))) {
  const id = f.replace(/\.glb$/i, '');
  const b64 = readFileSync(join(ROOT, 'models', f)).toString('base64');
  const out = join(ROOT, 'js', `modelo-${id}.js`);
  writeFileSync(out, `/* Generado por build.mjs a partir de models/${f}. No editar. */\n(window.YAKU_MODELOS=window.YAKU_MODELOS||{})[${JSON.stringify(id)}]="${b64}";\n`);
  console.log(`modelo  ${f} -> js/modelo-${id}.js (${(b64.length / 1048576).toFixed(2)} MiB)`);
}

// 2) aplicación
const r = await build({
  entryPoints: [join(ROOT, 'src', 'main.js')],
  outfile: join(ROOT, 'js', 'app.bundle.js'),
  bundle: true, format: 'iife', target: ['chrome100', 'edge100', 'firefox100', 'safari15'],
  minify: true, legalComments: 'eof', plugins: [threeLocal], logLevel: 'warning', metafile: true,
  banner: { js: '/* Yaku Energía · animación LH 140 — generado por build.mjs desde src/. No editar a mano. */' },
});
const kb = Object.values(r.metafile.outputs)[0].bytes / 1024;
console.log(`app     src/main.js -> js/app.bundle.js (${kb.toFixed(0)} KiB)`);

// Pruebas del motor del cubo: node tests/engine.test.mjs  (npm test)
// Compara el motor optimizado con la implementación original (1.26.0) y comprueba que la copia de index.html no se desvía.
import { readFileSync } from 'node:fs';
import * as E from '../src/cube-engine.js';

// ---- Referencia: código original de 1.26.0 ----
const FACES = E.FACES, NAME = E.NAME, solvedCube = E.solvedCube;
const ROT = { 0: v => [v[0], -v[2], v[1]], 1: v => [v[2], v[1], -v[0]], 2: v => [-v[1], v[0], v[2]] };
const mvOld = (cube, m) => {
  const f = m[0], q = m.endsWith("'") ? 3 : m.endsWith('2') ? 2 : 1, n = FACES[f], ax = n.findIndex(x => x), sg = n[ax];
  const times = sg > 0 ? 3 * q : q;
  for (const s of cube) if (s.p[ax] === sg) for (let i = 0; i < times; i++) { s.p = ROT[ax](s.p); s.n = ROT[ax](s.n); }
};
const sigOld = c => c.map(s => s.p + '|' + s.n + '|' + s.c).sort().join();
const isSolvedOld = c => c.every(s => s.c === NAME[s.n]);
const cloneOld = c => c.map(s => ({ p: [...s.p], n: [...s.n], c: s.c }));
const FPo = { U: (r, k) => [-1 + k, 1, -1 + r], R: (r, k) => [1, 1 - r, 1 - k], F: (r, k) => [-1 + k, 1 - r, 1], D: (r, k) => [-1 + k, -1, 1 - r], L: (r, k) => [-1, 1 - r, -1 + k], B: (r, k) => [1 - k, 1 - r, -1] };
const stickerAtOld = (c, f, i) => { const p = FPo[f](i / 3 | 0, i % 3); return c.find(x => x.n + '' === FACES[f] + '' && x.p + '' === p + ''); };
const toFaceletsOld = c => { let o = ''; 'URFDLB'.split('').forEach(f => { for (let i = 0; i < 9; i++) o += stickerAtOld(c, f, i).c; }); return o; };

// ---- Utilidades ----
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const MOVES = [...'UDLRFB'].flatMap(f => [f, f + "'", f + '2']);
const scr = n => Array.from({ length: n }, () => MOVES[rnd() * 18 | 0]);
const norm = c => JSON.stringify(c.map(s => ({ p: s.p.map(x => x + 0), n: s.n.map(x => x + 0), c: s.c })));
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.error('FALLO:', msg); } };

// 1) mv: mismo estado tras cualquier secuencia
for (let t = 0; t < 400; t++) {
  const a = solvedCube(), b = solvedCube(), seq = scr(1 + rnd() * 40 | 0);
  for (const m of seq) { mvOld(a, m); E.mv(b, m); }
  ok(norm(a) === norm(b), 'mv ' + seq.join(' '));
  ok(E.isSolved(b) === isSolvedOld(a), 'isSolved');
  ok(toFaceletsOld(a) === E.toFacelets(b), 'toFacelets');
  ok(norm(E.fromFacelets(E.toFacelets(b))) === norm(E.fromFacelets(toFaceletsOld(a))), 'fromFacelets');
  ok(norm(E.clone(b)) === norm(cloneOld(a)), 'clone');
}
// 2) giros que no cambian nada y su inverso
for (const f of 'UDLRFB') { const c = solvedCube(); E.mv(c, f); E.mv(c, f + "'"); ok(E.isSolved(c), 'inverso ' + f); const d = solvedCube(); for (let i = 0; i < 4; i++) E.mv(d, f); ok(E.isSolved(d), '4 giros ' + f); const e = solvedCube(); E.mv(e, f + '2'); E.mv(e, f + '2'); ok(E.isSolved(e), 'doble ' + f); }
// 3) sig: igualdad equivalente a la original, también con el array desordenado
const pool = []; for (let t = 0; t < 250; t++) { const c = solvedCube(); scr(rnd() * 12 | 0).forEach(m => E.mv(c, m)); pool.push(c); }
pool.push(solvedCube(), (() => { const c = solvedCube(); ['R', "R'"].forEach(m => E.mv(c, m)); return c; })());
for (let i = 0; i < pool.length; i++) for (let j = i; j < pool.length; j += 7) {
  const same = sigOld(pool[i]) === sigOld(pool[j]), shuf = pool[j].slice().sort(() => rnd() - .5);
  ok((E.sig(pool[i]) === E.sig(pool[j])) === same, 'sig equivalencia ' + i + ',' + j);
  ok((E.sig(pool[i]) === E.sig(shuf)) === same, 'sig orden ' + i + ',' + j);
}
ok(new Set(pool.map(E.sig)).size === new Set(pool.map(sigOld)).size, 'sig: nº de estados distintos');
// 4) la copia de index.html es idéntica al módulo
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const m = /\/\*ENGINE-START\*\/([\s\S]*?)\/\*ENGINE-END\*\//.exec(html); ok(!!m, 'bloque ENGINE en index.html');
const mod = readFileSync(new URL('../src/cube-engine.js', import.meta.url), 'utf8');
const m2 = /\/\*ENGINE-START\*\/([\s\S]*?)\/\*ENGINE-END\*\//.exec(mod);
ok(m && m2 && m[1] === m2[1], 'index.html y src/cube-engine.js tienen bloques distintos (copia desviada)');
if (m) { const H = new Function('FACES', 'NAME', 'solvedCube', m[1] + ';return{mv,sig,isSolved,clone,fromFacelets,toFacelets}')(FACES, NAME, solvedCube);
  const a = solvedCube(), b = solvedCube(); scr(30).forEach(x => { E.mv(a, x); H.mv(b, x); }); ok(H.sig(a) === E.sig(b) && H.toFacelets(b) === E.toFacelets(a), 'copia index.html funciona igual'); }

// 5) rendimiento (informativo)
const bench = (name, f, n) => { const t = performance.now(); for (let i = 0; i < n; i++) f(i); return (performance.now() - t); };
const cA = solvedCube(), cB = solvedCube(), long = scr(200);
const t1 = bench('mv old', () => long.forEach(x => mvOld(cA, x)), 200), t2 = bench('mv new', () => long.forEach(x => E.mv(cB, x)), 200);
const s1 = bench('sig old', () => sigOld(cA), 20000), s2 = bench('sig new', () => E.sig(cB), 20000);
const f1 = bench('facelets old', () => toFaceletsOld(cA), 3000), f2 = bench('facelets new', () => E.toFacelets(cB), 3000);
console.log(`mv        ${t1.toFixed(0)} ms -> ${t2.toFixed(0)} ms  (x${(t1 / t2).toFixed(1)})`);
console.log(`sig       ${s1.toFixed(0)} ms -> ${s2.toFixed(0)} ms  (x${(s1 / s2).toFixed(1)})`);
console.log(`facelets  ${f1.toFixed(0)} ms -> ${f2.toFixed(0)} ms  (x${(f1 / f2).toFixed(1)})`);
console.log(fails ? `\n${fails} FALLOS` : '\nTodas las pruebas OK');
process.exit(fails ? 1 : 0);

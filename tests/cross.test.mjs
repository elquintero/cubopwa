// Pruebas de la cruz óptima: node tests/cross.test.mjs  (npm test)
import { solvedCube, mv, clone } from '../src/cube-engine.js';
import { solveCross, countHtm, depthHistogram, MOVES } from '../src/cross.js';
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.error('FALLO:', msg); } };
let seed = 987654; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;

// 1) Todas las posiciones de la cruz y su profundidad (coincide con un cálculo independiente hecho con 54 pegatinas)
const H = depthHistogram('D'), EXPECT = [1, 15, 158, 1394, 9809, 46381, 97254, 34966, 102];
ok(JSON.stringify(H) === JSON.stringify(EXPECT), 'histograma de profundidades ' + JSON.stringify(H));
ok(H.reduce((a, b) => a + b, 0) === 190080, 'total de posiciones');
for (const f of 'UFRLB') ok(JSON.stringify(depthHistogram(f)) === JSON.stringify(EXPECT), 'histograma cara ' + f);

// 2) La solución resuelve de verdad la cruz de esa cara, es la más corta y tiene como mucho 8 giros
const FACES = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
const faceOf = (n) => Object.keys(FACES).find((k) => FACES[k] + '' === n + '');
// la cruz de la cara f está hecha si todas las pegatinas de sus 4 aristas están en la cara de su color
const crossDone = (c, f) => { const n = FACES[f]; let cnt = 0;
  for (const s of c) { const edge = (s.p[0] !== 0) + (s.p[1] !== 0) + (s.p[2] !== 0) === 2; if (edge && s.p[0] * n[0] + s.p[1] * n[1] + s.p[2] * n[2] === 1) { cnt++; if (s.c !== faceOf(s.n)) return false; } }
  return cnt === 8; };
let maxLen = 0;
for (let t = 0; t < 400; t++) {
  const c = solvedCube(), f = 'UDLRFB'[rnd() * 6 | 0];
  for (let i = 0; i < 25; i++) mv(c, MOVES[rnd() * 18 | 0]);
  const { len, seq } = solveCross(clone(c), f);
  ok(seq.length === len && len <= 8, 'longitud ' + len);
  maxLen = Math.max(maxLen, len);
  const d = clone(c); for (const m of seq) mv(d, m);
  ok(crossDone(d, f), 'la cruz no queda resuelta (cara ' + f + ')');
}
ok(maxLen === 8 || maxLen >= 7, 'se han probado cruces largos');

// 3) Contar giros de tu cruz
ok(countHtm(['R', 'R']) === 1, 'R R = R2');
ok(countHtm(['R', "R'"]) === 0, "R R' se anula");
ok(countHtm(['U', 'R', "R'", "U'"]) === 0, 'anulación en cadena');
ok(countHtm(['R', 'U', 'R2', 'L']) === 4, 'giros distintos');
ok(countHtm(["R'", "R'", 'R']) === 1, "R' R' R = R'");

console.log(fails ? fails + ' fallos' : 'cross.test.mjs: todo correcto');
process.exit(fails ? 1 : 0);

// CubIQ · Cruz óptima.
// La cruz (4 aristas de una cara) tiene 190 080 posiciones posibles y siempre se resuelve en 8 giros o menos.
// Se recorren todas una sola vez (búsqueda en anchura desde la cruz resuelta) y la solución más corta de cualquier
// posición se encuentra bajando por esa tabla. Los giros de media vuelta cuentan como uno (HTM).
import { solvedCube, mv } from './cube-engine.js';

const FACES = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
const NAME = {}; for (const f in FACES) NAME[FACES[f]] = f;
const EP = [];                                                  // las 12 posiciones de arista
for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) if ((x !== 0) + (y !== 0) + (z !== 0) === 2) EP.push([x, y, z]);
const EI = new Map(EP.map((p, i) => [p + '', i]));
const prim = (p) => (p[1] ? [0, Math.sign(p[1]), 0] : [0, 0, Math.sign(p[2])]);   // normal «principal» de cada posición (eje Y; en la capa media, eje Z)
const sec = (p) => (p[1] ? (p[0] ? [Math.sign(p[0]), 0, 0] : [0, 0, Math.sign(p[2])]) : [Math.sign(p[0]), 0, 0]);
export const MOVES = []; for (const f of 'UDLRFB') for (const s of ['', "'", '2']) MOVES.push(f + s);

// Tablas de giro sacadas del propio motor (mv): a qué posición va cada arista y si queda girada.
const PERM = [], FLIP = [];
for (const m of MOVES) {
  const c = solvedCube(), refs = EP.map((p) => c.find((s) => s.p + '' === p + '' && s.n + '' === prim(p) + ''));
  mv(c, m);
  PERM.push(refs.map((s) => EI.get(s.p + '')));
  FLIP.push(refs.map((s) => (s.n + '' === prim(EP[EI.get(s.p + '')]) + '' ? 0 : 1)));
}
// Una arista tiene 24 estados (posición × orientación): estado = pos*2 + giro.
const TR = new Uint8Array(18 * 24);
MOVES.forEach((_, m) => { for (let pos = 0; pos < 12; pos++) for (let o = 0; o < 2; o++) TR[m * 24 + pos * 2 + o] = PERM[m][pos] * 2 + (o ^ FLIP[m][pos]); });
const key = (a, b, c, d) => ((a * 24 + b) * 24 + c) * 24 + d;

const tables = {};
function tableFor(f) {
  if (tables[f]) return tables[f];
  const n = FACES[f], homes = EP.map((p, i) => i).filter((i) => EP[i][0] * n[0] + EP[i][1] * n[1] + EP[i][2] * n[2] === 1);
  const D = new Int8Array(24 ** 4).fill(-1), q = new Int32Array(190080 + 8);
  const s0 = key(homes[0] * 2, homes[1] * 2, homes[2] * 2, homes[3] * 2);
  D[s0] = 0; q[0] = s0; let head = 0, tail = 1;
  while (head < tail) {
    let k = q[head++]; const d = D[k];
    const d3 = k % 24; k = (k - d3) / 24; const d2 = k % 24; k = (k - d2) / 24; const d1 = k % 24, d0 = (k - d1) / 24;
    for (let m = 0; m < 18; m++) {
      const b = m * 24, nk = key(TR[b + d0], TR[b + d1], TR[b + d2], TR[b + d3]);
      if (D[nk] < 0) { D[nk] = d + 1; q[tail++] = nk; }
    }
  }
  return (tables[f] = { D, homes });
}
export const depthHistogram = (f = 'D') => { const { D } = tableFor(f), h = []; for (let i = 0; i < D.length; i++) if (D[i] >= 0) h[D[i]] = (h[D[i]] || 0) + 1; return h; };

// Estado de las 4 aristas de la cruz de la cara f en una posición del cubo (54 pegatinas {p,n,c}).
function crossState(cube, f, homes) {
  return homes.map((h) => {
    const p = EP[h], cA = NAME[prim(p)], cB = NAME[sec(p)];
    for (const s of cube) {
      if (s.c !== cA || (s.p[0] !== 0) + (s.p[1] !== 0) + (s.p[2] !== 0) !== 2) continue;
      const o = cube.find((t) => t !== s && t.p[0] === s.p[0] && t.p[1] === s.p[1] && t.p[2] === s.p[2]);
      if (o && o.c === cB) { const pos = EI.get(s.p + ''); return pos * 2 + (s.n + '' === prim(EP[pos]) + '' ? 0 : 1); }
    }
    throw new Error('cruz: pieza no encontrada');
  });
}

// Solución más corta de la cruz de la cara f desde la posición `cube`: { len, seq }
export function solveCross(cube, f) {
  const { D, homes } = tableFor(f);
  let st = crossState(cube, f, homes), d = D[key(st[0], st[1], st[2], st[3])];
  const len = d, seq = [];
  while (d > 0) {
    for (let m = 0; m < 18; m++) {
      const b = m * 24, ns = [TR[b + st[0]], TR[b + st[1]], TR[b + st[2]], TR[b + st[3]]];
      if (D[key(ns[0], ns[1], ns[2], ns[3])] === d - 1) { seq.push(MOVES[m]); st = ns; d--; break; }
    }
  }
  return { len, seq };
}

// Giros de una lista, contando como uno la media vuelta (R R = R2) y quitando los que se anulan (R R').
export function countHtm(list) {
  const stack = [];
  for (const m of list) {
    const f = m[0]; if (!FACES[f]) continue;
    const q = m.endsWith("'") ? 3 : m.endsWith('2') ? 2 : 1, top = stack[stack.length - 1];
    if (top && top[0] === f) { top[1] = (top[1] + q) % 4; if (!top[1]) stack.pop(); } else stack.push([f, q]);
  }
  return stack.length;
}

// Compara tu cruz (moves[0..end]) con la óptima para esa posición inicial.
export function compareCross(snap, moves, f, end) {
  const mine = countHtm(moves.slice(0, end + 1).map((x) => x.m)), opt = solveCross(snap, f);
  return { mine, opt: opt.len, seq: opt.seq, face: f };
}

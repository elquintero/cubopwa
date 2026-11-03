// CubIQ · Análisis de resoluciones: detecta fases (F2L, OLL, PLL), identifica el caso y estima el tiempo ahorrable.
const CM = () => globalThis.CM || window.CM;
// Giros/s mínimos que se suponen al ejecutar un algoritmo ya memorizado (valores propios, ajustables; no vienen de una fuente verificada).
export const TPS_ALG = { OLL: 5, PLL: 6 };
const OPP = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };
const ID = { U: 'U', D: 'D', L: 'L', R: 'R', F: 'F', B: 'B' };
// Posición de entrenamiento: AMARILLO arriba y VERDE de frente (cubo girado z2 respecto a blanco arriba).
export const HOLD = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'F', B: 'B' };

// ---- Algoritmos (notación estándar, con giros de capa doble, slices y rotaciones) ----
export const OLL = {
  1: "R U2 R2 F R F' U2 R' F R F'", 2: "F R U R' U' F' f R U R' U' f'", 3: "f R U R' U' f' U' F R U R' U' F'",
  4: "f R U R' U' f' U F R U R' U' F'", 5: "r' U2 R U R' U r", 6: "r U2 R' U' R U' r'", 7: "r U R' U R U2 r'",
  8: "r' U' R U' R' U2 r", 9: "R U R' U' R' F R2 U R' U' F'", 10: "R U R' U R' F R F' R U2 R'",
  11: "r U R' U R' F R F' R U2 r'", 12: "F R U R' U' F' U F R U R' U' F'", 13: "F U R U2 R' U' R U R' F'",
  14: "R' F R U R' F' R F U' F'", 15: "r' U' r R' U' R U r' U r", 16: "r U r' R U R' U' r U' r'",
  17: "R U R' U R' F R F' U2 R' F R F'", 18: "r U R' U R U2 r2 U' R U' R' U2 r", 19: "r' R U R U R' U' r R2 F R F'",
  20: "r U R' U' M2 U R U' R' U' M'", 21: "R U2 R' U' R U R' U' R U' R'", 22: "R U2 R2 U' R2 U' R2 U2 R",
  23: "R2 D R' U2 R D' R' U2 R'", 24: "r U R' U' r' F R F'", 25: "F' r U R' U' r' F R", 26: "R U2 R' U' R U' R'",
  27: "R U R' U R U2 R'", 28: "r U R' U' M U R U' R'", 29: "R U R' U' R U' R' F' U' F R U R'",
  30: "F R' F R2 U' R' U' R U R' F2", 31: "R' U' F U R U' R' F' R", 32: "R U B' U' R' U R B R'",
  33: "R U R' U' R' F R F'", 34: "R U R2 U' R' F R U R U' F'", 35: "R U2 R2 F R F' R U2 R'",
  36: "L' U' L U' L' U L U L F' L' F", 37: "F R' F' R U R U' R'", 38: "R U R' U R U' R' U' R' F R F'",
  39: "R U R' F' U' F U R U2 R'", 40: "R' F R U R' U' F' U R", 41: "R U R' U R U2 R' F R U R' U' F'",
  42: "R' U' R U' R' U2 R F R U R' U' F'", 43: "R' U' F' U F R", 44: "F U R U' R' F'", 45: "F R U R' U' F'",
  46: "R' U' R' F R F' U R", 47: "R' U' R' F R F' R' F R F' U R", 48: "F R U R' U' R U R' U' F'",
  49: "r U' r2 U r2 U r2 U' r", 50: "r' U r2 U' r2 U' r2 U r'", 51: "f R U R' U' R U R' U' f'",
  52: "R U R' U R U' B U' B' R'", 53: "r' U' R U' R' U R U' R' U2 r", 54: "r U R' U R U' R' U R U2 r'",
  55: "R U2 R2 U' R U' R' U2 F R F'", 56: "r U r' U R U' R' U R U' R' r U' r'", 57: "R U R' U' M' U R U' r'"
};
export const PLL = {
  Aa: "x R' U R' D2 R U' R' D2 R2 x'", Ab: "x R2 D2 R U R' D2 R U' R x'",
  E: "x' R U' R' D R U R' D' R U R' D R U' R' D' x", F: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
  Ga: "R2 U R' U R' U' R U' R2 D U' R' U R D'", Gb: "R' U' R U D' R2 U R' U R U' R U' R2 D",
  Gc: "R2 U' R U' R U R' U R2 D' U R U' R' D", Gd: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
  H: "M2 U M2 U2 M2 U M2", Ja: "x R2 F R F' R U2 r' U r U2 x'", Jb: "R U R' F' R U R' U' R' F R2 U' R'",
  Na: "z U R' D R2 U' R D' U R' D R2 U' R D' z'", Nb: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
  Ra: "R U' R' U' R U R D R' U' R D' R' U2 R'", Rb: "R' U2 R U2 R' F R U R' U' R' F' R2",
  T: "R U R' U' R' F R2 U' R' U' R U R' F'", Ua: "R U' R U R U R U' R' U' R2", Ub: "R2 U R U R' U' R' U' R' U R'",
  V: "R' U R' U' y R' F' R2 U' R' U R' F R F", Y: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  Z: "M' U M2 U M2 U M' U2 M2"
};

// ---- Grupos para aprender CFOP (solo lo fundamental) ----
export const EOLL = { 'Línea': "F R U R' U' F'", L: "f R U R' U' f'", Punto: "F R U R' U' F' f R U R' U' f'" };
export const OCLL = { Sune: OLL[27], 'Anti-Sune': OLL[26], H: OLL[21], Pi: OLL[22], U: OLL[23], T: OLL[24], L: OLL[25] };
export const CPLL = { A: PLL.Aa, Y: PLL.Y };
export const EPLL = { Ua: PLL.Ua, Ub: PLL.Ub, H: PLL.H, Z: PLL.Z };
// F2L completo: los 41 casos de la pareja esquina+arista en la ranura delantera derecha (cruz abajo). Todos comprobados con el simulador: 41 situaciones distintas, sin romper la cruz ni las otras ranuras.
export const F2L = { 1: "U R U' R'", 2: "R U R'", 3: "F' U F R U R'", 4: "F' U' F", 5: "F' U F", 6: "R U2 R' U' R U R'", 7: "R U' R' U R U' R'", 8: "R U R' U2 R U R'", 9: "F' U' F R U R'", 10: "R U' R' F' U' F", 11: "F' U F R U2 R'", 12: "R U2 R2 F R F'", 13: "F' U F2 R' F' R", 14: "F' U' F2 R' F' R", 15: "F' U2 F2 R' F' R", 16: "R U' R' U R U R'", 17: "R U' R' U' R U R'", 18: "R U R' U2 R U' R'", 19: "R U' R' U2 R U' R'", 20: "R U2 R' U2 R U' R'", 21: "R' U2 R2 U R2 U R", 22: "R2 U2 R' U' R U' R2", 23: "R2 U R2 U R2 U2 R2", 24: "F' U F U R U R'", 25: "R U R' U F' U' F", 26: "R U' R' F R' F' R", 27: "R U' R' U F' U' F", 28: "R' F R F' R U R'", 29: "F' U F U2 R U R'", 30: "R U' R' U2 F' U' F", 31: "R U2 R' U F' U' F", 32: "R2 U2 F R2 F' U2 R2", 33: "F2 U2 R' F R U2 F2", 34: "F2 U2 R' F' R U2 F2", 35: "F' U F U' F' U' F", 36: "F2 U2 F U F' U F2", 37: "R U2 R U R' U R U2 R2", 38: "R F U R U' R' F' U' R'", 39: "R U F R U R' U' F' R'", 40: "R U' R U2 F R2 F' U2 R2", 41: "R U2 R U2 F R F' U2 R2" };
// Categoría: u = pareja arriba, c = esquina en la ranura, e = arista en la ranura, s = atascadas
export const F2L_CAT = { 1: 'u', 2: 'u', 3: 'c', 4: 'u', 5: 'u', 6: 'u', 7: 'c', 8: 'e', 9: 'u', 10: 'c', 11: 'e', 12: 'u', 13: 'c', 14: 'u', 15: 'u', 16: 'u', 17: 'u', 18: 'u', 19: 'e', 20: 'u', 21: 'u', 22: 'u', 23: 'e', 24: 'e', 25: 'e', 26: 'c', 27: 'u', 28: 'c', 29: 'u', 30: 'u', 31: 'u', 32: 'u', 33: 'u', 34: 'u', 35: 'u', 36: 'u', 37: 's', 38: 's', 39: 's', 40: 's', 41: 's' };
export const GROUPS = { F2L, EOLL, OCLL, OLL, CPLL, EPLL, PLL };
const STYLE = { OLL: 'OLL', OCLL: 'OLL', EOLL: 'EOLL', PLL: 'PLL', CPLL: 'PLL', EPLL: 'PLL' };

// ---- Orientación del cubo entero y expansión a giros de cara (los cubos inteligentes solo informan de caras) ----
const ROTMAP = {
  x: (o) => ({ U: o.F, B: o.U, D: o.B, F: o.D, L: o.L, R: o.R }),
  y: (o) => ({ F: o.R, R: o.B, B: o.L, L: o.F, U: o.U, D: o.D }),
  z: (o) => ({ U: o.L, R: o.U, D: o.R, L: o.D, F: o.F, B: o.B }),
};
const AX = { R: ['x', 1], L: ['x', -1], U: ['y', 1], D: ['y', -1], F: ['z', 1], B: ['z', -1] };
const norm4 = (q) => ((q % 4) + 4) % 4;
const emit = (out, f, q) => { q = norm4(q); if (q) out.push(f + ['', '', '2', "'"][q]); };

const _exC = new WeakMap(); // caché: mismo algoritmo y misma orientación -> mismos giros (no se modifican)
export function expand(alg, o0 = ID, ends = null) {
  if (ends) return expandRaw(alg, o0, ends);
  let m = _exC.get(o0); if (!m) _exC.set(o0, (m = new Map()));
  let r = m.get(alg); if (!r) m.set(alg, (r = expandRaw(alg, o0, null)));
  return r;
}
function expandRaw(alg, o0 = ID, ends = null) {
  let o = { ...o0 };
  const out = [];
  const rot = (a, q) => { for (let i = 0; i < norm4(q); i++) o = ROTMAP[a](o); };
  const rotFace = (F, q) => rot(AX[F][0], AX[F][1] * q);
  for (const t of alg.trim().split(/\s+/)) {
    const m = /^([RLUDFBrludfbMESxyz])(2|')?$/.exec(t);
    if (!m) throw new Error('Token no válido: ' + t);
    const f = m[1], q = m[2] === "'" ? 3 : m[2] === '2' ? 2 : 1;
    if ('RLUDFB'.includes(f)) emit(out, o[f], q);
    else if ('rludfb'.includes(f)) { const F = f.toUpperCase(); emit(out, o[OPP[F]], q); rotFace(F, q); }
    else if (f === 'M') { emit(out, o.R, q); emit(out, o.L, -q); rotFace('L', q); }
    else if (f === 'E') { emit(out, o.U, q); emit(out, o.D, -q); rotFace('D', q); }
    else if (f === 'S') { emit(out, o.F, -q); emit(out, o.B, q); rotFace('F', q); }
    else rot(f, q);
    if (ends) ends.push(out.length);
  }
  return out;
}
export const invert = (a) => a.slice().reverse().map((m) => (m.endsWith("'") ? m[0] : m.endsWith('2') ? m : m + "'"));

const ORIS = (() => {
  const seen = new Map([[JSON.stringify(ID), ID]]);
  let frontier = [ID];
  while (frontier.length) {
    const nx = [];
    for (const o of frontier) for (const a of ['x', 'y', 'z']) {
      const n = ROTMAP[a](o), k = JSON.stringify(n);
      if (!seen.has(k)) { seen.set(k, n); nx.push(n); }
    }
    frontier = nx;
  }
  return [...seen.values()];
})();
const orisWithD = (f) => ORIS.filter((o) => o.D === f);

// ---- Predicados sobre el estado ----
function isF2L(c, f) {
  const { FACES, NAME } = CM();
  const n = FACES[f], ax = n.findIndex((v) => v), sg = n[ax];
  return c.every((s) => s.p[ax] * sg < 0 || s.c === NAME[s.n]);
}
function topUniform(c, f) {
  const { FACES } = CM();
  const opp = OPP[f], n = '' + FACES[opp];
  return c.every((s) => '' + s.n !== n || s.c === opp);
}
const run = (c, moves) => { const { mv } = CM(); moves.forEach((m) => mv(c, m)); return c; };

// ---- Identificación de casos por simulación ----
// Caché acotada de identificación: analyze() y casesOf() suelen consultar
// exactamente el mismo estado durante el detalle de una resolución.
const _caseCache = { OLL: new Map(), PLL: new Map() };
function cachedCase(kind, S, f, compute) {
  const key = f + '|' + CM().sig(S);
  const cache = _caseCache[kind];
  if (cache.has(key)) return cache.get(key);
  const result = compute();
  if (cache.size >= 160) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}
function matchOLL(S, f) {
  return cachedCase('OLL', S, f, () => matchOLLRaw(S, f));
}
function matchOLLRaw(S, f) {
  const { clone } = CM();
  for (const [id, alg] of Object.entries(OLL)) for (const o of orisWithD(f)) {
    const c = run(clone(S), expand(alg, o));
    if (topUniform(c, f) && isF2L(c, f)) return { id, alg };
  }
  return null;
}
function solvedUpToAUF(c, f) {
  const { mv, isSolved, clone } = CM();
  const d = clone(c);
  for (let k = 0; k < 4; k++) { if (isSolved(d)) return true; mv(d, OPP[f]); }
  return false;
}
function matchPLL(S, f) {
  return cachedCase('PLL', S, f, () => matchPLLRaw(S, f));
}
function matchPLLRaw(S, f) {
  const { clone, mv } = CM(), top = OPP[f];
  for (const [id, alg] of Object.entries(PLL)) for (const o of orisWithD(f)) {
    const ex = expand(alg, o);
    for (let u = 0; u < 4; u++) {
      const c = clone(S);
      for (let i = 0; i < u; i++) mv(c, top);
      if (solvedUpToAUF(run(c, ex), f)) return { id, alg };
    }
  }
  return null;
}

// ---- Cruz y ranuras de F2L sobre la cara f ----
const faceAxis = (f) => { const n = CM().FACES[f]; const ax = n.findIndex((v) => v); return { ax, sg: n[ax] }; };
function crossOK(c, f) {
  const { NAME } = CM(), { ax, sg } = faceAxis(f);
  return c.every((s) => !(s.p[ax] === sg && s.p.filter((v) => v !== 0).length === 2) || s.c === NAME[s.n]);
}
function slotLayout(f) {
  const { ax, sg } = faceAxis(f), [o1, o2] = [0, 1, 2].filter((i) => i !== ax), out = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const P = [0, 0, 0], Q = [0, 0, 0];
    P[ax] = sg; P[o1] = a; P[o2] = b; Q[ax] = 0; Q[o1] = a; Q[o2] = b;
    const na = [0, 0, 0], nb = [0, 0, 0]; na[o1] = a; nb[o2] = b;
    out.push({ P: P + '', Q: Q + '', colors: [CM().NAME[na], CM().NAME[nb]] });
  }
  return out;
}
const slotSet = (c, f) => { const { NAME } = CM(); return slotLayout(f).map(({ P, Q }) => c.every((s) => (s.p + '' !== P && s.p + '' !== Q) || s.c === NAME[s.n])); };

// ---- Fases de una resolución: cruz, 4 ranuras de F2L, OLL y PLL ----
// snap: estado justo antes del primer giro. mvs: [{m, t}] con t en ms desde el primer giro.
export function phases(snap, mvs) {
  const { mv, clone } = CM();
  let c = clone(snap), SF = null, SO = null, f = null, iF = -1, iO = -1;
  mvs.forEach((x, i) => {
    mv(c, x.m);
    if (iF < 0) for (const g of 'UDLRFB') if (isF2L(c, g)) { iF = i; f = g; SF = clone(c); break; }
    if (iF >= 0 && iO < 0 && topUniform(c, f) && isF2L(c, f)) { iO = i; SO = clone(c); }
  });
  if (iF < 0 || iO < 0) return null;
  const last = mvs.length - 1;
  c = clone(snap);
  const cross = [], slots = [], init = { cross: crossOK(c, f), slots: slotSet(c, f) };
  for (let i = 0; i <= iF; i++) { mv(c, mvs[i].m); cross.push(crossOK(c, f)); slots.push(slotSet(c, f)); }
  const crossIdx = init.cross ? -1 : cross.indexOf(true); // primera vez que la cruz está completa
  const pairsAt = (j) => (j < 0 ? init.slots : slots[j]).filter(Boolean).length;
  const layout = slotLayout(f), at = (j) => (j < 0 ? init.slots : slots[j]), idxs = [], used = new Set(), slotCol = [];
  for (let k = 1; k <= 4; k++) {
    // Se miran solo los momentos con la cruz intacta (durante una inserción se descoloca un instante).
    let i = iF;
    for (let j = iF; j >= Math.max(crossIdx, 0); j--) { if (!cross[j]) continue; if (pairsAt(j) >= k) i = j; else break; }
    i = Math.max(i, crossIdx); idxs.push(i);
    const solved = at(i), prevSolved = idxs.length > 1 ? at(idxs[idxs.length - 2]) : init.cross ? init.slots : at(crossIdx);
    let n = solved.findIndex((v, m) => v && !used.has(m) && !prevSolved[m]);
    if (n < 0) n = solved.findIndex((v, m) => v && !used.has(m));
    if (n >= 0) used.add(n);
    slotCol.push(n >= 0 ? layout[n].colors : null);
  }
  const T = (i) => (i < 0 ? 0 : mvs[i].t);
  const segs = [];
  let prev = -1;
  const push = (key, end, extra = {}) => {
    const turns = end - prev, step = T(end) - T(prev), rec = turns > 0 && prev >= 0 ? T(prev + 1) - T(prev) : 0;
    segs.push({ key, a: prev, b: end, turns, rec, exec: step - rec, step, total: T(end), tps: step > 0 ? turns / (step / 1000) : 0, ...extra });
    prev = end;
  };
  push('cross', crossIdx);
  idxs.forEach((e, k) => push('slot' + (k + 1), e, { colors: slotCol[k] }));
  push('oll', iO); push('pll', last);
  return { f, ll: OPP[f], iF, iO, last, SF, SO, segs, total: T(last) };
}

// ---- Resumen para consejos: qué pesa más en la resolución ----
export function summarize(P) {
  const segs = P.segs.filter((s) => s.turns > 0);
  const rec = segs.reduce((a, s) => a + s.rec, 0), exec = segs.reduce((a, s) => a + s.exec, 0);
  const worstPause = segs.filter((s) => s.rec > 0).sort((a, b) => b.rec - a.rec)[0] || null;
  const slowest = segs.filter((s) => s.turns >= 4).sort((a, b) => a.tps - b.tps)[0] || null;
  return { recShare: rec + exec > 0 ? rec / (rec + exec) : 0, rec, exec, worstPause, slowest };
}

// ---- Análisis para el aviso instantáneo ----
export function analyze(snap, mvs) {
  const P = phases(snap, mvs);
  if (!P) return null;
  const { iF, iO, last, SF, SO, f } = P, T = (i) => mvs[i].t;
  const out = [];
  const consider = (kind, id, alg, a, b, extra) => {
    const len = expand(alg).length, userMoves = b - a;
    const pause = (T(a + 1) - T(a)) / 1000, userTime = (T(b) - T(a + 1)) / 1000;
    if (userMoves < len + extra || userTime < 0.2) return;
    const rate = Math.max((userMoves - 1) / userTime, TPS_ALG[kind]);
    const algTime = (len - 1) / rate, save = userTime - algTime;
    if (save >= 0.3) out.push({ kind, id, label: kind + ' ' + id, alg, len, userMoves, pause, userTime, algTime, save });
  };
  if (iO > iF && !topUniform(SF, f)) { const m = matchOLL(SF, f); if (m) consider('OLL', m.id, m.alg, iF, iO, 3); }
  if (last > iO && !solvedUpToAUF(SO, f)) { const m = matchPLL(SO, f); if (m) consider('PLL', m.id, m.alg, iO, last, 4); }
  return out.sort((a, b) => b.save - a.save)[0] || null;
}
// Casos identificados en las fases OLL y PLL (para mostrarlos en el detalle de la resolución).
export function casesOf(P) {
  const { iF, iO, last, SF, SO, f } = P;
  return {
    oll: iO > iF && !topUniform(SF, f) ? matchOLL(SF, f) : null,
    pll: last > iO && !solvedUpToAUF(SO, f) ? matchPLL(SO, f) : null,
  };
}

// ---- Algoritmos alternativos ----
// Candidatos escritos a mano. Solo se conservan los que superan la comprobación con el simulador:
// partiendo del caso (inverso del algoritmo principal) tienen que dejarlo resuelto igual que él.
const ALT_SRC = {
  OLL: {
    2: ["r U r' U2 r U2 R' U2 R U' r'"],
    5: ["l' U2 L U L' U l"], 6: ["l U2 L' U' L U' l'"], 7: ["l U L' U L U2 l'"], 8: ["l' U' L U' L' U2 l"],
    21: ["R U R' U R U' R' U R U2 R'", "F R U R' U' R U R' U' R U R' U' F'"],
    33: ["R U R' U' R' F R F'"], 37: ["F R U' R' U' R U R' F'"], 45: ["F R U R' U' F'"],
    41: ["f R U R' U' f' U R U2 R' U' R U' R'"], 26: ["L' U2 L U L' U L"], 27: ["L' U' L U' L' U2 L"],
  },
  OCLL: { H: ["F R U R' U' R U R' U' R U R' U' F'"], Sune: ["L' U' L U' L' U2 L"], 'Anti-Sune': ["L' U2 L U L' U L"] },
  EOLL: { 'Línea': ["F U R U' R' F'"], L: ["F' L' U' L U F"] },
  PLL: {
    Aa: ["l' U R' D2 R U' R' D2 R2"], Ab: ["l' U' R D2 R' U R D2 R2"],
    Ua: ["M2 U M U2 M' U M2"], Ub: ["M2 U' M U2 M' U' M2"], H: ["R2 U2 R U2 R2 U2 R2 U2 R U2 R2"],
    Z: ["M2 U M2 U M' U2 M2 U2 M'"], Na: ["R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
    Nb: ["R' U L' U2 R U' R' U2 R L U'"], T: ["R2 U R2 U' R2 U' D R2 U' R2 U R2 D'"],
  },
  CPLL: { A: ["l' U R' D2 R U' R' D2 R2"] },
  EPLL: { Ua: ["M2 U M U2 M' U M2"], Ub: ["M2 U' M U2 M' U' M2"], H: ["R2 U2 R U2 R2 U2 R2 U2 R U2 R2"], Z: ["M2 U M2 U M' U2 M2 U2 M'"] },
  F2L: {
    1: ["U R U' R'"], 2: ["R U R'", "U' R' F R F'"], 3: ["R U' R'", "R U' R' U2 R U R'"],
    4: ["F' U' F"], 5: ["F' U F", "R' U' R U2 R' U R"], 6: ["R U2 R' U' R U R'"], 7: ["R U' R' U R U' R'"], 8: ["R U R' U2 R U R'"],
  },
};
// Con la posición de entrenamiento (cruz en la cara física U, última capa en D).
const altOK = (kind, main, alt) => {
  try {
    const { solvedCube } = CM();
    const c = run(solvedCube(), invert(expand(main, HOLD)));
    run(c, expand(alt, HOLD));
    const { isSolved } = CM();
    if (kind === 'OLL' || kind === 'OCLL') return topUniform(c, 'U') && isF2L(c, 'U');
    if (kind === 'EOLL') return isF2L(c, 'U') && c.every((s) => !(s.n[1] === -1 && Math.abs(s.p[0]) + Math.abs(s.p[2]) === 1) || s.c === 'D');
    if (kind === 'F2L') return isF2L(c, 'U');
    return isSolved(c); // PLL: el estado de partida es exactamente el mismo
  } catch (e) { return false; }
};
const _algs = {};
export function algsOf(kind, id) {
  const k = kind + ' ' + id;
  if (_algs[k]) return _algs[k];
  const main = (GROUPS[kind] || {})[id];
  if (!main) return [];
  const out = [main];
  for (const a of (ALT_SRC[kind] || {})[id] || []) if (!out.includes(a) && altOK(kind, main, a)) out.push(a);
  return (_algs[k] = out);
}

// ---- Casos para entrenar (cubo con AMARILLO arriba y VERDE de frente) ----
export function getCase(kind, id, alt = 0) {
  const algs = algsOf(kind, id);
  if (!algs.length) return null;
  const ai = Math.max(0, Math.min(alt | 0, algs.length - 1)), alg = algs[ai];
  const { solvedCube } = CM();
  const ends = [], faceAlg = expand(alg, HOLD, ends), setup = invert(faceAlg);
  const steps = alg.trim().split(/\s+/).map((t, i) => ({ t, end: ends[i] })); // símbolo + giros de cara acumulados
  const frame = {}; for (const [fr, col] of Object.entries(HOLD)) frame[col] = fr; // cara de color -> posición al sujetarlo
  const flip = (arr) => arr.map((s) => ({ p: [-s.p[0], -s.p[1], s.p[2]], n: [-s.n[0], -s.n[1], s.n[2]], c: s.c }));
  const shown = flip(run(solvedCube(), setup)); // el caso tal como lo ves con amarillo arriba
  let pair = null;
  if (kind === 'F2L') { // posiciones actuales de la esquina y la arista de la ranura delantera derecha
    const ref = flip(solvedCube()), colorsAt = (pos) => ref.filter((s) => s.p + '' === pos).map((s) => s.c).sort().join('');
    const where = (set) => { const g = new Map(); for (const s of shown) (g.get(s.p + '') || g.set(s.p + '', []).get(s.p + '')).push(s.c); for (const [p, cs] of g) if (cs.slice().sort().join('') === set) return p; };
    pair = [where(colorsAt('1,-1,1')), where(colorsAt('1,0,1'))];
  }
  return { kind, id, key: kind + ' ' + id, label: kind === 'F2L' ? 'F2L ' + id : kind + ' ' + id, alg, algs, ai, steps, faceAlg, setup, frame, shown, pair,
    icon: kind === 'F2L' ? null : caseIcon(run(solvedCube(), setup), STYLE[kind], true) };
}

// F2L básico en una resolución: para cada ranura, ¿qué caso de los 41 era la situación de partida?
export function f2lCases(P, snap, mvs) {
  const { mv, clone } = CM(), f = P.f, out = {};
  const after = (i) => { const c = clone(snap); for (let j = 0; j <= i; j++) mv(c, mvs[j].m); return c; };
  for (const seg of P.segs) {
    if (!/^slot\d$/.test(seg.key) || seg.turns <= 0) continue;
    const S = after(seg.a), E = after(seg.b), need = slotSet(E, f), had = slotSet(S, f);
    if (!need.some((v, i) => v && !had[i])) continue;
    search: for (const [id, alg] of Object.entries(F2L)) for (const o of orisWithD(f)) for (let u = 0; u < 4; u++) {
      const c = clone(S);
      for (let i = 0; i < u; i++) mv(c, OPP[f]);
      run(c, expand(alg, o));
      if (crossOK(c, f) && slotSet(c, f).every((v, i) => !need[i] || v)) { out[seg.key] = { id, alg }; break search; }
    }
  }
  return out;
}

// Icono de la capa superior vista desde arriba. flip = ver el cubo con amarillo arriba.
// OLL: pegatinas orientadas en amarillo; PLL: colores reales de los laterales. Sin letras.
export function caseIcon(state, kind, flip = false) {
  const { COL, solvedCube } = CM();
  const tf = (arr) => (flip ? arr.map((s) => ({ p: [-s.p[0], -s.p[1], s.p[2]], n: [-s.n[0], -s.n[1], s.n[2]], c: s.c })) : arr);
  const st = tf(state);
  const lit = flip ? 'D' : 'U', k = 16, pad = 4, W = pad * 2 + k * 5, bar = k * 0.28, g = 0.65;
  const light = !!window.__cubeLight, white = window.__cubeLine === 'white'; // estilo claro: casillas sin iluminar en blanco; líneas negras o blancas
  const lineC = white ? '#f4f6fa' : '#14171c';
  const yel = '#ffd500', off = light ? (white ? '#e6eaf0' : '#fafbfc') : '#262c34', dontCare = light ? '#cfd5de' : '#3b434e', topPLL = light ? off : COL[lit];
  const isO = kind === 'OLL' || kind === 'EOLL', corner = (s) => s.p[0] !== 0 && s.p[2] !== 0;
  const col = (s) => (isO ? (s.c === lit ? yel : off) : COL[s.c]);
  let r = `<rect x="${pad + k - 1.1}" y="${pad + k - 1.1}" width="${3 * k + 2.2}" height="${3 * k + 2.2}" rx="3.4" fill="${lineC}"/>`;
  const rect = (x, y, w, h, c, rx = 2.5) => (r += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"/>`);
  for (const s of st) {
    if (s.p[1] !== 1) continue;
    const [x, , z] = s.p, n = s.n.join(), cx = pad + (x + 2) * k, cz = pad + (z + 2) * k;
    if (n === '0,1,0') rect(cx + g, cz + g, k - 2 * g, k - 2 * g, kind === 'EOLL' && corner(s) ? dontCare : isO ? col(s) : topPLL);
    else if (isO && (s.c !== lit || (kind === 'EOLL' && corner(s)))) continue;
    else if (n === '0,0,1') rect(cx + g, pad + 5 * k - bar, k - 2 * g, bar, col(s), 1.5);
    else if (n === '0,0,-1') rect(cx + g, pad, k - 2 * g, bar, col(s), 1.5);
    else if (n === '1,0,0') rect(pad + 5 * k - bar, cz + g, bar, k - 2 * g, col(s), 1.5);
    else if (n === '-1,0,0') rect(pad, cz + g, bar, k - 2 * g, col(s), 1.5);
  }
  if (kind === 'PLL') { // flechas: de dónde viene cada pieza y a dónde debe ir
    const grp = (arr) => {
      const m = new Map();
      for (const s of arr) {
        if (s.p[1] !== 1 || (s.p[0] === 0 && s.p[2] === 0)) continue;
        const key = s.p[0] + ',' + s.p[2];
        (m.get(key) || m.set(key, []).get(key)).push(s.c);
      }
      return m;
    };
    const home = new Map();
    for (const [pos, cols] of grp(tf(solvedCube()))) home.set(cols.slice().sort().join(''), pos);
    const ctr = (pos) => { const [x, z] = pos.split(',').map(Number); return [pad + (x + 2) * k + k / 2, pad + (z + 2) * k + k / 2]; };
    let arrows = '';
    for (const [pos, cols] of grp(st)) {
      const h = home.get(cols.slice().sort().join(''));
      if (!h || h === pos) continue;
      const [x1, y1] = ctr(pos), [x2, y2] = ctr(h), d = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / d, uy = (y2 - y1) / d;
      const ax = x1 + ux * 4, ay = y1 + uy * 4, bx = x2 - ux * 4, by = y2 - uy * 4;
      arrows += `<path d="M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}"/>`
        + `<path fill="#14171c" d="M${bx.toFixed(1)} ${by.toFixed(1)}l${(-ux * 4.8 - uy * 2.9).toFixed(1)} ${(-uy * 4.8 + ux * 2.9).toFixed(1)}l${(uy * 5.8).toFixed(1)} ${(-ux * 5.8).toFixed(1)}Z"/>`;
    }
    r += `<g stroke="#14171c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">${arrows}</g>`;
  }
  return `<svg viewBox="0 0 ${W} ${W}" width="56" height="56" aria-hidden="true">${r}</svg>`;
}

if (typeof window !== 'undefined') window.Insight = { F2L_CAT, analyze, phases, summarize, casesOf, f2lCases, algsOf, getCase, caseIcon, expand, invert, OLL, PLL, GROUPS, TPS_ALG, HOLD };

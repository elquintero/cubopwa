// CubIQ · Análisis de resoluciones: detecta fases (F2L, OLL, PLL), identifica el caso y estima el tiempo ahorrable.
const CM = () => window.CM;
const OPP = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };
const ID = { U: 'U', D: 'D', L: 'L', R: 'R', F: 'F', B: 'B' };

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
  Na: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'", Nb: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
  Ra: "R U' R' U' R U R D R' U' R D' R' U2 R'", Rb: "R' U2 R U2 R' F R U R' U' R' F' R2",
  T: "R U R' U' R' F R2 U' R' U' R U R' F'", Ua: "R U' R U R U R U' R' U' R2", Ub: "R2 U R U R' U' R' U' R' U R'",
  V: "R' U R' U' y R' F' R2 U' R' U R' F R F", Y: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  Z: "M' U M2 U M2 U M' U2 M2"
};

// ---- Orientación del cubo entero y expansión a giros de cara (los cubos inteligentes solo informan de caras) ----
const ROTMAP = {
  x: (o) => ({ U: o.F, B: o.U, D: o.B, F: o.D, L: o.L, R: o.R }),
  y: (o) => ({ F: o.R, R: o.B, B: o.L, L: o.F, U: o.U, D: o.D }),
  z: (o) => ({ U: o.L, R: o.U, D: o.R, L: o.D, F: o.F, B: o.B }),
};
const AX = { R: ['x', 1], L: ['x', -1], U: ['y', 1], D: ['y', -1], F: ['z', 1], B: ['z', -1] };
const norm4 = (q) => ((q % 4) + 4) % 4;
const emit = (out, f, q) => { q = norm4(q); if (q) out.push(f + ['', '', '2', "'"][q]); };

export function expand(alg, o0 = ID) {
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
function matchOLL(S, f) {
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

// ---- Análisis de una resolución ----
// snap: estado del cubo justo antes del primer giro. mvs: [{m, t}] con t en ms desde el inicio.
export function analyze(snap, mvs) {
  const { mv, clone } = CM();
  let c = clone(snap), SF = null, SO = null, f = null, iF = -1, iO = -1;
  mvs.forEach((x, i) => {
    mv(c, x.m);
    if (iF < 0) for (const g of 'UDLRFB') if (isF2L(c, g)) { iF = i; f = g; SF = clone(c); break; }
    if (iF >= 0 && iO < 0 && topUniform(c, f) && isF2L(c, f)) { iO = i; SO = clone(c); }
  });
  const last = mvs.length - 1;
  if (iF < 0 || iO < 0) return null;
  const out = [];
  const consider = (kind, id, alg, userMoves, dt, extra) => {
    const len = expand(alg).length;
    if (userMoves >= len + extra && dt > 0.2) {
      const save = dt * (1 - len / userMoves);
      if (save >= 0.3) out.push({ kind, id, label: kind + ' ' + id, alg, len, userMoves, save });
    }
  };
  if (iO > iF && !topUniform(SF, f)) {
    const m = matchOLL(SF, f);
    if (m) consider('OLL', m.id, m.alg, iO - iF, (mvs[iO].t - mvs[iF].t) / 1000, 3);
  }
  if (last > iO && !solvedUpToAUF(SO, f)) {
    const m = matchPLL(SO, f);
    if (m) consider('PLL', m.id, m.alg, last - iO, (mvs[last].t - mvs[iO].t) / 1000, 4);
  }
  return out.sort((a, b) => b.save - a.save)[0] || null;
}

// ---- Casos para entrenar ----
export function getCase(kind, id) {
  const alg = (kind === 'OLL' ? OLL : PLL)[id];
  if (!alg) return null;
  const { solvedCube } = CM();
  const faceAlg = expand(alg);
  const setup = invert(faceAlg);
  return { kind, id, label: kind + ' ' + id, alg, faceAlg, setup, icon: caseIcon(run(solvedCube(), setup), kind) };
}

// Icono de la capa superior (vista desde arriba): OLL = pegatinas orientadas en amarillo; PLL = colores reales de los laterales.
export function caseIcon(state, kind) {
  const { COL } = CM();
  const k = 14, pad = 3, W = pad * 2 + k * 5;
  let r = '';
  const rect = (x, y, w, h, col) => (r += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${col}"/>`);
  const col = (s) => (kind === 'OLL' ? (s.c === 'U' ? '#ffd500' : '#2a3038') : COL[s.c]);
  for (const s of state) {
    if (s.p[1] !== 1) continue;
    const [x, , z] = s.p, n = s.n.join();
    if (n === '0,1,0') rect(pad + (x + 2) * k + 1, pad + (z + 2) * k + 1, k - 2, k - 2, kind === 'OLL' ? col(s) : '#e8ecf1');
    else if (kind === 'OLL' && s.c !== 'U') continue;
    else if (n === '0,0,1') rect(pad + (x + 2) * k + 1, pad + 5 * k - k * 0.35 - 0, k - 2, k * 0.35, col(s));
    else if (n === '0,0,-1') rect(pad + (x + 2) * k + 1, pad + 0.0, k - 2, k * 0.35, col(s));
    else if (n === '1,0,0') rect(pad + 5 * k - k * 0.35, pad + (z + 2) * k + 1, k * 0.35, k - 2, col(s));
    else if (n === '-1,0,0') rect(pad, pad + (z + 2) * k + 1, k * 0.35, k - 2, col(s));
  }
  const bg = `<rect x="${pad + k - 1}" y="${pad + k - 1}" width="${3 * k + 2}" height="${3 * k + 2}" rx="3" fill="#0b0d10"/>`;
  return `<svg viewBox="0 0 ${W} ${W}" width="56" height="56" aria-hidden="true">${bg}${r}</svg>`;
}

window.Insight = { analyze, getCase, expand, OLL, PLL };

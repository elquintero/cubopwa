import { analyze } from './insight.js';
import { FACES, NAME, solvedCube, mv, sig, isSolved, clone } from './cube-engine.js';

// Mismo motor que la interfaz (src/cube-engine.js), expuesto con el nombre que espera insight.js.
globalThis.CM = { solvedCube, mv, sig, isSolved, clone, FACES, COL: {}, NAME };

self.onmessage = ({ data }) => {
  const { id, snap, moves } = data;
  try {
    const result = analyze(snap, moves);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) });
  }
};

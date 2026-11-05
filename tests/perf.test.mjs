// Prueba del diagnóstico de rendimiento sin navegador: node tests/perf.test.mjs
import assert from 'node:assert/strict';
const g = globalThis; g.window = g;
class Storage { constructor() { this.d = {}; } getItem(k) { return k in this.d ? this.d[k] : null; } setItem(k, v) { this.d[k] = String(v); } removeItem(k) { delete this.d[k]; } key(i) { return Object.keys(this.d)[i]; } get length() { return Object.keys(this.d).length; } }
class Element { constructor(t, id) { this.tagName = t; this.id = id; this.className = ''; this._h = ''; } get innerHTML() { return this._h; } set innerHTML(v) { this._h = v; } }
class HTMLCanvasElement extends Element { constructor() { super('CANVAS', ''); this.width = 168; this.height = 168; } toDataURL() { return 'data:image/png;base64,' + 'A'.repeat(3000); } }
Object.assign(g, { Storage, Element, HTMLCanvasElement, MutationObserver: class { observe() {} disconnect() {} } });
Object.defineProperty(g, 'localStorage', { value: new Storage(), configurable: true, writable: true });
Object.defineProperty(g, 'document', { value: { body: { dataset: { view: 'home' } }, hidden: false, getElementsByTagName: (t) => ({ length: t === 'canvas' ? 2 : 150 }) }, configurable: true, writable: true });
g.matchMedia = () => ({ matches: false }); g.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 16);
g.APP_VERSION = 'test';
const busy = (ms) => { const t = performance.now(); while (performance.now() - t < ms); };
g.renderStats = function renderStats() { busy(6); const e = new Element('DIV', 'stSessList'); e.innerHTML = '<p>'.repeat(500); };
g.tileL = function tileL() { busy(0.05); };
g.renderLearn = function renderLearn() { busy(3); for (let i = 0; i < 40; i++) g.tileL(); JSON.parse(JSON.stringify({ a: 'x'.repeat(60000) })); };
g.slowAsync = async function slowAsync() { await new Promise((r) => setTimeout(r, 30)); return 1; };
const origStats = g.renderStats;
localStorage.setItem('cubiq_solves_p1', JSON.stringify(Array.from({ length: 800 }, (_, i) => ({ t: i, m: 'R U R\'' }))));
const perf = await import('../src/perf.js');
const ctl = perf.start({ ui: false });
assert.ok(perf.isOn()); assert.notEqual(g.renderStats, origStats, 'renderStats debe estar envuelta');
ctl.mark('escenario A');
for (let i = 0; i < 3; i++) g.renderStats();
g.renderLearn(); await g.slowAsync();
localStorage.getItem('cubiq_solves_p1'); localStorage.setItem('x', 'y'.repeat(100));
JSON.parse(localStorage.getItem('cubiq_solves_p1'));
new HTMLCanvasElement().toDataURL();
document.body.dataset.view = 'stats'; await new Promise((r) => setTimeout(r, 400));
const R = await perf._test.report();
const fn = Object.fromEntries(R.functions.map((x) => [x.f, x]));
assert.equal(R.format, 'cubiq-perf/1');
assert.equal(fn.renderStats.n, 3); assert.ok(fn.renderStats.self >= 17, 'tiempo propio renderStats ' + fn.renderStats.self);
assert.equal(fn.tileL.n, 40); assert.ok(fn.renderLearn.self < fn.renderLearn.incl, 'el tiempo propio excluye a los hijos');
assert.ok(fn.slowAsync.async_ms >= 25, 'tiempo asíncrono ' + fn.slowAsync.async_ms);
assert.ok(R.json.parse.n >= 2 && R.json.stringify.n >= 1, 'JSON medido'); assert.ok(R.json.slow_callers.length >= 0);
assert.ok(R.innerHTML.by.some((e) => e.el === 'div#stSessList'), 'innerHTML por elemento');
assert.equal(R.canvas.toDataURL.n, 1); assert.ok(R.storage.keys.some((k) => k.k === 'L:cubiq_solves_p1'));
assert.ok(R.storage.snapshot.keys.some((k) => k.items === 800 && k.parse_ms >= 0), 'instantánea de localStorage con nº de elementos');
assert.ok(R.frames.n > 5, 'fotogramas ' + R.frames.n); assert.ok(R.frames.by_view.some((v) => v.view === 'stats'));
assert.ok(R.segments.length >= 2 && R.segments.some((s) => s.name === 'escenario A'), 'segmentos por escenario');
assert.ok(R.summary.length >= 1 && R.bench.cpu_index_ms > 0);
const size = JSON.stringify(R).length; assert.ok(size < 150000, 'tamaño del informe ' + size);
perf._resetCounters(); const R2 = await perf._test.report(); assert.equal(R2.functions.length, 0, 'reinicio a cero');
perf.stop(); assert.equal(g.renderStats, origStats, 'stop restaura las funciones'); assert.ok(!perf.isOn()); assert.equal(localStorage.getItem('cubiq_perf'), null);
console.log('Diagnóstico OK · informe', Math.round(size / 1024), 'KB · funciones medidas', R.coverage.wrapped_functions);
console.log(R.summary.map((x) => ' - ' + x).join('\n'));
process.exit(0);

// CubIQ · Diagnóstico de rendimiento (oculto).
// Se activa con 5 toques seguidos en la versión (Ajustes) y se carga solo entonces: desactivado no mide ni cuesta nada.
// Mide arranque, tareas largas, fotogramas, eventos, tiempo por función, JSON/localStorage/innerHTML/canvas, memoria y DOM,
// y genera un informe JSON (sin tiempos de resoluciones ni datos personales) para analizar hacia dónde optimizar.
const FLAG = 'cubiq_perf';
const g = globalThis, now = () => performance.now();
const SI0 = g.setInterval.bind(g), CI0 = g.clearInterval.bind(g); // los del propio diagnóstico, sin contarse como de la app
const r1 = (x) => Math.round(x * 10) / 10;
const mkAgg = () => ({ n: 0, ms: 0, max: 0, sz: 0 });
const add = (a, d, sz) => { a.n++; a.ms += d; if (d > a.max) a.max = d; a.sz += sz || 0; };
const outAgg = (a) => ({ n: a.n, ms: r1(a.ms), max: r1(a.max), avg_us: a.n ? Math.round(a.ms / a.n * 1000) : 0, kb: Math.round(a.sz / 1024) });
const mkFr = () => ({ n: 0, sum: 0, j20: 0, j34: 0, f100: 0, worst: 0, h: [0, 0, 0, 0, 0, 0] });
const EDGES = [17, 25, 34, 50, 100];
const pct = (arr, p) => { if (!arr.length) return 0; const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const desc = (el) => { try { if (!el || !el.tagName) return String((el && el.nodeName) || '?'); const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''; return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : ''); } catch (e) { return '?'; } };
const callers = (skip = 3, depth = 4) => { try { return new Error().stack.split('\n').slice(skip, skip + depth).map((l) => { const m = /at\s+(?:async\s+)?([^\s(]+)\s*\(|^\s*([^@\s]*)@/.exec(l); return (m && (m[1] || m[2])) || '·'; }).join(' < '); } catch (e) { return '?'; } };
const topN = (arr, key, n) => arr.sort((a, b) => b[key] - a[key]).slice(0, n);

let S = null, ctl = null;
const fresh = () => ({
  t0: now(), paused: false, views: [], marks: [], fn: new Map(), slowFn: [],
  json: { p: mkAgg(), s: mkAgg(), ps: new Map() }, ls: new Map(), html: { all: mkAgg(), by: new Map(), slow: [] }, url: mkAgg(), urlDims: new Map(),
  timers: { si: 0, siActive: new Set(), st: 0, raf: 0 },
  fr: mkFr(), fd: [], frView: new Map(), lt: { n: 0, ms: 0, top: [] }, loaf: { n: 0, ms: 0, block: 0, top: [], by: new Map() },
  ev: { top: [], all: [], by: new Map() }, paint: {}, lcp: null, cls: 0, samples: [], early: [], notes: [],
});

// ---------- vista actual y línea de tiempo ----------
const curView = () => (g.document && document.body && document.body.dataset.view) || '?';
const viewAt = (t) => { if (!S) return '?'; for (let i = S.views.length - 1; i >= 0; i--) if (S.views[i].t <= t) return S.views[i].v; return S.views.length ? S.views[0].v : '?'; };

// ---------- medición por función (declaraciones globales del script de la app) ----------
const ORIGFN = new Map();
const stack = [];
function wrap(name, f) {
  const st = { n: 0, incl: 0, self: 0, max: 0, slow: 0, async: 0, an: 0, depth: 0, off: false };
  S.fn.set(name, st); ORIGFN.set(name, f);
  const w = function () {
    if (S.paused || st.off) return f.apply(this, arguments);
    const fr = { child: 0 }; stack.push(fr); st.depth++; const t = now(); let r;
    try { r = f.apply(this, arguments); return r; }
    finally {
      const d = now() - t; stack.pop(); const top = stack[stack.length - 1]; if (top) top.child += d;
      st.depth--; st.n++; if (!st.depth) st.incl += d;
      st.self += d - fr.child; if (d > st.max) st.max = d;
      if (d > 16) { st.slow++; S.slowFn.push({ f: name, ms: r1(d), at: Math.round(t), v: curView() }); if (S.slowFn.length > 150) S.slowFn = topN(S.slowFn, 'ms', 60); }
      if (st.n > 80000 && st.self / st.n < 0.004) st.off = true; // llamadas muy frecuentes y baratas: se deja de medir para no distorsionar
      if (r && typeof r.then === 'function') { const ta = t; r.then(() => { st.an++; st.async += now() - ta; }, () => {}); }
    }
  };
  Object.assign(w, f); try { Object.defineProperty(w, 'name', { value: f.name }); } catch (e) { /* nada */ }
  g[name] = w;
}
function wrapAll() {
  let n = 0;
  for (const name of Object.getOwnPropertyNames(g)) {
    let v; try { v = g[name]; } catch (e) { continue; }
    if (typeof v !== 'function' || v.__pf || S.fn.has(name) || ['setTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame'].includes(name)) continue;
    let src; try { src = Function.prototype.toString.call(v); } catch (e) { continue; }
    if (/\[native code\]/.test(src) || /^class\b/.test(src) || /^(on|webkit)/.test(name)) continue;
    const d = Object.getOwnPropertyDescriptor(g, name); if (!d || !d.writable) continue;
    wrap(name, v); g[name].__pf = true; n++;
  }
  return n;
}

// ---------- API nativas ----------
const UNDO = [];
const patch = (obj, key, make) => { try { const o = obj[key]; if (typeof o !== 'function') return; obj[key] = make(o); UNDO.push(() => { obj[key] = o; }); } catch (e) { /* no disponible */ } };
function slowJson(kind, d, n) {
  const k = kind + ' ← ' + callers(4, 4), m = S.json.ps.get(k) || (S.json.ps.set(k, { n: 0, ms: 0, sz: 0 }), S.json.ps.get(k));
  m.n++; m.ms += d; m.sz += n;
}
function installNatives() {
  if (g.__pfO) { try { JSON.parse = g.__pfO.P; Storage.prototype.getItem = g.__pfO.G; } catch (e) { /* nada */ } }
  patch(JSON, 'parse', (o) => function (s, r) { if (S.paused) return o.call(this, s, r); const t = now(); try { return o.call(this, s, r); } finally { const d = now() - t, n = typeof s === 'string' ? s.length : 0; add(S.json.p, d, n); if (d > 2) slowJson('parse', d, n); } });
  patch(JSON, 'stringify', (o) => function () { if (S.paused) return o.apply(this, arguments); const t = now(); let r; try { r = o.apply(this, arguments); return r; } finally { const d = now() - t, n = typeof r === 'string' ? r.length : 0; add(S.json.s, d, n); if (d > 2) slowJson('stringify', d, n); } });
  if (g.Storage) {
    const rec = (st, op, k, d, n) => { k = (st === g.localStorage ? 'L:' : 'S:') + String(k).slice(0, 48); let e = S.ls.get(k); if (!e) { if (S.ls.size > 80) return; S.ls.set(k, e = { g: mkAgg(), s: mkAgg() }); } add(e[op], d, n); };
    patch(Storage.prototype, 'getItem', (o) => function (k) { if (S.paused) return o.call(this, k); const t = now(); let r; try { r = o.call(this, k); return r; } finally { rec(this, 'g', k, now() - t, r ? r.length : 0); } });
    patch(Storage.prototype, 'setItem', (o) => function (k, v) { if (S.paused) return o.call(this, k, v); const t = now(); try { return o.call(this, k, v); } finally { rec(this, 's', k, now() - t, String(v).length); } });
  }
  if (g.Element) {
    const D = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (D && D.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, enumerable: D.enumerable, get: D.get, set(v) {
        if (S.paused) return D.set.call(this, v);
        const t = now(); try { D.set.call(this, v); } finally {
          const d = now() - t, n = typeof v === 'string' ? v.length : 0, k = desc(this); add(S.html.all, d, n);
          let e = S.html.by.get(k); if (!e) { if (S.html.by.size > 60) return; S.html.by.set(k, e = mkAgg()); } add(e, d, n);
          if (d > 4) { S.html.slow.push({ el: k, ms: r1(d), kb: Math.round(n / 1024), v: curView(), at: Math.round(t) }); if (S.html.slow.length > 100) S.html.slow = topN(S.html.slow, 'ms', 40); }
        }
      } });
      UNDO.push(() => Object.defineProperty(Element.prototype, 'innerHTML', D));
    }
  }
  if (g.HTMLCanvasElement) patch(HTMLCanvasElement.prototype, 'toDataURL', (o) => function () {
    if (S.paused) return o.apply(this, arguments);
    const t = now(); let r; try { r = o.apply(this, arguments); return r; } finally { add(S.url, now() - t, r ? r.length : 0); const k = this.width + 'x' + this.height; S.urlDims.set(k, (S.urlDims.get(k) || 0) + 1); }
  });
  patch(g, 'setInterval', (o) => function (f, ms) { const id = o.apply(this, arguments); S.timers.si++; S.timers.siActive.add(id); return id; });
  patch(g, 'clearInterval', (o) => function (id) { S.timers.siActive.delete(id); return o.apply(this, arguments); });
  patch(g, 'setTimeout', (o) => function () { S.timers.st++; return o.apply(this, arguments); });
  if (g.requestAnimationFrame) patch(g, 'requestAnimationFrame', (o) => function () { S.timers.raf++; return o.apply(this, arguments); });
}

// ---------- observadores del navegador ----------
function observe(type, cb, extra) { try { if (!g.PerformanceObserver) return; const po = new PerformanceObserver((l) => { try { l.getEntries().forEach(cb); } catch (e) { /* nada */ } }); po.observe({ type, buffered: true, ...extra }); UNDO.push(() => po.disconnect()); } catch (e) { /* tipo no soportado */ } }
function installObservers() {
  observe('longtask', (e) => { S.lt.n++; S.lt.ms += e.duration; S.lt.top.push({ at: Math.round(e.startTime), ms: Math.round(e.duration), v: viewAt(e.startTime) }); if (S.lt.top.length > 100) S.lt.top = topN(S.lt.top, 'ms', 40); });
  observe('long-animation-frame', (e) => {
    S.loaf.n++; S.loaf.ms += e.duration; S.loaf.block += e.blockingDuration || 0;
    const sc = (e.scripts || []).map((s) => ({ fn: s.sourceFunctionName || s.invoker || '·', url: String(s.sourceURL || '').split('/').pop().slice(0, 30), ms: Math.round(s.duration), forced: Math.round(s.forcedStyleAndLayoutDuration || 0) })).sort((a, b) => b.ms - a.ms);
    for (const s of sc) { const k = s.fn + ' @' + s.url; const m = S.loaf.by.get(k) || (S.loaf.by.set(k, { n: 0, ms: 0, forced: 0 }), S.loaf.by.get(k)); m.n++; m.ms += s.ms; m.forced += s.forced; }
    S.loaf.top.push({ at: Math.round(e.startTime), ms: Math.round(e.duration), block: Math.round(e.blockingDuration || 0), render: Math.round(Math.max(0, (e.startTime + e.duration) - (e.renderStart || e.startTime))), v: viewAt(e.startTime), s: sc.slice(0, 3) });
    if (S.loaf.top.length > 100) S.loaf.top = topN(S.loaf.top, 'ms', 40);
  });
  observe('event', (e) => {
    const k = e.name; S.ev.by.set(k, (S.ev.by.get(k) || 0) + 1);
    if (e.interactionId > 0) { S.ev.all.push(e.duration); if (S.ev.all.length > 600) S.ev.all.shift(); }
    S.ev.top.push({ ev: e.name, ms: Math.round(e.duration), wait: Math.round(e.processingStart - e.startTime), run: Math.round(e.processingEnd - e.processingStart), on: desc(e.target), v: viewAt(e.startTime), at: Math.round(e.startTime) });
    if (S.ev.top.length > 120) S.ev.top = topN(S.ev.top, 'ms', 40);
  }, { durationThreshold: 16 });
  observe('paint', (e) => { S.paint[e.name] = Math.round(e.startTime); });
  observe('largest-contentful-paint', (e) => { S.lcp = { at: Math.round(e.startTime), size: e.size, el: desc(e.element) }; });
  observe('layout-shift', (e) => { if (!e.hadRecentInput) S.cls += e.value; });
}

// ---------- fotogramas y muestreo ----------
let rafId = 0, last = 0, RAF = null, sampler = 0, mo = null;
function addFrame(a, d) { if (a === S.fr) { S.fd.push(d); if (S.fd.length > 3000) S.fd.shift(); } a.n++; a.sum += d; if (d > a.worst) a.worst = d; if (d > 20) a.j20++; if (d > 34) a.j34++; if (d > 100) a.f100++; let i = 0; while (i < EDGES.length && d > EDGES[i]) i++; a.h[i]++; }
function loop(ts) {
  if (!S) return;
  if (last && !S.paused && !document.hidden) { const d = ts - last; if (d < 1000) { addFrame(S.fr, d); const v = curView(); let a = S.frView.get(v); if (!a) S.frView.set(v, a = mkFr()); addFrame(a, d); } }
  last = ts; rafId = RAF(loop);
}
function sample() {
  if (S.paused || document.hidden) return;
  const m = performance.memory, c = document.getElementsByTagName('*').length;
  S.samples.push({ t: Math.round(now() - S.t0), heap: m ? Math.round(m.usedJSHeapSize / 1048576 * 10) / 10 : null, nodes: c, canv: document.getElementsByTagName('canvas').length, iv: S.timers.siActive.size, v: curView() });
  if (S.samples.length > 400) S.samples = S.samples.filter((_, i) => i % 2 === 0);
}
function snap(name, kind) {
  const fn = {}; for (const [k, v] of S.fn) if (v.n) fn[k] = [v.n, v.self];
  S.marks.push({ name, kind, t: now(), v: curView(), fn, fr: { n: S.fr.n, sum: S.fr.sum, j34: S.fr.j34, f100: S.fr.f100 }, lt: [S.lt.n, S.lt.ms], jp: S.json.p.ms, html: S.html.all.ms, url: S.url.ms, ls: [...S.ls.values()].reduce((a, e) => a + e.g.ms + e.s.ms, 0), loaf: S.loaf.ms });
  if (S.marks.length > 60) S.marks.splice(1, 1);
}
function segments() {
  const cur = { name: 'ahora', t: now(), fn: {}, fr: { n: S.fr.n, sum: S.fr.sum, j34: S.fr.j34, f100: S.fr.f100 }, lt: [S.lt.n, S.lt.ms], jp: S.json.p.ms, html: S.html.all.ms, url: S.url.ms, ls: [...S.ls.values()].reduce((a, e) => a + e.g.ms + e.s.ms, 0), loaf: S.loaf.ms };
  for (const [k, v] of S.fn) if (v.n) cur.fn[k] = [v.n, v.self];
  const out = [];
  for (let i = 0; i < S.marks.length; i++) {
    const a = S.marks[i], b = S.marks[i + 1] || cur, dur = (b.t - a.t) / 1000;
    if (dur < 1.5 && a.kind === 'view') continue;
    const fns = Object.entries(b.fn).map(([k, [n, ms]]) => { const p = a.fn[k] || [0, 0]; return [k, n - p[0], ms - p[1]]; }).filter((x) => x[1] > 0).sort((x, y) => y[2] - x[2]).slice(0, 6).map(([k, n, ms]) => ({ f: k, n, self: r1(ms) }));
    const fn = b.fr.n - a.fr.n;
    out.push({ name: a.name, kind: a.kind, view: a.v, sec: r1(dur), fps: (b.fr.sum - a.fr.sum) > 0 ? Math.round(fn / ((b.fr.sum - a.fr.sum) / 1000)) : 0, frames: fn, jank34: b.fr.j34 - a.fr.j34, freeze100: b.fr.f100 - a.fr.f100, longtasks: b.lt[0] - a.lt[0], longtask_ms: Math.round(b.lt[1] - a.lt[1]), loaf_ms: Math.round(b.loaf - a.loaf), json_parse_ms: r1(b.jp - a.jp), innerHTML_ms: r1(b.html - a.html), toDataURL_ms: r1(b.url - a.url), storage_ms: r1(b.ls - a.ls), top: fns });
  }
  return out;
}

// ---------- informe ----------
async function context() {
  const n = g.navigator || {}, c = n.connection || {}, o = {
    app: g.APP_VERSION || '?', ua: n.userAgent, platform: n.platform, cores: n.hardwareConcurrency, mem_gb: n.deviceMemory,
    dpr: g.devicePixelRatio, screen: g.screen ? [screen.width, screen.height] : null, viewport: [g.innerWidth, g.innerHeight],
    net: c.effectiveType ? { type: c.effectiveType, rtt: c.rtt, saveData: c.saveData } : null,
    standalone: !!(g.matchMedia && matchMedia('(display-mode: standalone)').matches), reducedMotion: !!(g.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
    sw: !!(n.serviceWorker && n.serviceWorker.controller), online: n.onLine, lang: n.language, date: new Date().toISOString(),
  };
  try { if (n.userAgentData) { o.uaData = { mobile: n.userAgentData.mobile, platform: n.userAgentData.platform }; const h = await n.userAgentData.getHighEntropyValues(['model', 'platformVersion']); o.uaData.model = h.model; o.uaData.osVersion = h.platformVersion; } } catch (e) { /* nada */ }
  try { if (n.getBattery) { const b = await n.getBattery(); o.battery = { level: Math.round(b.level * 100), charging: b.charging }; } } catch (e) { /* nada */ }
  return o;
}
function startup() {
  const nav = (performance.getEntriesByType('navigation') || [])[0], o = { paint: S.paint, lcp: S.lcp, cls: Math.round(S.cls * 1000) / 1000 };
  if (nav) Object.assign(o, { type: nav.type, sw_start: Math.round(nav.workerStart || 0), response_end: Math.round(nav.responseEnd), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), transfer_kb: Math.round((nav.transferSize || 0) / 1024), doc_kb: Math.round((nav.decodedBodySize || 0) / 1024) });
  const res = (performance.getEntriesByType('resource') || []).map((r) => ({ f: r.name.split('/').pop().slice(0, 40), ms: Math.round(r.duration), kb: Math.round((r.encodedBodySize || 0) / 1024), start: Math.round(r.startTime), t: r.initiatorType }));
  o.resources = { n: res.length, kb: res.reduce((a, r) => a + r.kb, 0), slowest: topN(res.slice(), 'ms', 8) };
  o.long_before_ready = S.lt.top.filter((x) => x.at < (nav ? nav.loadEventEnd || 4000 : 4000)).length;
  if (S.early.length) { const e = S.early; o.early = { json_parse_n: e.filter((x) => x[0] === 'jp').length, json_parse_ms: r1(e.filter((x) => x[0] === 'jp').reduce((a, x) => a + x[2], 0)), ls_reads: e.filter((x) => x[0] === 'ls').length, ls_ms: r1(e.filter((x) => x[0] === 'ls').reduce((a, x) => a + x[2], 0)), biggest_parse: e.filter((x) => x[0] === 'jp').sort((x, y) => y[2] - x[2]).slice(0, 4).map((x) => ({ at: Math.round(x[1]), ms: r1(x[2]), kchars: Math.round(x[3] / 1024) })) }; }
  return o;
}
async function storageInfo() {
  const o = { keys: [], total_kb: 0 }, P = (g.__pfO && g.__pfO.P) || JSON.parse;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i), v = localStorage.getItem(k) || '', e = { k: k.slice(0, 40), kb: Math.round(v.length * 2 / 102.4) / 10 };
      if (v[0] === '{' || v[0] === '[') { let best = 1e9, val; for (let j = 0; j < 3; j++) { const t = now(); try { val = P(v); } catch (er) { break; } best = Math.min(best, now() - t); } if (best < 1e9) { e.parse_ms = r1(best); e.items = Array.isArray(val) ? val.length : val && typeof val === 'object' ? Object.keys(val).length : undefined; } }
      o.keys.push(e); o.total_kb += v.length * 2 / 1024;
    }
    o.total_kb = Math.round(o.total_kb); o.keys = topN(o.keys, 'kb', 25);
  } catch (e) { o.error = String(e); }
  try { if (navigator.storage && navigator.storage.estimate) { const s = await navigator.storage.estimate(); o.quota_mb = Math.round((s.quota || 0) / 1048576); o.usage_mb = r1((s.usage || 0) / 1048576); } } catch (e) { /* nada */ }
  try { if (g.caches) { o.caches = []; for (const k of await caches.keys()) o.caches.push({ k: k.slice(0, 24), n: (await (await caches.open(k)).keys()).length }); } } catch (e) { /* nada */ }
  try { if (navigator.serviceWorker) { const r = await navigator.serviceWorker.getRegistration(); o.sw = r ? { active: !!r.active, waiting: !!r.waiting, installing: !!r.installing } : null; } } catch (e) { /* nada */ }
  return o;
}
function bench() {
  const o = {}, loopT = (f, n) => { const t = now(); for (let i = 0; i < n; i++) f(i); return (now() - t); };
  let x = 0; o.cpu_index_ms = r1(loopT((i) => { x += Math.sqrt(i) % 3; }, 5e5)); g.__pfSink = x; // referencia de velocidad del dispositivo (menos = mejor)
  const CM = g.CM; const O = (n) => ORIGFN.get(n) || g[n];
  if (CM && CM.solvedCube) {
    const c = CM.solvedCube(), mvs = ["R", "U", "R'", "U'", "F", "D2", "L", "B'"];
    o.engine_us = { mv: r1(loopT((i) => CM.mv(c, mvs[i & 7]), 4000) / 4000 * 1000), sig: r1(loopT(() => CM.sig(c), 3000) / 3000 * 1000), clone: r1(loopT(() => CM.clone(c), 3000) / 3000 * 1000) };
    const tf = O('toFacelets'), ff = O('fromFacelets');
    if (typeof tf === 'function') { try { const s = tf(c); o.engine_us.toFacelets = r1(loopT(() => tf(c), 800) / 800 * 1000); if (typeof ff === 'function') o.engine_us.fromFacelets = r1(loopT(() => ff(s), 800) / 800 * 1000); } catch (e) { /* nada */ } }
  }
  const d = O('draw'); if (typeof d === 'function') { try { const prevPaused = S.paused; S.paused = true; o.draw_main_ms = r1(loopT(() => d(), 20) / 20); S.paused = prevPaused; } catch (e) { /* nada */ } }
  return o;
}
function diagnose(R) {
  const L = [], f = R.frames, fn = R.functions;
  const secs = R.session.sec || 1;
  if (f.n) { L.push(`Fotogramas: ${f.fps} fps de media, p95 ${f.p95} ms; ${f.jank34} por encima de 34 ms (${f.jank_pct}%) y ${f.freeze100} congelaciones de más de 100 ms.`); if (f.jank_pct > 5) L.push('⚠ Más del 5% de los fotogramas se pierden: hay trabajo pesado en el hilo principal durante la interacción.'); }
  const worstView = R.frames.by_view.filter((v) => v.n > 60).sort((a, b) => b.jank_pct - a.jank_pct)[0]; if (worstView && worstView.jank_pct > 3) L.push(`Vista con más fotogramas perdidos: «${worstView.view}» (${worstView.jank_pct}% de ${worstView.n}).`);
  if (R.longtasks.n) L.push(`Tareas largas (>50 ms): ${R.longtasks.n}, ${Math.round(R.longtasks.ms)} ms en total; la peor ${R.longtasks.top[0] ? R.longtasks.top[0].ms + ' ms en «' + R.longtasks.top[0].v + '»' : ''}.`);
  if (R.inp.p98) L.push(`Respuesta a toques/teclas (INP aprox.): p98 ${R.inp.p98} ms, peor ${R.inp.worst} ms${R.inp.p98 > 200 ? ' ⚠ por encima de 200 ms' : ''}.`);
  const top = fn.slice(0, 3); if (top.length) L.push('Funciones que más tiempo propio consumen: ' + top.map((x) => `${x.f} (${x.self} ms, ${x.n} llamadas)`).join('; ') + '.');
  const jp = R.json.parse; if (jp.ms > 40 || jp.max > 8) L.push(`JSON.parse: ${jp.n} llamadas, ${jp.ms} ms en total (máx ${jp.max} ms, ${jp.kb} KB leídos)${R.json.slow_callers[0] ? '. Mayor origen: ' + R.json.slow_callers[0].from : ''}. → candidato a caché en memoria de localStorage.`);
  const ls = R.storage.localStorage_ms; if (ls > 30) L.push(`localStorage consume ${ls} ms acumulados (síncrono, bloquea el hilo).`);
  const ih = R.innerHTML; if (ih.all.ms > 60) L.push(`innerHTML: ${ih.all.n} asignaciones, ${ih.all.ms} ms; el mayor: ${ih.by[0] ? ih.by[0].el + ' (' + ih.by[0].ms + ' ms)' : '-'}.`);
  if (R.canvas.toDataURL.ms > 40) L.push(`toDataURL (iconos de casos): ${R.canvas.toDataURL.n} llamadas, ${R.canvas.toDataURL.ms} ms.`);
  const hs = R.memory.samples.filter((s) => s.heap != null); if (hs.length > 8) { const a = hs[2].heap, b = hs[hs.length - 1].heap; if (b > a * 1.3 && b - a > 4) L.push(`⚠ El heap de JS sube de ${a} MB a ${b} MB durante la sesión: posible fuga o caché sin límite.`); }
  const ns = R.memory.samples; if (ns.length > 8 && ns[ns.length - 1].nodes > ns[2].nodes * 1.5 && ns[ns.length - 1].nodes - ns[2].nodes > 800) L.push(`⚠ Los nodos del DOM crecen de ${ns[2].nodes} a ${ns[ns.length - 1].nodes}: algo no se limpia al cambiar de vista.`);
  if (R.timers.rafPerSec > 70) L.push(`requestAnimationFrame se pide ${R.timers.rafPerSec} veces/s: hay bucles de animación activos que quizá deberían parar en reposo.`);
  if (R.timers.intervals_active > 1) L.push(`Hay ${R.timers.intervals_active} setInterval activos.`);
  const st = R.startup; if (st.paint && st.paint['first-contentful-paint'] > 1800) L.push(`Arranque lento: primer contenido a los ${st.paint['first-contentful-paint']} ms.`);
  if (R.bench.cpu_index_ms) L.push(`Índice de CPU del dispositivo: ${R.bench.cpu_index_ms} ms (500.000 iteraciones: sirve para comparar dispositivos, menos es más rápido).`);
  if (!L.length) L.push('Sin hallazgos relevantes con la actividad registrada. Recorre las pantallas pesadas (Estadísticas, Aprender, una resolución completa) y vuelve a generar el informe.');
  return L;
}
async function report() {
  const t = now(), sec = (t - S.t0) / 1000, fr = S.fr;
  const fnArr = [...S.fn].map(([k, v]) => ({ f: k, n: v.n, self: r1(v.self), incl: r1(v.incl), max: r1(v.max), avg_us: v.n ? Math.round(v.self / v.n * 1000) : 0, slow16: v.slow, async_ms: v.an ? r1(v.async / v.an) : undefined, sampled_off: v.off || undefined })).filter((x) => x.n);
  const jsonCallers = [...S.json.ps].map(([k, v]) => ({ from: k, n: v.n, ms: r1(v.ms), kb: Math.round(v.sz / 1024) })).sort((a, b) => b.ms - a.ms).slice(0, 8);
  const lsE = [...S.ls].map(([k, v]) => ({ k, get_n: v.g.n, get_ms: r1(v.g.ms), get_max: r1(v.g.max), read_kb: Math.round(v.g.sz / 1024), set_n: v.s.n, set_ms: r1(v.s.ms), set_max: r1(v.s.max), wrote_kb: Math.round(v.s.sz / 1024) }));
  const lsMs = r1(lsE.reduce((a, e) => a + e.get_ms + e.set_ms, 0));
  const R = {
    format: 'cubiq-perf/1', context: await context(), session: { sec: Math.round(sec), paused: S.paused, views: S.views.slice(-40).map((v) => ({ t: Math.round(v.t - S.t0), v: v.v })) },
    startup: startup(), bench: bench(), storage: { snapshot: await storageInfo(), localStorage_ms: lsMs, keys: topN(lsE, 'get_ms', 15) },
    frames: { n: fr.n, fps: fr.sum ? Math.round(fr.n / (fr.sum / 1000)) : 0, avg_ms: fr.n ? r1(fr.sum / fr.n) : 0, p95: r1(pct(S.fd, .95)), worst: Math.round(fr.worst), jank20: fr.j20, jank34: fr.j34, freeze100: fr.f100, jank_pct: fr.n ? r1(fr.j34 / fr.n * 100) : 0, hist: { '<=17': fr.h[0], '<=25': fr.h[1], '<=34': fr.h[2], '<=50': fr.h[3], '<=100': fr.h[4], '>100': fr.h[5] },
      by_view: [...S.frView].map(([v, a]) => ({ view: v, n: a.n, fps: a.sum ? Math.round(a.n / (a.sum / 1000)) : 0, worst: Math.round(a.worst), jank34: a.j34, freeze100: a.f100, jank_pct: a.n ? r1(a.j34 / a.n * 100) : 0 })) },
    longtasks: { n: S.lt.n, ms: Math.round(S.lt.ms), top: topN(S.lt.top.slice(), 'ms', 12) },
    loaf: { n: S.loaf.n, ms: Math.round(S.loaf.ms), blocking_ms: Math.round(S.loaf.block), top: topN(S.loaf.top.slice(), 'ms', 10), by_script: [...S.loaf.by].map(([k, v]) => ({ s: k, n: v.n, ms: v.ms, forced_layout_ms: v.forced })).sort((a, b) => b.ms - a.ms).slice(0, 10) },
    inp: { n: S.ev.all.length, p75: Math.round(pct(S.ev.all, .75)), p98: Math.round(pct(S.ev.all, .98)), worst: Math.round(Math.max(0, ...S.ev.all)), events: Object.fromEntries(S.ev.by), slowest: topN(S.ev.top.slice(), 'ms', 12) },
    functions: topN(fnArr.slice(), 'self', 45), slow_calls: topN(S.slowFn.slice(), 'ms', 15),
    json: { parse: outAgg(S.json.p), stringify: outAgg(S.json.s), slow_callers: jsonCallers },
    innerHTML: { all: outAgg(S.html.all), by: [...S.html.by].map(([el, a]) => ({ el, ...outAgg(a) })).sort((a, b) => b.ms - a.ms).slice(0, 12), slowest: topN(S.html.slow.slice(), 'ms', 10) },
    canvas: { toDataURL: { ...outAgg(S.url), sizes: Object.fromEntries([...S.urlDims].slice(0, 8)) } },
    timers: { raf_calls: S.timers.raf, rafPerSec: sec ? Math.round(S.timers.raf / sec) : 0, setTimeout_calls: S.timers.st, setInterval_calls: S.timers.si, intervals_active: S.timers.siActive.size },
    memory: { api: !!performance.memory, samples: S.samples.length > 40 ? S.samples.filter((_, i) => i % Math.ceil(S.samples.length / 40) === 0 || i === S.samples.length - 1) : S.samples },
    segments: segments(), notes: S.notes.slice(-20),
    coverage: { wrapped_functions: S.fn.size, names_sample: [...S.fn.keys()].slice(0, 12) },
  };
  R.summary = diagnose(R);
  return R;
}

function resetCounters() {
  const n = fresh(), keep = S.fn; n.fn = keep; n.early = S.early; n.paused = S.paused; n.timers.siActive = S.timers.siActive;
  for (const st of keep.values()) { st.n = st.incl = st.self = st.max = st.slow = st.async = st.an = 0; st.off = false; }
  S = n; S.views.push({ t: now(), v: curView() }); snap('inicio', 'manual');
}

// ---------- panel (Shadow DOM, discreto) ----------
let host = null, tickId = 0;
function buildUI() {
  host = document.createElement('div'); host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483000;font:12px/1.35 system-ui,sans-serif;color:#e6e9ee';
  const sh = host.attachShadow({ mode: 'open' });
  sh.innerHTML = '<style>button{font:inherit;color:inherit;background:#222a35;border:1px solid #3a4452;border-radius:8px;padding:6px 9px;margin:2px}#p{opacity:.55;border-radius:12px;background:#0b0d10}#p.on{opacity:.9}#b{display:none;margin-top:6px;background:#0b0d10ee;border:1px solid #3a4452;border-radius:12px;padding:8px;width:min(300px,86vw)}#b.on{display:block}input{font:inherit;width:100%;box-sizing:border-box;background:#151a21;color:inherit;border:1px solid #3a4452;border-radius:8px;padding:6px;margin:4px 0}#s{white-space:pre;font:11px/1.4 ui-monospace,monospace;color:#9aa4b2;margin-bottom:4px}#m{color:#6ea0ff;min-height:16px}</style><button id="p">● PERF</button><div id="b"><div id="s"></div><input id="n" placeholder="Escenario (ej. abrir Estadísticas)" maxlength="40"><div><button id="mk">Marcar</button><button id="ps">Pausar</button><button id="rs">Reiniciar</button></div><div><button id="cp">Copiar informe</button><button id="dl">Descargar</button><button id="sh">Compartir</button></div><div><button id="off">Desactivar diagnóstico</button></div><div id="m"></div></div>';
  document.body.appendChild(host);
  const q = (i) => sh.getElementById(i), say = (t) => { q('m').textContent = t; };
  q('p').onclick = () => q('b').classList.toggle('on');
  q('mk').onclick = () => { snap(q('n').value.trim() || curView(), 'manual'); say('Marcado: ' + (q('n').value.trim() || curView())); q('n').value = ''; };
  q('ps').onclick = () => { S.paused = !S.paused; q('ps').textContent = S.paused ? 'Seguir' : 'Pausar'; q('p').classList.toggle('on', !S.paused); };
  q('rs').onclick = () => { resetCounters(); say('Contadores a cero'); };
  const blob = async () => { say('Generando…'); const R = await report(); return JSON.stringify(R); };
  q('cp').onclick = async () => { const s = await blob(); try { await navigator.clipboard.writeText(s); say('Copiado (' + Math.round(s.length / 1024) + ' KB). Pégalo en el chat.'); } catch (e) { const ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); say('Copiado (' + Math.round(s.length / 1024) + ' KB)'); } catch (er) { say('No se pudo copiar: usa Descargar'); } ta.remove(); } };
  const file = (s) => new File([s], 'cubiq-perf-' + (g.APP_VERSION || 'x') + '-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '') + '.json', { type: 'application/json' });
  q('dl').onclick = async () => { const f = file(await blob()), a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); say('Descargado: ' + f.name); };
  q('sh').onclick = async () => { const f = file(await blob()); try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Informe de rendimiento CubIQ' }); say('Compartido'); } else say('Este navegador no comparte archivos: usa Copiar o Descargar'); } catch (e) { say('Cancelado'); } };
  q('off').onclick = () => { try { localStorage.removeItem(FLAG); } catch (e) { /* nada */ } location.reload(); };
  tickId = SI0(() => {
    const dt = (now() - S.t0) / 1000, mm = performance.memory, fr = S.fr;
    q('p').textContent = '● PERF ' + Math.floor(dt / 60) + ':' + String(Math.floor(dt % 60)).padStart(2, '0') + (S.paused ? ' ⏸' : '');
    if (q('b').classList.contains('on')) q('s').textContent = 'vista ' + curView() + '\nfps ' + (fr.sum ? Math.round(fr.n / (fr.sum / 1000)) : '-') + ' · perdidos ' + fr.j34 + ' · >100ms ' + fr.f100 + '\ntareas largas ' + S.lt.n + ' (' + Math.round(S.lt.ms) + ' ms)\nJSON.parse ' + r1(S.json.p.ms) + ' ms · innerHTML ' + r1(S.html.all.ms) + ' ms\n' + (mm ? 'heap ' + Math.round(mm.usedJSHeapSize / 1048576) + ' MB · ' : '') + 'nodos ' + document.getElementsByTagName('*').length;
  }, 1000);
}

// ---------- ciclo de vida ----------
export function isOn() { return !!S; }
export function start(opts = {}) {
  if (S) return ctl;
  S = fresh(); RAF = (g.__pfRAF = g.__pfRAF || g.requestAnimationFrame.bind(g));
  if (g.__pfE) S.early = g.__pfE;
  installNatives(); installObservers();
  const n = wrapAll(); S.notes.push('funciones medidas: ' + n);
  S.views.push({ t: now(), v: curView() }); snap('inicio', 'manual');
  try { mo = new MutationObserver(() => { const v = curView(), l = S.views[S.views.length - 1]; if (!l || l.v !== v) { S.views.push({ t: now(), v }); snap(v, 'view'); } }); mo.observe(document.body, { attributes: true, attributeFilter: ['data-view'] }); } catch (e) { /* nada */ }
  rafId = RAF(loop); sampler = SI0(sample, 2000); sample();
  try { localStorage.setItem(FLAG, '1'); } catch (e) { /* nada */ }
  if (opts.ui !== false && g.document && document.body) buildUI();
  ctl = { mark: (n) => snap(n, 'manual'), report, stop };
  return ctl;
}
export function stop() {
  try { localStorage.removeItem(FLAG); } catch (e) { /* nada */ }
  if (!S) return;
  CI0(tickId); CI0(sampler); if (mo) mo.disconnect(); if (host) host.remove();
  UNDO.splice(0).reverse().forEach((u) => { try { u(); } catch (e) { /* nada */ } });
  for (const [n, f] of ORIGFN) { try { g[n] = f; } catch (e) { /* nada */ } }
  ORIGFN.clear(); S = null; ctl = null; rafId = 0;
}
export const _resetCounters = resetCounters;
export const _test = { get S() { return S; }, report, snap };

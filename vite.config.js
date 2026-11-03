import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

// Optimización de producción sin dependencias extra:
//  1) minifica el <script> y el <style> en línea del index.html (Vite no los toca) con esbuild, que ya viene con Vite;
//  2) genera la lista de precarga del service worker a partir de lo que realmente se ha construido.
const cubiq = () => {
  let outDir = 'dist';
  const replaceAsync = async (s, re, fn) => {
    const found = [];
    s.replace(re, (m, ...a) => { found.push([m, a]); return m; });
    const res = await Promise.all(found.map(([m, a]) => fn(m, ...a)));
    let i = 0; return s.replace(re, () => res[i++]);
  };
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
  return {
    name: 'cubiq-optimize',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        const esb = await import('esbuild').catch(() => null);
        if (!esb) return html;
        const min = async (code, loader) => { try { return (await esb.transform(code, { loader, minify: true, legalComments: 'none' })).code.trim(); } catch (e) { this?.warn?.('No se pudo minificar: ' + e.message); return code; } };
        html = await replaceAsync(html, /<script>([\s\S]*?)<\/script>/g, async (m, js) => '<script>' + await min(js, 'js') + '</script>');
        html = await replaceAsync(html, /<style>([\s\S]*?)<\/style>/g, async (m, css) => '<style>' + await min(css, 'css') + '</style>');
        return html;
      },
    },
    closeBundle() {
      const files = walk(outDir).map((f) => relative(outDir, f).split(sep).join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map') && !f.endsWith('.woff')) // woff2 basta en los navegadores que instalan PWAs
        .filter((f) => !f.endsWith('.woff2') || /-latin-\d/.test(f));                // solo el subconjunto latino de la tipografía (cubre el español)
      const hash = createHash('sha1');
      for (const f of files.sort()) hash.update(f).update(readFileSync(join(outDir, f)));
      const list = ['./', ...files.filter((f) => f !== 'index.html').map((f) => './' + f), './index.html'];
      const swPath = join(outDir, 'sw.js');
      writeFileSync(swPath, readFileSync(swPath, 'utf8')
        .replace("V = '__VERSION__'", "V = '" + hash.digest('hex').slice(0, 10) + "'")
        .replace('/*__PRECACHE__*/[]', JSON.stringify(list)));
    },
  };
};

export default {
  base: './', // rutas relativas: funciona en subcarpetas como usuario.github.io/cubopwa/
  plugins: [cubiq()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    reportCompressedSize: false,
    assetsInlineLimit: 0, // las fuentes se cargan como archivos (y se precargan en el SW), no se incrustan en el CSS
  },
};

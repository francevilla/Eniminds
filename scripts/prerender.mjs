import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { render } from '../.ssr/entry-server.js';
import { pages, titles } from '../src/content.js';
const template = await readFile('dist/index.html', 'utf8');
const routes = ['/', ...Object.keys(pages), '/blog/', '/contatti/', '/2024/12/12/titolo-articolo/'];
const escape = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for (const route of routes) {
  const [title, description] = titles[route];
  const html = template.replace('<div id="root"></div>', `<div id="root">${render(route)}</div>`)
    .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(description)}" />`)
    .replace('</head>', `${route.includes('titolo-articolo') ? '<meta name="robots" content="noindex,follow" />' : ''}</head>`);
  const out = route === '/' ? 'dist/index.html' : join('dist', route, 'index.html');
  await mkdir(dirname(out), {recursive:true}); await writeFile(out, html);
}
await rm('.ssr', { recursive:true, force:true });
console.log(`Prerendered ${routes.length} pages.`);

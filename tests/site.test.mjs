import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { pages, titles, normalizePath } from '../src/content.js';

test('normalizza gli URL interni senza perdere la radice', () => {
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath('/chi-siamo'), '/chi-siamo/');
  assert.equal(normalizePath('/per-condomini/?test=1'), '/per-condomini/');
});

test('ogni pagina ha contenuti, immagine e destinazione valide', async () => {
  const paths = new Set([...Object.keys(titles), '/']);
  for (const [route, page] of Object.entries(pages)) {
    assert.ok(page.slug && page.label && page.title && page.intro && page.heading, route);
    assert.ok(page.alt, `${route}: testo alternativo`);
    assert.ok(paths.has(page.next[0]), `${route}: destinazione successiva`);
    await access(`public${page.image}`);
  }
});

test('build: tutte le pagine note hanno HTML e metadati propri', async () => {
  for (const [route, [title]] of Object.entries(titles)) {
    const file = route === '/' ? 'dist/index.html' : `dist${route}index.html`;
    const html = await readFile(file, 'utf8');
    assert.ok(html.includes('<h1'), `${route}: titolo visibile`);
    assert.ok(html.includes('<meta name="description"'), `${route}: descrizione`);
    assert.ok(html.includes(title.replaceAll('&','&amp;')), `${route}: titolo SEO`);
    assert.ok(html.includes('<nav'), `${route}: navigazione`);
  }
});

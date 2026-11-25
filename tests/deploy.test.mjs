import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { scryptSync, timingSafeEqual } from 'node:crypto';

function hash(input) {
  return spawnSync(process.execPath,['scripts/hash-cms-password.mjs'],{input,encoding:'utf8'});
}
test('hash della password: formato, verifica e salt casuale',()=>{
  const value='un-test-lungo-e-casuale-123';
  const first=hash(value), second=hash(value);
  assert.equal(first.status,0);assert.equal(second.status,0);
  const match=/^scrypt:([a-f0-9]{64}):([a-f0-9]{64})\n$/.exec(first.stdout);
  assert.ok(match);assert.notEqual(first.stdout,second.stdout);
  assert.ok(timingSafeEqual(scryptSync(value,Buffer.from(match[1],'hex'),32),Buffer.from(match[2],'hex')));
  assert.ok(!first.stdout.includes(value));
});
test('hash della password: rifiuta password corte e a capo',()=>{
  assert.notEqual(hash('corta').status,0);
  assert.notEqual(hash('questa-password-ha\nun-a-capo').status,0);
});

test('Vercel rewrite: inoltra percorsi e rifiuta parametri ambigui', async () => {
  const { rewrittenUrl }=await import('../server/rewrite.mjs');
  assert.equal(rewrittenUrl('/api/index?__cms_path=%2Fadmin%2F'),'/admin/');
  assert.equal(rewrittenUrl('/api/index?__cms_path=%2Fapi%2Fadmin%2Flogin&x=1'),'/api/admin/login?x=1');
  assert.equal(rewrittenUrl('/api/index'),null);
  assert.equal(rewrittenUrl('/api/index?__cms_path=%2F%2Fevil.example'),null);
  assert.equal(rewrittenUrl('/api/index?__cms_path=%2Fadmin&__cms_path=%2Fapi'),null);
});

test('Vercel: route generate corrispondono alla radice e ai percorsi con o senza slash', async () => {
  const { readFile }=await import('node:fs/promises');
  const { convertRewrites }=await import('@vercel/routing-utils');
  const { rewrittenUrl }=await import('../server/rewrite.mjs');
  const config=JSON.parse(await readFile('vercel.json','utf8'));
  const routes=convertRewrites(config.rewrites);
  for (const path of ['/','/admin','/admin/','/chi-siamo/','/blog/articolo/','/api/content','/api/admin/status','/api/admin/login']) {
    const route=routes.find(r=>new RegExp(r.src).test(path));
    assert.ok(route, `Nessuna route per ${path}`);
    const forwarded=path.replace(new RegExp(route.src), route.dest);
    assert.equal(new URL(forwarded,'https://example.com').pathname,'/api/index');
    const result = new URL(rewrittenUrl(forwarded), 'https://example.com');
    assert.equal(result.pathname,path, `Percorso errato per ${path}`);
  }
});

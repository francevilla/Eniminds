import { pages } from '../src/content.js';
import { home, services, audiences, settings } from '../src/home-content.js';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

export const defaults = { home, services, audiences, settings, pages, posts: [] };
const postSchema = z.object({slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),title:z.string().trim().min(1).max(200),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),excerpt:z.string().max(1000),body:z.string().max(20000),published:z.boolean()}).strict();
function validateLike(value, reference, path='') {
  if (typeof reference === 'string') {
    if (typeof value !== 'string' || value.length > 5000 || (reference.trim() && !value.trim())) throw Error(`Campo non valido: ${path}`);
    if (/\.(slug|number|accent)$/.test(path) || /\.next\.[01]$/.test(path)) { if (value !== reference) throw Error(`Campo non valido: ${path}`); }
    if (path.endsWith('.image') || path.endsWith('.heroImage')) {
      if (!/^\/(images|media)\/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$/.test(value)) throw Error(`Immagine non valida: ${path}`);
    }
    return;
  }
  if (Array.isArray(reference)) {
    if (!Array.isArray(value) || value.length !== reference.length) throw Error(`Elenco non valido: ${path}`);
    reference.forEach((item,i)=>validateLike(value[i],item,`${path}.${i}`));return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== Object.keys(reference).length) throw Error(`Oggetto non valido: ${path}`);
  for (const k of Object.keys(reference)) { if (!(k in value)) throw Error(`Campo mancante: ${path}.${k}`); validateLike(value[k],reference[k],`${path}.${k}`); }
}
export function validateContent(content) {
  if (!content || typeof content !== 'object' || Object.keys(content).sort().join(',') !== 'audiences,home,pages,posts,services,settings') throw Error('Struttura non valida');
  for (const k of ['home','services','audiences','pages','settings']) validateLike(content[k],defaults[k],k);
  if (!z.string().email().max(254).safeParse(content.settings.email).success) throw Error('Campo non valido: settings.email');
  const posts=z.array(postSchema).max(200).parse(content.posts);
  if(new Set(posts.map(p=>p.slug)).size!==posts.length) throw Error('Slug articolo duplicato');
  return content;
}
export function revision(data) { return createHash('sha256').update(JSON.stringify(data)).digest('hex'); }
export function store(dir) {
  const file=join(dir,'content.json');
  async function read() { try { const data=JSON.parse(await readFile(file,'utf8'));return validateContent(data); } catch (err) { if (err.code==='ENOENT') return structuredClone(defaults); throw err; } }
  async function write(content) { validateContent(content); await mkdir(dir,{recursive:true,mode:0o700});const temp=join(dir,`content.${process.pid}.tmp`);await writeFile(temp,JSON.stringify(content,null,2)+'\n',{mode:0o600});await rename(temp,file); }
  return {read,write};
}

import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { titles, normalizePath } from '../src/content.js';
import { resolve, join } from 'node:path';
import { store, revision } from './content-store.mjs';

const app=express(); app.disable('x-powered-by');
const dir=resolve(process.env.CMS_DATA_DIR || '.cms-data'); const db=store(dir);
const password=process.env.CMS_PASSWORD || ''; const username=process.env.CMS_USERNAME || ''; const passwordHash=process.env.CMS_PASSWORD_HASH || ''; const production=process.env.NODE_ENV === 'production';
if (username && (!/^[a-zA-Z0-9._-]{1,64}$/.test(username))) { console.error('CMS_USERNAME non valido.'); process.exit(1); }
if (password && passwordHash) { console.error('Usare CMS_PASSWORD oppure CMS_PASSWORD_HASH, non entrambi.'); process.exit(1); }
if (production && process.env.CMS_PREVIEW_ONLY === 'true') { console.error('Credenziali per anteprima non consentite in produzione.'); process.exit(1); }
if (production && password && password.length < 16) { console.error('CMS_PASSWORD deve contenere almeno 16 caratteri in produzione.'); process.exit(1); }
if (production && (!username || (!password && !passwordHash))) { console.error('Configurare CMS_USERNAME e una password prima di avviare in produzione.'); process.exit(1); }
let publicOrigin = '';
if (production) { try { const u = new URL(process.env.CMS_PUBLIC_ORIGIN); if (u.protocol !== 'https:' || u.pathname !== '/' || u.search || u.hash || u.username || u.password) throw Error(); publicOrigin = u.origin; } catch { console.error('CMS_PUBLIC_ORIGIN deve essere un’origine HTTPS, ad esempio https://cms.example.com'); process.exit(1); } }
let salt, expected;
if (passwordHash) {
  const match = /^scrypt:([0-9a-f]{64}):([0-9a-f]{64})$/.exec(passwordHash);
  if (!match) { console.error('CMS_PASSWORD_HASH non valido.'); process.exit(1); }
  salt=Buffer.from(match[1],'hex');expected=Buffer.from(match[2],'hex');
} else { salt=randomBytes(32);expected=scryptSync(password || randomBytes(32).toString('hex'),salt,32); }
const configured=Boolean(username && (password || passwordHash));
const sessions=new Map(), attempts=[];
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','strict-origin-when-cross-origin');next()});
app.use(express.json({limit:'8mb'}));
const publicContent = content => ({...content,posts:content.posts.filter(p=>p.published)});
const cookieToken = req => (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('cms_session='))?.slice(12);
function sameOrigin(req,res,next) { try { const origin=new URL(req.get('origin')); if (production ? origin.origin !== publicOrigin : (origin.host !== req.get('host') || !['http:','https:'].includes(origin.protocol))) throw Error(); next(); } catch { res.status(403).json({error:'Origine non autorizzata'}); } }
function auth(req,res,next) { const token=cookieToken(req), session=sessions.get(token); if(!session || session.expires<Date.now()) { if(token) sessions.delete(token); return res.status(401).json({error:'Accesso richiesto'}); } req.cmsSession=session; next(); }
function csrf(req,res,next) { if(req.get('x-csrf-token') !== req.cmsSession.csrf) return res.status(403).json({error:'Sessione non valida'}); next(); }
app.get('/api/content', async (req,res,next)=>{try{res.set('Cache-Control','no-store').json(publicContent(await db.read()))}catch(e){next(e)}});
app.get('/api/admin/status',(req,res)=>res.json({configured}));
app.post('/api/admin/login',sameOrigin,(req,res)=>{
  const now=Date.now(); while(attempts.length && attempts[0]<now-15*60*1000) attempts.shift();
  if(attempts.length>=15) return res.status(429).json({error:'Troppi tentativi. Riprova più tardi.'}); attempts.push(now);
  const supplied=typeof req.body?.password==='string' && req.body.password.length<=512?req.body.password:'';
  const suppliedUsername=typeof req.body?.username==='string' && req.body.username.length<=64?req.body.username:'';
  const candidate=scryptSync(supplied,salt,32); if(!configured || suppliedUsername!==username || !timingSafeEqual(candidate,expected)) return res.status(401).json({error:'Accesso non riuscito'});
  attempts.length=0;const token=randomBytes(32).toString('hex'), csrfToken=randomBytes(32).toString('hex');sessions.set(token,{csrf:csrfToken,expires:now+8*60*60*1000});
  res.cookie('cms_session',token,{httpOnly:true,sameSite:'strict',secure:production,path:'/api/admin',maxAge:8*60*60*1000});res.set('Cache-Control','no-store').json({csrf:csrfToken});
});
app.get('/api/admin/content',auth,async(req,res,next)=>{try{const data=await db.read();res.set('Cache-Control','no-store').json({data,revision:revision(data),csrf:req.cmsSession.csrf});}catch(e){next(e)}});
let writing=false;
app.put('/api/admin/content',sameOrigin,auth,csrf,async(req,res,next)=>{if(writing)return res.status(409).json({error:'Salvataggio in corso, riprova.'});writing=true;try{let old=await db.read();if(req.body?.revision!==revision(old))return res.status(409).json({error:'I contenuti sono stati modificati da un’altra sessione. Ricarica prima di salvare.'});await db.write(req.body.data);res.json({revision:revision(req.body.data)});}catch(e){if(e instanceof SyntaxError || e.name==='ZodError' || e.message.startsWith('Campo') || e.message.startsWith('Oggetto') || e.message.startsWith('Elenco') || e.message.startsWith('Immagine') || e.message.startsWith('Struttura') || e.message.startsWith('Slug')) return res.status(400).json({error:'Contenuto non valido: '+e.message});next(e);}finally{writing=false;}});
app.post('/api/admin/logout',sameOrigin,auth,csrf,(req,res)=>{sessions.delete(cookieToken(req));res.clearCookie('cms_session',{path:'/api/admin',httpOnly:true,sameSite:'strict',secure:production});res.json({ok:true});});
app.post('/api/admin/upload',sameOrigin,auth,csrf,async(req,res,next)=>{try{const {data,type}=req.body || {}; if(typeof data!=='string'||!['image/png','image/jpeg','image/webp'].includes(type)||data.length>7_000_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data))return res.status(400).json({error:'File non valido'});const b=Buffer.from(data,'base64');if(b.length>5_000_000 || b.length<16)return res.status(400).json({error:'La dimensione massima è 5 MB'});const valid=type==='image/png'?b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):type==='image/jpeg'?b.subarray(0,3).equals(Buffer.from('ffd8ff','hex')):b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';if(!valid)return res.status(400).json({error:'Formato immagine non valido'});let ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[type];let name=randomBytes(16).toString('hex')+'.'+ext;await mkdir(join(dir,'media'),{recursive:true,mode:0o700});await writeFile(join(dir,'media',name),b,{flag:'wx',mode:0o600});res.json({url:'/media/'+name});}catch(e){next(e)}});
app.use('/media',express.static(join(dir,'media'),{dotfiles:'deny',index:false,fallthrough:false}));
if (production) {
  const { render } = await import('../.ssr/entry-server.js');
  const shell = await readFile(resolve('dist/shell.html'),'utf8');
  app.use((req,res,next)=>req.path.endsWith('.html') ? res.sendStatus(404) : next());
  app.use(express.static('dist',{index:false,redirect:false}));
  app.get('/{*path}', async (req,res,next)=>{try {
    if(req.path.startsWith('/api/')||req.path.startsWith('/media/')) return res.sendStatus(404);
    const data=publicContent(await db.read()), path=normalizePath(req.path);
    const post = path.startsWith('/blog/') ? data.posts.find(p=>`/blog/${p.slug}/`===path) : null;
    const known = path === '/admin/' || Object.hasOwn(titles,path) || Boolean(post);
    const page = data.pages[path];
    const title = post ? post.title+' | Eniminds' : page ? page.title+' | Eniminds' : titles[path]?.[0] || (path === '/admin/'?'Area riservata | Eniminds':'Pagina non trovata | Eniminds');
    const description = post ? post.excerpt : page ? page.intro : titles[path]?.[1] || '';
    const escape = text=>String(text).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    const serialized=JSON.stringify(data).replace(/[<>&\u2028\u2029]/g,c=>({'<':'\\u003c','>':'\\u003e','&':'\\u0026','\u2028':'\\u2028','\u2029':'\\u2029'})[c]);
    const html = shell.replace('<div id="root"></div>',`<div id="root">${render(path,data)}</div>`).replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta name="description" content="[^"]*"\s*\/>/,`<meta name="description" content="${escape(description)}" />`).replace('</head>', path==='/admin/'?'<meta name="robots" content="noindex,nofollow" /></head>':path==='/2024/12/12/titolo-articolo/'?'<meta name="robots" content="noindex,follow" /></head>':'</head>').replace('</body>',`<script type="application/json" id="initial-content">${serialized}</script></body>`);
    res.status(known?200:404).set('Cache-Control','no-store').type('html').send(html);
  } catch(e){next(e)} });
}
app.use((err,req,res,next)=>{console.error(err);res.status(err.status || 500).json({error:'Errore del server'});});
const port=Number(process.env.PORT || 3001);app.listen(port,'0.0.0.0',()=>console.log(`CMS API in ascolto sulla porta ${port}; accesso ${configured?'configurato':'disabilitato (imposta CMS_USERNAME e password)'}`));

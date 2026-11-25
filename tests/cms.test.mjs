import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';

async function port() {const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const n=s.address().port;await new Promise(r=>s.close(r));return n;}
test('CMS: autenticazione, CSRF, modifiche, bozze e rendering', async t=>{
 const dir=await mkdtemp(join(tmpdir(),'eniminds-cms-'));const p=await port();const origin=`http://127.0.0.1:${p}`;
 const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'production',PORT:String(p),CMS_DATA_DIR:dir,CMS_USERNAME:'test-admin',CMS_PASSWORD:'test-password-very-long',CMS_PUBLIC_ORIGIN:`https://127.0.0.1:${p}`},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{server.kill();await once(server,'exit');await rm(dir,{recursive:true,force:true})});
 await Promise.race([new Promise((resolve,reject)=>{server.stdout.on('data',s=>{if(s.toString().includes('in ascolto'))resolve()});server.on('exit',code=>reject(Error('server exit '+code)));}),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout server')),5000))]);
 const json=async(path, opts={})=>{let r=await fetch(origin+path,opts);return [r,await r.json()]};
 let [r]=await json('/api/admin/content');assert.equal(r.status,401);
 [r]=await json('/api/admin/login',{method:'POST',headers:{'content-type':'application/json',origin:`https://127.0.0.1:${p}`},body:JSON.stringify({username:'test-admin',password:'sbagliata'})});assert.equal(r.status,401);
 [r]=await json('/api/admin/login',{method:'POST',headers:{'content-type':'application/json',origin:`https://127.0.0.1:${p}`},body:JSON.stringify({username:'wrong-user',password:'test-password-very-long'})});assert.equal(r.status,401);
 let result;[r,result]=await json('/api/admin/login',{method:'POST',headers:{'content-type':'application/json',origin:`https://127.0.0.1:${p}`},body:JSON.stringify({username:'test-admin',password:'test-password-very-long'})});assert.equal(r.status,200);
 const cookie=r.headers.get('set-cookie').split(';')[0], csrf=result.csrf;const headers={'content-type':'application/json',origin:`https://127.0.0.1:${p}`,cookie,'x-csrf-token':csrf};
 let current;[r,current]=await json('/api/admin/content',{headers:{cookie}});assert.equal(r.status,200);
 [r]=await json('/api/admin/content',{method:'PUT',headers:{...headers,origin:'https://evil.example'},body:JSON.stringify({data:current.data,revision:current.revision})});assert.equal(r.status,403);
 [r]=await json('/api/admin/content',{method:'PUT',headers:{...headers,'x-csrf-token':'bad'},body:JSON.stringify({data:current.data,revision:current.revision})});assert.equal(r.status,403);
 current.data.home.heroTitle='Titolo aggiornato dal CMS';current.data.home.introText='Prova </script><script>alert(1)</script>'; current.data.posts=[{slug:'bozza',title:'Bozza segreta',date:'2026-11-25',excerpt:'',body:'test',published:false},{slug:'articolo',title:'Articolo CMS',date:'2026-11-25',excerpt:'Introduzione',body:'Contenuto pubblicato',published:true}];
 [r,result]=await json('/api/admin/content',{method:'PUT',headers,body:JSON.stringify({data:current.data,revision:current.revision})});assert.equal(r.status,200);
 [r]=await json('/api/admin/content',{method:'PUT',headers,body:JSON.stringify({data:current.data,revision:current.revision})});assert.equal(r.status,409);
 let pub;[r,pub]=await json('/api/content');assert.equal(pub.home.heroTitle,'Titolo aggiornato dal CMS');assert.equal(pub.posts.length,1);assert.equal(pub.posts[0].slug,'articolo');
 let html=await (await fetch(origin+'/')).text();assert.match(html,/Titolo aggiornato dal CMS/);assert.doesNotMatch(html,/Bozza segreta/);assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);assert.match(html,/\\u003c\/script\\u003e/);
 let article=await fetch(origin+'/blog/articolo/');assert.equal(article.status,200);assert.match(await article.text(),/Contenuto pubblicato/);assert.equal((await fetch(origin+'/blog/bozza/')).status,404);
 [r]=await json('/api/admin/upload',{method:'POST',headers,body:JSON.stringify({type:'image/png',data:Buffer.from('<html>test</html>').toString('base64')})});assert.equal(r.status,400);
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
 let upload;[r,upload]=await json('/api/admin/upload',{method:'POST',headers,body:JSON.stringify({type:'image/png',data:png})});assert.equal(r.status,200);assert.match(upload.url,/^\/media\/[a-f0-9]+\.png$/);let img=await fetch(origin+upload.url);assert.equal(img.status,200);assert.equal(img.headers.get('x-content-type-options'),'nosniff');
 [r]=await json('/api/admin/content',{method:'PUT',headers,body:JSON.stringify({data:{...current.data,home:{...current.data.home,heroImage:'javascript:alert(1)'}},revision:result.revision})});assert.equal(r.status,400);
 [r]=await json('/api/admin/logout',{method:'POST',headers});assert.equal(r.status,200);[r]=await json('/api/admin/content',{headers:{cookie}});assert.equal(r.status,401);
});

test('credenziali hash e divieto delle credenziali di anteprima in produzione', async t=>{
 const dir=await mkdtemp(join(tmpdir(),'eniminds-auth-'));const p=await port();const origin=`http://127.0.0.1:${p}`;
 const salt=randomBytes(32),hash=`scrypt:${salt.toString('hex')}:${scryptSync('preview-only-test',salt,32).toString('hex')}`;
 const env={...process.env,NODE_ENV:'development',PORT:String(p),CMS_DATA_DIR:dir,CMS_USERNAME:'tester',CMS_PASSWORD:'',CMS_PASSWORD_HASH:hash,CMS_PREVIEW_ONLY:'true'};
 const blocked=spawnSync(process.execPath,['server/index.mjs'],{env:{...env,NODE_ENV:'production',CMS_PUBLIC_ORIGIN:'https://example.com'},encoding:'utf8',timeout:5000});assert.notEqual(blocked.status,0);assert.match(blocked.stderr,/anteprima/);
 const server=spawn(process.execPath,['server/index.mjs'],{env,stdio:['ignore','pipe','pipe']});t.after(async()=>{server.kill();await once(server,'exit');await rm(dir,{recursive:true,force:true})});
 await Promise.race([new Promise((resolve,reject)=>{server.stdout.on('data',s=>{if(s.toString().includes('in ascolto'))resolve()});server.on('exit',code=>reject(Error('server exit '+code)));}),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout server')),5000))]);
 const login=async(username,password)=>fetch(origin+'/api/admin/login',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({username,password})});
 assert.equal((await login('errato','preview-only-test')).status,401);
 assert.equal((await login('tester','errata')).status,401);
 assert.equal((await login('tester','preview-only-test')).status,200);
});

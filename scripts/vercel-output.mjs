import { cp, mkdir, rm } from 'node:fs/promises';
// Vercel serves only assets statically. HTML goes through the CMS for fresh content.
await rm('vercel-dist',{recursive:true,force:true});
await mkdir('vercel-dist',{recursive:true});
await cp('dist/assets','vercel-dist/assets',{recursive:true});
await cp('dist/images','vercel-dist/images',{recursive:true});

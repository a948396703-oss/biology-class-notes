const CACHE='bio-notes-v21-ocr-cache';
const OCR_CACHE='bio-ocr-resources-v1';
const isOCR=request=>new URL(request.url).pathname.includes('/vendor/');
const ASSETS=['./','./index.html','./style.css?v=20261031.1','./income.css?v=20261031.1','./app.js?v=20261031.1','./core.js?v=20261031.1','./catalog.js?v=20261031.1','./income.js?v=20261031.1','./benchmarks.js?v=20261031.1','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const store=await caches.open(OCR_CACHE);for(const key of await caches.keys()){if(!key.startsWith('bio-notes-')||key===CACHE)continue;const old=await caches.open(key);for(const request of await old.keys()){if(isOCR(request)&&!await store.match(request)){const response=await old.match(request);if(response?.ok)await store.put(request,response);}}await caches.delete(key);}await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 if(isOCR(e.request)){e.respondWith((async()=>{const store=await caches.open(OCR_CACHE),cached=await store.match(e.request);if(cached)return cached;const response=await fetch(e.request);if(response.ok)await store.put(e.request,response.clone());return response;})());return;}
 e.respondWith(fetch(e.request,{cache:e.request.mode==='navigate'?'no-cache':'default'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>await caches.match(e.request)||(e.request.mode==='navigate'?await caches.match('./index.html'):Response.error())));
});


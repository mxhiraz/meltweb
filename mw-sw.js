const CACHE="mw-v1";
const CACHE_HOSTS=["framerusercontent.com","onai.b-cdn.net"];
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin===location.origin || CACHE_HOSTS.some(h=>u.hostname.endsWith(h))){
    e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(rr=>{if(rr.ok)c.put(e.request,rr.clone());return rr}))));
  }
});

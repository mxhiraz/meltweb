const CACHE="mw-v2";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  // rewrite framerusercontent.com to local
  if(u.hostname.endsWith("framerusercontent.com")){
    const file=u.pathname.split("/").pop();
    let local=null;
    if(u.pathname.startsWith("/images/")) local="/assets/images/"+file;
    else if(u.pathname.startsWith("/assets/")||u.pathname.startsWith("/third-party-assets/")) local="/assets/static/"+file;
    if(local){
      e.respondWith(
        caches.open(CACHE).then(c=>
          c.match(local).then(r=>r||fetch(local).then(rr=>{
            if(rr.ok){c.put(local,rr.clone());return rr}
            // fallback to CDN if local missing
            return fetch(e.request).then(cr=>{if(cr.ok)c.put(local,cr.clone());return cr})
          }))
        )
      );
      return;
    }
  }
  // same-origin: cache-first
  if(u.origin===location.origin){
    e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(rr=>{if(rr.ok)c.put(e.request,rr.clone());return rr}))));
  }
});

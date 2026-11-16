/* Future Code AI Tools: browser-safe online-first shell, offline fallback, revisioned cache.
   JSON catalog uses network-first so updates are not stuck behind stale service worker assets. */
const CACHE="fc-ai-tools-v2-20261116";
const CORE=["./","./index.html","./styles.css","./styles-v2.css","./app-v2.js","./tools.json","./updates.json","./icon.svg","./manifest.json"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith("fc-ai-tools-")&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  const u=new URL(request.url);
  if(request.method!=="GET"||u.origin!==self.location.origin)return;
  if(!u.pathname.includes("/ai-tools/"))return;
  const canonical=new Request(u.origin+u.pathname,{method:"GET"});
  event.respondWith(fetch(request,{cache:"no-store"}).then(response=>{
    if(response.ok && response.type==="basic"){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(canonical,copy)));
    }
    return response;
  }).catch(()=>caches.match(canonical).then(cached=>cached||(request.mode==="navigate"?caches.match("./index.html"):Response.error()))));
});
self.addEventListener("push",event=>{
  let body={};try{body=event.data?event.data.json():{}}catch{}
  event.waitUntil(self.registration.showNotification(body.title||"Future Code AI Tools",{body:body.body||"AI Tools အသစ်တွေ ရရှိပါပြီ",icon:"./icon.svg",tag:body.tag||"fc-ai-tools",data:{url:body.url||"./"}}));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=new URL(event.notification.data?.url||"./",self.registration.scope);
  if(url.origin!==self.location.origin) return;
  event.waitUntil(clients.openWindow(url.href));
});

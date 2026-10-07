/* NoxyMusic service worker: network first, cached copy when offline */
const CACHE="noxymusic-v1.1.1";
const FILES=["./","index.html","manifest.webmanifest","assets/favicon.svg","css/base.css","css/stage.css","css/panel.css","css/components.css","css/extras.css","css/glass.css","css/glass.css","js/mediapipe.js","js/core.js","js/audio.js","js/notes.js","js/hands.js","js/looper.js","js/dj.js","js/sampler.js","js/faces.js","js/record.js","js/ui.js","js/storage.js","js/theme.js","js/a11y.js","js/beat.js","js/eq.js","js/shortcuts.js","js/help.js","js/share.js","js/pwa.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});

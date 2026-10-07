/* NoxyMusic service worker: network first, cached copy when offline */
const CACHE="noxymusic-v2.0.0";
const FILES=["./","index.html","manifest.webmanifest","assets/favicon.svg","css/base.css","css/components.css","css/extras.css","css/glass.css","css/lights.css","css/panel.css","css/platter.css","css/stage.css","js/a11y.js","js/audio.js","js/beat.js","js/core.js","js/dj.js","js/eq.js","js/faces.js","js/hands.js","js/help.js","js/lib/bpm.js","js/lib/key.js","js/lib/music.js","js/lights.js","js/looper.js","js/loud.js","js/main.js","js/mp.js","js/notes.js","js/platter.js","js/pwa.js","js/record.js","js/sampler.js","js/share.js","js/shortcuts.js","js/state.js","js/storage.js","js/theme.js","js/ui.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});

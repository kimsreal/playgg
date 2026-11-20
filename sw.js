const CACHE='annyeong-v2';
const APP_FILES=[
  './','./manifest.webmanifest','./app/style.css','./app/main.js','./app/photos.js',
  './app/data.js','./app/avatar.js','./app/scene.js','./app/vendor/three.module.min.js',
  './app/vendor/jquery.min.js','./app/icon-drawing-192.png','./app/icon-drawing-512.png'
];
const assets=new Set(APP_FILES.map(file => new URL(file,self.registration.scope).href));

self.addEventListener('install',event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES.map(file => new Request(file,{cache:'reload'})))));
});
self.addEventListener('activate',event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith('annyeong-') && key!==CACHE).map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch',event => {
  const request=event.request;
  const url=new URL(request.url);
  if (request.method!=='GET' || url.origin!==self.location.origin) return;
  const index=new URL('./',self.registration.scope);
  const isAppPage=url.pathname===index.pathname || url.pathname===new URL('index.php',index).pathname;
  if (request.mode==='navigate' && isAppPage) {
    event.respondWith(fetch(request).catch(() => caches.match(index.href)));
  } else if (assets.has(url.href)) {
    event.respondWith(caches.match(request).then(response => response || fetch(request)));
  }
});

const CACHE='annyeong-v23';
const APP_FILES=[
  './','./manifest.webmanifest?v=6','./app/style.css?v=22','./app/main.js?v=23','./app/photos.js?v=5',
  './app/fonts/nanum-pen-script.woff2','./app/friends.js','./app/icons.svg?v=20','./app/data.js','./app/data.js?v=18','./app/avatar.js?v=9','./app/scene.js?v=23','./app/vendor/three.module.min.js',
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

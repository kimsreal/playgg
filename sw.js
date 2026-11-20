const CACHE='annyeong-v41';
const APP_FILES=[
  './','./manifest.webmanifest?v=6','./app/style.css?v=40','./app/main.js?v=41','./app/photos.js?v=39',
  './app/fonts/nanum-pen-script.woff2','./app/treats.js','./app/treat-meat.png','./app/treat-fish.png','./app/friends.js','./app/account.js?v=40','./app/icons.svg?v=20','./app/data.js','./app/data.js?v=18','./app/avatar.js?v=35','./app/scene.js?v=41','./app/vendor/three.module.min.js',
  './app/owner-model.js?v=41','./app/owner-colors.js','./app/models/hood_character_detailed.glb','./app/vendor/GLTFLoader.js','./app/vendor/BufferGeometryUtils.js',
  './app/items.js','./app/item-names.js',
  './app/item-ball.png','./app/item-bath.png','./app/item-vacuum.png','./app/item-tube.png','./app/item-bag.png','./app/item-gift-0.png','./app/item-gift-1.png','./app/item-gift-2.png',
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

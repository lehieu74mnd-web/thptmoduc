var N='cham-v2',F=['./','index.html','config.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(N).then(function(c){return c.addAll(F)}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!=N}).map(function(x){return caches.delete(x)}))}));self.clients.claim()});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!='GET'||new URL(r.url).origin!=location.origin)return;
e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(N).then(function(c){c.put(r,cp)});return res}).catch(function(){return caches.match(r).then(function(m){return m||caches.match('index.html')})}))});

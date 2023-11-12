// Cache First => Networt as Fallback
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(function (res) {
            return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch(function (err) {
            return caches.open(CACHE_STATIC_NAME).then(function (cache) {
              return cache.match("/offline.html");
            });
          });
      }
    })
  );
});

// Cache - only;
self.addEventListener("fetch", function (event) {
  event.respondWith(caches.match(event.request));
});

// Network - only;
self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
});

/* ----------------------------------------------------------------------------------------- */
// Remove Too Many cache Not Important At All
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(function (cache) {
    return cache.keys().then(function (keys) {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

//Dynamic Cache Not Strategy
self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
          cache.put(event.request.url, res.clone());
          return res;
        });
      })
      .catch(function (err) {
        return caches.match(event.request);
      })
  );
});

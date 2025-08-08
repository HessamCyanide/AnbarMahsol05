

const CACHE_NAME = 'inventory-app-cache-v2';
const LOCAL_ASSETS = [
    '/',
    '/index.html',
    '/index.tsx',
    '/App.tsx',
    '/types.ts',
    '/constants.ts',
    '/hooks/useDatabase.ts',
    '/components/icons.tsx',
    '/components/StatCard.tsx',
    '/components/AddProductModal.tsx',
    '/components/ProductItem.tsx',
    '/components/ProductList.tsx',
    '/components/TransactionModal.tsx',
    '/components/TransactionList.tsx',
    '/components/ExportModal.tsx',
    '/components/ProductCardexModal.tsx',
    '/components/ConfirmationModal.tsx',
    '/components/MultiSelect.tsx',
    '/components/SearchableSelect.tsx',
    '/components/Login.tsx',
    '/components/UserManagementModal.tsx',
    '/components/ProfileModal.tsx',
    '/manifest.json',
    '/icon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache, caching local assets');
        return cache.addAll(LOCAL_ASSETS);
      })
      .catch(err => {
        console.error('Failed to cache local assets:', err);
      })
  );
});

self.addEventListener('fetch', event => {
    // For navigation requests, use a network-first strategy.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
            .then(response => {
                // Check if we received a valid response
                if (response && response.ok) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
        );
        return;
    }

    // For other requests (assets), use a cache-first strategy.
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                return response; // Serve from cache
            }

            // Not in cache, fetch from network
            return fetch(event.request).then(
                networkResponse => {
                    // Check if we received a valid response
                    if(!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
                        return networkResponse;
                    }
                    
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }
            );
        })
    );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
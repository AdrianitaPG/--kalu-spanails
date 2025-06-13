const CACHE_NAME = 'kaluSpanails-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './admin.js',
    './admin.html',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                console.log('Cache abierto');

                // Intentar cachear cada recurso individualmente
                for (const url of urlsToCache) {
                    try {
                        await cache.add(url);
                        console.log(`Recurso cacheado exitosamente: ${url}`);
                    } catch (error) {
                        console.error(`Error al cachear ${url}:`, error);
                    }
                }
            } catch (error) {
                console.error('Error durante la instalación:', error);
            }
        })()
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(error => {
                console.error('Error en fetch:', error);
                // Podrías retornar una respuesta fallback aquí si lo deseas
            })
    );
});
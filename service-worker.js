/* ==========================================================
   Service Worker — Mi Perfil (PWA)
   Guarda los archivos base para que la página abra sin internet.
   ========================================================== */

var CACHE = "perfil-pwa-v1";

var ARCHIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./foto-perfil.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

// 1. Instalación: guarda los archivos en caché
self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return cache.addAll(ARCHIVOS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

// 2. Activación: borra cachés viejas
self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (nombres) {
        return Promise.all(nombres.map(function (nombre) {
          if (nombre !== CACHE) return caches.delete(nombre);
          return null;
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// 3. Descargas: internet primero (para ver cambios) y caché si no hay red
self.addEventListener("fetch", function (evento) {
  var peticion = evento.request;

  if (peticion.method !== "GET") return;

  var url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return; // Google Sheets e imágenes externas pasan directo

  // Las imágenes e iconos sí se guardan y se sirven desde la caché
  var esImagen = /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(url.pathname);

  if (esImagen) {
    evento.respondWith(
      caches.match(peticion).then(function (guardado) {
        if (guardado) return guardado;

        return fetch(peticion).then(function (respuesta) {
          if (respuesta && respuesta.ok) {
            var copia = respuesta.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(peticion, copia);
            });
          }
          return respuesta;
        });
      })
    );
    return;
  }

  // HTML, CSS y JS: se intenta la red primero y, si falla, la caché
  evento.respondWith(
    fetch(peticion)
      .then(function (respuesta) {
        if (respuesta && respuesta.ok) {
          var copia = respuesta.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(peticion, copia);
          });
        }
        return respuesta;
      })
      .catch(function () {
        return caches.match(peticion).then(function (guardado) {
          if (guardado) return guardado;
          if (peticion.mode === "navigate") return caches.match("./index.html");
          return null;
        });
      })
  );
});

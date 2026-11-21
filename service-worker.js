/* ==========================================================
   Service Worker — Mi Perfil (PWA)
   Guarda los archivos base para que la página abra sin internet.
   ========================================================== */

var CACHE = "perfil-pwa-v5";

var ARCHIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./foto-perfil.jpg",
  "./foto-perfil.webp",
  "./foto-perfil-400.webp",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

// 1. Instalación: guarda los archivos en caché (cada archivo por
// separado: si uno falta, el resto igual queda offline)
self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return Promise.all(ARCHIVOS.map(function (archivo) {
          return cache.add(archivo).catch(function () {
            return null; // un archivo ausente no rompe la instalación
          });
        }));
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

// 3. Descargas: estrategias por tipo de recurso (offline-first)
self.addEventListener("fetch", function (evento) {
  var peticion = evento.request;

  if (peticion.method !== "GET") return;

  var url = new URL(peticion.url);
  var mismaOrigen = url.origin === self.location.origin;

  // Google Sheets (horario): contenido dinámico, nunca se cachea
  if (url.hostname === "docs.google.com") return;

  var esImagen = /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(url.pathname);
  var esFuente = /\.(woff2?|ttf|eot)$/i.test(url.pathname);
  var esCssJs = /\.(css|js)$/i.test(url.pathname);

  // Imágenes y fuentes (locales y externas): CACHÉ PRIMERO (offline-first)
  if (esImagen || esFuente) {
    evento.respondWith(cachePrimero(peticion));
    return;
  }

  // CSS y JS de CDNs (Bootstrap, fuentes, iconos): STALE-WHILE-REVALIDATE
  // → se responde al instante desde caché y se refresca de fondo
  if (esCssJs) {
    evento.respondWith(caducadoMientrasRevalida(peticion));
    return;
  }

  // Resto del mismo origen (HTML): red primero y caché si no hay red
  if (mismaOrigen) {
    evento.respondWith(redPrimero(peticion));
    return;
  }

  // Cualquier otro recurso externo pasa directo
});

function cachePrimero(peticion) {
  return caches.match(peticion).then(function (guardado) {
    if (guardado) return guardado;

    return fetch(peticion).then(function (respuesta) {
      if (respuesta && (respuesta.ok || respuesta.type === "opaque")) {
        var copia = respuesta.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(peticion, copia);
        });
      }
      return respuesta;
    });
  });
}

function caducadoMientrasRevalida(peticion) {
  return caches.open(CACHE).then(function (cache) {
    return caches.match(peticion).then(function (guardado) {
      var refresco = fetch(peticion).then(function (respuesta) {
        if (respuesta && (respuesta.ok || respuesta.type === "opaque")) {
          cache.put(peticion, respuesta.clone());
        }
        return respuesta;
      }).catch(function () {
        return guardado;
      });

      return guardado || refresco;
    });
  });
}

function redPrimero(peticion) {
  return fetch(peticion)
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
    });
}

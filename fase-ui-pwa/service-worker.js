/* ==========================================================
   Service Worker — Mi Perfil (PWA)
   Guarda los archivos base para que la página abra sin internet.
   ========================================================== */

var CACHE = "perfil-pwa-v6";

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

// Recursos externos esenciales (si fallan, la instalación sigue igual)
var EXTERNOS = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
];

// 1. Instalación: guarda los archivos en caché (cada archivo por
// separado: si uno falta, el resto igual queda offline)
self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        var locales = ARCHIVOS.map(function (archivo) {
          return cache.add(archivo).catch(function () {
            return null; // un archivo ausente no rompe la instalación
          });
        });

        var externos = EXTERNOS.map(function (url) {
          return cache.add(url).catch(function () {
            return null; // sin conexión o CDN caído: se ignora
          });
        });

        return Promise.all(locales.concat(externos));
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
        return respuesta;
      }

      // El servidor respondió un error (5xx): se usa la copia local
      return buscarEnCache(peticion).then(function (guardado) {
        return guardado || respuesta;
      });
    })
    .catch(function () {
      return buscarEnCache(peticion);
    });
}

// Busca una respuesta en caché (con respaldo al index para navegación)
function buscarEnCache(peticion) {
  return caches.match(peticion).then(function (guardado) {
    if (guardado) return guardado;

    if (peticion.mode === "navigate") {
      return caches.match("./index.html").then(function (inicio) {
        return inicio || caches.match("./");
      });
    }

    return null;
  });
}

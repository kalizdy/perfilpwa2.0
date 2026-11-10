// ==========================================================
// script.js — Manipulación del DOM para "Mi Perfil"
// Aquí se toma el HTML ya cargado (el DOM) y se modifica
// con JavaScript: crear elementos, cambiar textos y escuchar
// eventos. Nada de esto se ve en el archivo index.html.
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {
  ponerAnioActual();
  ponerSaludo();
  prepararBotonTema();
  resaltarMenuAlHacerScroll();
  prepararFormularioContacto();
  prepararMusica();
  prepararFiltroJuegos();
  cerrarMenuAlElegirSeccion();
  cerrarMenuAlHacerClicFuera();
  prepararLobby();
  registrarServiceWorker();
  prepararInstalacion();
});

/* ---------- 1. Año del footer automático ---------- */
function ponerAnioActual() {
  var credito = document.querySelector(".footer .small");
  if (!credito) return;

  var anio = new Date().getFullYear();
  credito.textContent = "© " + anio + " Mi Perfil";
}

/* ---------- 2. Saludo según la hora del día ---------- */
function ponerSaludo() {
  var destino = document.getElementById("perfilSaludo") || document.querySelector(".slide-perfil");
  if (!destino) return;

  var hora = new Date().getHours();
  var saludo = "Buenas noches";

  if (hora < 12) {
    saludo = "Buenos días";
  } else if (hora < 19) {
    saludo = "Buenas tardes";
  }

  // createElement + appendChild: elementos nuevos creados por JS
  var etiqueta = document.createElement("span");
  etiqueta.className = "saludo-dinamico";
  etiqueta.textContent = saludo + ", bienvenido a mi perfil";

  destino.appendChild(etiqueta);
}

/* ---------- 3. Botón de tema claro / oscuro ---------- */
// El botón ya está en el HTML, al lado de la hamburguesa
function prepararBotonTema() {
  var boton = document.getElementById("botonTema");
  if (!boton) return;

  // Recuperar la preferencia guardada
  var guardado = null;
  try {
    guardado = localStorage.getItem("tema");
  } catch (e) {
    guardado = null;
  }

  if (guardado === "oscuro") {
    document.body.setAttribute("data-bs-theme", "dark");
  }
  pintarIconoTema(boton);

  boton.addEventListener("click", function () {
    var esOscuro = document.body.getAttribute("data-bs-theme") === "dark";

    if (esOscuro) {
      document.body.removeAttribute("data-bs-theme");
    } else {
      document.body.setAttribute("data-bs-theme", "dark");
    }

    try {
      localStorage.setItem("tema", esOscuro ? "claro" : "oscuro");
    } catch (e) {
      // si el navegador bloquea localStorage, el tema igual funciona
    }

    pintarIconoTema(boton);
  });
}

function pintarIconoTema(boton) {
  var esOscuro = document.body.getAttribute("data-bs-theme") === "dark";
  var icono = document.createElement("i");

  icono.className = esOscuro ? "bi bi-brightness-high" : "bi bi-moon-stars";

  boton.textContent = "";
  boton.appendChild(icono);
}

/* ---------- 4. Enlace del menú activo al hacer scroll ---------- */
function resaltarMenuAlHacerScroll() {
  var enlaces = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');
  var secciones = [];

  enlaces.forEach(function (enlace) {
    var seccion = document.querySelector(enlace.getAttribute("href"));
    if (seccion) secciones.push(seccion);
  });

  if (!secciones.length) return;

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;

      var id = "#" + entrada.target.id;

      enlaces.forEach(function (enlace) {
        enlace.classList.toggle("active", enlace.getAttribute("href") === id);
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  secciones.forEach(function (seccion) {
    observador.observe(seccion);
  });
}

/* ---------- 5. El horario viene de Google Sheets ---------- */
// La sección #horario muestra la hoja incrustada (iframe), así que
// aquí no hay nada que calcular: el iframe ya la mantiene al día.

/* ==========================================================
   6. FORMULARIO DE CONTACTO
   Valida todo en el navegador y arma el mensaje para enviarlo
   por WhatsApp o por correo.
   ========================================================== */

// 👉 Cambia estos dos datos por los tuyos (así te llegan los mensajes)
var CORREO_CONTACTO = "";      // Ej. "deimar@correo.com"
var WHATSAPP_CONTACTO = "";    // Ej. "51987654321" (código de país + número)

// El segundo select cambia según el motivo
var TEMAS_POR_MOTIVO = {
  "Propuesta de proyecto": ["Página web", "Tienda online", "Aplicación móvil", "Análisis de datos", "Otra idea"],
  "Jugar un videojuego": ["Dota 2", "Fortnite", "Mobile Legends"],
  "Compartir intereses": ["Música", "Mercados financieros", "Criptomonedas", "Programación"],
  "Otra consulta": ["Otro tema"]
};

function prepararFormularioContacto() {
  var formulario = document.getElementById("formContacto");
  if (!formulario) return;

  var nombre = document.getElementById("conNombre");
  var correo = document.getElementById("conCorreo");
  var celular = document.getElementById("conCelular");
  var motivo = document.getElementById("conMotivo");
  var tema = document.getElementById("conTema");
  var mensaje = document.getElementById("conMensaje");
  var contador = document.getElementById("contadorMensaje");
  var resumen = document.getElementById("resumenContacto");

  // Cada campo avisa al salir de él, aunque quede vacío
  vigilarCampo(nombre, revisarNombreContacto);
  vigilarCampo(correo, revisarCorreoContacto);
  vigilarCampo(celular, revisarCelularContacto);
  vigilarCampo(motivo, revisarMotivoContacto);
  vigilarCampo(tema, revisarTemaContacto);
  vigilarCampo(mensaje, revisarMensajeContacto);

  // Filtros: no se pueden escribir caracteres que no correspondan
  limitarCaracteres(nombre, /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\s-]/g, "Solo letras en el nombre.");
  limitarCaracteres(correo, /[^A-Za-z0-9@._%+-]/g, "Solo letras, números y @ . _ - + en el correo.");
  limitarCaracteres(celular, /[^0-9+\s-]/g, "Solo números en el celular.");

  motivo.addEventListener("change", function () {
    llenarTemasDelMotivo(motivo.value);
    tema.classList.remove("is-invalid", "is-valid");
    ocultarFeedback(tema);
  });

  if (mensaje && contador) {
    mensaje.addEventListener("input", function () {
      contador.textContent = mensaje.value.length + "/300";
    });
  }

  var botonEditar = document.getElementById("editarMensaje");
  if (botonEditar) {
    botonEditar.addEventListener("click", function () {
      resumen.classList.add("d-none");
      mensaje.focus();
    });
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    var nombreOk = revisarNombreContacto();
    var correoOk = revisarCorreoContacto();
    var celularOk = revisarCelularContacto();
    var motivoOk = revisarMotivoContacto();
    var temaOk = revisarTemaContacto();
    var mensajeOk = revisarMensajeContacto();

    if (!(nombreOk && correoOk && celularOk && motivoOk && temaOk && mensajeOk)) {
      var primerError = formulario.querySelector(".is-invalid");
      if (primerError) {
        primerError.focus({ preventScroll: true });
        primerError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    prepararEnvio();
  });

  formulario.addEventListener("reset", function () {
    limpiarValidacion(formulario);
    llenarTemasDelMotivo("");
    if (contador) contador.textContent = "0/300";
    ocultarAviso(document.getElementById("avisoContacto"));
    if (resumen) resumen.classList.add("d-none");
  });
}

/* ---------- Revisores de cada campo ---------- */
var MINIMO_CARACTERES = 3;

// Si escribió algo pero es muy corto, se avisa con el mínimo
function cumpleMinimo(campo, texto) {
  if (texto.length > 0 && texto.length < MINIMO_CARACTERES) {
    marcarCampo(campo, false,
      "Este campo requiere mínimo " + MINIMO_CARACTERES + " caracteres.");
    return false;
  }

  return true;
}

function revisarNombreContacto() {
  var campo = document.getElementById("conNombre");
  var texto = campo.value.trim();

  if (texto === "") {
    return marcarCampo(campo, false, "Falta llenar tu nombre completo.");
  }

  if (!cumpleMinimo(campo, texto)) return false;

  return marcarCampo(campo, esNombreCompleto(texto),
    "Escribe tu nombre y apellido (mínimo dos palabras).");
}

function revisarCorreoContacto() {
  var campo = document.getElementById("conCorreo");
  var texto = campo.value.trim();

  if (texto === "") {
    return marcarCampo(campo, false, "Falta llenar tu correo.");
  }

  if (!cumpleMinimo(campo, texto)) return false;

  return marcarCampo(campo, /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(texto),
    "Escribe un correo válido (ej. ana@correo.com).");
}

function revisarCelularContacto() {
  var campo = document.getElementById("conCelular");
  var texto = campo.value.trim();

  if (texto === "") {
    return marcarCampo(campo, false, "Falta llenar tu número de celular.");
  }

  if (!cumpleMinimo(campo, texto)) return false;

  return marcarCampo(campo, /^9\d{8}$/.test(normalizarCelular(texto)),
    "Celular de 9 dígitos que empiece en 9 (ej. 987 654 321).");
}

function revisarMotivoContacto() {
  var campo = document.getElementById("conMotivo");

  if (campo.value === "") {
    return marcarCampo(campo, false, "Falta elegir el motivo.");
  }

  return marcarCampo(campo, true, "");
}

function revisarTemaContacto() {
  var campo = document.getElementById("conTema");

  if (campo.value === "") {
    return marcarCampo(campo, false,
      document.getElementById("conMotivo").value === ""
        ? "Falta elegir el tema."
        : "Falta elegir el tema.");
  }

  return marcarCampo(campo, true, "");
}

function revisarMensajeContacto() {
  var campo = document.getElementById("conMensaje");
  var texto = campo.value.trim();

  if (texto === "") {
    return marcarCampo(campo, false, "Falta escribir tu mensaje.");
  }

  if (!cumpleMinimo(campo, texto)) return false;

  return marcarCampo(campo, true, "");
}

/* ---------- Segundo select según el motivo ---------- */
function llenarTemasDelMotivo(motivo) {
  var select = document.getElementById("conTema");
  if (!select) return;

  select.textContent = "";

  var inicial = document.createElement("option");
  inicial.value = "";
  inicial.textContent = motivo ? "Elige un tema…" : "Elige el motivo…";
  select.appendChild(inicial);

  (TEMAS_POR_MOTIVO[motivo] || []).forEach(function (tema) {
    var opcion = document.createElement("option");
    opcion.value = tema;
    opcion.textContent = tema;
    select.appendChild(opcion);
  });
}

/* ---------- Resumen y envío ---------- */
function prepararEnvio() {
  var nombre = document.getElementById("conNombre").value.trim().replace(/\s+/g, " ");
  var correo = document.getElementById("conCorreo").value.trim();
  var celular = normalizarCelular(document.getElementById("conCelular").value);
  var motivo = document.getElementById("conMotivo").value;
  var tema = document.getElementById("conTema").value;
  var mensaje = document.getElementById("conMensaje").value.trim();

  var texto = "Hola Deimar, soy " + nombre + ".\n" +
              "Motivo: " + motivo + " (" + tema + ")\n" +
              "Correo: " + correo + "\n" +
              "Celular: " + formatearCelular(celular) + "\n\n" +
              mensaje;

  var resumen = document.getElementById("resumenContacto");
  var resumenTexto = document.getElementById("resumenTexto");
  var whatsapp = document.getElementById("enviarWhatsApp");
  var email = document.getElementById("enviarCorreo");
  var aviso = document.getElementById("avisoContacto");

  if (resumenTexto) resumenTexto.textContent = texto;
  if (resumen) resumen.classList.remove("d-none");

  if (whatsapp) {
    if (WHATSAPP_CONTACTO) {
      whatsapp.href = "https://wa.me/" + WHATSAPP_CONTACTO +
        "?text=" + encodeURIComponent(texto);
      whatsapp.classList.remove("d-none");
    } else {
      whatsapp.classList.add("d-none");
    }
  }

  if (email) {
    if (CORREO_CONTACTO) {
      email.href = "mailto:" + CORREO_CONTACTO +
        "?subject=" + encodeURIComponent("Contacto desde tu perfil: " + motivo) +
        "&body=" + encodeURIComponent(texto);
      email.classList.remove("d-none");
    } else {
      email.classList.add("d-none");
    }
  }

  if (!WHATSAPP_CONTACTO && !CORREO_CONTACTO) {
    mostrarAviso(aviso, "info",
      "Tu mensaje está listo. Copia el texto y envíalo; falta configurar tu correo y WhatsApp en script.js.");
  } else {
    mostrarAviso(aviso, "success", "¡Listo! Elige cómo quieres enviarlo.");
  }

  if (resumen) resumen.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- Escuchar campos, mensajes y filtros ---------- */
function vigilarCampo(campo, comprobar) {
  if (!campo) return;

  campo.addEventListener("blur", comprobar);

  var alEscribir = function () {
    if (campo.classList.contains("is-invalid")) comprobar();
  };

  campo.addEventListener("input", alEscribir);
  campo.addEventListener("change", alEscribir);
}

/* ---------- Filtro de caracteres por campo ---------- */
function limitarCaracteres(campo, patronProhibido, mensaje) {
  if (!campo) return;

  var aviso = document.createElement("div");
  aviso.className = "aviso-caracter d-none";
  campo.parentElement.appendChild(aviso);

  var temporizador = null;

  campo.addEventListener("input", function () {
    var original = campo.value;
    var posicion = campo.selectionStart || 0;
    var textoAntes = original.slice(0, posicion);

    var limpio = original.replace(patronProhibido, "");
    if (limpio === original) return;

    campo.value = limpio;

    var borradosAntes = textoAntes.length - textoAntes.replace(patronProhibido, "").length;
    var nuevaPosicion = Math.max(0, posicion - borradosAntes);
    campo.setSelectionRange(nuevaPosicion, nuevaPosicion);

    aviso.textContent = mensaje;
    aviso.classList.remove("d-none");

    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      aviso.classList.add("d-none");
    }, 1800);
  });
}

function marcarCampo(campo, esValido, mensaje) {
  if (!campo) return false;

  campo.classList.toggle("is-invalid", !esValido);
  campo.classList.toggle("is-valid", esValido);

  var feedback = campo.parentElement.querySelector(".invalid-feedback");

  if (feedback) {
    if (esValido) {
      feedback.classList.add("d-none");
    } else {
      feedback.textContent = mensaje;
      feedback.classList.remove("d-none");
    }
  }

  return esValido;
}

function ocultarFeedback(campo) {
  var feedback = campo.parentElement.querySelector(".invalid-feedback");
  if (feedback) feedback.classList.add("d-none");
}

function limpiarValidacion(formulario) {
  formulario.querySelectorAll(".form-control, .form-select").forEach(function (campo) {
    campo.classList.remove("is-valid", "is-invalid");
  });

  formulario.querySelectorAll(".invalid-feedback").forEach(function (feedback) {
    feedback.classList.add("d-none");
  });

  formulario.querySelectorAll(".aviso-caracter").forEach(function (aviso) {
    aviso.classList.add("d-none");
  });
}

/* ---------- Nombre, celular y avisos ---------- */
function esNombreCompleto(texto) {
  var partes = texto.trim().split(/\s+/);
  if (partes.length < 2) return false;

  return partes.every(function (parte) {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.-]{2,}$/.test(parte);
  });
}

function normalizarCelular(texto) {
  var limpio = texto.replace(/[^\d+]/g, "");

  if (limpio.indexOf("+51") === 0) {
    limpio = limpio.slice(3);
  } else if (limpio.indexOf("51") === 0 && limpio.length > 9) {
    limpio = limpio.slice(2);
  }

  return limpio;
}

function formatearCelular(digitos) {
  if (!/^\d{9}$/.test(digitos)) return digitos;
  return digitos.slice(0, 3) + " " + digitos.slice(3, 6) + " " + digitos.slice(6);
}

function mostrarAviso(aviso, tipo, mensaje) {
  if (!aviso) return;
  aviso.className = "alert alert-" + tipo + " mt-3 mb-0";
  aviso.textContent = mensaje;
}

function ocultarAviso(aviso) {
  if (!aviso) return;
  aviso.className = "alert d-none mt-3 mb-0";
  aviso.textContent = "";
}

/* ==========================================================
   8. MENÚ HAMBURGUESA
   Al elegir una sección se cierra solo el menú desplegado.
   ========================================================== */

function cerrarMenuAlElegirSeccion() {
  var menu = document.getElementById("menu");
  if (!menu) return;

  menu.querySelectorAll(".nav-link").forEach(function (enlace) {
    enlace.addEventListener("click", function () {
      if (!menu.classList.contains("show")) return;
      if (typeof bootstrap === "undefined") return;

      bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
    });
  });
}

/* También se cierra al tocar fuera o al presionar Escape */
function cerrarMenuAlHacerClicFuera() {
  var menu = document.getElementById("menu");
  if (!menu) return;

  document.addEventListener("click", function (evento) {
    if (!menu.classList.contains("show")) return;
    if (menu.contains(evento.target)) return;
    if (evento.target.closest(".navbar-toggler")) return;
    if (typeof bootstrap === "undefined") return;

    bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key !== "Escape") return;
    if (!menu.classList.contains("show")) return;
    if (typeof bootstrap === "undefined") return;

    bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
  });
}

/* ==========================================================
   9. MÚSICA: PRIMERO LOS ARTISTAS, LUEGO SUS TEMAS
   La galería muestra solo artistas; al hacer clic en uno se
   pintan sus canciones con DOM.
   ========================================================== */

function prepararMusica() {
  var genero = document.getElementById("filtroGenero");
  var buscar = document.getElementById("buscarMusica");
  var volver = document.getElementById("volverArtistas");

  if (genero) {
    genero.addEventListener("change", mostrarGaleria);
  }

  if (buscar) {
    buscar.addEventListener("input", function () {
      var detalle = document.getElementById("detalleArtista");
      var enDetalle = detalle && !detalle.classList.contains("d-none");

      if (enDetalle) {
        filtrarTemasDelArtista();
      } else {
        renderizarGaleria();
      }
    });
  }

  if (volver) {
    volver.addEventListener("click", mostrarGaleria);
  }

  renderizarGaleria();
}

// Agrupa el catálogo por artista (con su género, foto y total)
function listaDeArtistas() {
  var artistas = [];

  CANCIONES.forEach(function (cancion) {
    var existente = null;

    for (var i = 0; i < artistas.length; i++) {
      if (artistas[i].nombre === cancion.artista) {
        existente = artistas[i];
        break;
      }
    }

    if (!existente) {
      artistas.push({
        nombre: cancion.artista,
        genero: cancion.genero,
        portada: cancion.portada || PORTADA_GENERICA,
        total: 1
      });
      return;
    }

    existente.total++;

    // Si la primera portada era genérica, se intenta con la siguiente
    if (existente.portada === PORTADA_GENERICA && cancion.portada) {
      existente.portada = cancion.portada;
    }
  });

  return artistas.sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

function renderizarGaleria() {
  var contenedor = document.getElementById("galeriaArtistas");
  var detalle = document.getElementById("detalleArtista");
  var buscar = document.getElementById("buscarMusica");
  var mensaje = document.getElementById("mensajeCanciones");
  if (!contenedor) return;

  if (detalle) detalle.classList.add("d-none");
  contenedor.classList.remove("d-none");

  if (buscar) {
    buscar.placeholder = "Buscar artista…";
  }

  var genero = document.getElementById("filtroGenero").value;
  var texto = normalizarTexto(buscar ? buscar.value : "");

  var artistas = listaDeArtistas().filter(function (artista) {
    var coincideGenero = !genero || artista.genero === genero;
    var coincideTexto = !texto || normalizarTexto(artista.nombre).indexOf(texto) !== -1;
    return coincideGenero && coincideTexto;
  });

  contenedor.textContent = "";

  artistas.forEach(function (artista) {
    contenedor.appendChild(crearTarjetaArtista(artista));
  });

  if (mensaje) {
    if (artistas.length === 0) {
      mensaje.textContent = "No hay artistas con ese filtro.";
    } else if (artistas.length === 1) {
      mensaje.textContent = "1 artista.";
    } else {
      mensaje.textContent = artistas.length + " artistas.";
    }
  }
}

function crearTarjetaArtista(artista) {
  var boton = document.createElement("button");
  boton.type = "button";
  boton.className = "artista-card";

  var imagen = document.createElement("img");
  imagen.className = "artista-foto";
  imagen.src = artista.portada;
  imagen.alt = "Foto de " + artista.nombre;
  imagen.addEventListener("error", function () {
    imagen.src = PORTADA_GENERICA;
  }, { once: true });

  var nombre = document.createElement("span");
  nombre.className = "artista-nombre";
  nombre.textContent = artista.nombre;

  var cantidad = document.createElement("span");
  cantidad.className = "artista-cantidad";
  cantidad.textContent = artista.total + " canciones";

  boton.appendChild(imagen);
  boton.appendChild(nombre);
  boton.appendChild(cantidad);

  boton.addEventListener("click", function () {
    mostrarArtista(artista.nombre);
  });

  return boton;
}

function mostrarArtista(nombre) {
  var galeria = document.getElementById("galeriaArtistas");
  var detalle = document.getElementById("detalleArtista");
  var titulo = document.getElementById("tituloArtista");
  var buscar = document.getElementById("buscarMusica");
  var mensaje = document.getElementById("mensajeCanciones");

  galeria.classList.add("d-none");
  detalle.classList.remove("d-none");

  if (titulo) titulo.textContent = nombre;

  if (buscar) {
    buscar.value = "";
    buscar.placeholder = "Buscar canción…";
  }

  var canciones = CANCIONES.filter(function (cancion) {
    return cancion.artista === nombre;
  });

  pintarCanciones(canciones);

  if (mensaje) {
    mensaje.textContent = canciones.length === 1
      ? "1 canción."
      : canciones.length + " canciones.";
  }

  document.getElementById("musica").scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrarGaleria() {
  var galeria = document.getElementById("galeriaArtistas");
  var detalle = document.getElementById("detalleArtista");
  var buscar = document.getElementById("buscarMusica");

  if (detalle) detalle.classList.add("d-none");
  if (galeria) galeria.classList.remove("d-none");

  // Al volver se limpia la búsqueda para que se vean todos los artistas
  if (buscar) buscar.value = "";

  renderizarGaleria();
}

function filtrarTemasDelArtista() {
  var titulo = document.getElementById("tituloArtista");
  var buscar = document.getElementById("buscarMusica");
  var mensaje = document.getElementById("mensajeCanciones");
  if (!titulo || !buscar) return;

  var texto = normalizarTexto(buscar.value);

  var canciones = CANCIONES.filter(function (cancion) {
    return cancion.artista === titulo.textContent &&
           (!texto || normalizarTexto(cancion.titulo).indexOf(texto) !== -1);
  });

  pintarCanciones(canciones);

  if (mensaje) {
    if (canciones.length === 0) {
      mensaje.textContent = "No hay canciones con ese nombre.";
    } else if (canciones.length === 1) {
      mensaje.textContent = "1 canción.";
    } else {
      mensaje.textContent = canciones.length + " canciones.";
    }
  }
}

/* ---------- Filtro de juegos por tipo ---------- */
function prepararFiltroJuegos() {
  var filtro = document.getElementById("filtroTipoJuego");
  if (!filtro) return;

  filtro.addEventListener("change", filtrarJuegos);
  filtrarJuegos();
}

function filtrarJuegos() {
  var filtro = document.getElementById("filtroTipoJuego");
  var mensaje = document.getElementById("mensajeFiltroJuegos");
  if (!filtro) return;

  var tipo = filtro.value;
  var visibles = 0;

  document.querySelectorAll("#juegos .juego-card").forEach(function (tarjeta) {
    var coincide = !tipo || tarjeta.dataset.tipo === tipo;
    var columna = tarjeta.closest(".col-md-4");

    // En el panel compacto las tarjetas no están dentro de columnas
    (columna || tarjeta).classList.toggle("d-none", !coincide);
    if (coincide) visibles++;
  });

  if (mensaje) {
    if (visibles === 0) {
      mensaje.textContent = "No hay juegos de ese tipo.";
    } else if (visibles === 1) {
      mensaje.textContent = "1 juego.";
    } else {
      mensaje.textContent = visibles + " juegos.";
    }
  }
}
// Para buscar sin importar tildes ni mayúsculas
function normalizarTexto(texto) {
  return texto.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/* ==========================================================
   10. PORTADAS DE LAS CANCIONES
   Si una imagen no carga, se reemplaza por una portada genérica.
   ========================================================== */

var PORTADA_GENERICA = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
  '<rect width="120" height="120" fill="#0d6efd"/>' +
  '<text x="60" y="80" font-size="58" text-anchor="middle" fill="#ffffff" font-family="Arial">♪</text>' +
  '</svg>'
);

function prepararPortadas() {
  document.querySelectorAll("#listaCanciones .portada").forEach(function (imagen) {
    imagen.addEventListener("error", function () {
      if (imagen.src === PORTADA_GENERICA) return;
      imagen.src = PORTADA_GENERICA;
    });
  });
}

/* ==========================================================
   11. CATÁLOGO DE CANCIONES
   Cada tema se pinta con DOM; el género y el artista son los
   que alimentan la doble selección de Música.
   ========================================================== */

var CANCIONES = [
  { titulo: "Hipocresía", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/be/33/bc/be33bcdc-4ab1-b500-a828-4471c296e250/artwork.jpg/100x100bb.jpg" },
  { titulo: "Juguete De Nadie", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/be/33/bc/be33bcdc-4ab1-b500-a828-4471c296e250/artwork.jpg/100x100bb.jpg" },
  { titulo: "El Tomador", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c1/c2/48/c1c24863-fd22-b2e3-660c-c15b9e6aba64/artwork.jpg/100x100bb.jpg" },
  { titulo: "Te Quería Porquería", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/be/33/bc/be33bcdc-4ab1-b500-a828-4471c296e250/artwork.jpg/100x100bb.jpg" },
  { titulo: "Tu Desprecio", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/be/33/bc/be33bcdc-4ab1-b500-a828-4471c296e250/artwork.jpg/100x100bb.jpg" },
  { titulo: "Ave De Paso", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/be/33/bc/be33bcdc-4ab1-b500-a828-4471c296e250/artwork.jpg/100x100bb.jpg" },
  { titulo: "No Podrán Separarnos", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/be/33/bc/be33bcdc-4ab1-b500-a828-4471c296e250/artwork.jpg/100x100bb.jpg" },
  { titulo: "La Culpable", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/be/33/bc/be33bcdc-4ab1-b500-a828-4471c296e250/artwork.jpg/100x100bb.jpg" },
  { titulo: "Enséñame a Olvidar", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c1/c2/48/c1c24863-fd22-b2e3-660c-c15b9e6aba64/artwork.jpg/100x100bb.jpg" },
  { titulo: "Terco Corazón (Naoki Ishida)", artista: "Carlos Alarcón y Los Genios", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a4/cf/08/a4cf0876-bd08-d6f6-5a03-15db6cd2ec1c/artwork.jpg/100x100bb.jpg" },
  { titulo: "Tu Fiel Amante", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/f7/d6/62/f7d6629f-5da5-91b0-6aa1-5c8436e6ecab/197190180497.jpg/100x100bb.jpg" },
  { titulo: "Emociones", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cd/67/41/cd67410a-6d51-0e33-3504-2e363a4a4ef4/197190156324.jpg/100x100bb.jpg" },
  { titulo: "Si Me Quieres / Maldito Dinero / Tramposa", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/21/75/7f/21757ff9-b557-b181-86be-65bfddc6540d/197190187809.jpg/100x100bb.jpg" },
  { titulo: "El Amor de Mi Vida", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/8b/8f/7e8b8f8e-c9c3-03ac-e04b-4d8ad0e57060/197190184495.jpg/100x100bb.jpg" },
  { titulo: "Nena", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/47/28/d2/4728d243-34c4-d1ba-03a6-b8b489759962/197190187700.jpg/100x100bb.jpg" },
  { titulo: "Por Siempre Kevin Achata", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/01/3b/eb/013bebd9-d793-76cc-8490-d94641dbacd1/198391865930.jpg/100x100bb.jpg" },
  { titulo: "Sentado en un bar", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9b/5e/7f/9b5e7fb5-a00e-375a-6830-c624b0b13705/198588345719.jpg/100x100bb.jpg" },
  { titulo: "Te Vas o Te Boto", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/48/05/af/4805af17-3714-a535-e0e8-70a4fafb6e2d/197190148541.jpg/100x100bb.jpg" },
  { titulo: "Maldito Dinero", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2e/1f/1d/2e1f1d97-2173-9f8c-3e35-c68fce4096e3/197190169836.jpg/100x100bb.jpg" },
  { titulo: "Si Me Quieres", artista: "Kumbia Fusión", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/bb/69/3d/bb693d46-bafc-93c7-db78-20cc2e553245/0.jpg/100x100bb.jpg" },
  { titulo: "Olvídame", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3d/e9/76/3de97629-c540-742c-0a23-accb78e142c3/196292135992.jpg/100x100bb.jpg" },
  { titulo: "Heridas de Amor", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/67/66/5d/67665df0-beac-5dcd-4fd0-cd0aa7741560/196292748567.jpg/100x100bb.jpg" },
  { titulo: "Tomando Cerveza", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/68/0a/88/680a8882-5273-a1f1-1bf7-d138a22bc0bc/195081102818.jpg/100x100bb.jpg" },
  { titulo: "Vida Ya No Es Vida", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/cc/af/55/ccaf551e-cfef-6d99-3355-14e67fbbc4c4/195081071978.jpg/100x100bb.jpg" },
  { titulo: "Prometiste Volver", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/70/94/07/709407c4-9eb4-75e5-5f38-cc992c72914d/196292312751.jpg/100x100bb.jpg" },
  { titulo: "Hasta la Raíz", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/ce/32/b5/ce32b59a-de42-ca42-3974-ec6d868aad67/195497148806.jpg/100x100bb.jpg" },
  { titulo: "No te preocupes por mí", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/80/b7/37/80b73794-f8c3-5329-6aca-711a45e4a4ed/199538524178.jpg/100x100bb.jpg" },
  { titulo: "Dos Cervecitas", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/5c/e5/cc/5ce5ccd1-e042-edbb-7be1-23c95b7b1109/195497148738.jpg/100x100bb.jpg" },
  { titulo: "El Final de Este Amor", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c5/5c/8c/c55c8cb7-ba4c-f439-6125-f43747a18878/195497149216.jpg/100x100bb.jpg" },
  { titulo: "Vuelve", artista: "Corazón Serrano", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/65/cb/0d/65cb0d41-bc8b-f1f0-b88e-0af47657f04c/195497141906.jpg/100x100bb.jpg" },
  { titulo: "Te Vi", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/35/99/37/3599370c-129d-84d0-1922-42a8d71f1632/191018667191.jpg/100x100bb.jpg" },
  { titulo: "Cariño", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/35/99/37/3599370c-129d-84d0-1922-42a8d71f1632/191018667191.jpg/100x100bb.jpg" },
  { titulo: "Traigan Cerveza", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music127/v4/b0/46/b7/b046b72c-d490-1819-71a2-303483e77f87/191773436100.jpg/100x100bb.jpg" },
  { titulo: "La Plazita", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/35/99/37/3599370c-129d-84d0-1922-42a8d71f1632/191018667191.jpg/100x100bb.jpg" },
  { titulo: "Trampas", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e8/22/15/e82215df-f624-893d-2623-7c7d2b3d4b47/195081660202.jpg/100x100bb.jpg" },
  { titulo: "Veneno y Licor", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/27/34/02/27340249-9340-e3d9-c7ef-2e73f46dc06d/192562543818.jpg/100x100bb.jpg" },
  { titulo: "Llora Por Su Error", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/27/66/f4/2766f47f-5d93-0ad3-0ada-6fa8d1baac33/191773931650.jpg/100x100bb.jpg" },
  { titulo: "15 Días", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/35/99/37/3599370c-129d-84d0-1922-42a8d71f1632/191018667191.jpg/100x100bb.jpg" },
  { titulo: "Pa el Baile", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/35/99/37/3599370c-129d-84d0-1922-42a8d71f1632/191018667191.jpg/100x100bb.jpg" },
  { titulo: "El Arbolito", artista: "La Banda de Lechuga", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/38/30/0a/38300a2a-aa78-f363-9e42-25e2a20f37e1/191018666811.jpg/100x100bb.jpg" },
  { titulo: "Volveré / Lejos de Ti", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/64/c6/9e/64c69ed0-ac25-5e62-54cb-b9fc2044a030/196006762773.jpg/100x100bb.jpg" },
  { titulo: "Estaba aquí pensando", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c0/ed/a7/c0eda7c2-a7d0-1416-f430-bb78860ad820/199350549137.jpg/100x100bb.jpg" },
  { titulo: "Chiquitita", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/1c/81/f4/1c81f4cc-013c-aef5-7df7-87baffeef181/cover.jpg/100x100bb.jpg" },
  { titulo: "Traigan Cerveza", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/54/02/49/540249ce-4613-f447-d669-b53dcc5ac895/196626555830.jpg/100x100bb.jpg" },
  { titulo: "Mentiras", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5b/8f/53/5b8f5330-e1c0-ac16-1842-b3b6234a949d/196006719333.jpg/100x100bb.jpg" },
  { titulo: "Ya No Vives en Mí", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a9/4c/c8/a94cc81c-eed3-be53-afc3-f4e80a25960f/196006719203.jpg/100x100bb.jpg" },
  { titulo: "Mix Bandido", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/29/9f/dc/299fdc99-2c2d-8d8c-9436-9ef5b2f518df/199538471755.jpg/100x100bb.jpg" },
  { titulo: "Mujer Interesada", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/0a/84/49/0a8449bf-e870-240d-56c3-11dc5e333da2/197188896591.jpg/100x100bb.jpg" },
  { titulo: "No Volveré", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/8e/1e/39/8e1e39e2-60aa-d793-3023-fedb963087ef/197188159238.jpg/100x100bb.jpg" },
  { titulo: "Amárrame", artista: "Grupo Histeria", genero: "Cumbia", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/27/72/30/277230fe-ae83-45e9-3afb-3031a949cc57/199806041475.jpg/100x100bb.jpg" },
  { titulo: "Dejaría Todo", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music/d8/da/55/mzi.tejiipmk.jpg/100x100bb.jpg" },
  { titulo: "Yo Te Amo", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Features124/v4/e6/48/e4/e648e4aa-12d4-b233-e95c-6f153bdeca4f/dj.hotiqplq.jpg/100x100bb.jpg" },
  { titulo: "Un Siglo Sin Ti", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music/9a/29/25/mzi.zncuwxmv.jpg/100x100bb.jpg" },
  { titulo: "Y Tú Te Vas", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/45/eb/eb/45ebebe8-8eab-ccdc-e610-0b029b02ceb3/mzi.flmctplg.jpg/100x100bb.jpg" },
  { titulo: "Bailando Bachata", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3d/36/06/3d3606a4-b85f-41f0-1519-806eb649e2f0/196871278164.jpg/100x100bb.jpg" },
  { titulo: "Me Enamoré de Ti", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/7a/a6/12/7aa612d1-19fc-c6ac-1259-1ddb121417b0/mzi.xcfzhvjd.jpg/100x100bb.jpg" },
  { titulo: "Atado a Tu Amor", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music/d8/da/55/mzi.tejiipmk.jpg/100x100bb.jpg" },
  { titulo: "Humanos a Marte", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/46/f6/30/46f63022-aab9-1b59-766d-fffb72936a91/886444687744.jpg/100x100bb.jpg" },
  { titulo: "Torero", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/45/eb/eb/45ebebe8-8eab-ccdc-e610-0b029b02ceb3/mzi.flmctplg.jpg/100x100bb.jpg" },
  { titulo: "Si Nos Quedara Poco Tiempo", artista: "Chayanne", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/82/ef/c4/82efc4e4-6f99-f4b0-fb4f-33fb923a29e3/886444831383.jpg/100x100bb.jpg" },
  { titulo: "El Problema", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/33/6b/0c/336b0cfe-2cf3-7fa3-a2b9-861997b17ecc/886444945578_Cover.jpg/100x100bb.jpg" },
  { titulo: "Desnuda", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/b8/ce/58/b8ce58f8-3757-18f0-c731-cef8e20d4e5e/037628268024.jpg/100x100bb.jpg" },
  { titulo: "Historia de Taxi", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/0f/6b/2a/0f6b2a0c-be5b-f5a3-1e51-dd721027cdd4/dj.ttotofzw.jpg/100x100bb.jpg" },
  { titulo: "Señora de las Cuatro Décadas", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music/23/3b/aa/mzi.kugocjka.jpg/100x100bb.jpg" },
  { titulo: "Fuiste Tú (feat. Gaby Moreno)", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/37/00/c3/3700c3a3-c29a-a96f-6fbe-296062a36320/886444931953_Cover.jpg/100x100bb.jpg" },
  { titulo: "Acompáñame a Estar Solo", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f2/cf/c1/f2cfc1d4-b82d-cd53-debf-633edff53da3/886444944571_Cover.jpg/100x100bb.jpg" },
  { titulo: "Cómo Duele", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/0b/57/4c/0b574c13-c628-b4af-3223-6870b640f2cb/886445220827_Cover.jpg/100x100bb.jpg" },
  { titulo: "Minutos", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/33/6b/0c/336b0cfe-2cf3-7fa3-a2b9-861997b17ecc/886444945578_Cover.jpg/100x100bb.jpg" },
  { titulo: "Mujeres", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b4/3a/10/b43a104f-cfaa-8990-239c-47f95d742dc2/dj.glpwhmzr.jpg/100x100bb.jpg" },
  { titulo: "Ella y Él", artista: "Ricardo Arjona", genero: "Romántica", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/05/8e/9e/058e9ee8-cbae-c525-3e14-e3cdfdb3e2cf/mzi.qbnuhmde.jpg/100x100bb.jpg" },
  { titulo: "Adiós Amor", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ca/70/a4/ca70a457-5d72-0e11-87a8-fb8dba93e204/17UM1IM16287.rgb.jpg/100x100bb.jpg" },
  { titulo: "No Te Contaron Mal", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/03/b1/4f/03b14f40-2cf6-120a-09ae-4f1cf6d6101f/19UMGIM35897.rgb.jpg/100x100bb.jpg" },
  { titulo: "De los Besos Que Te Di", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/03/b1/4f/03b14f40-2cf6-120a-09ae-4f1cf6d6101f/19UMGIM35897.rgb.jpg/100x100bb.jpg" },
  { titulo: "Ya No Somos Ni Seremos", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f6/5f/d0/f65fd019-ff7b-cb37-8dc6-4e829d377591/196589080363.jpg/100x100bb.jpg" },
  { titulo: "Botella Tras Botella", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3f/d4/7c/3fd47cca-c704-7c5b-dba0-deebb606ef6f/00602438235018_Cover.jpg/100x100bb.jpg" },
  { titulo: "Probablemente", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ca/70/a4/ca70a457-5d72-0e11-87a8-fb8dba93e204/17UM1IM16287.rgb.jpg/100x100bb.jpg" },
  { titulo: "El Amigo", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/7c/a6/80/7ca6809b-0b25-f940-f833-ac14a33a0460/196872947915.jpg/100x100bb.jpg" },
  { titulo: "Aquí Abajo", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/97/97/fa/9797fa22-6f36-befd-f98c-22b5982d7e2b/20UMGIM51570.rgb.jpg/100x100bb.jpg" },
  { titulo: "Te Fallé", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ca/70/a4/ca70a457-5d72-0e11-87a8-fb8dba93e204/17UM1IM16287.rgb.jpg/100x100bb.jpg" },
  { titulo: "Por el Resto de Tu Vida", artista: "Christian Nodal", genero: "Regional mexicano", portada: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5e/20/02/5e200276-4e46-0f91-29cf-c76c53cbfb6e/196589080431.jpg/100x100bb.jpg" },
  { titulo: "Florcita del Ande", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Ama Amazonas", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Raíces", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Rosa", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Guardián del Amazonas", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Aguas Claras", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Ch'bambinita", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Nuestro Amor a la Tierra", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Paloma del Alma Mía", artista: "Los Karkas", genero: "Cumbia", portada: "" },
  { titulo: "Quiero Saber", artista: "Los Karkas", genero: "Cumbia", portada: "" }
];

function pintarCanciones(canciones) {
  var lista = document.getElementById("listaCanciones");
  if (!lista) return;

  lista.textContent = "";

  canciones.forEach(function (cancion) {
    var item = document.createElement("li");
    item.className = "list-group-item";

    var imagen = document.createElement("img");
    imagen.className = "portada";
    imagen.src = cancion.portada || PORTADA_GENERICA;
    imagen.alt = "Portada de " + cancion.titulo + ", " + cancion.artista;

    var texto = document.createElement("span");
    texto.className = "cancion-texto";

    var icono = document.createElement("i");
    icono.className = "bi bi-play-circle me-2";

    var titulo = document.createElement("strong");
    titulo.textContent = cancion.titulo;

    texto.appendChild(icono);
    texto.appendChild(titulo);
    texto.appendChild(document.createTextNode(" — " + cancion.artista));

    item.appendChild(imagen);
    item.appendChild(texto);
    lista.appendChild(item);
  });

  // Cada vez que se pinta la lista, se vigilan las portadas
  prepararPortadas();
}

/* ==========================================================
   12. PWA: SERVICE WORKER E INSTALACIÓN
   ========================================================== */

function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return; // abrir con doble clic no soporta PWA

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./service-worker.js").catch(function () {
      // Si falla el registro, la página sigue funcionando normal
    });
  });
}

var eventoInstalacion = null;

function prepararInstalacion() {
  var boton = document.getElementById("botonInstalar");
  if (!boton) return;

  window.addEventListener("beforeinstallprompt", function (evento) {
    evento.preventDefault();
    eventoInstalacion = evento;
    boton.classList.remove("d-none");
  });

  boton.addEventListener("click", function () {
    if (!eventoInstalacion) return;

    eventoInstalacion.prompt();
    eventoInstalacion.userChoice.then(function () {
      eventoInstalacion = null;
      boton.classList.add("d-none");
    });
  });

  window.addEventListener("appinstalled", function () {
    eventoInstalacion = null;
    boton.classList.add("d-none");
  });
}

/* ==========================================================
   LOBBY: RAIL, PESTAÑAS Y PANEL FLOTANTE
   Cada sección se abre en una tarjeta que flota al costado;
   la pantalla principal nunca se cubre.
   ========================================================== */

function prepararLobby() {
  var panel = document.getElementById("panelLateral");
  if (!panel) return;

  var seccionActiva = null;   // nombre de la sección mostrada
  var eventosConectados = false;
  var demoEnMarcha = false;

  /* === HIDRATACIÓN (guía: arquitectura frontend avanzada) ===
     La página carga primero con la interfaz estática (rápida),
     y JS "hidrata" conectando los eventos sin redibujar nada.
     El guard equivale al .off() antes del .on() de jQuery:
     conecta los escuchadores UNA sola vez en toda la vida de la
     página (aunque se pulse el botón "Hidratar la página" mil
     veces) → sin fugas de memoria. */

  function conectarEventos() {
    if (eventosConectados) return; // guard anti fuga: ya están conectados
    eventosConectados = true;

    // Escuchadores del panel (se registran una sola vez)
    var botones = document.querySelectorAll("[data-panel]");

    function abrirSeccion(nombre) {
      var destino = document.getElementById(nombre);
      if (!destino) return;

      // Se muestra solo la sección elegida
      document.querySelectorAll(".panel-seccion").forEach(function (seccion) {
        if (seccion !== destino) seccion.classList.add("d-none");
      });
      destino.classList.remove("d-none");

      panel.classList.add("abierto");
      seccionActiva = nombre;

      // Marco el botón activo (rail y barra inferior)
      document.querySelectorAll("[data-panel]").forEach(function (boton) {
        boton.classList.toggle("activo", boton.dataset.panel === nombre && !boton.classList.contains("nav-link"));
      });

      // Al reabrir la sección, su contenido se ve desde arriba.
      var scrollPanel = panel.querySelector(".panel-scroll");
      if (scrollPanel) scrollPanel.scrollTop = 0;
    }

    function cerrarPanel() {
      panel.classList.remove("abierto");
      seccionActiva = null;
      document.querySelectorAll("[data-panel]").forEach(function (boton) {
        boton.classList.remove("activo");
      });
    }

    botones.forEach(function (boton) {
      if (boton.id === "cerrarPanel" || boton === document.body) return;
      boton.addEventListener("click", function (evento) {
        evento.preventDefault();

        var nombre = evento.currentTarget.dataset.panel;
        if (!nombre) return;

        var yaAbierto = seccionActiva === nombre && panel.classList.contains("abierto");
        if (yaAbierto) {
          cerrarPanel();
          return;
        }

        abrirSeccion(nombre);
      });
    });

    // Botón X del panel
    var cerrar = document.getElementById("cerrarPanel");
    if (cerrar) cerrar.addEventListener("click", cerrarPanel);

    // Cierre con Escape o al hacer clic fuera del panel
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") cerrarPanel();
    });

    document.addEventListener("click", function (evento) {
      if (!panel.classList.contains("abierto")) return;
      if (!(evento.target instanceof Element)) return;
      if (panel.contains(evento.target)) return;
      if (evento.target.closest("[data-panel], .menu-caida")) return;

      cerrarPanel();
    });

    panel.abrirSeccion = abrirSeccion; // (uso interno de la demo)
  }

  function activarInterfaz() {
    panel.dataset.hidratado = "true";

    // La interfaz pasa de estática a interactiva: se quita el candado
    document.querySelectorAll(".no-hidratado").forEach(function (elemento) {
      elemento.classList.remove("no-hidratado");
      elemento.removeAttribute("aria-disabled");
    });

    mostrarAvisoHidratacion();
  }

  // Pone la interfaz en modo "estática" (para la demo visual)
  function ponerEstatica() {
    panel.dataset.hidratado = "false";
    document.querySelectorAll(".rail-btn, .abajo-cta, .menu-lista").forEach(function (elemento) {
      elemento.classList.add("no-hidratado");
      elemento.setAttribute("aria-disabled", "true");
    });
  }

  function mostrarAvisoHidratacion() {
    var aviso = document.getElementById("avisoHidratacion");
    if (!aviso) return;

    clearTimeout(mostrarAvisoHidratacion.temporizador); // sin timers huérfanos
    aviso.classList.remove("d-none");
    mostrarAvisoHidratacion.temporizador = setTimeout(function () {
      aviso.classList.add("d-none");
    }, 2600);
  }

  // Carga normal: estática → hidratada a los 400 ms (como la guía)
  setTimeout(function () {
    conectarEventos(); // guard: solo la primera vez
    activarInterfaz();
  }, 400);

  /* === BOTÓN DEMO "Hidratar la página" ===
     Vuelve a mostrar el proceso completo delante del usuario:
     interfaz estática → (600 ms) → hidratada. Los escuchadores
     NO se duplican gracias al guard de conectarEventos(). */
  var botonHidratar = document.getElementById("botonHidratar");
  if (botonHidratar) {
    botonHidratar.addEventListener("click", function () {
      if (demoEnMarcha) return;
      demoEnMarcha = true;

      panel.classList.remove("abierto");
      ponerEstatica();

      setTimeout(function () {
        conectarEventos(); // el guard evita duplicar escuchadores
        activarInterfaz();
        demoEnMarcha = false;
      }, 600);
    });
  }
}

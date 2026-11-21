# Documentación del Proyecto — Perfil Personal PWA "Deimar Yeri"

**Autora:** Deimar Yeri Quispe Ramos
**Materia:** Diseño Web II — Carrera de Ingeniería
**Docente:** Ing. Miguel · UPDS Sede La Paz
**Fecha:** Noviembre de 2026
**Sitio publicado:** https://kalizdy.github.io/perfilpwa2.0/fase-ui-pwa/
**Tecnologías:** HTML5, CSS3, Bootstrap 5, JavaScript (vanilla), Web App Manifest, Service Worker, Cache Storage, LocalStorage

---

## 1. Resumen del proyecto

### 1.1 Descripción general

"Perfil Personal" es una **aplicación web progresiva (PWA)** que funciona como tarjeta de presentación interactiva de Deimar Yeri Quispe Ramos. Reúne en una sola pantalla —con estética de *lobby* de videojuego— su información personal, pasatiempos, intereses, horario académico, catálogo musical, juegos favoritos y un formulario de contacto inteligente.

El proyecto evolucionó desde una página de perfil tradicional (navbar + carrusel + secciones apiladas) hasta una **interfaz tipo dashboard de una sola pantalla**, inspirada en los lobbies de juegos como Mobile Legends: escenario de fondo, personaje central, rail de iconos lateral y panel flotante de contenido. Finalmente se convirtió en PWA **offline-first** instalable, con hidratación, delegación de eventos y una cola local de sincronización.

### 1.2 Objetivos

1. Presentar el perfil personal de forma moderna, atractiva y usable en cualquier dispositivo.
2. Aplicar los patrones de arquitectura frontend de la materia: **hidratación**, **prevención de fugas de memoria** y **delegación de eventos (Event Bubbling)**.
3. Convertir el sitio en una **PWA instalable y funcional sin conexión** (Offline-First).
4. Cumplir las guías del docente: formularios con validación en tiempo real, enfoque visual (*focus*), manifest + service worker y detector de estado de red.
5. Publicar el resultado en GitHub Pages como entregable verificable.

### 1.3 Arquitectura de archivos

Todos los archivos de la PWA viven dentro de la subcarpeta **`fase-ui-pwa/`** del repositorio (tal como pide la guía). La raíz del repositorio solo contiene un `index.html` que redirige a esa carpeta.

| Archivo | Rol ||---|---|
| `index.html` | Estructura del lobby: barra superior, rail de 6 secciones, escenario central, panel flotante, barra inferior y avisos. Incluye las metas PWA. |
| `style.css` | Diseño completo: variables de marca, estética cristal/dorado, 3 modos responsive, estados de foco, tema claro/oscuro, estados de hidratación y red. |
| `script.js` | Toda la lógica: hidratación, secciones, catálogo musical (90 canciones), filtros de juegos, validación del formulario, tema, instalación, cola offline y detector de red. |
| `service-worker.js` | Interceptación de red y caché: precache en instalación, estrategias por tipo de recurso, limpieza de cachés viejas. |
| `manifest.json` | Identidad de la app: nombre, iconos, colores, `display: standalone`, `start_url`. |
| `icons/` | Iconos 192×192, 512×512 y maskable para la instalación. |
| `foto-perfil.jpg` | Imagen central del personaje y avatar (respaldo). |
| `foto-perfil.webp` / `foto-perfil-400.webp` | Versiones WebP optimizadas de la foto: LCP del sitio y avatar móvil. |
| `diagnostico.html` | Herramienta de la guía del docente: analiza código pegado y detecta clases bloqueables por Brave/Opera y `100vh` rígido. Usa **DOMPurify** para sanear el HTML del informe (anti-XSS). |

### 1.4 Funcionalidades por sección

| Sección | Contenido y funciones |
|---|---|
| **Pasatiempos** | Tarjetas con imagen de videojuegos y música; cada tarjeta **lleva a su sección** (Juegos / Música). |
| **Intereses** | Programación, mercados financieros y criptomonedas. Cada tarjeta se **despliega al tocarla** y muestra una descripción ampliada con temas concretos (acordeón accesible, uno a la vez). |
| **Horario** | Hoja de Google Sheets embebida + botón "Abrir hoja" (URL real, pestaña nueva). |
| **Música** | Catálogo de **90 canciones** con 9 artistas: filtro por género, búsqueda en vivo por artista/canción, vista de detalle con lista de temas y botón "Volver". **Cada canción abre YouTube** (búsqueda exacta "artista + título") en una pestaña nueva. |
| **Juegos** | Dota 2, Fortnite y Mobile Legends con filtro por tipo (MOBA / Battle Royale). Al tocar una tarjeta **no sale del perfil**: abre su **historial** con rango, última actualización, estadísticas y últimas partidas de ejemplo. |
| **Contacto** | Formulario de 6 campos con validación en tiempo real, filtro de caracteres, contador 0/300, resumen del mensaje y botones de envío por WhatsApp/correo. Cada mensaje se guarda además en **Supabase** (base de datos en la nube). |

### 1.5 Patrones técnicos destacados

- **Hidratación:** la interfaz se sirve estática (botones bloqueados con `.no-hidratado`) y a los 400 ms JavaScript conecta los eventos y la "despierta" sin redibujar el DOM. Un guard (`data-hidratado` + variable `eventosConectados`) impide duplicar escuchadores → **sin fugas de memoria**. El proceso es completamente **interno**: no muestra botones ni avisos al usuario.
- **Delegación de eventos (Event Bubbling):** un único escuchador en `document` maneja todos los botones `[data-panel]` (rail, CTA y menú), y un único escuchador en `#galeriaArtistas` maneja todas las tarjetas de artista creadas dinámicamente. El clic "burbujea" desde el hijo más profundo y se resuelve con `closest()`.
- **Offline-First:** Cache Storage para recursos, LocalStorage para datos dinámicos y cola de envíos, Service Worker para sincronización y UI optimista con estados visuales.

---

## 2. Experiencia de usuario (UI)

### 2.1 Concepto visual: lobby de juego

La pantalla se organiza como un **lobby de videojuego**:

- **Escenario de fondo**: **carrusel automático** (fundido cada 6 s) que **intercala** imágenes de sus **intereses reales** (programación, mercados financieros, criptomonedas y videojuegos) con **tres fotos personales** optimizadas en WebP, con degradados y brillo para mantener la legibilidad; se adapta al tema claro/oscuro y respeta "reducir movimiento".
- **Personaje central**: foto con marco luminoso y placa con nombre y lema ("Tecnología • Mercados financieros • Música").
- **Barra superior**: avatar, nombre y **barra de carrera "Estudiante de Ingeniería de Sistemas"** con una **barra de avance visual** (sin escribir el semestre), saludo dinámico según la hora y acciones (instalar, tema, menú).
- **Rail lateral** con 6 iconos: Pasatiempos, Intereses, Horario, Música, Juegos y Contacto (destacado en dorado).
- **Panel flotante** de cristal que se desliza al costado sin cubrir la pantalla principal.
- **Barra inferior** con CTA dorado "Contáctame", chip de estado de red, redes sociales reales y crédito.
- **Frase flotante** decorativa.

La metáfora "lobby" reduce la sensación de página larga: todo está a un toque y la pantalla principal nunca se abandona.

### 2.2 Diseño responsive (3 modos)

| Modo | Comportamiento |
|---|---|
| **Escritorio / tablet (≥ 769 px)** | Rail visible a la izquierda + panel flotante a la derecha del personaje. Una sola pantalla sin scroll de página. |
| **Celular vertical (≤ 768 px, portrait)** | Estructura apilada: barra superior compacta, personaje centrado y panel tipo hoja. El rail se reemplaza por el menú hamburguesa. |
| **Celular acostado (landscape, ≤ 520 px de alto)** | Se conserva la estructura de escritorio: rail visible con las 6 secciones, panel al costado derecho (sin tapar al personaje, que se desplaza a la izquierda al abrirse) y **menú hamburguesa disponible junto al botón de tema**. |

Detalles de adaptación: tipografías fluidas con `clamp()`, chips que se ocultan en pantallas pequeñas, foto y textos del jugador reducidos en móvil, y botones con tamaño táctil adecuado.

### 2.3 Interacción y navegación

- **6 botones del rail** + CTA dorado + menú hamburguesa abren su sección en el panel.
- **Cierres múltiples:** botón ✕, tecla `Escape`, clic fuera del panel y volver a tocar el mismo botón (toggle).
- **Cambio de sección** con transición suave; el botón activo se resalta.
- **Saludo dinámico** según la hora del día.
- **Tema claro/oscuro** con un clic, icono intercambiable y preferencia guardada en `localStorage` (persiste entre visitas). El **modo día es blanco**: fondo y barras de vidrio blanco, texto oscuro y el carrusel de intereses visible pero aclarado; el **modo noche** conserva el escenario oscuro original con las imágenes a plena visibilidad. Los colores de paneles, títulos y textos de estado se ajustan por tema (contraste verificado: 15.7:1 en claro y 12.3:1 en oscuro en el panel principal).
- **Sin enlaces muertos ni `onclick` incrustados:** todas las URLs (Facebook, Instagram, GitHub, Google Sheets) son reales, con `target="_blank"` y `rel="noopener"`.

### 2.4 Formulario de contacto

- **6 campos:** nombre, correo, celular, motivo, tema y mensaje.
- **Celular válido por país:** selector compacto con código telefónico (Bolivia +591 por defecto, Perú +51, Argentina +54, Chile +56, Colombia +57, Ecuador +593, México +52, Paraguay +595, Brasil +55, España +34, EE.UU./Canadá +1 y "Otro"). Cada país define su rango de dígitos y prefijo válido (p. ej. Bolivia: 8 dígitos que empiecen en 6 o 7); el campo **bloquea dígitos extra** al llegar al máximo y limpia el código si se pega el número completo.
- **Validación en tiempo real:** al salir del campo (`blur`) y revalidación mientras se corrige (`input`).
- **Regla de mínimo 3 caracteres** con mensaje específico.
- **Filtro de caracteres prohibidos** con aviso temporal autocontenido (temporizador limpiado con `clearTimeout`).
- **Contador 0/300** en vivo; límite duro de 300.
- **Tema dependiente del motivo** (select encadenado).
- **Resumen final** con el texto completo y botones de WhatsApp/correo (ocultos hasta configurar los datos de contacto), más "Editar".
- **Accesibilidad:** `label` asociado, `aria-live` en mensajes y foco automático al primer campo con error.

### 2.5 Accesibilidad y enfoque visual

- Anillo azul de marca en `:focus` de campos; **verde/rojo** cuando el campo es válido/inválido.
- Anillo cian `:focus-visible` en botones y enlaces (navegación con teclado).
- Atributos `aria-label`, `aria-controls`, `aria-expanded`, `aria-disabled` y `role="status"` para lectores de pantalla.
- Estados de "no hidratado" con `pointer-events: none` y `aria-disabled` coherentes.

### 2.6 Rendimiento percibido

- La página aparece **instantáneamente** (HTML estático), la hidratación tarda 400 ms y no produce parpadeos.
- El panel no recarga la página ni destruye el DOM: solo alterna clases.
- **Imágenes WebP:** la foto del personaje pesa 65 KB (antes 86 KB) y su versión móvil/avatar 27,5 KB (antes se usaba la misma de 86 KB). `<picture>` con respaldo JPG para navegadores antiguos.
- **LCP optimizado:** la imagen principal se precarga con `<link rel="preload">` + `imagesrcset`, `fetchpriority="high"`, dimensiones explícitas (sin CLS) y `decoding="async"`; el fondo decorativo baja a prioridad baja y las 8 imágenes secundarias usan `loading="lazy"`.
- Imágenes con `alt` descriptivo y precarga de fuentes del sistema/Bootstrap.

### 2.7 Convención de nombres en CSS

Las clases propias usan **nombres semánticos en español** (`lobby`, `rail-btn`, `jugador-foto`, `panel-seccion`, `estado-red`), consistentes y legibles, con variables CSS centralizadas (`--marca`, `--oro`, `--cristal`). No se aplica la convención BEM (`bloque__elemento--modificador`): se priorizó la claridad en español y la estabilidad del proyecto ya probado. Las utilidades de Bootstrap (`d-none`, `d-flex`, `mb-0`…) se mantienen tal cual, como recomienda la propia documentación de Bootstrap.

### 2.8 Optimización de rendimiento (medida)

| Métrica | Resultado |
|---|---|
| **LCP** (Largest Contentful Paint) | ~0,3–0,8 s (la foto del personaje, precargada en WebP) |
| **CLS** (salto de layout) | **0** (dimensiones explícitas en las imágenes) |
| **Peticiones al cargar** | 25 → **13** (la galería de música ya no descarga sus 9 fotos hasta abrirse) |
| **Fuentes** | 5 archivos / 198 KB → **3 archivos / 62 KB** (Inter variable 400–600 + Poppins 700/800) |
| **Compresión en GitHub Pages** | gzip activo en HTML, CSS y JS |
| **Imágenes** | WebP en el personaje y avatar; carrusel de fondo con `srcset` (420/700 px) y `loading="lazy"`; portadas y miniaturas diferidas |
| **Caché** | Service Worker v5 con precache tolerante a archivos ausentes y estrategias por tipo de recurso |
| **Redes** | `preconnect` a jsDelivr y Unsplash; `dns-prefetch` |
| **SEO / compartir** | Open Graph (título, descripción, imagen) + JSON-LD `Person` |

---

## 3. PWA (Progressive Web App)

### 3.1 Qué se implementó

La aplicación es **instalable** (ícono en el celular/escritorio, ventana `standalone` sin barra del navegador) y **funciona sin conexión** gracias a los tres pilares de la guía:

1. **Almacenamiento local robusto:** Cache Storage (recursos estáticos) + LocalStorage (tema y datos dinámicos).
2. **Cola de sincronización + Service Worker:** las acciones sin red se guardan en una cola local y se marcan como sincronizadas al volver la conexión.
3. **UI resiliente y optimista:** la interfaz confirma la acción localmente y muestra el estado real de la red.

### 3.2 `manifest.json`

- `name` / `short_name`, `description`, `lang: es`, `dir: ltr`.
- `start_url: "./"` y `scope: "./"` (funciona en la subcarpeta de GitHub Pages).
- `display: "standalone"`, `background_color` y `theme_color` `#0b1220`.
- Iconos 192, 512 y maskable.
- **Sin `"orientation"` fija a propósito:** durante las pruebas, el bloqueo de orientación impedía que la app instalada girara correctamente en algunos dispositivos; dejarlo sin declarar equivale a "cualquier orientación" y mejora la experiencia real.

### 3.3 `service-worker.js`

| Recurso | Estrategia | Motivo |
|---|---|---|
| HTML (mismo origen) | **Red primero** con caché de respaldo | Ver cambios publicados al instante; abrir aunque no haya red. |
| CSS / JS (propios y CDN) | **Stale-while-revalidate** | Respuesta inmediata desde caché + actualización de fondo. |
| Imágenes y fuentes (propios, CDN, Unsplash) | **Caché primero** | Carga instantánea y completa sin internet. |
| Google Sheets (iframe del horario) | **Sin caché (passthrough)** | Contenido dinámico que no debe quedar fijo. |

Además: precache de los archivos base en la instalación, `skipWaiting()` + `clients.claim()` para activarse de inmediato, y borrado de cachés antiguas (`perfil-pwa-v1` → `perfil-pwa-v2`).

Comprobación real: la caché contiene 29 recursos, incluidos Bootstrap CSS/JS, iconos y fuentes `.woff2`, por lo que la página **se ve completa y con estilos sin conexión**.

### 3.4 Flujo Offline-First implementado

1. El usuario llena el formulario y pulsa "Preparar".
2. Si **no hay red**, el mensaje se guarda en `localStorage` (`colaEnviosPerfil`) con estado `pendiente` y la UI muestra **"🟠 Guardado localmente — pendiente de envío"**.
3. El chip inferior cambia a **"🟠 Offline — datos locales (n pendientes)"**.
4. Al recuperar la conexión (`evento online`) o al recargar con red, la cola se reintenta: cada mensaje se envía por REST a **Supabase** (tabla `mensajes_contacto`); si el envío es exitoso queda `sincronizado`, aparece el aviso **"✓ Enviado — mensaje guardado en la nube"** y el estado pasa a **"🟢 Enviado — guardado en el servidor"**.
5. Si Supabase no responde o la tabla no está creada, el mensaje **permanece pendiente** y se reintenta en la próxima conexión (tolerancia a fallos).

El chip de red es la versión en JavaScript puro del ejemplo jQuery de la guía (`online`/`offline` + estado visual). No se usa jQuery en ningún punto del proyecto.

### 3.5 Instalación y actualización

- Botón de instalación personalizado que aparece cuando el navegador emite `beforeinstallprompt` y llama a `prompt()` al tocarlo.
- Cache-busting por versión en las hojas/scripts (`?v=lobbyN`) para garantizar que las actualizaciones lleguen al usuario.
- Registro del service worker omitido en `file://` (limitación de seguridad del navegador, no un error).

### 3.6 Pruebas realizadas

| Prueba | Resultado |
|---|---|
| Apertura de las 6 secciones desde rail, CTA y menú móvil | ✔ |
| Cierre por ✕, Escape, clic fuera y toggle del mismo botón | ✔ |
| Filtros de música (género, búsqueda, artista → canciones → volver) | ✔ |
| Filtro de juegos (MOBA / Battle Royale) | ✔ |
| Validación de los 6 campos, contador y resumen | ✔ |
| Tema claro/oscuro persistente | ✔ |
| Hidratación (marca `data-hidratado`, candado visual y demo) | ✔ |
| Cola offline: pendiente → sincronizado con eventos de red | ✔ |
| Enlaces externos reales sin `href="#"` | ✔ |
| Service worker activo y recursos en caché | ✔ |
| Errores de consola propios | **0** |

### 3.7 Limitaciones conocidas

- Abrir `index.html` con doble clic (`file://`) bloquea el manifest y el service worker por CORS: es una restricción del navegador. Para probar la PWA se usa el servidor local (`http://127.0.0.1:8123/fase-ui-pwa/`) o el sitio publicado.
- Los botones de WhatsApp y correo del resumen permanecen ocultos hasta completar `CORREO_CONTACTO` y `WHATSAPP_CONTACTO` en `script.js`.
- El envío a Supabase requiere que la tabla `mensajes_contacto` exista con sus políticas RLS (insertar para `anon`); si no está creada, los mensajes quedan en cola y se reintentan.

### 3.8 Integración con Supabase (backend en la nube)

El formulario de contacto se conecta a una base de datos PostgreSQL alojada en **Supabase** mediante su API REST.

- **Proyecto:** `https://jeggyjriuqyvyithlvlr.supabase.co`
- **Clave usada:** clave pública (*publishable*), visible en `script.js`; es segura porque **no tiene permisos de lectura ni de borrado**.
- **Endpoint:** `POST /rest/v1/mensajes_contacto` con cabeceras `apikey` y `Authorization: Bearer`.
- **Tabla:** `mensajes_contacto` (nombre, correo, celular, motivo, tema, mensaje, fecha).
- **Seguridad (RLS):** la política permite únicamente `INSERT` al rol `anon`; la lectura queda reservada a usuarios autenticados.
- **Resiliencia:** si la red o el servidor fallan, el mensaje se conserva en la cola local y se reintenta automáticamente, sin pérdida de datos ni bloqueo de la interfaz.

---

## 4. Conclusiones

1. **Arquitectura frontend aplicada con criterio:** la hidratación separa "pintar rápido" de "volverse interactivo", y el guard de eventos garantiza que los escuchadores se registren una sola vez, eliminando la principal causa de fugas de memoria en SPA.
2. **La delegación de eventos simplifica y escala:** un solo escuchador en `document` maneja toda la navegación del lobby, y uno en la galería cubre las tarjetas que se crean y destruyen al filtrar. El código es más corto, consume menos RAM y funciona con contenido futuro.
3. **La PWA no es un adorno:** con manifest, service worker y estrategias de caché por tipo de recurso, el sitio realmente abre sin internet y con estilos completos. El flujo offline-first (cola + UI optimista + detector de red) demuestra los tres pilares de la guía en uso.
4. **La experiencia de usuario guía las decisiones técnicas:** el lobby de una sola pantalla, el panel flotante, los cierres múltiples, el tema persistente y el formulario con validación inmediata reducen la fricción; la estética de juego hace la presentación memorable sin sacrificar claridad.
5. **La verificación constante paga:** cada funcionalidad se probó en escritorio, celular vertical y acostado, con auditorías de botones, enlaces reales, consola limpia y simulación de redes lentas/offline.

---

## 5. Implementaciones futuras

| Prioridad | Mejora | Beneficio |
|---|---|---|
| Alta | **Panel de administración** (Supabase Auth + tabla) para leer los mensajes recibidos | Ver y gestionar los mensajes desde la web |
| Alta | **Background Sync API** en el service worker | Sincronizar automáticamente aunque la pestaña esté cerrada |
| Alta | Completar `CORREO_CONTACTO` y `WHATSAPP_CONTACTO` | Activar los botones reales de envío |
| Media | **IndexedDB** para la cola y borradores del formulario | Mayor capacidad y estructura que LocalStorage |
| Media | **Notificaciones push** (Push API + Notification) | Avisar de nuevos mensajes o recordatorios de horario |
| Media | Optimización de imágenes (WebP/AVIF + `srcset`) y auditoría Lighthouse | Mejor puntuación de rendimiento y accesibilidad |
| Media | Migrar Bootstrap de CDN a local | Independencia total de terceros y mejor caché |
| Baja | Pantalla de modo offline explícita (`offline.html`) | Mensaje más claro cuando no hay red ni caché |
| Baja | Sección de proyectos/portafolio con datos desde JSON | Ampliar el perfil sin tocar el HTML |
| Baja | Modo multilingüe (es/en) | Alcance internacional del perfil |
| Baja | Analítica ligera y respetuosa (sin cookies) | Medir visitas sin comprometer privacidad |

---

## Anexo A — Cómo probar el proyecto

1. **Local con servidor:** `python -m http.server 8123` en la carpeta del proyecto y abrir `http://127.0.0.1:8123/fase-ui-pwa/`.
2. **En línea:** https://kalizdy.github.io/perfilpwa2.0/fase-ui-pwa/
3. **Hidratación:** `document.getElementById("panelLateral").dataset.hidratado` → `"true"` (proceso interno, sin botón visible).
4. **Offline:** DevTools → *Network* → *Offline* → recargar → la app abre completa; enviar el formulario y reconectar para ver la sincronización.
5. **Instalación:** botón ⬇ (aparece cuando el navegador lo permite) o menú del navegador → "Instalar aplicación".
6. **Diagnóstico de código:** abrir `diagnostico.html` y pegar cualquier HTML/CSS para detectar clases bloqueables y `100vh` rígido.

---

*Documento generado como memoria técnica del proyecto de Diseño Web II — UPDS La Paz, noviembre de 2026.*

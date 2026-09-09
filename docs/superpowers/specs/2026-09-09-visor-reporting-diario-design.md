# Visor de reporting diario — Diseño

## Objetivo

Crear un visor web local, usable abriendo el `index.html` de la raíz con doble clic, que redirija a la aplicación contenida en `web-report/index.html`, muestre de forma legible todos los reportes diarios guardados bajo carpetas `AAAA-MM-DD` y permita abrir directamente una fecha mediante `?fecha=AAAA-MM-DD`.

## Archivos y responsabilidades

- `index.html`: lanzador mínimo situado en la raíz. Redirige a `web-report/index.html` conservando la cadena de consulta y el fragmento de la URL.
- `web-report/index.html`: estructura accesible del visor y carga ordenada de estilos, datos y aplicación.
- `web-report/styles.css`: presentación responsive, estados de foco, cabecera fija, selector de fecha y estilos del Markdown.
- `web-report/app.js`: selección de reporte, resolución de la fecha inicial, renderizado seguro del subconjunto de Markdown usado por los reportes y mensajes de estado.
- `web-report/reportes.js`: índice generado que asigna a `window.REPORTES` una lista de `{ fecha, contenido }`, ordenada de más reciente a más antigua.
- `web-report/actualizar-indice.ps1`: recorre las carpetas de fecha situadas en la raíz padre, lee cada `resumen-matutino.md` y regenera `web-report/reportes.js` usando serialización JSON segura.
- `web-report/tests.html`: pruebas ejecutables directamente en el navegador para la selección de fecha, el fallback y el renderizado.

## Descubrimiento e indexación

Un HTML abierto mediante `file://` no puede enumerar automáticamente sus carpetas vecinas. Por eso, el visor cargará `web-report/reportes.js` como un script clásico, evitando peticiones `fetch` que los navegadores suelen bloquear para archivos locales.

`web-report/actualizar-indice.ps1` buscará en los hijos directos de la raíz padre cuyo nombre cumpla `^\d{4}-\d{2}-\d{2}$`. Solo incorporará una fecha si contiene `resumen-matutino.md`. El resultado se escribirá de forma determinista en `web-report/reportes.js`, ordenado por fecha descendente.

## Selección de fecha

1. Si existe el parámetro `fecha=AAAA-MM-DD` y esa fecha está indexada, se carga exactamente ese reporte.
2. Si el parámetro está ausente y existe el reporte de hoy en la zona horaria local, se carga hoy.
3. Si el parámetro está ausente y falta el reporte de hoy, se carga el reporte disponible más reciente anterior a hoy y aparece de forma persistente en la cabecera el aviso `FALTA REPORTE DE HOY`.
4. Si el parámetro solicita una fecha inexistente, se muestra un estado claro de «reporte no encontrado» sin sustituir silenciosamente la fecha.
5. Si no existe ningún reporte, se muestra un estado vacío con instrucciones para ejecutar `web-report/actualizar-indice.ps1`.

La selección manual se presentará como un control de fecha y una lista de reportes recientes. Al cambiar de fecha, el navegador navegará a la misma página con `?fecha=AAAA-MM-DD`, dejando una URL copiable y enlazable.

## Presentación

La interfaz tendrá una cabecera fija con el título, la fecha visible y el aviso de ausencia del reporte actual. En escritorio habrá una columna lateral compacta con las fechas y una tarjeta principal de lectura. En pantallas pequeñas, los controles pasarán encima del contenido.

El estilo será sobrio y profesional, con jerarquía tipográfica clara, buen contraste, ancho de lectura limitado, tablas desplazables horizontalmente y tratamiento visual diferenciado para prioridades, enlaces, listas y citas. No dependerá de fuentes, CDNs ni conexión a Internet.

## Renderizado y seguridad

El renderizador cubrirá los elementos presentes en los reportes actuales: títulos, párrafos, negrita, cursiva, enlaces, listas ordenadas y no ordenadas, tablas, citas, separadores y código en línea. El texto se escapará antes de aplicar el formato y los enlaces solo admitirán protocolos seguros o destinos relativos.

## Automatización

La tarea programada `Resumen diario` conservará su horario, estado, modelo, esfuerzo de razonamiento, proyecto y directorios actuales. Su prompt se ampliará para exigir esta secuencia en cada ejecución:

1. Guardar el reporte en `AAAA-MM-DD/resumen-matutino.md`.
2. Ejecutar `web-report/actualizar-indice.ps1` desde la raíz de `reporting`.
3. Comprobar que `web-report/reportes.js` contiene la fecha recién creada.
4. Incluir al final de la respuesta un enlace local a `index.html?fecha=AAAA-MM-DD`.

La tarea no modificará manualmente el índice ni duplicará contenido fuera de la carpeta correspondiente al día.

## Pruebas y verificación

- Pruebas JavaScript sin librerías desde `web-report/tests.html` para fecha explícita, hoy disponible, fallback al último reporte anterior, fecha explícita ausente y Markdown básico.
- Ejecución real de `web-report/actualizar-indice.ps1` sobre la carpeta actual y validación de que indexa `2026-09-09`.
- Apertura de `index.html?fecha=2026-09-09` en navegador para comprobar diseño, enlaces, tablas y comportamiento responsive.
- Inspección final de la configuración de la tarea programada para confirmar que solo cambió el prompt.

## Fuera de alcance

- Servidor web, base de datos o despliegue remoto.
- Edición de reportes desde el navegador.
- Dependencias JavaScript externas.
- Node.js, npm o cualquier proceso servidor para abrir o utilizar el visor.
- Cambios al contenido funcional del resumen diario existente, salvo la persistencia, reindexación y enlace al visor.

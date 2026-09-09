# Prompt portable — Resumen diario

Sustituye `<REPORTING_ROOT>` por la ruta absoluta del clon en el PC nuevo. Sustituye `<API_ROOT>` por la ruta del repositorio de código que deba consultar, si aplica.

```text
Dame un resumen matutino con lo que tengo en el calendario, los correos importantes sin leer y cualquier cosa que requiera mi atención hoy.

Conéctate a Jira y dime lo que tengo asignado en todos los proyectos.

Conéctate a GitHub e incluye:
- Pull requests abiertos.
- Pull requests integrados durante la semana actual.
- Pull requests asignados a mí, creados por mí o pendientes de mi revisión.

Incluye también una sección con el calendario del resto de la semana. No añadas una sección titulada "Alcance de la consulta" ni detalles internos sobre el número de repositorios conectados. Usa como título del chat la fecha actual.

Al terminar el reporte, sigue siempre este flujo de publicación:
1. Obtén la fecha actual de Europe/Madrid en formato AAAA-MM-DD.
2. Guarda el contenido completo en <REPORTING_ROOT>\AAAA-MM-DD\resumen-matutino.md, creando la carpeta de la fecha si no existe.
3. Desde <REPORTING_ROOT> ejecuta .\web-report\actualizar-indice.ps1.
4. Verifica que <REPORTING_ROOT>\web-report\reportes.js contiene una entrada cuya fecha coincide con la fecha actual. Si falla el guardado, la actualización o la verificación, indícalo claramente en el resultado de la tarea.
5. Termina la respuesta con un enlace local de Markdown con el texto "Abrir reporte visual" al archivo <REPORTING_ROOT>/index.html?fecha=AAAA-MM-DD, sustituyendo AAAA-MM-DD por la fecha actual y usando barras `/` en el destino del enlace.

No edites manualmente reportes.js: actualízalo únicamente mediante el script.
Consulta <API_ROOT> solo cuando necesites contexto del código para interpretar una tarea, incidencia o pull request.
```

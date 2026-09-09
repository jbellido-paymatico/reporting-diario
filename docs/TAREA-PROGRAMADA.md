# Recrear la tarea programada «Resumen diario»

Esta guía documenta la automatización que genera el Markdown, actualiza el visor y devuelve un enlace directo al reporte del día.

## Configuración de referencia

| Campo | Valor |
|---|---|
| Nombre | `Resumen diario` |
| Tipo | Tarea programada independiente |
| Estado | Activa |
| Frecuencia | Lunes a viernes, 08:00 |
| Zona horaria operativa | `Europe/Madrid` |
| Regla de recurrencia | `RRULE:FREQ=WEEKLY;BYHOUR=8;BYMINUTE=0;BYDAY=MO,TU,WE,TH,FR` |
| Entorno | Proyecto local, no worktree |
| Modelo usado al documentar | `gpt-5.6-sol` |
| Esfuerzo de razonamiento | Alto |

Se usa el entorno local porque la tarea debe escribir en el clon que abre `index.html`. Un worktree dejaría el nuevo reporte y el índice aislados en otro checkout.

## Requisitos del PC nuevo

1. Instala la aplicación de escritorio de ChatGPT con Codex e inicia sesión.
2. Clona este repositorio en una ruta local permanente.
3. Añade el clon como proyecto local de Codex.
4. Si el reporte necesita contexto de código, añade también el repositorio correspondiente al proyecto o al conjunto de directorios permitido.
5. Conecta y autoriza las fuentes que use el resumen: calendario, correo, Jira y GitHub.
6. Comprueba que PowerShell puede ejecutar `web-report/actualizar-indice.ps1`.

Las tareas que usan archivos locales necesitan que el equipo esté encendido, que la aplicación de escritorio esté abierta y que el proyecto siga disponible en disco. Consulta la [documentación oficial de tareas programadas](https://learn.chatgpt.com/docs/automations).

## Creación en Codex

Desde un chat de Codex asociado al clon, solicita:

```text
Crea una tarea programada independiente llamada "Resumen diario". Debe ejecutarse de lunes a viernes a las 08:00, trabajar directamente en este proyecto local y usar el prompt guardado en automation/resumen-diario-prompt.md. Configura Europe/Madrid como referencia temporal. Usa gpt-5.6-sol con razonamiento alto si está disponible.
```

Cuando Codex pida el contenido completo del prompt, copia [automation/resumen-diario-prompt.md](../automation/resumen-diario-prompt.md) y sustituye:

- `<REPORTING_ROOT>` por la ruta absoluta del clon.
- `<API_ROOT>` por la ruta del repositorio de código consultado. Si no se necesita, elimina esa última instrucción.

La aplicación permite crear y administrar tareas programadas desde una conversación. Para proyectos locales, confirma que el destino sea `local`; de lo contrario, los archivos podrían escribirse en un worktree aislado.

## Validación inicial

Ejecuta la tarea manualmente una vez desde la vista de tareas programadas y comprueba:

1. Existe `<REPORTING_ROOT>\AAAA-MM-DD\resumen-matutino.md`.
2. Existe `<REPORTING_ROOT>\web-report\reportes.js`.
3. `reportes.js` contiene la fecha de la ejecución.
4. El enlace final abre `index.html?fecha=AAAA-MM-DD`.
5. Al abrir `index.html` sin parámetro se muestra el reporte de hoy.

Después de validar, revisa las primeras ejecuciones automáticas para confirmar que las conexiones y permisos siguen disponibles.

## Protección de datos

No subas `reportes.js` ni carpetas `AAAA-MM-DD` al repositorio. Ambos están excluidos por `.gitignore` porque pueden incluir mensajes, reuniones, incidencias y enlaces internos.

No copies al repositorio credenciales, tokens, cookies ni identificadores de sesión. Las conexiones deben autorizarse desde la aplicación en cada PC.


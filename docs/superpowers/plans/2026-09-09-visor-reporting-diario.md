# Visor de Reporting Diario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un visor local sin servidor que indexe los reportes diarios, permita seleccionarlos por URL y mantenga el índice actualizado desde la tarea programada.

**Architecture:** Un `index.html` raíz conserva la consulta y redirige a una aplicación estática en `web-report`. Un script PowerShell convierte los Markdown de las carpetas de fecha en un script de datos cargable desde `file://`; JavaScript puro selecciona y renderiza el reporte.

**Tech Stack:** HTML5, CSS, JavaScript clásico, PowerShell 7/Windows PowerShell, pruebas JavaScript en navegador.

**Spec:** `docs/superpowers/specs/2026-09-09-visor-reporting-diario-design.md`

## Global Constraints

- No usar Node.js, npm, servidor local ni dependencias externas.
- Todos los archivos de aplicación salvo el lanzador raíz viven en `web-report`.
- La fecha de URL usa exactamente el parámetro `fecha=AAAA-MM-DD`.
- La tarea programada conserva horario, modelo, proyecto, directorios y estado.

---

### Task 1: Contrato de selección y Markdown

**Files:**
- Create: `web-report/tests.html`
- Create: `web-report/app.js`

**Interfaces:**
- Consumes: lista `Array<{fecha: string, contenido: string}>`, fecha solicitada y fecha local actual.
- Produces: `ReportApp.resolveReport(reportes, fechaSolicitada, hoy)`, `ReportApp.markdownToHtml(markdown)` y `ReportApp.formatLongDate(fecha)`.

- [x] **Step 1: Write the failing test**

Crear un runner visual que pruebe: fecha explícita existente; hoy existente; fallback al reporte anterior con `missingToday: true`; fecha explícita inexistente sin fallback; escaping de HTML y renderizado de título, enlace y tabla.

- [x] **Step 2: Run test to verify it fails**

Abrir `web-report/tests.html` en un navegador y confirmar que el resumen indica fallos porque `ReportApp` todavía no implementa las funciones.

- [x] **Step 3: Write minimal implementation**

Crear un módulo clásico autocontenido que exponga las tres funciones en `window.ReportApp`, escape primero el contenido no confiable y solo admita enlaces `https:`, `http:`, `mailto:`, rutas relativas y fragmentos.

- [x] **Step 4: Run test to verify it passes**

Recargar `web-report/tests.html` y confirmar que todas las pruebas pasan sin errores de consola.

### Task 2: Interfaz del visor

**Files:**
- Create: `index.html`
- Create: `web-report/index.html`
- Create: `web-report/styles.css`
- Modify: `web-report/app.js`

**Interfaces:**
- Consumes: `window.REPORTES` cargado por `reportes.js` y las funciones del Task 1.
- Produces: selector por fecha, lista de días, banner de ausencia, contenido Markdown y navegación que conserva enlaces directos.

- [x] **Step 1: Write the failing test**

Añadir pruebas DOM en `tests.html` que creen un fixture real y verifiquen el reporte seleccionado, el banner y el estado de fecha no encontrada.

- [x] **Step 2: Run test to verify it fails**

Recargar la página de pruebas y confirmar que fallan por ausencia de `renderApp`.

- [x] **Step 3: Write minimal implementation**

Implementar `ReportApp.renderApp(document, reportes, locationLike, hoy)`; crear HTML semántico y estilos responsive; añadir el lanzador raíz con `location.replace('web-report/index.html' + location.search + location.hash)`.

- [x] **Step 4: Run test to verify it passes**

Confirmar que todas las pruebas pasan y abrir el visor para inspección manual.

### Task 3: Generador de índice

**Files:**
- Create: `web-report/actualizar-indice.ps1`
- Create: `web-report/reportes.js`

**Interfaces:**
- Consumes: carpetas hermanas `AAAA-MM-DD/resumen-matutino.md` bajo la raíz de reporting.
- Produces: `window.REPORTES = <JSON>;` con UTF-8, fechas descendentes y contenido íntegro.

- [x] **Step 1: Write the failing test**

Ejecutar el generador antes de que exista y confirmar que PowerShell falla por script ausente.

- [x] **Step 2: Write minimal implementation**

Resolver la raíz desde `$PSScriptRoot`, filtrar nombres válidos, leer Markdown en UTF-8, serializar con `ConvertTo-Json` y escribir `reportes.js` sin BOM.

- [x] **Step 3: Run test to verify it passes**

Ejecutar el script, cargar el índice en el navegador y confirmar que aparece `2026-09-09` con su contenido y enlaces.

### Task 4: Automatización y verificación final

**Files:**
- Modify: tarea programada `Resumen diario` mediante la API de automaciones.

**Interfaces:**
- Consumes: automatización existente y `web-report/actualizar-indice.ps1`.
- Produces: ejecución diaria que escribe el reporte, regenera/verifica el índice y devuelve un enlace con la fecha.

- [x] **Step 1: Update the automation**

Preservar todos los campos y ampliar el prompt con rutas y condiciones exactas del flujo nuevo.

- [x] **Step 2: Verify files and behavior**

Ejecutar las pruebas, comprobar el redirect con y sin consulta, revisar la página a anchura desktop y móvil, y consultar la automatización actualizada.

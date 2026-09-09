# Reporting diario

Visor local para presentar reportes diarios escritos en Markdown. Funciona abriendo `index.html` con doble clic: no necesita Node.js, npm, servidor web ni dependencias externas.

## Funcionalidad

- Descubre los reportes guardados como `AAAA-MM-DD/resumen-matutino.md`.
- Permite abrir una fecha directamente con `index.html?fecha=AAAA-MM-DD`.
- Carga el reporte del día al entrar sin parámetros.
- Si el reporte de hoy todavía no existe, muestra el último anterior y mantiene el aviso `FALTA REPORTE DE HOY` en la cabecera.
- Formatea títulos, listas, enlaces, tablas, citas y bloques de código.
- Incluye diseño responsive y estilos de impresión.

## Instalación en un PC nuevo

Requisitos:

- Windows 10 u 11.
- Git.
- PowerShell 5.1 o posterior.
- Chrome, Edge u otro navegador moderno.

Clona el repositorio privado:

```powershell
git clone https://github.com/jbellido-paymatico/reporting-diario.git
Set-Location .\reporting-diario
```

Para probarlo con el reporte ficticio incluido:

```powershell
New-Item -ItemType Directory -Path '.\2026-01-15' -Force
Copy-Item '.\examples\resumen-matutino.md' '.\2026-01-15\resumen-matutino.md'
& '.\web-report\actualizar-indice.ps1'
Start-Process '.\index.html'
```

El archivo `web-report/reportes.js` se crea localmente y no se versiona porque contiene el texto completo de los reportes.

## Uso diario

Cada ejecución debe:

1. Crear una carpeta con la fecha local: `AAAA-MM-DD`.
2. Guardar el reporte como `resumen-matutino.md`.
3. Ejecutar:

   ```powershell
   & '.\web-report\actualizar-indice.ps1'
   ```

4. Abrir `index.html` o compartir una ruta como `index.html?fecha=2026-01-15`.

El generador recorre todas las carpetas de fecha de la raíz y reconstruye el índice completo en orden descendente.

## Tarea programada

La configuración, el prompt portable y el procedimiento de migración están en [docs/TAREA-PROGRAMADA.md](docs/TAREA-PROGRAMADA.md). La tarea debe ejecutarse en modo local para que escriba en el clon principal y actualice el índice que abre el usuario.

## Pruebas

Abre `web-report/tests.html` con doble clic. El resultado esperado es `8/8 pruebas superadas`.

Las pruebas cubren selección explícita, carga del día actual, fallback, fecha inexistente, seguridad del Markdown y estados visibles de la interfaz.

## Estructura

```text
reporting-diario/
├── index.html                         Lanzador que conserva ?fecha=...
├── web-report/
│   ├── index.html                     Interfaz del visor
│   ├── app.js                         Selección y renderizado
│   ├── styles.css                     Diseño responsive
│   ├── actualizar-indice.ps1          Generador del índice local
│   └── tests.html                     Suite de navegador
├── examples/
│   └── resumen-matutino.md            Ejemplo anonimizado
├── automation/
│   └── resumen-diario-prompt.md        Prompt portable
└── docs/
    └── TAREA-PROGRAMADA.md             Guía de recreación
```

## Privacidad

Las carpetas con fecha y el índice generado están ignorados por Git. Antes de cambiar `.gitignore`, ten en cuenta que pueden contener correos, reuniones, incidencias y enlaces internos.


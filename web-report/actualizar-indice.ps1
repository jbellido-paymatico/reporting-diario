[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$reportingRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $PSScriptRoot 'reportes.js'

$reports = @(
    Get-ChildItem -LiteralPath $reportingRoot -Directory |
        Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}$' } |
        Sort-Object Name -Descending |
        ForEach-Object {
            $reportPath = Join-Path $_.FullName 'resumen-matutino.md'
            if (Test-Path -LiteralPath $reportPath -PathType Leaf) {
                [PSCustomObject]@{
                    fecha = $_.Name
                    contenido = Get-Content -LiteralPath $reportPath -Raw -Encoding UTF8
                }
            }
        }
)

$json = ConvertTo-Json -InputObject $reports -Depth 4 -Compress
$javascript = "window.REPORTES = $json;`n"
$utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($outputPath, $javascript, $utf8WithoutBom)

Write-Output "Índice actualizado: $($reports.Count) reporte(s) en $outputPath"

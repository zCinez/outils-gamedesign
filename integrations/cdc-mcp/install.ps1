$ErrorActionPreference = 'Stop'
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
$codexExecutable = (Get-Command codex -ErrorAction Stop).Source
$serverPath = Join-Path $PSScriptRoot 'server.mjs'
Push-Location $PSScriptRoot
try {
    & npm.cmd ci --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw 'Installation des dépendances impossible.' }
    & $codexExecutable mcp add neodium-cdc -- $nodeExecutable $serverPath
    if ($LASTEXITCODE -ne 0) { throw 'Configuration MCP impossible.' }
    Write-Host 'Connecteur Neodium CDC installé. Redémarrez les serveurs MCP dans Codex puis utilisez cdc_connect.'
} finally { Pop-Location }

$ErrorActionPreference = "Stop"

$stateFile = Join-Path $env:TEMP "neodium-outils-gamedesign-preview.json"

if (-not (Test-Path -LiteralPath $stateFile)) {
  Write-Host "Aucun apercu local actif."
  exit 0
}

try {
  $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
} catch {
  Remove-Item -LiteralPath $stateFile -Force -ErrorAction SilentlyContinue
  Write-Host "Etat d'aperçu corrompu nettoye."
  exit 0
}

$process = Get-Process -Id $state.pid -ErrorAction SilentlyContinue

if ($process) {
  Stop-Process -Id $state.pid -Force
  Write-Host "Apercu local arrete (port $($state.port))."
} else {
  Write-Host "Le serveur n'etait plus en cours."
}

Remove-Item -LiteralPath $stateFile -Force -ErrorAction SilentlyContinue

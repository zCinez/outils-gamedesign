$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$stateFile = Join-Path $env:TEMP "neodium-outils-gamedesign-preview.json"
$preferredPorts = 8000..8010

function Test-PortAvailable {
  param([int]$Port)

  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

function Get-FreePort {
  foreach ($candidate in $preferredPorts) {
    if (Test-PortAvailable -Port $candidate) {
      return $candidate
    }
  }

  throw "Aucun port libre n'a ete trouve entre 8000 et 8010."
}

function Get-ExistingState {
  if (-not (Test-Path -LiteralPath $stateFile)) {
    return $null
  }

  try {
    return Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
  } catch {
    Remove-Item -LiteralPath $stateFile -Force -ErrorAction SilentlyContinue
    return $null
  }
}

function Save-State {
  param(
    [int]$ProcessId,
    [int]$Port
  )

  @{
    pid = $ProcessId
    port = $Port
  } | ConvertTo-Json | Set-Content -LiteralPath $stateFile
}

$existingState = Get-ExistingState

if ($existingState) {
  $existingProcess = Get-Process -Id $existingState.pid -ErrorAction SilentlyContinue
  if ($existingProcess) {
    $existingUrl = "http://127.0.0.1:$($existingState.port)/index.html"
    Start-Process $existingUrl | Out-Null
    Write-Host "Apercu local deja lance : $existingUrl"
    exit 0
  }

  Remove-Item -LiteralPath $stateFile -Force -ErrorAction SilentlyContinue
}

$port = Get-FreePort
$url = "http://127.0.0.1:$port/index.html"

$process = Start-Process `
  -FilePath "py" `
  -ArgumentList "-m", "http.server", $port, "--bind", "127.0.0.1" `
  -WorkingDirectory $projectRoot `
  -WindowStyle Hidden `
  -PassThru

Start-Sleep -Milliseconds 900

if ($process.HasExited) {
  throw "Le serveur local n'a pas pu demarrer."
}

Save-State -ProcessId $process.Id -Port $port
Start-Process $url | Out-Null

Write-Host "Apercu local lance : $url"
Write-Host "Pour l'arreter : .\stop-preview-local.ps1"

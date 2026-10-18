$ErrorActionPreference = 'Stop'
$wrapperDirectory = Join-Path $PSScriptRoot '..\android\gradle\wrapper'
$wrapperPath = Join-Path $wrapperDirectory 'gradle-wrapper.jar'
$expectedHash = '81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f'

if (!(Test-Path -LiteralPath $wrapperPath)) {
    $null = New-Item -ItemType Directory -Path $wrapperDirectory -Force
    $temporaryPath = Join-Path $wrapperDirectory 'gradle-wrapper.jar.download'
    try {
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 60 -Uri 'https://raw.githubusercontent.com/gradle/gradle/v8.13.0/gradle/wrapper/gradle-wrapper.jar' -OutFile $temporaryPath
        if ((Get-FileHash -LiteralPath $temporaryPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
            throw 'Le fichier Gradle telecharge ne correspond pas a son empreinte officielle.'
        }
        Move-Item -LiteralPath $temporaryPath -Destination $wrapperPath
    } finally {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath
        }
    }
}
if ((Get-FileHash -LiteralPath $wrapperPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
    throw 'Empreinte du wrapper Gradle incorrecte.'
}
Write-Output 'Wrapper Gradle 8.13 verifie.'

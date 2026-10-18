param(
    [ValidateSet('debug', 'release')]
    [string]$Variant = 'debug',
    [string]$JavaHome = ''
)

$ErrorActionPreference = 'Stop'
if ($JavaHome) {
    $env:JAVA_HOME = $JavaHome
}
$androidDirectory = Join-Path $PSScriptRoot 'android'
$configScript = Join-Path $PSScriptRoot 'scripts\android-config.cjs'
& node $configScript check
if ($LASTEXITCODE -ne 0) {
    throw 'Configure l adresse du site avant de construire l application.'
}
$sdkDirectory = $env:ANDROID_HOME
if (!$sdkDirectory) { $sdkDirectory = $env:ANDROID_SDK_ROOT }
if (!$sdkDirectory) { $sdkDirectory = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (!(Test-Path -LiteralPath (Join-Path $sdkDirectory 'platforms\android-36\android.jar'))) {
    throw 'SDK Android absent. Installe Android Studio et Android SDK Platform 36 (voir mobile/README.md).'
}
$env:ANDROID_HOME = $sdkDirectory
if (!$env:JAVA_HOME -and (Test-Path -LiteralPath 'C:\Program Files\Android\Android Studio\jbr\bin\java.exe')) {
    $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
}
& (Join-Path $PSScriptRoot 'scripts\bootstrap-gradle.ps1')
Push-Location $androidDirectory
try {
    $buildTask = if ($Variant -eq 'debug') { 'assembleDebug' } else { 'assembleRelease' }
    $lintTask = if ($Variant -eq 'debug') { 'lintDebug' } else { 'lintRelease' }
    & .\gradlew.bat --no-daemon $buildTask $lintTask
    if ($LASTEXITCODE -ne 0) { throw 'La compilation Android a echoue.' }
    Write-Output "APK disponible dans mobile/android/app/build/outputs/apk/$Variant/"
    if ($Variant -eq 'release') {
        Write-Output 'Ce build release est non signe. Utilise Generate Signed App Bundle / APK dans Android Studio pour le distribuer.'
    }
} finally {
    Pop-Location
}

param(
  [switch]$Aab = $true,
  [switch]$Apk
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$propsPath = Join-Path $root "android/keystore.properties"
if (-not (Test-Path $propsPath)) {
  throw "Missing android/keystore.properties. Run scripts/create-android-keystore.ps1 first."
}

$gradlew = Join-Path $root "android/gradlew.bat"
if (-not (Test-Path $gradlew)) {
  throw "Missing gradlew.bat in android/."
}

$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run cap:sync:android | Out-Host

Push-Location (Join-Path $root "android")
try {
  if ($Aab) {
    & .\gradlew.bat bundleRelease
    Write-Host "AAB: android/app/build/outputs/bundle/release/app-release.aab"
  }
  if ($Apk) {
    & .\gradlew.bat assembleRelease
    Write-Host "APK: android/app/build/outputs/apk/release/app-release.apk"
  }
}
finally {
  Pop-Location
}
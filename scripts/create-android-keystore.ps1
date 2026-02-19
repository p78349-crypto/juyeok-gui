param(
  [string]$KeystorePath = "android/release-keystore/juyeok-release.jks",
  [string]$Alias = "juyeok",
  [string]$Dname = "CN=juyeok, OU=mobile, O=juyeok, L=Seoul, ST=Seoul, C=KR"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  throw "keytool not found. Install JDK or use Android Studio embedded JDK and add keytool to PATH."
}

$target = Join-Path $root $KeystorePath
$targetDir = Split-Path $target -Parent
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

if (Test-Path $target) {
  throw "Keystore already exists: $target"
}

$plain = [Runtime.InteropServices.Marshal]::PtrToStringUni(
  [Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode(
    (Read-Host "Keystore password" -AsSecureString)
  )
)

if ([string]::IsNullOrWhiteSpace($plain)) {
  throw "Password cannot be empty."
}

& $keytool.Source -genkeypair -v -storetype JKS -keystore $target -alias $Alias -keyalg RSA -keysize 2048 -validity 10000 -storepass $plain -keypass $plain -dname $Dname

$props = @(
  "storeFile=../release-keystore/juyeok-release.jks"
  "storePassword=$plain"
  "keyAlias=$Alias"
  "keyPassword=$plain"
)

Set-Content -Path (Join-Path $root "android/keystore.properties") -Value $props -Encoding UTF8
Write-Host "Created keystore and android/keystore.properties"
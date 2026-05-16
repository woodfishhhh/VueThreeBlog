param(
  [string]$Remote = "jdcloud-blog",
  [string]$RemoteRoot = "/opt/muyu-image-bed",
  [string]$Domain = "img.woodfish.site",
  [string]$ExpectedIp = "36.151.148.198",
  [string]$BaseUrl = "https://img.woodfish.site",
  [string]$ProbeFile = "",
  [string]$Token = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-CheckedNative {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath failed with exit code $LASTEXITCODE"
  }
}

Write-Host "== 1/4 pre-check (remote cutover status)"
Invoke-CheckedNative ssh $Remote "$RemoteRoot/check-cutover-status.sh || true"

Write-Host "== 2/4 finalize DNS/TLS (idempotent)"
Invoke-CheckedNative ssh $Remote "EXPECTED_IP='$ExpectedIp' DOMAIN='$Domain' $RemoteRoot/finalize-dns-tls.sh"

Write-Host "== 3/4 strict public health check"
Invoke-CheckedNative curl.exe "-fsS" "$BaseUrl/api/health"

Write-Host "== 4/4 optional public upload smoke"
if (-not [string]::IsNullOrWhiteSpace($Token) -and -not [string]::IsNullOrWhiteSpace($ProbeFile)) {
  if (-not (Test-Path -LiteralPath $ProbeFile)) {
    throw "probe file not found: $ProbeFile"
  }

  $uploadResp = & curl.exe -fsS `
    -H "Authorization: Bearer $Token" `
    -F "file=@$ProbeFile" `
    "$BaseUrl/api/upload"
  if ($LASTEXITCODE -ne 0) {
    throw "upload failed"
  }

  $uploadJson = $uploadResp | ConvertFrom-Json
  $imageId = [string]$uploadJson.id
  $publicUrl = [string]$uploadJson.url
  if ([string]::IsNullOrWhiteSpace($imageId) -or [string]::IsNullOrWhiteSpace($publicUrl)) {
    throw "upload response missing id/url"
  }

  Invoke-CheckedNative curl.exe "-fsS" "$publicUrl" "-o" "$env:TEMP\\muyu-wave5-close-check.bin"
  Invoke-CheckedNative curl.exe "-fsS" "-X" "DELETE" "-H" "Authorization: Bearer $Token" "$BaseUrl/api/images/$imageId"
  Write-Host "smoke passed: $publicUrl"
} else {
  Write-Host "skip smoke (set -Token and -ProbeFile to enable)"
}

Write-Host "wave5 close check done"

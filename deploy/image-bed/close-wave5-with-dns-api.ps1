param(
  [string]$ExpectedIp = "36.151.148.198",
  [string]$RootDomain = "woodfish.site",
  [string]$HostRecord = "img",
  [string]$RemoteMetadataHost = "jdcloud-blog",
  [string]$ProbeFile = "",
  [string]$Token = "",
  [string]$AccessKeyId = "",
  [string]$SecretAccessKey = "",
  [string]$SessionToken = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not [string]::IsNullOrWhiteSpace($AccessKeyId)) {
  $env:JDCLOUD_ACCESS_KEY_ID = $AccessKeyId
}
if (-not [string]::IsNullOrWhiteSpace($SecretAccessKey)) {
  $env:JDCLOUD_SECRET_ACCESS_KEY = $SecretAccessKey
}
if (-not [string]::IsNullOrWhiteSpace($SessionToken)) {
  $env:JDCLOUD_SESSION_TOKEN = $SessionToken
}
if (-not [string]::IsNullOrWhiteSpace($RemoteMetadataHost)) {
  $env:JDCLOUD_METADATA_SSH_HOST = $RemoteMetadataHost
}

if ([string]::IsNullOrWhiteSpace($env:JDCLOUD_ACCESS_KEY_ID) -or [string]::IsNullOrWhiteSpace($env:JDCLOUD_SECRET_ACCESS_KEY)) {
  Write-Warning "No explicit JDCLOUD_ACCESS_KEY_ID/JDCLOUD_SECRET_ACCESS_KEY found. Will fallback to metadata instance-role credentials if available."
}

Write-Host "== 1/2 upsert DNS via JDCloud OpenAPI"
$dnsArgs = @(
  "--domain", $RootDomain,
  "--rr", $HostRecord,
  "--type", "A",
  "--value", $ExpectedIp
)
if (-not [string]::IsNullOrWhiteSpace($env:JDCLOUD_ACCESS_KEY_ID) -and -not [string]::IsNullOrWhiteSpace($env:JDCLOUD_SECRET_ACCESS_KEY)) {
  $dnsArgs += @("--ak", $env:JDCLOUD_ACCESS_KEY_ID, "--sk", $env:JDCLOUD_SECRET_ACCESS_KEY)
}
if (-not [string]::IsNullOrWhiteSpace($env:JDCLOUD_SESSION_TOKEN)) {
  $dnsArgs += @("--token", $env:JDCLOUD_SESSION_TOKEN)
}
& powershell -ExecutionPolicy Bypass -File "$PSScriptRoot/jdcloud-dns-upsert.ps1" @dnsArgs
if ($LASTEXITCODE -ne 0) {
  throw "jdcloud-dns-upsert failed with exit code $LASTEXITCODE"
}

Write-Host "== 2/2 finalize + strict checks"
if (-not [string]::IsNullOrWhiteSpace($Token) -and -not [string]::IsNullOrWhiteSpace($ProbeFile)) {
  & powershell -ExecutionPolicy Bypass -File "$PSScriptRoot/close-wave5-after-dns.ps1" `
    -ExpectedIp $ExpectedIp `
    -Token $Token `
    -ProbeFile $ProbeFile
} else {
  & powershell -ExecutionPolicy Bypass -File "$PSScriptRoot/close-wave5-after-dns.ps1" `
    -ExpectedIp $ExpectedIp
}
if ($LASTEXITCODE -ne 0) {
  throw "close-wave5-after-dns failed with exit code $LASTEXITCODE"
}

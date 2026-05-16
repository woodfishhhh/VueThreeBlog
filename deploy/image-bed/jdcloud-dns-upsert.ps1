param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ArgsForward
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path (Join-Path $PSScriptRoot "..") "..")
Push-Location $root
$exitCode = 0
try {
  node deploy/image-bed/jdcloud-dns-upsert.cjs @ArgsForward
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
}
if ($exitCode -ne 0) {
  exit $exitCode
}

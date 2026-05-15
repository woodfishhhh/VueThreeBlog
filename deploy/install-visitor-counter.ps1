param(
  [string]$Remote = $env:DEPLOY_REMOTE,
  [string]$ServiceDir = $env:DEPLOY_VISITOR_COUNTER_DIR,
  [string]$UnitPath = $env:DEPLOY_VISITOR_COUNTER_UNIT_PATH
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Remote)) {
  $Remote = "root@36.151.148.198"
}

if ([string]::IsNullOrWhiteSpace($ServiceDir)) {
  $ServiceDir = "/opt/blog-stack/services/visitor-counter"
}

if ([string]::IsNullOrWhiteSpace($UnitPath)) {
  $UnitPath = "/etc/systemd/system/visitor-counter.service"
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$deployId = Get-Date -Format "yyyyMMddHHmmss"
$remoteScript = "/tmp/visitor-counter-$deployId.py"
$remoteUnit = "/tmp/visitor-counter-$deployId.service"
$sshOptions = @("-o", "StrictHostKeyChecking=accept-new")

function Invoke-CheckedNative {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath failed with exit code $LASTEXITCODE"
  }
}

function ConvertTo-BashSingleQuoted {
  param([Parameter(Mandatory = $true)][string]$Value)
  return "'" + $Value.Replace("'", "'\''") + "'"
}

Push-Location $projectRoot
try {
  Write-Host "==> 1. Upload visitor counter service artifacts..."
  Invoke-CheckedNative scp @sshOptions "server/visitor-counter.py" "${Remote}:$remoteScript"
  Invoke-CheckedNative scp @sshOptions "deploy/visitor-counter.service" "${Remote}:$remoteUnit"

  Write-Host "==> 2. Install / restart visitor counter service..."
  $remoteEnv = @(
    "SERVICE_DIR=$(ConvertTo-BashSingleQuoted $ServiceDir)",
    "UNIT_PATH=$(ConvertTo-BashSingleQuoted $UnitPath)",
    "REMOTE_SCRIPT=$(ConvertTo-BashSingleQuoted $remoteScript)",
    "REMOTE_UNIT=$(ConvertTo-BashSingleQuoted $remoteUnit)"
  ) -join " "

  $remoteScriptBody = @'
set -euo pipefail

case "$SERVICE_DIR" in
  /opt/blog-stack/services/*) ;;
  *) echo "Refusing unsafe service dir: $SERVICE_DIR" >&2; exit 2 ;;
esac

case "$UNIT_PATH" in
  /etc/systemd/system/*) ;;
  *) echo "Refusing unsafe unit path: $UNIT_PATH" >&2; exit 3 ;;
esac

mkdir -p "$SERVICE_DIR" "$SERVICE_DIR/data"
install -m 0644 "$REMOTE_SCRIPT" "$SERVICE_DIR/visitor-counter.py"
install -m 0644 "$REMOTE_UNIT" "$UNIT_PATH"

systemctl daemon-reload
systemctl enable --now visitor-counter
systemctl restart visitor-counter

python3 - <<'PY'
import urllib.request
payload = urllib.request.urlopen("http://127.0.0.1:3011/api/visitor-count", timeout=5).read()
print(payload.decode("utf-8"))
PY

rm -f "$REMOTE_SCRIPT" "$REMOTE_UNIT"
'@

  $remoteScriptBody | & ssh @sshOptions $Remote "$remoteEnv bash -se"
  if ($LASTEXITCODE -ne 0) {
    throw "remote install failed with exit code $LASTEXITCODE"
  }

  Write-Host "==> Visitor counter service installed on $Remote"
} finally {
  Pop-Location
}

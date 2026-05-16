param(
  [string]$RemoteMetadataHost = "jdcloud-blog",
  [int]$PollSeconds = 60,
  [int]$MaxAttempts = 120,
  [string]$LogFile = "",
  [string]$ExpectedIp = "36.151.148.198",
  [string]$RootDomain = "woodfish.site",
  [string]$HostRecord = "img",
  [string]$ProbeFile = "",
  [string]$Token = "",
  [string]$AccessKeyId = "",
  [string]$SecretAccessKey = "",
  [string]$SessionToken = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Log([string]$Message) {
  $line = "{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Write-Host $line
  if (-not [string]::IsNullOrWhiteSpace($LogFile)) {
    Add-Content -LiteralPath $LogFile -Value $line
  }
}

function LogWarn([string]$Message) {
  Log "[WARN] $Message"
}

function Has-ExplicitCreds {
  if (-not [string]::IsNullOrWhiteSpace($AccessKeyId) -and -not [string]::IsNullOrWhiteSpace($SecretAccessKey)) {
    return $true
  }
  if (-not [string]::IsNullOrWhiteSpace($env:JDCLOUD_ACCESS_KEY_ID) -and -not [string]::IsNullOrWhiteSpace($env:JDCLOUD_SECRET_ACCESS_KEY)) {
    return $true
  }
  return $false
}

function Test-RemoteRoleCredsReady {
  if ([string]::IsNullOrWhiteSpace($RemoteMetadataHost)) {
    return $false
  }

  $remote = "curl -sS -m 8 http://169.254.169.254/metadata/latest/iam/instance-role-security-credentials"
  $raw = & ssh $RemoteMetadataHost $remote 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($raw)) {
    return $false
  }

  try {
    $obj = $raw | ConvertFrom-Json
    $code = [string]$obj.Code
    $ak = [string]$obj.accessKey
    $sk = [string]$obj.secretKey
    if ($code -eq "success" -and -not [string]::IsNullOrWhiteSpace($ak) -and -not [string]::IsNullOrWhiteSpace($sk)) {
      return $true
    }
    return $false
  } catch {
    return $false
  }
}

if ($PollSeconds -lt 5) {
  throw "PollSeconds must be >= 5"
}
if ($MaxAttempts -lt 1) {
  throw "MaxAttempts must be >= 1"
}

for ($i = 1; $i -le $MaxAttempts; $i++) {
  Log "[$i/$MaxAttempts] probing authority path..."
  $ready = (Has-ExplicitCreds) -or (Test-RemoteRoleCredsReady)
  if (-not $ready) {
    if ($i -lt $MaxAttempts) {
      Start-Sleep -Seconds $PollSeconds
      continue
    }
    LogWarn "Authority not ready after $MaxAttempts attempts (no AK/SK and no usable instance-role creds)."
    throw "Authority not ready after $MaxAttempts attempts (no AK/SK and no usable instance-role creds)."
  }

  Log "authority ready -> running close-wave5-with-dns-api"
  $args = @(
    "-ExpectedIp", $ExpectedIp,
    "-RootDomain", $RootDomain,
    "-HostRecord", $HostRecord,
    "-RemoteMetadataHost", $RemoteMetadataHost
  )
  if (-not [string]::IsNullOrWhiteSpace($ProbeFile)) {
    $args += @("-ProbeFile", $ProbeFile)
  }
  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $args += @("-Token", $Token)
  }
  if (-not [string]::IsNullOrWhiteSpace($AccessKeyId)) {
    $args += @("-AccessKeyId", $AccessKeyId)
  }
  if (-not [string]::IsNullOrWhiteSpace($SecretAccessKey)) {
    $args += @("-SecretAccessKey", $SecretAccessKey)
  }
  if (-not [string]::IsNullOrWhiteSpace($SessionToken)) {
    $args += @("-SessionToken", $SessionToken)
  }

  & powershell -ExecutionPolicy Bypass -File "$PSScriptRoot/close-wave5-with-dns-api.ps1" @args
  if ($LASTEXITCODE -ne 0) {
    if ($i -lt $MaxAttempts) {
      LogWarn "close-wave5-with-dns-api failed (exit=$LASTEXITCODE), will retry after $PollSeconds seconds."
      Start-Sleep -Seconds $PollSeconds
      continue
    }
    LogWarn "close-wave5-with-dns-api failed with exit code $LASTEXITCODE"
    throw "close-wave5-with-dns-api failed with exit code $LASTEXITCODE"
  }

  Log "running section43 audit..."
  & powershell -ExecutionPolicy Bypass -File "$PSScriptRoot/section43-audit.ps1"
  if ($LASTEXITCODE -eq 0) {
    Log "Section 43 gate satisfied."
    exit 0
  }

  if ($i -lt $MaxAttempts) {
    LogWarn "Section43 still blocked (exit=$LASTEXITCODE), will retry after $PollSeconds seconds."
    Start-Sleep -Seconds $PollSeconds
    continue
  }
  LogWarn "Section43 still blocked after $MaxAttempts attempts."
  throw "Section43 still blocked after $MaxAttempts attempts."
}

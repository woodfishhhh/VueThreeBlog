param(
  [string]$RemoteMetadataHost = "jdcloud-blog",
  [string]$MetadataPath = "http://169.254.169.254/metadata/latest/iam/instance-role-security-credentials"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Redact([string]$s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return "" }
  if ($s.Length -le 8) { return "***" }
  return $s.Substring(0,4) + "***" + $s.Substring($s.Length-4)
}

function ReadJsonField($obj, [string]$name) {
  if ($null -eq $obj) { return "" }
  if ($obj -is [hashtable]) {
    if ($obj.ContainsKey($name)) { return [string]$obj[$name] }
    return ""
  }
  $prop = $obj.PSObject.Properties[$name]
  if ($null -ne $prop) { return [string]$prop.Value }
  return ""
}

Write-Host "== image-bed auth status =="
Write-Host "RemoteMetadataHost: $RemoteMetadataHost"
Write-Host "MetadataPath: $MetadataPath"
Write-Host ""

$ak = [string]$env:JDCLOUD_ACCESS_KEY_ID
$sk = [string]$env:JDCLOUD_SECRET_ACCESS_KEY
$st = [string]$env:JDCLOUD_SESSION_TOKEN

if (-not [string]::IsNullOrWhiteSpace($ak) -and -not [string]::IsNullOrWhiteSpace($sk)) {
  Write-Host ("[PASS] explicit env creds present: AK={0} SK={1}" -f (Redact $ak), (Redact $sk))
  if (-not [string]::IsNullOrWhiteSpace($st)) {
    Write-Host ("[INFO] session token present: {0}" -f (Redact $st))
  }
} else {
  Write-Host "[FAIL] explicit env creds missing (JDCLOUD_ACCESS_KEY_ID / JDCLOUD_SECRET_ACCESS_KEY)"
}

Write-Host ""
Write-Host "== remote metadata probe =="
$raw = ""
try {
  $raw = (& ssh $RemoteMetadataHost "curl -sS -m 8 $MetadataPath" 2>$null).Trim()
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] ssh/curl failed"
  } else {
    Write-Host "raw: $raw"
    try {
      $jsonPayload = $raw
      $start = $raw.IndexOf("{")
      $end = $raw.LastIndexOf("}")
      if ($start -ge 0 -and $end -gt $start) {
        $jsonPayload = $raw.Substring($start, $end - $start + 1)
      }
      $parsed = $jsonPayload | ConvertFrom-Json
      if ($parsed -is [System.Array]) {
        $arr = @($parsed)
        if ($arr.Count -eq 0) {
          throw "remote metadata payload parsed to empty array"
        }
        $obj = $arr[0]
      } else {
        $obj = $parsed
      }

      $code = ReadJsonField $obj "Code"
      $rak = ReadJsonField $obj "accessKey"
      $rsk = ReadJsonField $obj "secretKey"
      $rst = ReadJsonField $obj "sessionToken"
      if ($code -eq "success" -and -not [string]::IsNullOrWhiteSpace($rak) -and -not [string]::IsNullOrWhiteSpace($rsk)) {
        Write-Host ("[PASS] remote metadata creds ready: AK={0} SK={1}" -f (Redact $rak), (Redact $rsk))
        if (-not [string]::IsNullOrWhiteSpace($rst)) {
          Write-Host ("[INFO] remote session token present: {0}" -f (Redact $rst))
        }
      } else {
        Write-Host "[FAIL] remote metadata creds not ready"
      }
    } catch {
      Write-Host ("[FAIL] remote metadata response is not valid JSON: {0}" -f $_.Exception.Message)
    }
  }
} catch {
  Write-Host ("[FAIL] remote metadata probe exception: {0}" -f $_.Exception.Message)
}

Write-Host ""
Write-Host "== local daemon status =="
$daemon = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*await-auth-and-close.ps1*' }
if ($daemon) {
  $daemonList = @($daemon)
  Write-Host ("[PASS] daemon running count={0}" -f $daemonList.Count)
  $daemon | Select-Object ProcessId,Name,CommandLine | Format-Table -AutoSize
} else {
  Write-Host "[FAIL] daemon not running"
}

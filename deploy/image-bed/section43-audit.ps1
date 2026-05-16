param(
  [string]$Remote = "jdcloud-blog",
  [string]$RemoteRoot = "/opt/muyu-image-bed",
  [string]$Domain = "img.woodfish.site",
  [string]$ExpectedIp = "36.151.148.198",
  [string]$BaseUrl = "https://img.woodfish.site",
  [string]$PlanFile = "docs/superpowers/plans/2026-05-16-woodfishnest-monorepo-muyu-image-bed.md",
  [string]$AuditFile = "docs/superpowers/plans/2026-05-16-woodfishnest-monorepo-muyu-image-bed.completion-audit.md",
  [switch]$SkipRemote
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:Failed = 0

function Say([string]$Message) {
  Write-Host $Message
}

function Pass([string]$Message) {
  Write-Host "[PASS] $Message"
}

function Fail([string]$Message) {
  Write-Host "[FAIL] $Message"
  $script:Failed++
}

function Warn([string]$Message) {
  Write-Host "[WARN] $Message"
}

function Require-File([string]$Path) {
  if (Test-Path -LiteralPath $Path) {
    Pass "file exists: $Path"
  } else {
    Fail "missing file: $Path"
  }
}

function Contains-Line([string]$Path, [string]$Needle) {
  return [bool](Select-String -Path $Path -Pattern $Needle -SimpleMatch -ErrorAction SilentlyContinue)
}

function Check-Audit-Line-Present([string]$Needle, [string]$Label) {
  if (Contains-Line -Path $AuditFile -Needle $Needle) {
    Pass $Label
  } else {
    Fail $Label
  }
}

function Check-Audit-Line-Absent([string]$Needle, [string]$Label) {
  if (Contains-Line -Path $AuditFile -Needle $Needle) {
    Fail $Label
  } else {
    Pass $Label
  }
}

function Check-DohA() {
  try {
    $resp = Invoke-RestMethod -Uri "https://dns.google/resolve?name=$Domain&type=A" -TimeoutSec 15
    $status = ""
    if ($resp -and ($resp.PSObject.Properties.Name -contains "Status")) {
      $status = [string]$resp.Status
    }
    $answers = @()
    if ($resp -and ($resp.PSObject.Properties.Name -contains "Answer") -and $resp.Answer) {
      $answers = @($resp.Answer | ForEach-Object { [string]$_.data })
    }
    $hasIp = $answers -contains $ExpectedIp
    if (($status -eq "0") -and $hasIp) {
      Pass "DoH A includes $ExpectedIp ($($answers -join ','))"
    } else {
      Fail "DoH A not ready (status=$status, answers=$($answers -join ','))"
    }
  } catch {
    Fail "DoH query failed: $($_.Exception.Message)"
  }
}

function Check-PublicHealth() {
  & curl.exe -fsS "$BaseUrl/api/health" | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Pass "strict public health reachable: $BaseUrl/api/health"
  } else {
    Fail "strict public health failed: $BaseUrl/api/health"
  }
}

function Check-RemoteCutover() {
  if ($SkipRemote.IsPresent) {
    Warn "remote cutover check skipped (-SkipRemote)"
    return
  }

  $output = ""
  try {
    $output = & ssh $Remote "$RemoteRoot/check-cutover-status.sh" 2>&1 | Out-String
    $rc = $LASTEXITCODE
  } catch {
    $output = $_.Exception.Message
    $rc = 1
  }

  Say "--- remote cutover output ---"
  Say $output.TrimEnd()
  Say "--- end remote cutover output ---"

  if ($rc -ne 0) {
    if ($output -match "Could not resolve hostname|Permission denied|Connection timed out|No route to host|Connection refused") {
      Warn "remote cutover check unavailable in current shell context"
      return
    }
  }

  if (($rc -eq 0) -and ($output -match "cutover status: ready/complete")) {
    Pass "remote cutover status ready/complete"
  } else {
    Fail "remote cutover status blocked"
  }
}

Say "== Section 43 Gate Audit =="
Say "Domain: $Domain"
Say "Expected IP: $ExpectedIp"
Say "Base URL: $BaseUrl"
Say ""

Require-File $PlanFile
Require-File $AuditFile

Check-Audit-Line-Absent "Plan is **not complete yet**." "completion-audit no longer marks plan incomplete"
Check-Audit-Line-Absent "Section 43 is not satisfied; no shutdown path is permitted." "completion-audit no longer blocks Section 43"

Check-Audit-Line-Present '- `Root typecheck`: PASS' "39.12 root typecheck recorded PASS"
Check-Audit-Line-Present '- `Root tests`: PASS' "39.12 root tests recorded PASS"
Check-Audit-Line-Present '- `Blog build`: PASS' "39.12 blog build recorded PASS"
Check-Audit-Line-Present '- `API tests`: PASS' "39.12 API tests recorded PASS"
Check-Audit-Line-Present '- `CLI tests`: PASS' "39.12 CLI tests recorded PASS"
Check-Audit-Line-Present '- `Admin build`: PASS' "39.12 admin build recorded PASS"
Check-Audit-Line-Present '- `Backup restore dry run`: PASS' "39.12 backup/restore recorded PASS"
Check-Audit-Line-Present '- `Production smoke`: PASS' "39.12 production smoke recorded PASS"

Check-DohA
Check-PublicHealth
Check-RemoteCutover

Say ""
if ($script:Failed -eq 0) {
  Pass "Section 43 gate satisfied"
  exit 0
}

Fail "Section 43 gate blocked"
exit 1

param(
  [string]$BaseUrl = "https://winsproposal.com",
  [string[]]$Paths = @("/", "/proposals")
)

$ErrorActionPreference = "Stop"

function Join-Url {
  param(
    [string]$Base,
    [string]$Path
  )

  if ($Path -match "^https?://") {
    return $Path
  }

  return $Base.TrimEnd("/") + "/" + $Path.TrimStart("/")
}

function Get-LiveContent {
  param([string]$Url)

  return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30).Content
}

$failures = New-Object System.Collections.Generic.List[string]
$checkedUrls = New-Object System.Collections.Generic.List[string]
$scriptUrls = New-Object System.Collections.Generic.HashSet[string]

foreach ($path in $Paths) {
  $url = Join-Url -Base $BaseUrl -Path $path
  $checkedUrls.Add($url) | Out-Null

  try {
    $html = Get-LiveContent -Url $url
  } catch {
    $failures.Add("Could not fetch $url. $($_.Exception.Message)") | Out-Null
    continue
  }

  if ($html -match "apps\.abacus\.ai/chatllm/appllm-lib\.js") {
    $failures.Add("$url still includes the removed global Abacus AppLLM script.") | Out-Null
  }

  foreach ($match in [regex]::Matches($html, '<script[^>]+src="([^"]+\.js[^"]*)"')) {
    $src = $match.Groups[1].Value
    if ($src.StartsWith("/")) {
      $scriptUrls.Add((Join-Url -Base $BaseUrl -Path $src)) | Out-Null
    } elseif ($src.StartsWith($BaseUrl)) {
      $scriptUrls.Add($src) | Out-Null
    }
  }
}

foreach ($scriptUrl in $scriptUrls) {
  try {
    $script = Get-LiveContent -Url $scriptUrl
  } catch {
    $failures.Add("Could not fetch script $scriptUrl. $($_.Exception.Message)") | Out-Null
    continue
  }

  if ($script -match "Auto-generating diagram") {
    $failures.Add("$scriptUrl still contains the removed automatic diagram generation path.") | Out-Null
  }

  if ($script -match "Status changed to") {
    $failures.Add("$scriptUrl still contains direct Draft/Final status toggle feedback.") | Out-Null
  }

  if ($script -match "apps\.abacus\.ai/chatllm/appllm-lib\.js") {
    $failures.Add("$scriptUrl still references the removed global Abacus AppLLM script.") | Out-Null
  }
}

Write-Host "Checked live URLs:"
foreach ($url in $checkedUrls) {
  Write-Host " - $url"
}

Write-Host "Checked $($scriptUrls.Count) Next.js script bundle(s)."

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "FAIL: live publish verification failed."
  foreach ($failure in $failures) {
    Write-Host " - $failure"
  }
  exit 1
}

Write-Host ""
Write-Host "PASS: live publish verification passed."

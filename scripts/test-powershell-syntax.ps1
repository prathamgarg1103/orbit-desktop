$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$scripts = @(
  "scripts\configure-vercel-production.ps1",
  "scripts\make-submission-bundle.ps1"
)

foreach ($relativePath in $scripts) {
  $path = Join-Path $repoRoot $relativePath
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$null, [ref]$errors) | Out-Null
  if ($errors.Count -gt 0) {
    $message = ($errors | ForEach-Object { "${relativePath}:$($_.Extent.StartLineNumber): $($_.Message)" }) -join [Environment]::NewLine
    throw $message
  }
}

Write-Host "PowerShell script syntax OK."

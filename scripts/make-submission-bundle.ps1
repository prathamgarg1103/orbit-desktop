param(
  [switch]$SkipReadinessCheck
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$packageJsonPath = Join-Path $repoRoot "package.json"
$packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
$version = $packageJson.version
$releaseUrl = "https://github.com/prathamgarg1103/orbit-desktop/releases/tag/v$version"
$downloadUrl = "https://github.com/prathamgarg1103/orbit-desktop/releases/download/v$version/Diya.$version.exe"
$publicSiteUrl = "https://diya-cloud.vercel.app"
$bundleRoot = Join-Path $repoRoot "dist\submission"
$bundleDir = Join-Path $bundleRoot "Diya-hackathon-submission"
$zipPath = Join-Path $bundleRoot "Diya-hackathon-submission.zip"
$exePath = Join-Path $repoRoot "dist\Diya $version.exe"

if (-not (Test-Path -LiteralPath $exePath)) {
  throw "Missing portable app artifact: $exePath. Run npm run dist first."
}

if (-not $SkipReadinessCheck) {
  Push-Location $repoRoot
  try {
    & "C:\Program Files\nodejs\npm.cmd" run submission:check
    if ($LASTEXITCODE -ne 0) {
      throw "Readiness check failed. Use -SkipReadinessCheck only when you intentionally want a bundle with known blockers."
    }
  } finally {
    Pop-Location
  }
}

if (Test-Path -LiteralPath $bundleDir) {
  Remove-Item -LiteralPath $bundleDir -Recurse -Force
}
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $bundleDir | Out-Null

$files = @(
  @{ Source = $exePath; Target = "Diya $version.exe" },
  @{ Source = Join-Path $repoRoot "SUBMISSION.md"; Target = "SUBMISSION.md" },
  @{ Source = Join-Path $repoRoot "DEMO_SCRIPT.md"; Target = "DEMO_SCRIPT.md" },
  @{ Source = Join-Path $repoRoot "HACKATHON_READINESS.md"; Target = "HACKATHON_READINESS.md" },
  @{ Source = Join-Path $repoRoot "BETA_LAUNCH_PLAN.md"; Target = "BETA_LAUNCH_PLAN.md" },
  @{ Source = Join-Path $repoRoot "PRIVACY.md"; Target = "PRIVACY.md" },
  @{ Source = Join-Path $repoRoot "RELEASE_NOTES_v$version.md"; Target = "RELEASE_NOTES_v$version.md" },
  @{ Source = Join-Path $repoRoot "README.md"; Target = "README.md" },
  @{ Source = Join-Path $repoRoot "LICENSE"; Target = "LICENSE" }
)

foreach ($file in $files) {
  if (-not (Test-Path -LiteralPath $file.Source)) {
    throw "Missing submission file: $($file.Source)"
  }
  Copy-Item -LiteralPath $file.Source -Destination (Join-Path $bundleDir $file.Target)
}

$commit = (& git -C $repoRoot log -1 --oneline).Trim()
$status = (& git -C $repoRoot status --short --branch).Trim()
$manifest = @(
  "# Diya hackathon submission bundle",
  "",
  "Version: $version",
  "Created: $((Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"))",
  "Commit: $commit",
  "Public site: $publicSiteUrl",
  "Release: $releaseUrl",
  "Windows beta download: $downloadUrl",
  "Repository status:",
  '```',
  $status,
  '```',
  "",
  "Contents:",
  "- Diya $version.exe",
  "- SUBMISSION.md",
  "- DEMO_SCRIPT.md",
  "- HACKATHON_READINESS.md",
  "- BETA_LAUNCH_PLAN.md",
  "- PRIVACY.md",
  "- RELEASE_NOTES_v$version.md",
  "- README.md",
  "- LICENSE"
)

Set-Content -LiteralPath (Join-Path $bundleDir "BUNDLE_MANIFEST.md") -Value $manifest -Encoding UTF8
Compress-Archive -LiteralPath $bundleDir -DestinationPath $zipPath -Force

Write-Host "Submission bundle created:"
Write-Host $zipPath

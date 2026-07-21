param(
  [switch]$IncludeOpenAIKey,
  [switch]$Redeploy
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$cloudRoot = Join-Path $repoRoot "cloud"
$npx = "C:\Program Files\nodejs\npx.cmd"

function ConvertFrom-SecureStringPlainText {
  param([Parameter(Mandatory = $true)][securestring]$Value)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Add-VercelSecret {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
  )

  Push-Location $cloudRoot
  try {
    & $npx vercel@56.3.1 env add $Name production --value $Value --yes --sensitive
    if ($LASTEXITCODE -ne 0) {
      throw "Could not add $Name. If it already exists, remove it in Vercel or run: npx vercel@56.3.1 env rm $Name production --yes"
    }
  } finally {
    Pop-Location
  }
}

Write-Host "Configuring Diya Cloud production secrets for Vercel."
Write-Host "Values are read locally and are not printed by this script."

$databaseUrlSecure = Read-Host "Paste Supabase Transaction pooler URL for DIYA_DATABASE_URL" -AsSecureString
$databaseUrl = ConvertFrom-SecureStringPlainText $databaseUrlSecure
if (-not $databaseUrl.StartsWith("postgresql://")) {
  throw "DIYA_DATABASE_URL must start with postgresql://"
}
if ($databaseUrl -notmatch "sslmode=require") {
  throw "DIYA_DATABASE_URL must include sslmode=require"
}

Add-VercelSecret -Name "DIYA_DATABASE_URL" -Value $databaseUrl
Write-Host "Added DIYA_DATABASE_URL."

if ($IncludeOpenAIKey) {
  $openAiKeySecure = Read-Host "Paste OPENAI_API_KEY" -AsSecureString
  $openAiKey = ConvertFrom-SecureStringPlainText $openAiKeySecure
  if ($openAiKey -notmatch "^sk-") {
    throw "OPENAI_API_KEY should look like an OpenAI API key."
  }
  Add-VercelSecret -Name "OPENAI_API_KEY" -Value $openAiKey
  Write-Host "Added OPENAI_API_KEY."
}

if ($Redeploy) {
  Push-Location $cloudRoot
  try {
    & $npx vercel@56.3.1 --prod --yes
    if ($LASTEXITCODE -ne 0) {
      throw "Vercel production deploy failed."
    }
  } finally {
    Pop-Location
  }
}

Write-Host "Done. Verify: https://diya-cloud.vercel.app/health"

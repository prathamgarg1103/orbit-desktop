param(
  [switch]$IncludeOpenAIKey,
  [switch]$Redeploy,
  [switch]$Verify,
  [switch]$BuildSupabaseUrlFromPassword,
  [switch]$SelfTest,
  [string]$SupabaseProjectRef = "vjhwyqujehvzvweyjnmr",
  [string]$SupabasePoolerHost = "aws-0-ap-south-1.pooler.supabase.com"
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
    $Value | & $npx vercel@56.3.1 env add $Name production --yes --sensitive --force
    if ($LASTEXITCODE -ne 0) {
      throw "Could not add $Name."
    }
  } finally {
    Pop-Location
  }
}

function New-SupabasePoolerUrl {
  param(
    [Parameter(Mandatory = $true)][string]$ProjectRef,
    [Parameter(Mandatory = $true)][string]$PoolerHost,
    [Parameter(Mandatory = $true)][string]$Password
  )

  if ($ProjectRef -notmatch "^[a-z0-9]+$") {
    throw "Supabase project ref should contain only lowercase letters and numbers."
  }
  if ($PoolerHost -notmatch "^[a-z0-9.-]+$") {
    throw "Supabase pooler host is not valid."
  }

  $encodedPassword = [System.Uri]::EscapeDataString($Password)
  return "postgresql://postgres.${ProjectRef}:$encodedPassword@${PoolerHost}:6543/postgres?sslmode=require"
}

function Test-DiyaCloudHealth {
  try {
    $response = Invoke-WebRequest -Uri "https://diya-cloud.vercel.app/health" -UseBasicParsing -TimeoutSec 30
    return $response.Content
  } catch {
    if ($_.Exception.Response) {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = [System.IO.StreamReader]::new($stream)
      return $reader.ReadToEnd()
    }
    return $_.Exception.Message
  }
}

if ($SelfTest) {
  $url = New-SupabasePoolerUrl -ProjectRef "abc123" -PoolerHost "aws-0-test.pooler.supabase.com" -Password "p@ss word!"
  $expected = "postgresql://postgres.abc123:p%40ss%20word!@aws-0-test.pooler.supabase.com:6543/postgres?sslmode=require"
  if ($url -ne $expected) {
    throw "Supabase pooler URL self-test failed."
  }
  Write-Host "configure-vercel-production self-test OK."
  exit 0
}

Write-Host "Configuring Diya Cloud production secrets for Vercel."
Write-Host "Values are read locally and are not printed by this script."

if ($BuildSupabaseUrlFromPassword) {
  Write-Host "Building DIYA_DATABASE_URL for Supabase project $SupabaseProjectRef through $SupabasePoolerHost."
  $databasePasswordSecure = Read-Host "Paste Supabase database password" -AsSecureString
  $databasePassword = ConvertFrom-SecureStringPlainText $databasePasswordSecure
  $databaseUrl = New-SupabasePoolerUrl -ProjectRef $SupabaseProjectRef -PoolerHost $SupabasePoolerHost -Password $databasePassword
} else {
  $databaseUrlSecure = Read-Host "Paste Supabase Transaction pooler URL for DIYA_DATABASE_URL" -AsSecureString
  $databaseUrl = ConvertFrom-SecureStringPlainText $databaseUrlSecure
}
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

if ($Verify) {
  Write-Host "Health response:"
  Write-Host (Test-DiyaCloudHealth)
}

Write-Host "Done. Verify: https://diya-cloud.vercel.app/health"

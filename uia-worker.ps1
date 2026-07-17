param(
  [int]$X,
  [int]$Y
)

$ErrorActionPreference = 'Stop'

try {
  Add-Type -AssemblyName UIAutomationClient
  Add-Type -AssemblyName UIAutomationTypes
  Add-Type -AssemblyName WindowsBase
  $point = New-Object System.Windows.Point($X, $Y)
  $element = [System.Windows.Automation.AutomationElement]::FromPoint($point)
  if ($null -eq $element) { '{}' ; exit 0 }

  $current = $element.Current
  $name = [string]$current.Name
  if ($current.IsPassword) { $name = 'password field' }
  if ($name.Length -gt 120) { $name = $name.Substring(0, 120) }
  [PSCustomObject]@{
    name = $name
    controlType = [string]$current.ControlType.ProgrammaticName
    automationId = ([string]$current.AutomationId).Substring(0, [Math]::Min(80, ([string]$current.AutomationId).Length))
  } | ConvertTo-Json -Compress
} catch {
  '{}'
}

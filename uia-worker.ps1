$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

try {
  [void](Add-Type -AssemblyName UIAutomationClient)
  [void](Add-Type -AssemblyName UIAutomationTypes)
  [void](Add-Type -AssemblyName WindowsBase)
} catch {
  [Console]::Out.WriteLine((@{ ready = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
  exit 1
}

[Console]::Out.WriteLine('{"ready":true}')
[Console]::Out.Flush()

while ($null -ne ($line = [Console]::In.ReadLine())) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  if ($line -eq "__ORBIT_EXIT__") { break }

  $request = $null
  try {
    $request = $line | ConvertFrom-Json
    $point = New-Object System.Windows.Point([double]$request.x, [double]$request.y)
    $element = [System.Windows.Automation.AutomationElement]::FromPoint($point)
    if ($null -eq $element) {
      $result = @{ id = $request.id; target = $null }
    } else {
      $value = $null
      $valuePattern = $null
      try {
        if ($element.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valuePattern)) {
          $value = $valuePattern.Current.Value
        }
      } catch { }
      $rect = $element.Current.BoundingRectangle
      $target = @{
        name = $element.Current.Name
        automationId = $element.Current.AutomationId
        controlType = $element.Current.ControlType.ProgrammaticName
        className = $element.Current.ClassName
        helpText = $element.Current.HelpText
        value = $value
        isPassword = $element.Current.IsPassword
        processId = $element.Current.ProcessId
        bounds = @{ x = [math]::Round($rect.X); y = [math]::Round($rect.Y); width = [math]::Round($rect.Width); height = [math]::Round($rect.Height) }
      }
      $result = @{ id = $request.id; target = $target }
    }
  } catch {
    $id = if ($null -ne $request) { $request.id } else { $null }
    $result = @{ id = $id; error = $_.Exception.Message }
  }
  [Console]::Out.WriteLine(($result | ConvertTo-Json -Compress -Depth 4))
  [Console]::Out.Flush()
}

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$app = Join-Path $workspace "app"
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$node = if (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { (Get-Command node -ErrorAction Stop).Source }
$major = [int]((& $node --version).TrimStart("v").Split(".")[0])
if ($major -lt 22) { throw "Node.js 22 or newer is required. Found $(& $node --version)." }

if (-not (Test-Path -LiteralPath (Join-Path $app "node_modules\vinext\dist\cli.js"))) {
  Write-Host "Installing local app dependencies..." -ForegroundColor Cyan
  $nodeBin = Split-Path -Parent $node
  $env:Path = "$nodeBin;$env:Path"
  & npm.cmd install --prefix $app
  if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed." }
}

$cli = Join-Path $app "node_modules\vinext\dist\cli.js"
$server = Start-Process -FilePath $node -ArgumentList @($cli, "dev") -WorkingDirectory $app -WindowStyle Hidden -PassThru
try {
  Write-Host "Starting Catalan Atelier..." -ForegroundColor Cyan
  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($server.HasExited) { throw "The local server stopped before it was ready." }
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  if (-not $ready) { throw "The local server did not become ready within 30 seconds." }
  Start-Process "http://localhost:3000"
  Write-Host ""
  Write-Host "Catalan Atelier is open at http://localhost:3000" -ForegroundColor Green
  Write-Host "Press Enter here when you want to stop it." -ForegroundColor DarkGray
  Read-Host | Out-Null
} finally {
  if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
}

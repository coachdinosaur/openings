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
  $npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source
  $npmCli = Join-Path (Split-Path -Parent $npmCommand) "node_modules\npm\bin\npm-cli.js"
  if (-not (Test-Path -LiteralPath $npmCli)) { throw "Could not locate npm's command-line script." }
  $nodeBin = Split-Path -Parent $node
  $env:Path = "$nodeBin;$env:Path"
  Push-Location $app
  try {
    & $node $npmCli install
    $installExitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
  if ($installExitCode -ne 0) { throw "Dependency installation failed." }
}

$patchScript = Join-Path $app "scripts\patch-vinext-static.mjs"
Write-Host "Checking Vinext Windows compatibility..." -ForegroundColor Cyan
Push-Location $app
try {
  & $node $patchScript
  $patchExitCode = $LASTEXITCODE
} finally {
  Pop-Location
}
if ($patchExitCode -ne 0) { throw "The Vinext Windows compatibility patch failed." }

$cli = Join-Path $app "node_modules\vinext\dist\cli.js"
Write-Host "Building the local app..." -ForegroundColor Cyan
Push-Location $app
try {
  & $node $cli build
  $buildExitCode = $LASTEXITCODE
} finally {
  Pop-Location
}
if ($buildExitCode -ne 0) { throw "The local app build failed." }

Write-Host "Starting Catalan Atelier at http://127.0.0.1:3000 ..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C in this window when you want to stop it." -ForegroundColor DarkGray
Push-Location $app
try {
  # Keep Vinext attached to this interactive PowerShell session. Its RSC
  # worker relies on the live console and does not serve correctly when
  # detached with Start-Process on Windows.
  & $node $cli start
} finally {
  Pop-Location
}

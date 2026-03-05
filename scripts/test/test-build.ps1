# 2D Formula Visualization - Build Test Script
# This script tests the build-all.js script functionality

Write-Host "2D Formula Visualization - Build Test Script"
Write-Host "==============================================="
Write-Host ""

# Set working directory
Set-Location "$PSScriptRoot"

# Check if Node.js is installed
Write-Host "Checking Node.js..."
try {
    $nodeVersion = node -v
    Write-Host "Node.js found: $nodeVersion"
} catch {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js first."
    Write-Host "Download: https://nodejs.org/"
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm..."
try {
    $npmVersion = npm -v
    Write-Host "npm found: $npmVersion"
} catch {
    Write-Host "ERROR: npm not found!" -ForegroundColor Red
    Write-Host "Please install npm first."
    exit 1
}

# Run the build script
Write-Host ""
Write-Host "Running build-all.js..."
Write-Host "==============================================="

# Run web-only build for testing
node build-all.js --web

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

# Delete dist folder
Write-Host ""
Write-Host "Cleaning up dist folder..."
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "dist folder deleted."
} else {
    Write-Host "dist folder not found, skipping."
}

# Get the latest build folder
Write-Host ""
Write-Host "==============================================="
Write-Host "Build Summary"
Write-Host "==============================================="
Write-Host ""

$latestBuild = Get-ChildItem -Path "build-output" -Directory | Where-Object { $_.Name -like "v1.0.0*" } | Sort-Object -Property LastWriteTime -Descending | Select-Object -First 1

if (-not $latestBuild) {
    Write-Host "ERROR: No build output found!" -ForegroundColor Red
    exit 1
}

Write-Host "Latest build: $($latestBuild.Name)"
Write-Host "Output directory: $($latestBuild.FullName)"
Write-Host ""

# Check which platforms were built
if (Test-Path "$($latestBuild.FullName)\web") {
    Write-Host "[OK] Web version: $($latestBuild.FullName)\web\" -ForegroundColor Green
} else {
    Write-Host "[SKIP] Web version not built" -ForegroundColor Yellow
}

if (Test-Path "$($latestBuild.FullName)\windows") {
    Write-Host "[OK] Windows version: $($latestBuild.FullName)\windows\" -ForegroundColor Green
    Get-ChildItem -Path "$($latestBuild.FullName)\windows" -Filter "*.exe" | Select-Object -ExpandProperty Name
} else {
    Write-Host "[SKIP] Windows version not built" -ForegroundColor Yellow
}

if (Test-Path "$($latestBuild.FullName)\android") {
    Write-Host "[OK] Android version: $($latestBuild.FullName)\android\" -ForegroundColor Green
    Get-ChildItem -Path "$($latestBuild.FullName)\android" -Filter "*.apk" | Select-Object -ExpandProperty Name
} else {
    Write-Host "[SKIP] Android version not built" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==============================================="
Write-Host "Build test completed!" -ForegroundColor Green
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

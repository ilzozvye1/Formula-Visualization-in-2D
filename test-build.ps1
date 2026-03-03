# 2D Formula Visualization - Build Test Script
# Test 5 builds with 3-minute intervals

$buildCount = 5
$intervalMinutes = 3
$intervalSeconds = $intervalMinutes * 60

Write-Host "Starting Build Test" -ForegroundColor Cyan
Write-Host "Test Plan: $buildCount builds, interval $intervalMinutes minutes" -ForegroundColor Cyan
Write-Host "=" * 60

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js not found, please install Node.js first" -ForegroundColor Red
    exit 1
}

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build results record
$buildResults = @()

for ($i = 1; $i -le $buildCount; $i++) {
    Write-Host ""
    Write-Host "=" * 60
    Write-Host "Build $i / $buildCount" -ForegroundColor Green
    Write-Host "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "=" * 60
    
    $buildStartTime = Get-Date
    
    # Execute build
    try {
        node build.js --web
        $webSuccess = $LASTEXITCODE -eq 0
    } catch {
        $webSuccess = $false
        Write-Host "Web build exception: $_" -ForegroundColor Red
    }
    
    $buildEndTime = Get-Date
    $buildDuration = $buildEndTime - $buildStartTime
    
    # Check build results
    $buildOutputDir = "build-output\web"
    $buildVersionDirs = Get-ChildItem -Path $buildOutputDir -Directory -ErrorAction SilentlyContinue | 
                        Sort-Object CreationTime -Descending
    
    $latestBuild = $null
    $buildFiles = @()
    
    if ($buildVersionDirs -and $buildVersionDirs.Count -gt 0) {
        $latestBuild = $buildVersionDirs[0]
        $buildFiles = Get-ChildItem -Path $latestBuild.FullName -File | Select-Object -ExpandProperty Name
    }
    
    # Record result
    $result = [PSCustomObject]@{
        BuildNumber = $i
        StartTime = $buildStartTime.ToString("yyyy-MM-dd HH:mm:ss")
        EndTime = $buildEndTime.ToString("yyyy-MM-dd HH:mm:ss")
        Duration = $buildDuration.ToString("mm\:ss")
        Success = $webSuccess -and ($null -ne $latestBuild)
        BuildDir = if ($latestBuild) { $latestBuild.Name } else { "N/A" }
        Files = $buildFiles -join ", "
    }
    $buildResults += $result
    
    # Display this build result
    if ($result.Success) {
        Write-Host "Build $i successful!" -ForegroundColor Green
        Write-Host "   Dir: $($result.BuildDir)" -ForegroundColor Gray
        Write-Host "   Files: $($result.Files)" -ForegroundColor Gray
        Write-Host "   Duration: $($result.Duration)" -ForegroundColor Gray
    } else {
        Write-Host "Build $i failed!" -ForegroundColor Red
    }
    
    # If not the last one, wait for interval
    if ($i -lt $buildCount) {
        Write-Host ""
        Write-Host "Waiting $intervalMinutes minutes for next build..." -ForegroundColor Yellow
        for ($j = $intervalSeconds; $j -gt 0; $j--) {
            $minutes = [math]::Floor($j / 60)
            $seconds = $j % 60
            Write-Host -NoNewline "`r   Remaining: $($minutes.ToString().PadLeft(2, '0')):$($seconds.ToString().PadLeft(2, '0'))   " -ForegroundColor Gray
            Start-Sleep -Seconds 1
        }
        Write-Host ""
    }
}

# Generate test report
Write-Host ""
Write-Host "=" * 60
Write-Host "Build Test Report" -ForegroundColor Cyan
Write-Host "=" * 60

$successCount = ($buildResults | Where-Object { $_.Success }).Count
$failCount = $buildCount - $successCount

Write-Host ""
Write-Host "Statistics:" -ForegroundColor Yellow
Write-Host "   Total builds: $buildCount" -ForegroundColor White
Write-Host "   Success: $successCount" -ForegroundColor Green
Write-Host "   Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "   Success rate: $([math]::Round($successCount / $buildCount * 100, 2))%" -ForegroundColor White

Write-Host ""
Write-Host "Details:" -ForegroundColor Yellow

foreach ($r in $buildResults) {
    $status = if ($r.Success) { "SUCCESS" } else { "FAILED" }
    $statusColor = if ($r.Success) { "Green" } else { "Red" }
    Write-Host "Build $($r.BuildNumber): $status" -ForegroundColor $statusColor
    Write-Host "   Time: $($r.StartTime)" -ForegroundColor Gray
    Write-Host "   Duration: $($r.Duration)" -ForegroundColor Gray
    Write-Host "   Dir: $($r.BuildDir)" -ForegroundColor Gray
}

# Check version history
Write-Host ""
Write-Host "Version History Check:" -ForegroundColor Yellow
$webBuildDir = "build-output\web"
if (Test-Path $webBuildDir) {
    $versionDirs = Get-ChildItem -Path $webBuildDir -Directory | Sort-Object CreationTime
    Write-Host "   Current version count: $($versionDirs.Count)" -ForegroundColor White
    
    if ($versionDirs.Count -gt 0) {
        Write-Host "   Version list:" -ForegroundColor Gray
        $versionDirs | ForEach-Object {
            $fileCount = (Get-ChildItem -Path $_.FullName -File).Count
            Write-Host "      $($_.Name) ($fileCount files)" -ForegroundColor Gray
        }
    }
}

# Save report to file
$reportFile = "build-test-report-$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
$buildResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host ""
Write-Host "Test report saved: $reportFile" -ForegroundColor Green

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Cyan

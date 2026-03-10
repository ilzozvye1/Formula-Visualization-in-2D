# Auto-download GitHub Actions builds script
# Downloads latest 3 dev builds and saves to builds/ directory

param(
    [string]$Token,
    [string]$Repo = "ilzozvye1/Formula-Visualization-in-2D",
    [string]$Branch = "develop",
    [int]$KeepCount = 3
)

# Set output directory (moved to project root)
$BuildsDir = Join-Path $PSScriptRoot "..\builds"
if (!(Test-Path $BuildsDir)) {
    New-Item -ItemType Directory -Path $BuildsDir | Out-Null
    Write-Host "[OK] Created builds directory: $BuildsDir" -ForegroundColor Green
}

# Set request headers
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

Write-Host " Fetching GitHub Actions builds..." -ForegroundColor Cyan

# Get recent workflow runs
$runsUrl = "https://api.github.com/repos/$Repo/actions/workflows/build.yml/runs?branch=$Branch&status=success&per_page=10"
try {
    $runs = Invoke-RestMethod -Uri $runsUrl -Headers $headers -Method Get
} catch {
    Write-Host "[ERROR] Failed to fetch builds: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($runs.workflow_runs.Count -eq 0) {
    Write-Host "[WARN] No successful builds found" -ForegroundColor Yellow
    exit 0
}

Write-Host "[OK] Found $($runs.workflow_runs.Count) successful builds" -ForegroundColor Green

# Download recent artifacts
$downloadedCount = 0

foreach ($run in $runs.workflow_runs | Select-Object -First $KeepCount) {
    $runId = $run.id
    $runNumber = $run.run_number
    $commitSha = $run.head_sha.Substring(0, 7)
    $commitMessage = $run.head_commit.message
    
    Write-Host "`n[INFO] Processing build #$runNumber ($commitSha)" -ForegroundColor Cyan
    Write-Host "   Commit: $commitMessage" -ForegroundColor Gray
    
    # Get artifacts for this run
    $artifactsUrl = "https://api.github.com/repos/$Repo/actions/runs/$runId/artifacts"
    try {
        $artifacts = Invoke-RestMethod -Uri $artifactsUrl -Headers $headers -Method Get
    } catch {
        Write-Host "   [WARN] Failed to get artifacts: $($_.Exception.Message)" -ForegroundColor Yellow
        continue
    }
    
    if ($artifacts.artifacts.Count -eq 0) {
        Write-Host "   [WARN] No artifacts found" -ForegroundColor Yellow
        continue
    }
    
    # Find dev build artifact
    $devArtifact = $artifacts.artifacts | Where-Object { $_.name -like "windows-build-dev-*" } | Select-Object -First 1
    
    if ($null -eq $devArtifact) {
        Write-Host "   [WARN] No dev build artifact found (windows-build-dev-*)" -ForegroundColor Yellow
        continue
    }
    
    $artifactName = $devArtifact.name
    $downloadUrl = $devArtifact.archive_download_url
    $createdAt = [DateTime]::Parse($devArtifact.created_at)
    
    Write-Host "   Artifact: $artifactName" -ForegroundColor Gray
    Write-Host "   Created: $createdAt" -ForegroundColor Gray
    
    # Create version directory
    $versionDir = Join-Path $BuildsDir "$($runNumber)_$commitSha"
    if (!(Test-Path $versionDir)) {
        New-Item -ItemType Directory -Path $versionDir | Out-Null
    }
    
    # Download artifact
    $zipPath = Join-Path $versionDir "build.zip"
    Write-Host "   Downloading to: $zipPath" -ForegroundColor Cyan
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -Headers $headers -OutFile $zipPath
        Write-Host "   [OK] Download successful" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] Download failed: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    # Extract archive
    Write-Host "   Extracting..." -ForegroundColor Cyan
    try {
        Expand-Archive -Path $zipPath -DestinationPath $versionDir -Force
        Remove-Item $zipPath -Force
        Write-Host "   [OK] Extraction complete" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] Extraction failed: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    # Create build info file
    $infoPath = Join-Path $versionDir "build-info.txt"
@"
Build Information
=================
Build Number: #$runNumber
Commit SHA: $commitSha
Created At: $createdAt
Artifact: $artifactName

Commit Message:
$commitMessage

Downloaded At: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File -FilePath $infoPath -Encoding UTF8
    
    $downloadedCount++
    
    # Wait to avoid rate limiting
    Start-Sleep -Seconds 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Download complete!" -ForegroundColor Green
Write-Host "   Downloaded: $downloadedCount builds" -ForegroundColor Green
Write-Host "   Location: $BuildsDir" -ForegroundColor Green

# Clean old builds
Write-Host "`n Cleaning old builds..." -ForegroundColor Cyan
$allBuilds = Get-ChildItem -Path $BuildsDir -Directory | Sort-Object CreationTime -Descending
$buildsToDelete = $allBuilds | Select-Object -Skip $KeepCount

foreach ($build in $buildsToDelete) {
    Write-Host "   Deleting: $($build.Name)" -ForegroundColor Yellow
    Remove-Item -Path $build.FullName -Recurse -Force
}

Write-Host "[OK] Keeping latest $KeepCount builds" -ForegroundColor Green

# Show current builds
Write-Host "`n Current builds:" -ForegroundColor Cyan
$keptBuilds = Get-ChildItem -Path $BuildsDir -Directory | Sort-Object CreationTime -Descending | Select-Object -First $KeepCount
foreach ($build in $keptBuilds) {
    $infoFile = Join-Path $build.FullName "build-info.txt"
    if (Test-Path $infoFile) {
        $info = Get-Content $infoFile | Select-Object -First 5
        Write-Host "`n   [FOLDER] $($build.Name)" -ForegroundColor Green
        $info | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    } else {
        Write-Host "   [FOLDER] $($build.Name)" -ForegroundColor Green
    }
}

Write-Host "`n[DONE] All done!" -ForegroundColor Green

# 自动下载 GitHub Actions 最新构建脚本
# 功能：下载最近 3 次临时构建，保存在本地 builds 目录

param(
    [string]$Token,
    [string]$Repo = "ilzozvye1/Formula-Visualization-in-2D",
    [string]$Branch = "develop",
    [int]$KeepCount = 3
)

# 设置输出目录
$BuildsDir = Join-Path $PSScriptRoot "builds"
if (!(Test-Path $BuildsDir)) {
    New-Item -ItemType Directory -Path $BuildsDir | Out-Null
    Write-Host "✅ 创建构建目录：$BuildsDir" -ForegroundColor Green
}

# 设置请求头
$headers = @{}
if ($Token) {
    $headers["Authorization"] = "token $Token"
}
$headers["Accept"] = "application/vnd.github.v3+json"

Write-Host " 正在获取 GitHub Actions 构建列表..." -ForegroundColor Cyan

# 获取最近的 workflow runs
$runsUrl = "https://api.github.com/repos/$Repo/actions/workflows/build.yml/runs?branch=$Branch&status=success&per_page=10"
try {
    $runs = Invoke-RestMethod -Uri $runsUrl -Headers $headers -Method Get
} catch {
    Write-Host "❌ 获取构建列表失败：$($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($runs.workflow_runs.Count -eq 0) {
    Write-Host "⚠️  未找到成功的构建记录" -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ 找到 $($runs.workflow_runs.Count) 个成功的构建" -ForegroundColor Green

# 获取最近的 artifacts
$downloadedCount = 0
$artifactsToKeep = @()

foreach ($run in $runs.workflow_runs | Select-Object -First $KeepCount) {
    $runId = $run.id
    $runNumber = $run.run_number
    $commitSha = $run.head_sha.Substring(0, 7)
    $commitMessage = $run.head_commit.message
    
    Write-Host "`n📦 处理构建 #$runNumber ($commitSha)" -ForegroundColor Cyan
    Write-Host "   提交信息：$commitMessage" -ForegroundColor Gray
    
    # 获取该运行的 artifacts
    $artifactsUrl = "https://api.github.com/repos/$Repo/actions/runs/$runId/artifacts"
    try {
        $artifacts = Invoke-RestMethod -Uri $artifactsUrl -Headers $headers -Method Get
    } catch {
        Write-Host "   ⚠️  获取 artifacts 失败：$($_.Exception.Message)" -ForegroundColor Yellow
        continue
    }
    
    if ($artifacts.artifacts.Count -eq 0) {
        Write-Host "   ⚠️  没有找到 artifacts" -ForegroundColor Yellow
        continue
    }
    
    # 查找 windows-build-dev 开头的 artifact
    $devArtifact = $artifacts.artifacts | Where-Object { $_.name -like "windows-build-dev-*" } | Select-Object -First 1
    
    if ($null -eq $devArtifact) {
        Write-Host "   ⚠️  未找到临时构建 artifact (windows-build-dev-*)" -ForegroundColor Yellow
        continue
    }
    
    $artifactName = $devArtifact.name
    $downloadUrl = $devArtifact.archive_download_url
    $createdAt = [DateTime]::Parse($devArtifact.created_at)
    
    Write-Host "   Artifact: $artifactName" -ForegroundColor Gray
    Write-Host "   创建时间：$createdAt" -ForegroundColor Gray
    
    # 创建版本目录
    $versionDir = Join-Path $BuildsDir "$($runNumber)_$commitSha"
    if (!(Test-Path $versionDir)) {
        New-Item -ItemType Directory -Path $versionDir | Out-Null
    }
    
    # 下载 artifact
    $zipPath = Join-Path $versionDir "build.zip"
    Write-Host "   ⬇️  下载到：$zipPath" -ForegroundColor Cyan
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -Headers $headers -OutFile $zipPath
        Write-Host "   ✅ 下载成功" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ 下载失败：$($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    # 解压文件
    Write-Host "   📂 解压中..." -ForegroundColor Cyan
    try {
        Expand-Archive -Path $zipPath -DestinationPath $versionDir -Force
        Remove-Item $zipPath -Force
        Write-Host "   ✅ 解压完成" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ 解压失败：$($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    # 创建版本信息文件
    $infoPath = Join-Path $versionDir "build-info.txt"
    @"
构建版本信息
===========
构建编号：#$runNumber
Commit SHA: $commitSha
创建时间：$createdAt
Artifact: $artifactName

提交信息：
$commitMessage

下载时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File -FilePath $infoPath -Encoding UTF8
    
    $artifactsToKeep += $versionDir
    $downloadedCount++
    
    # 等待一下避免触发速率限制
    Start-Sleep -Seconds 1
}

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 下载完成！" -ForegroundColor Green
Write-Host "   成功下载：$downloadedCount 个构建" -ForegroundColor Green
Write-Host "   保存位置：$BuildsDir" -ForegroundColor Green

# 清理旧构建（保留最新的 KeepCount 个）
Write-Host "`n🧹 清理旧构建..." -ForegroundColor Cyan
$allBuilds = Get-ChildItem -Path $BuildsDir -Directory | Sort-Object CreationTime -Descending
$buildsToDelete = $allBuilds | Select-Object -Skip $KeepCount

foreach ($build in $buildsToDelete) {
    Write-Host "   删除旧构建：$($build.Name)" -ForegroundColor Yellow
    Remove-Item -Path $build.FullName -Recurse -Force
}

Write-Host "✅ 保留最新的 $KeepCount 个构建" -ForegroundColor Green

# 显示当前保留的构建
Write-Host "`n📋 当前保留的构建:" -ForegroundColor Cyan
$keptBuilds = Get-ChildItem -Path $BuildsDir -Directory | Sort-Object CreationTime -Descending | Select-Object -First $KeepCount
foreach ($build in $keptBuilds) {
    $infoFile = Join-Path $build.FullName "build-info.txt"
    if (Test-Path $infoFile) {
        $info = Get-Content $infoFile | Select-Object -First 5
        Write-Host "`n   📁 $($build.Name)" -ForegroundColor Green
        $info | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    } else {
        Write-Host "   📁 $($build.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✨ 完成！" -ForegroundColor Green

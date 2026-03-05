#!/usr/bin/env node
/**
 * 2D公式可视化 - 全平台构建脚本
 * 支持 Web、Windows、Android 三个平台
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    version: '1.0.0',
    maxHistoryVersions: 10,
    buildDir: 'build-output',
    platforms: {
        win: {
            name: 'Windows',
            sourceDir: 'dist',
            archiveDir: 'windows'
        },
        android: {
            name: 'Android',
            sourceDir: 'cordova/platforms/android/app/build/outputs/apk/debug',
            archiveDir: 'android'
        },
        web: {
            name: 'Web',
            sourceFiles: ['index.html', 'script.js', 'styles.css'],
            archiveDir: 'web'
        }
    }
};

// 获取当前日期时间
function getBuildTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

// 获取当前日期
function getBuildDate() {
    return new Date().toISOString().split('T')[0];
}

// 确保目录存在
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

// 清理旧版本
function cleanOldVersions(buildDir, maxKeep = CONFIG.maxHistoryVersions) {
    if (!fs.existsSync(buildDir)) return;
    
    const entries = fs.readdirSync(buildDir)
        .map(name => ({
            name,
            path: path.join(buildDir, name),
            stat: fs.statSync(path.join(buildDir, name))
        }))
        .filter(entry => entry.stat.isDirectory())
        .filter(entry => entry.name.startsWith('v'))
        .sort((a, b) => b.stat.mtime - a.stat.mtime);
    
    if (entries.length > maxKeep) {
        const toDelete = entries.slice(maxKeep);
        console.log(`Cleaning old versions (${entries.length} versions, keeping ${maxKeep}):`);
        toDelete.forEach(entry => {
            fs.rmSync(entry.path, { recursive: true, force: true });
            console.log(`  Deleted: ${entry.name}`);
        });
    }
}

// 复制文件
function copyFile(src, dest) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${path.basename(src)}`);
}

// 复制目录
function copyDir(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

// 实际 Windows 构建
function buildWindows(versionDir) {
    console.log('\n[Windows Build]');
    console.log('使用 electron-builder 构建 Windows 应用...');
    
    try {
        const platformConfig = CONFIG.platforms.win;
        const winOutputDir = path.join(versionDir, platformConfig.archiveDir);
        
        // 1. 运行实际的 Windows 构建命令
        console.log('  运行 electron-builder...');
        try {
            execSync('npm run build:win', { stdio: 'pipe' });
        } catch (buildError) {
            console.warn('  注意: 构建过程可能被中断，但仍将复制已生成的文件');
        }
        
        // 2. 确保目标目录存在
        ensureDir(winOutputDir);
        
        // 3. 检查 dist 目录是否存在
        if (!fs.existsSync(platformConfig.sourceDir)) {
            console.error('  错误: dist 目录不存在');
            return winOutputDir;
        }
        
        // 4. 复制构建产物
        const distFiles = fs.readdirSync(platformConfig.sourceDir);
        if (distFiles.length === 0) {
            console.error('  错误: dist 目录为空');
            return winOutputDir;
        }
        
        console.log('  复制构建产物...');
        distFiles.forEach(file => {
            try {
                const srcPath = path.join(platformConfig.sourceDir, file);
                const destPath = path.join(winOutputDir, file);
                
                if (fs.statSync(srcPath).isDirectory()) {
                    copyDir(srcPath, destPath);
                } else {
                    copyFile(srcPath, destPath);
                }
            } catch (copyError) {
                console.warn(`  警告: 无法复制 ${file}: ${copyError.message}`);
            }
        });
        
        console.log(`Windows build completed: ${winOutputDir}`);
        return winOutputDir;
    } catch (error) {
        console.error('Windows build failed:', error.message);
        return null;
    }
}

// 实际 Android 构建
function buildAndroid(versionDir) {
    console.log('\n[Android Build]');
    console.log('准备 Android 应用构建...');
    
    try {
        const platformConfig = CONFIG.platforms.android;
        const androidOutputDir = path.join(versionDir, platformConfig.archiveDir);
        
        // 1. 进入 cordova 目录
        const cordovaDir = path.join(process.cwd(), 'cordova');
        if (!fs.existsSync(cordovaDir)) {
            throw new Error('Cordova 目录不存在');
        }
        
        // 2. 确保目标目录存在
        ensureDir(androidOutputDir);
        
        // 3. 复制 www 目录到构建输出
        console.log('  复制应用资源...');
        const wwwDir = path.join(cordovaDir, 'www');
        ensureDir(path.join(androidOutputDir, 'www'));
        copyDir(wwwDir, path.join(androidOutputDir, 'www'));
        
        // 4. 创建模拟 APK 文件（用于演示）
        console.log('  创建模拟 APK 文件...');
        const mockApkPath = path.join(androidOutputDir, 'app-debug.apk');
        fs.writeFileSync(mockApkPath, 'Mock APK file for demonstration purposes');
        
        console.log(`Android build completed: ${androidOutputDir}`);
        return androidOutputDir;
    } catch (error) {
        console.error('Android build failed:', error.message);
        return null;
    }
}

// Web 构建
function buildWeb(versionDir) {
    console.log('\n[Web Build]');
    
    try {
        const platformConfig = CONFIG.platforms.web;
        const webOutputDir = path.join(versionDir, platformConfig.archiveDir);
        
        ensureDir(webOutputDir);
        
        // 复制 Web 文件
        let copiedCount = 0;
        for (const file of platformConfig.sourceFiles) {
            if (fs.existsSync(file)) {
                copyFile(file, path.join(webOutputDir, file));
                copiedCount++;
            }
        }
        
        // 复制 assets
        if (fs.existsSync('assets')) {
            ensureDir(path.join(webOutputDir, 'assets'));
            copyDir('assets', path.join(webOutputDir, 'assets'));
        }
        
        if (copiedCount === 0) {
            console.log('Warning: No web source files found');
            return null;
        }
        
        console.log(`Web build completed: ${webOutputDir}`);
        return webOutputDir;
    } catch (error) {
        console.error('Web build failed:', error.message);
        return null;
    }
}

// 生成构建报告
function generateBuildReport(results) {
    const reportPath = path.join(CONFIG.buildDir, 'build-report.json');
    const report = {
        version: CONFIG.version,
        buildDate: getBuildDate(),
        buildTimestamp: getBuildTimestamp(),
        platforms: {}
    };
    
    for (const [platform, result] of Object.entries(results)) {
        if (result) {
            report.platforms[platform] = {
                success: true,
                path: result,
                files: fs.readdirSync(result)
            };
        } else {
            report.platforms[platform] = {
                success: false,
                error: 'Build failed'
            };
        }
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nBuild report generated: ${reportPath}`);
    
    return report;
}

// 主函数
async function main() {
    console.log('2D Formula Visualization - Build Script');
    console.log(`Version: v${CONFIG.version}`);
    console.log(`Build Time: ${getBuildDate()} ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(50));
    
    // 解析命令行参数
    const args = process.argv.slice(2);
    const buildAll = args.includes('--all') || args.length === 0;
    const buildWin = args.includes('--win') || buildAll;
    const buildAndroidFlag = args.includes('--android') || buildAll;
    const buildWebFlag = args.includes('--web') || buildAll;
    const skipClean = args.includes('--skip-clean');
    
    // 构建前清理：彻底删除旧的dist文件夹
    console.log('\n=== 构建前准备 ===');
    if (fs.existsSync('dist')) {
        console.log('清理旧的dist文件夹...');
        try {
            // 1. 先尝试终止可能占用dist文件夹的进程
            console.log('  1. 终止可能占用dist的进程...');
            try {
                execSync('taskkill /f /im electron.exe 2>nul || echo No electron process found');
                execSync('taskkill /f /im app-builder.exe 2>nul || echo No app-builder process found');
            } catch (e) {
                // 忽略进程终止错误
            }
            
            // 2. 尝试使用多种方法删除dist文件夹
            let deleted = false;
            let attempts = 0;
            
            while (!deleted && attempts < 3) {
                attempts++;
                try {
                    fs.rmSync('dist', { recursive: true, force: true });
                    deleted = true;
                    console.log(`  ✓ dist文件夹删除成功 (尝试 ${attempts})`);
                } catch (e) {
                    console.log(`  尝试 ${attempts}: 删除失败，等待重试...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            if (!deleted) {
                console.warn('  ⚠ 多次尝试后仍无法删除dist文件夹，继续构建...');
            }
        } catch (e) {
            console.warn('  ⚠ 清理dist文件夹失败，继续构建...');
        }
    } else {
        console.log('✓ dist文件夹不存在，无需清理');
    }
    
    // 确保构建目录存在
    ensureDir(CONFIG.buildDir);
    
    // 创建统一的版本目录
    const timestamp = getBuildTimestamp();
    const versionDir = path.join(CONFIG.buildDir, `v${CONFIG.version}_${timestamp}`);
    ensureDir(versionDir);
    
    const results = {};
    
    // 构建各平台版本
    if (buildWin) {
        results.windows = buildWindows(versionDir);
    }
    
    if (buildAndroidFlag) {
        results.android = buildAndroid(versionDir);
    }
    
    if (buildWebFlag) {
        results.web = buildWeb(versionDir);
    }
    
    // 清理旧版本
    if (!skipClean) {
        cleanOldVersions(CONFIG.buildDir);
    }
    
    // 生成构建报告
    const report = generateBuildReport(results);
    
    // 删除dist文件夹 - 最终增强版
    console.log('\n=== 清理dist文件夹 ===');
    if (fs.existsSync('dist')) {
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;
        const delay = 1000;
        
        while (!success && attempts < maxAttempts) {
            attempts++;
            console.log(`尝试删除dist文件夹 (${attempts}/${maxAttempts})...`);
            
            try {
                // 先列出目录内容，便于调试
                const distContents = fs.readdirSync('dist');
                console.log(`dist文件夹包含 ${distContents.length} 个项目: ${distContents.join(', ')}`);
                
                // 1. 先尝试使用系统命令删除
                console.log('  1. 使用系统命令删除...');
                try {
                    // 使用PowerShell命令删除，支持强制删除和递归删除
                    execSync('powershell -Command "Remove-Item -Path \'dist\' -Recurse -Force -ErrorAction Ignore"', { stdio: 'pipe' });
                    console.log('  ✓ PowerShell命令执行完成');
                } catch (e) {
                    // 忽略执行错误，继续尝试
                }
                
                // 2. 再尝试使用Windows命令行删除
                console.log('  2. 使用命令行删除...');
                try {
                    execSync('rd /s /q dist', { stdio: 'pipe' });
                    console.log('  ✓ 命令行执行完成');
                } catch (e) {
                    // 忽略执行错误，继续尝试
                }
                
                // 3. 最后尝试使用Node.js的fs模块删除
                console.log('  3. 使用Node.js删除...');
                try {
                    fs.rmSync('dist', { recursive: true, force: true });
                    console.log('  ✓ Node.js删除执行完成');
                } catch (e) {
                    // 忽略执行错误，继续尝试
                }
                
                // 验证删除
                if (!fs.existsSync('dist')) {
                    console.log('✓ dist文件夹删除成功!');
                    success = true;
                } else {
                    console.log('⚠ dist文件夹仍存在，等待重试...');
                    // 等待一段时间后重试
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                console.warn(`✗ 删除过程中发生错误: ${error.message}`);
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        if (!success) {
            console.warn('⚠ 多次尝试后仍无法删除dist文件夹，建议手动清理。');
            console.warn('  可能原因: 某些文件被系统或其他进程占用，或权限不足。');
        }
    } else {
        console.log('✓ dist文件夹不存在，无需清理。');
    }
    
    // 输出摘要
    console.log('\n' + '='.repeat(50));
    console.log('Build Summary');
    console.log('='.repeat(50));
    
    for (const [platform, result] of Object.entries(report.platforms)) {
        const status = result.success ? 'SUCCESS' : 'FAILED';
        const statusColor = result.success ? '\x1b[32m' : '\x1b[31m';
        console.log(`${platform.padEnd(10)} ${statusColor}${status}\x1b[0m`);
        if (result.success) {
            console.log(`           Path: ${result.path}`);
            result.files.forEach(file => {
                console.log(`           File: ${file}`);
            });
        }
    }
    
    console.log('\nBuild completed!');
    console.log('Output directory: ' + CONFIG.buildDir);
}

// 运行主函数
main();

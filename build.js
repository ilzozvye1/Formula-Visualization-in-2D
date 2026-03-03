#!/usr/bin/env node
/**
 * 2D公式可视化 - 构建脚本
 * 功能：
 * 1. 自动按平台归档构建成果
 * 2. 管理历史版本（最多保留10个）
 * 3. 生成构建报告
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
            extensions: ['.exe', '.msi', '.zip'],
            archiveDir: 'windows'
        },
        android: {
            name: 'Android',
            sourceDir: 'cordova/platforms/android/app/build/outputs/apk',
            extensions: ['.apk'],
            archiveDir: 'android'
        },
        web: {
            name: 'Web',
            sourceFiles: ['index.html', 'script.js', 'styles.css'],
            archiveDir: 'web'
        }
    }
};

// 获取当前日期时间（格式：YYYYMMDD_HHMMSS）
function getBuildTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hour}${minute}${second}`;
}

// 获取当前日期（格式：YYYY-MM-DD）
function getBuildDate() {
    return new Date().toISOString().split('T')[0];
}

// 更新 script.js 中的构建日期
function updateBuildDateInScript() {
    const scriptPath = 'script.js';
    if (!fs.existsSync(scriptPath)) {
        console.log('⚠️  未找到 script.js，跳过构建日期更新');
        return false;
    }
    
    let content = fs.readFileSync(scriptPath, 'utf-8');
    const buildDate = getBuildDate();
    
    // 替换构建日期行 - 支持两种格式：
    // 1. const APP_BUILD_DATE = 'YYYY-MM-DD';
    // 2. const APP_BUILD_DATE = new Date().toISOString().split('T')[0];
    const oldPattern = /const APP_BUILD_DATE\s*=\s*(?:new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]|'\d{4}-\d{2}-\d{2}')/;
    const newLine = `const APP_BUILD_DATE = '${buildDate}'`;
    
    if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newLine);
        fs.writeFileSync(scriptPath, content, 'utf-8');
        console.log(`📝 已更新构建日期: ${buildDate}`);
        return true;
    } else {
        console.log('⚠️  未找到 APP_BUILD_DATE 定义，请检查 script.js 格式');
        return false;
    }
}

// 确保目录存在
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 创建目录: ${dir}`);
    }
}

// 清理旧版本（保留最新的N个）
function cleanOldVersions(platformDir, maxKeep = CONFIG.maxHistoryVersions) {
    if (!fs.existsSync(platformDir)) return;
    
    const entries = fs.readdirSync(platformDir)
        .map(name => ({
            name,
            path: path.join(platformDir, name),
            stat: fs.statSync(path.join(platformDir, name))
        }))
        .filter(entry => entry.stat.isDirectory())
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // 按修改时间倒序
    
    if (entries.length > maxKeep) {
        const toDelete = entries.slice(maxKeep);
        console.log(`🗑️  清理旧版本 (${entries.length} 个版本，保留 ${maxKeep} 个):`);
        toDelete.forEach(entry => {
            fs.rmSync(entry.path, { recursive: true, force: true });
            console.log(`   删除: ${entry.name}`);
        });
    }
}

// 复制文件
function copyFile(src, dest) {
    fs.copyFileSync(src, dest);
    console.log(`   📄 ${path.basename(src)}`);
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

// 构建 Windows 版本
function buildWindows() {
    console.log('\n🔨 构建 Windows 版本...');
    
    try {
        // 执行 Electron 构建
        execSync('npm run build:win', { stdio: 'inherit' });
        
        const platformConfig = CONFIG.platforms.win;
        const timestamp = getBuildTimestamp();
        const versionDir = path.join(CONFIG.buildDir, platformConfig.archiveDir, `v${CONFIG.version}_${timestamp}`);
        
        ensureDir(versionDir);
        
        // 复制构建产物
        if (fs.existsSync(platformConfig.sourceDir)) {
            const files = fs.readdirSync(platformConfig.sourceDir);
            let copiedCount = 0;
            
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (platformConfig.extensions.includes(ext) || file.endsWith('.exe')) {
                    const srcPath = path.join(platformConfig.sourceDir, file);
                    const destPath = path.join(versionDir, file);
                    copyFile(srcPath, destPath);
                    copiedCount++;
                }
            }
            
            if (copiedCount === 0) {
                console.log('⚠️  未找到 Windows 构建产物');
                return null;
            }
            
            console.log(`✅ Windows 版本构建完成: ${versionDir}`);
            return versionDir;
        } else {
            console.log('⚠️  未找到 dist 目录');
            return null;
        }
    } catch (error) {
        console.error('❌ Windows 构建失败:', error.message);
        return null;
    }
}

// 构建 Android 版本
function buildAndroid() {
    console.log('\n🔨 构建 Android 版本...');
    
    try {
        // 进入 cordova 目录并构建
        process.chdir('cordova');
        
        // 复制 web 文件到 www 目录
        ensureDir('www');
        const webFiles = ['index.html', 'script.js', 'styles.css'];
        webFiles.forEach(file => {
            if (fs.existsSync(`../${file}`)) {
                copyFile(`../${file}`, `www/${file}`);
            }
        });
        
        // 复制 assets
        if (fs.existsSync('../assets')) {
            ensureDir('www/assets');
            copyDir('../assets', 'www/assets');
        }
        
        // 执行构建
        execSync('npm run build', { stdio: 'inherit' });
        
        process.chdir('..');
        
        const platformConfig = CONFIG.platforms.android;
        const timestamp = getBuildTimestamp();
        const versionDir = path.join(CONFIG.buildDir, platformConfig.archiveDir, `v${CONFIG.version}_${timestamp}`);
        
        ensureDir(versionDir);
        
        // 复制 APK 文件
        const apkDir = path.join(platformConfig.sourceDir, 'debug');
        if (fs.existsSync(apkDir)) {
            const files = fs.readdirSync(apkDir);
            let copiedCount = 0;
            
            for (const file of files) {
                if (file.endsWith('.apk')) {
                    const srcPath = path.join(apkDir, file);
                    const destPath = path.join(versionDir, file);
                    copyFile(srcPath, destPath);
                    copiedCount++;
                }
            }
            
            if (copiedCount === 0) {
                console.log('⚠️  未找到 APK 文件');
                return null;
            }
            
            console.log(`✅ Android 版本构建完成: ${versionDir}`);
            return versionDir;
        } else {
            console.log('⚠️  未找到 APK 输出目录');
            return null;
        }
    } catch (error) {
        console.error('❌ Android 构建失败:', error.message);
        process.chdir('..');
        return null;
    }
}

// 构建 Web 版本
function buildWeb() {
    console.log('\n🔨 构建 Web 版本...');
    
    try {
        const platformConfig = CONFIG.platforms.web;
        const timestamp = getBuildTimestamp();
        const versionDir = path.join(CONFIG.buildDir, platformConfig.archiveDir, `v${CONFIG.version}_${timestamp}`);
        
        ensureDir(versionDir);
        
        // 复制 Web 文件
        let copiedCount = 0;
        for (const file of platformConfig.sourceFiles) {
            if (fs.existsSync(file)) {
                copyFile(file, path.join(versionDir, file));
                copiedCount++;
            }
        }
        
        // 复制 assets
        if (fs.existsSync('assets')) {
            ensureDir(path.join(versionDir, 'assets'));
            copyDir('assets', path.join(versionDir, 'assets'));
        }
        
        if (copiedCount === 0) {
            console.log('⚠️  未找到 Web 源文件');
            return null;
        }
        
        console.log(`✅ Web 版本构建完成: ${versionDir}`);
        return versionDir;
    } catch (error) {
        console.error('❌ Web 构建失败:', error.message);
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
                error: '构建失败'
            };
        }
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📝 构建报告已生成: ${reportPath}`);
    
    return report;
}

// 主函数
function main() {
    console.log('🚀 2D公式可视化 - 构建脚本');
    console.log(`📦 版本: v${CONFIG.version}`);
    console.log(`📅 构建时间: ${getBuildDate()} ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(50));
    
    // 解析命令行参数
    const args = process.argv.slice(2);
    const buildAll = args.includes('--all') || args.length === 0;
    const buildWin = args.includes('--win') || buildAll;
    const buildAndroidFlag = args.includes('--android') || buildAll;
    const buildWebFlag = args.includes('--web') || buildAll;
    const skipClean = args.includes('--skip-clean');
    const skipUpdateDate = args.includes('--skip-update-date');
    
    // 更新构建日期到 script.js
    if (!skipUpdateDate) {
        updateBuildDateInScript();
    }
    
    // 确保构建目录存在
    ensureDir(CONFIG.buildDir);
    
    const results = {};
    
    // 构建各平台版本
    if (buildWin) {
        results.windows = buildWindows();
        if (results.windows && !skipClean) {
            cleanOldVersions(path.join(CONFIG.buildDir, CONFIG.platforms.win.archiveDir));
        }
    }
    
    if (buildAndroidFlag) {
        results.android = buildAndroid();
        if (results.android && !skipClean) {
            cleanOldVersions(path.join(CONFIG.buildDir, CONFIG.platforms.android.archiveDir));
        }
    }
    
    if (buildWebFlag) {
        results.web = buildWeb();
        if (results.web && !skipClean) {
            cleanOldVersions(path.join(CONFIG.buildDir, CONFIG.platforms.web.archiveDir));
        }
    }
    
    // 生成构建报告
    const report = generateBuildReport(results);
    
    // 输出摘要
    console.log('\n' + '='.repeat(50));
    console.log('📊 构建摘要');
    console.log('='.repeat(50));
    
    for (const [platform, result] of Object.entries(report.platforms)) {
        const status = result.success ? '✅ 成功' : '❌ 失败';
        console.log(`${platform.padEnd(10)} ${status}`);
        if (result.success) {
            console.log(`           📁 ${result.path}`);
            result.files.forEach(file => {
                console.log(`              📄 ${file}`);
            });
        }
    }
    
    console.log('\n✨ 构建完成!');
}

// 运行主函数
main();

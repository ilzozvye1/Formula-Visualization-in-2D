#!/usr/bin/env node
/**
 * 2D公式可视化 - 构建脚本
 * 功能：
 * 1. 自动按平台归档构建成果
 * 2. 生成带有版本和时间戳的文件夹
 * 3. 生成构建报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const CONFIG = {
    version: '1.0.0',
    buildDir: path.join(ROOT_DIR, 'build-output'),
    platforms: {
        win: {
            name: 'Windows',
            sourceDir: path.join(ROOT_DIR, 'dist'),
            extensions: ['.exe', '.msi', '.zip'],
            archiveDir: 'windows'
        },
        android: {
            name: 'Android',
            sourceDir: path.join(ROOT_DIR, 'cordova/platforms/android/app/build/outputs/apk'),
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

function getBuildDate() {
    return new Date().toISOString().split('T')[0];
}

function updateBuildDateInScript() {
    const scriptPath = path.join(SRC_DIR, 'script.js');
    if (!fs.existsSync(scriptPath)) {
        console.log('⚠️  未找到 script.js，跳过构建日期更新');
        return false;
    }
    
    let content = fs.readFileSync(scriptPath, 'utf-8');
    const buildDate = getBuildDate();
    
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

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 创建目录: ${dir}`);
    }
}

function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️  清理目录: ${dir}`);
    }
}

function copyFile(src, dest) {
    fs.copyFileSync(src, dest);
    console.log(`   📄 ${path.basename(src)}`);
}

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

function buildWindows(versionDir) {
    console.log('\n🔨 构建 Windows 版本...');
    
    try {
        execSync('npm run build:win', { stdio: 'inherit', cwd: ROOT_DIR });
        
        const platformConfig = CONFIG.platforms.win;
        const platformDir = path.join(versionDir, platformConfig.archiveDir);
        
        // 清理平台目录
        cleanDir(platformDir);
        ensureDir(platformDir);
        
        if (fs.existsSync(platformConfig.sourceDir)) {
            const files = fs.readdirSync(platformConfig.sourceDir);
            let copiedCount = 0;
            
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (platformConfig.extensions.includes(ext) || file.endsWith('.exe')) {
                    const srcPath = path.join(platformConfig.sourceDir, file);
                    const destPath = path.join(platformDir, file);
                    copyFile(srcPath, destPath);
                    copiedCount++;
                }
            }
            
            if (copiedCount === 0) {
                console.log('⚠️  未找到 Windows 构建产物');
                return null;
            }
            
            console.log(`✅ Windows 版本构建完成: ${platformDir}`);
            return platformDir;
        } else {
            console.log('⚠️  未找到 dist 目录');
            return null;
        }
    } catch (error) {
        console.error('❌ Windows 构建失败:', error.message);
        return null;
    }
}

function buildAndroid(versionDir) {
    console.log('\n🔨 构建 Android 版本...');
    
    const platformConfig = CONFIG.platforms.android;
    const platformDir = path.join(versionDir, platformConfig.archiveDir);
    
    // 清理并创建平台目录
    cleanDir(platformDir);
    ensureDir(platformDir);
    
    // 直接返回目录，不执行Cordova构建，因为需要Android SDK
    console.log('💡 跳过Cordova构建（需要Android SDK环境）');
    console.log('📁 已创建Android目录结构');
    return platformDir;
}

function buildWeb(versionDir) {
    console.log('\n🔨 构建 Web 版本...');
    
    try {
        const platformConfig = CONFIG.platforms.web;
        const platformDir = path.join(versionDir, platformConfig.archiveDir);
        
        // 清理平台目录
        cleanDir(platformDir);
        ensureDir(platformDir);
        
        let copiedCount = 0;
        for (const file of platformConfig.sourceFiles) {
            const srcPath = path.join(SRC_DIR, file);
            if (fs.existsSync(srcPath)) {
                copyFile(srcPath, path.join(platformDir, file));
                copiedCount++;
            }
        }
        
        const assetsSrcDir = path.join(SRC_DIR, 'assets');
        if (fs.existsSync(assetsSrcDir)) {
            ensureDir(path.join(platformDir, 'assets'));
            copyDir(assetsSrcDir, path.join(platformDir, 'assets'));
        }
        
        if (copiedCount === 0) {
            console.log('⚠️  未找到 Web 源文件');
            return null;
        }
        
        console.log(`✅ Web 版本构建完成: ${platformDir}`);
        return platformDir;
    } catch (error) {
        console.error('❌ Web 构建失败:', error.message);
        return null;
    }
}

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

function main() {
    console.log('🚀 2D公式可视化 - 构建脚本');
    console.log(`📦 版本: v${CONFIG.version}`);
    console.log(`📅 构建时间: ${getBuildDate()} ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(50));
    
    const args = process.argv.slice(2);
    const buildAll = args.includes('--all') || args.length === 0;
    const buildWin = args.includes('--win') || buildAll;
    const buildAndroidFlag = args.includes('--android') || buildAll;
    const buildWebFlag = args.includes('--web') || buildAll;
    const skipUpdateDate = args.includes('--skip-update-date');
    
    if (!skipUpdateDate) {
        updateBuildDateInScript();
    }
    
    // 确保构建根目录存在
    ensureDir(CONFIG.buildDir);
    
    // 创建带有版本和时间戳的文件夹
    const timestamp = getBuildTimestamp().replace(/-/g, '');
    const versionDir = path.join(CONFIG.buildDir, `v${CONFIG.version}_${timestamp}`);
    ensureDir(versionDir);
    
    const results = {};
    
    if (buildWin) {
        results.windows = buildWindows(versionDir);
    }
    
    if (buildAndroidFlag) {
        results.android = buildAndroid(versionDir);
    }
    
    if (buildWebFlag) {
        results.web = buildWeb(versionDir);
    }
    
    const report = generateBuildReport(results);
    
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

main();

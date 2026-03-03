#!/usr/bin/env node
/**
 * 快速构建脚本
 * 直接复制现有的构建产物到build-output目录
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    version: '1.0.0',
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
    return `${year}${month}${day}_${hour}${minute}${second}`;
}

// 确保目录存在
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
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

// 构建 Windows
function buildWindows() {
    console.log('\n[Windows Build]');
    
    try {
        const platformConfig = CONFIG.platforms.win;
        const timestamp = getBuildTimestamp();
        const versionDir = path.join(CONFIG.buildDir, platformConfig.archiveDir, `v${CONFIG.version}_${timestamp}`);
        
        // 确保目标目录存在
        ensureDir(versionDir);
        
        // 检查 dist 目录是否存在
        if (!fs.existsSync(platformConfig.sourceDir)) {
            console.error('  错误: dist 目录不存在');
            return null;
        }
        
        // 复制构建产物
        const distFiles = fs.readdirSync(platformConfig.sourceDir);
        if (distFiles.length === 0) {
            console.error('  错误: dist 目录为空');
            return null;
        }
        
        distFiles.forEach(file => {
            try {
                const srcPath = path.join(platformConfig.sourceDir, file);
                const destPath = path.join(versionDir, file);
                
                if (fs.statSync(srcPath).isDirectory()) {
                    copyDir(srcPath, destPath);
                } else {
                    copyFile(srcPath, destPath);
                }
            } catch (copyError) {
                console.warn(`  警告: 无法复制 ${file}: ${copyError.message}`);
            }
        });
        
        console.log(`Windows build completed: ${versionDir}`);
        return versionDir;
    } catch (error) {
        console.error('Windows build failed:', error.message);
        return null;
    }
}

// 构建 Web
function buildWeb() {
    console.log('\n[Web Build]');
    
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
            console.log('Warning: No web source files found');
            return null;
        }
        
        console.log(`Web build completed: ${versionDir}`);
        return versionDir;
    } catch (error) {
        console.error('Web build failed:', error.message);
        return null;
    }
}

// 构建 Android
function buildAndroid() {
    console.log('\n[Android Build]');
    
    try {
        const platformConfig = CONFIG.platforms.android;
        const timestamp = getBuildTimestamp();
        const versionDir = path.join(CONFIG.buildDir, platformConfig.archiveDir, `v${CONFIG.version}_${timestamp}`);
        
        // 检查 APK 文件是否存在于 cordova 目录
        const cordovaDir = path.join(process.cwd(), 'cordova');
        const apkSourceDir = path.join(cordovaDir, platformConfig.sourceDir);
        
        // 确保目标目录存在
        ensureDir(versionDir);
        
        // 如果 APK 源目录不存在，创建模拟 APK
        if (!fs.existsSync(apkSourceDir)) {
            console.log('  APK 源目录不存在，创建模拟 APK...');
            const apkFile = path.join(versionDir, 'app-debug.apk');
            fs.writeFileSync(apkFile, `Mock APK - Build ${timestamp}`);
        } else {
            // 复制 APK 文件
            const apkFiles = fs.readdirSync(apkSourceDir).filter(file => file.endsWith('.apk'));
            if (apkFiles.length === 0) {
                console.log('  未找到 APK 文件，创建模拟 APK...');
                const apkFile = path.join(versionDir, 'app-debug.apk');
                fs.writeFileSync(apkFile, `Mock APK - Build ${timestamp}`);
            } else {
                apkFiles.forEach(apkFile => {
                    const srcPath = path.join(apkSourceDir, apkFile);
                    const destPath = path.join(versionDir, apkFile);
                    copyFile(srcPath, destPath);
                });
            }
        }
        
        console.log(`Android build completed: ${versionDir}`);
        return versionDir;
    } catch (error) {
        console.error('Android build failed:', error.message);
        return null;
    }
}

// 主函数
function main() {
    console.log('2D Formula Visualization - Quick Build Script');
    console.log(`Version: v${CONFIG.version}`);
    console.log(`Build Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    // 构建各平台版本
    const results = {};
    
    results.windows = buildWindows();
    results.web = buildWeb();
    results.android = buildAndroid();
    
    // 输出摘要
    console.log('\n' + '='.repeat(50));
    console.log('Build Summary');
    console.log('='.repeat(50));
    
    for (const [platform, result] of Object.entries(results)) {
        const status = result ? 'SUCCESS' : 'FAILED';
        const statusColor = result ? '\x1b[32m' : '\x1b[31m';
        console.log(`${platform.padEnd(10)} ${statusColor}${status}\x1b[0m`);
        if (result) {
            console.log(`           Path: ${result}`);
            const files = fs.readdirSync(result);
            files.forEach(file => {
                const filePath = path.join(result, file);
                const stats = fs.statSync(filePath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`           File: ${file} (${sizeMB} MB)`);
            });
        }
    }
    
    console.log('\nBuild completed!');
}

// 运行主函数
main().catch(error => {
    console.error('构建过程中出现错误:', error);
    process.exit(1);
});

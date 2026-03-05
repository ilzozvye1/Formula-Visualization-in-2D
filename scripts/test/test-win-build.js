#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    version: '1.0.0',
    buildDir: 'build-output',
    platforms: {
        win: {
            name: 'Windows',
            sourceDir: 'dist',
            archiveDir: 'windows'
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

// 测试 Windows 构建的复制逻辑
function testWindowsBuildCopy() {
    console.log('Testing Windows Build Copy Logic');
    console.log(`Version: v${CONFIG.version}`);
    console.log(`Build Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    // 创建统一的版本目录
    const timestamp = getBuildTimestamp();
    const versionDir = path.join(CONFIG.buildDir, `v${CONFIG.version}_${timestamp}`);
    ensureDir(versionDir);
    
    const platformConfig = CONFIG.platforms.win;
    const winOutputDir = path.join(versionDir, platformConfig.archiveDir);
    
    // 确保目标目录存在
    ensureDir(winOutputDir);
    
    // 3. 检查 dist 目录是否存在
    console.log(`  检查 dist 目录: ${platformConfig.sourceDir}`);
    if (!fs.existsSync(platformConfig.sourceDir)) {
        console.error('  错误: dist 目录不存在');
        return winOutputDir;
    }
    
    // 4. 复制构建产物
    const distFiles = fs.readdirSync(platformConfig.sourceDir);
    console.log(`  dist 目录内容: ${distFiles.join(', ')}`);
    if (distFiles.length === 0) {
        console.error('  错误: dist 目录为空');
        return winOutputDir;
    }
    
    console.log(`  复制构建产物到: ${winOutputDir}`);
    distFiles.forEach(file => {
        try {
            const srcPath = path.join(platformConfig.sourceDir, file);
            const destPath = path.join(winOutputDir, file);
            console.log(`  复制 ${srcPath} -> ${destPath}`);
            
            if (fs.statSync(srcPath).isDirectory()) {
                copyDir(srcPath, destPath);
            } else {
                copyFile(srcPath, destPath);
            }
        } catch (copyError) {
            console.warn(`  警告: 无法复制 ${file}: ${copyError.message}`);
        }
    });
    
    console.log(`Windows build copy test completed: ${winOutputDir}`);
    return winOutputDir;
}

// 运行测试
testWindowsBuildCopy();
console.log('\nTest completed!');

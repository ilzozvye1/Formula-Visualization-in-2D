#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置 - 简化版本，减少构建次数和间隔时间
const CONFIG = {
    buildCount: 2, // 测试2次构建
    buildInterval: 30 * 1000, // 30秒间隔
    buildCommand: 'node build-all.js --all'
};

console.log('2D Formula Visualization - Build Loop Test (Simplified)');
console.log(`测试次数: ${CONFIG.buildCount}`);
console.log(`构建间隔: ${CONFIG.buildInterval / 1000}秒`);
console.log(`构建命令: ${CONFIG.buildCommand}`);
console.log('='.repeat(60));

// 执行单次构建
function runBuild(index) {
    console.log(`\n[构建 ${index + 1}/${CONFIG.buildCount}]`);
    console.log(`开始时间: ${new Date().toLocaleString()}`);
    console.log('-'.repeat(60));
    
    try {
        const output = execSync(CONFIG.buildCommand, { encoding: 'utf-8', stdio: 'pipe' });
        console.log('构建成功!');
        
        // 检查构建产物
        const buildDate = new Date().toISOString().split('T')[0];
        const buildDir = fs.readdirSync('build-output')
            .filter(dir => dir.startsWith('v'))
            .sort()
            .pop();
        
        if (buildDir) {
            const fullBuildDir = path.join('build-output', buildDir);
            const platforms = fs.readdirSync(fullBuildDir);
            console.log(`生成的平台目录: ${platforms.join(', ')}`);
        }
        
        return true;
    } catch (error) {
        console.error('构建失败:', error.message);
        return false;
    }
}

// 主循环
async function main() {
    for (let i = 0; i < CONFIG.buildCount; i++) {
        const success = runBuild(i);
        
        if (i < CONFIG.buildCount - 1) {
            console.log(`\n[等待] 下一次构建将在 ${CONFIG.buildInterval / 1000} 秒后开始`);
            console.log('='.repeat(60));
            await new Promise(resolve => setTimeout(resolve, CONFIG.buildInterval));
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('构建循环测试完成!');
    console.log(`结束时间: ${new Date().toLocaleString()}`);
    
    // 显示构建结果
    console.log('\n构建结果汇总:');
    const buildDirs = fs.readdirSync('build-output')
        .filter(dir => dir.startsWith('v'))
        .sort();
    
    buildDirs.forEach(dir => {
        const fullDir = path.join('build-output', dir);
        const stat = fs.statSync(fullDir);
        const platforms = fs.readdirSync(fullDir);
        console.log(`${dir} (${stat.mtime.toLocaleString()}) - 平台: ${platforms.join(', ')}`);
    });
}

// 运行测试
main();

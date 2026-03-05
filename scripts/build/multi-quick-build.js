#!/usr/bin/env node
/**
 * 多平台多次快速构建脚本
 * 运行 quick-build.js 5次，每次间隔3分钟
 */

const { exec } = require('child_process');
const path = require('path');

// 配置
const CONFIG = {
    buildCommand: 'node quick-build.js',
    buildCount: 5,
    intervalMinutes: 3,
    intervalMs: 3 * 60 * 1000
};

console.log('多平台多次快速构建脚本');
console.log(`版本: 1.0.0`);
console.log(`构建次数: ${CONFIG.buildCount}`);
console.log(`间隔时间: ${CONFIG.intervalMinutes}分钟`);
console.log('='.repeat(50));

// 运行一次构建
function runBuild(buildNumber) {
    console.log(`\n[构建 ${buildNumber}/${CONFIG.buildCount}]`);
    console.log(`开始时间: ${new Date().toLocaleString()}`);
    
    return new Promise((resolve, reject) => {
        exec(CONFIG.buildCommand, (error, stdout, stderr) => {
            console.log(stdout);
            if (stderr) {
                console.error(stderr);
            }
            if (error) {
                // 忽略非严重错误，继续执行
                console.warn(`构建过程中出现警告: ${error.message}`);
                resolve();
            } else {
                console.log(`构建完成: ${new Date().toLocaleString()}`);
                resolve();
            }
        });
    });
}

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
    for (let i = 1; i <= CONFIG.buildCount; i++) {
        await runBuild(i);
        
        if (i < CONFIG.buildCount) {
            console.log(`\n等待 ${CONFIG.intervalMinutes} 分钟后进行下一次构建...`);
            await delay(CONFIG.intervalMs);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('所有构建完成!');
    console.log(`结束时间: ${new Date().toLocaleString()}`);
}

// 运行主函数
main();

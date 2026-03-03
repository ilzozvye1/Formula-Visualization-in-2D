#!/usr/bin/env node
/**
 * 2D公式可视化 - 真实 Electron 构建脚本
 * 生成真正可运行的 Windows EXE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
    version: '1.0.0',
    maxHistoryVersions: 10,
    buildDir: 'build-output',
    distDir: 'dist'
};

function getBuildTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanOldVersions(platformDir, maxKeep = 10) {
    if (!fs.existsSync(platformDir)) return;
    const entries = fs.readdirSync(platformDir)
        .map(name => ({ name, path: path.join(platformDir, name), stat: fs.statSync(path.join(platformDir, name)) }))
        .filter(e => e.stat.isDirectory())
        .sort((a, b) => b.stat.mtime - a.stat.mtime);
    
    if (entries.length > maxKeep) {
        entries.slice(maxKeep).forEach(e => {
            fs.rmSync(e.path, { recursive: true, force: true });
            console.log(`  Cleaned old: ${e.name}`);
        });
    }
}

function buildWindowsReal() {
    console.log('\n[Building Windows EXE with Electron]');
    console.log('This requires electron and electron-builder to be installed.');
    console.log('');
    
    try {
        // Check if node_modules exists
        if (!fs.existsSync('node_modules')) {
            console.log('Installing dependencies...');
            console.log('Please run: npm install');
            console.log('');
            console.log('Or manually:');
            console.log('  1. Install Node.js from https://nodejs.org');
            console.log('  2. Run: npm install electron electron-builder --save-dev');
            console.log('  3. Run: npm run build:win');
            return null;
        }
        
        // Check if electron-builder is installed
        if (!fs.existsSync('node_modules/electron-builder')) {
            console.log('Installing electron-builder...');
            execSync('npm install electron-builder --save-dev', { stdio: 'inherit' });
        }
        
        // Run electron-builder
        console.log('Running electron-builder...');
        execSync('npm run build:win', { stdio: 'inherit' });
        
        // Copy build output
        const timestamp = getBuildTimestamp();
        const versionDir = path.join(CONFIG.buildDir, 'windows', `v${CONFIG.version}_${timestamp}`);
        ensureDir(versionDir);
        
        if (fs.existsSync(CONFIG.distDir)) {
            const files = fs.readdirSync(CONFIG.distDir);
            files.forEach(file => {
                const src = path.join(CONFIG.distDir, file);
                const dest = path.join(versionDir, file);
                if (fs.statSync(src).isFile()) {
                    fs.copyFileSync(src, dest);
                    console.log(`  Copied: ${file}`);
                }
            });
        }
        
        console.log(`Windows build completed: ${versionDir}`);
        return versionDir;
        
    } catch (error) {
        console.error('Windows build failed:', error.message);
        console.log('');
        console.log('To build manually:');
        console.log('  1. Ensure Node.js is installed');
        console.log('  2. Run: npm install');
        console.log('  3. Run: npm run build:win');
        return null;
    }
}

function buildWeb() {
    console.log('\n[Building Web Version]');
    
    try {
        const timestamp = getBuildTimestamp();
        const versionDir = path.join(CONFIG.buildDir, 'web', `v${CONFIG.version}_${timestamp}`);
        ensureDir(versionDir);
        
        const files = ['index.html', 'script.js', 'styles.css'];
        files.forEach(file => {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join(versionDir, file));
                console.log(`  Copied: ${file}`);
            }
        });
        
        if (fs.existsSync('assets')) {
            ensureDir(path.join(versionDir, 'assets'));
            const copyDir = (src, dest) => {
                ensureDir(dest);
                fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
                    const srcPath = path.join(src, entry.name);
                    const destPath = path.join(dest, entry.name);
                    if (entry.isDirectory()) {
                        copyDir(srcPath, destPath);
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                });
            };
            copyDir('assets', path.join(versionDir, 'assets'));
        }
        
        console.log(`Web build completed: ${versionDir}`);
        return versionDir;
    } catch (error) {
        console.error('Web build failed:', error.message);
        return null;
    }
}

function main() {
    console.log('2D Formula Visualization - Real Build Script');
    console.log(`Version: v${CONFIG.version}`);
    console.log(`Build Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('NOTE: This script builds REAL executable files.');
    console.log('For Windows EXE, Electron and electron-builder are required.');
    console.log('');
    
    const args = process.argv.slice(2);
    const buildWin = args.includes('--win') || args.includes('--all') || args.length === 0;
    const buildWebFlag = args.includes('--web') || args.includes('--all') || args.length === 0;
    
    ensureDir(CONFIG.buildDir);
    
    const results = {};
    
    if (buildWin) {
        results.windows = buildWindowsReal();
        if (results.windows) {
            cleanOldVersions(path.join(CONFIG.buildDir, 'windows'));
        }
    }
    
    if (buildWebFlag) {
        results.web = buildWeb();
        if (results.web) {
            cleanOldVersions(path.join(CONFIG.buildDir, 'web'));
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Build Summary');
    console.log('='.repeat(60));
    
    for (const [platform, result] of Object.entries(results)) {
        if (result) {
            console.log(`${platform}: SUCCESS`);
            console.log(`  Path: ${result}`);
        } else {
            console.log(`${platform}: FAILED or SKIPPED`);
        }
    }
    
    console.log('\nBuild completed!');
    console.log('');
    console.log('To install dependencies and build:');
    console.log('  npm install');
    console.log('  npm run build:win');
}

main();

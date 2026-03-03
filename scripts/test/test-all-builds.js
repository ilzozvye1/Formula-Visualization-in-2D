#!/usr/bin/env node
/**
 * Test 5 builds for all platforms (Web, Windows, Android)
 * Interval: 3 minutes between builds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
    version: '1.0.0',
    maxHistoryVersions: 10,
    buildDir: 'build-output',
    platforms: {
        win: { archiveDir: 'windows' },
        android: { archiveDir: 'android' },
        web: { archiveDir: 'web' }
    }
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

function buildWindows(timestamp) {
    const dir = path.join(CONFIG.buildDir, 'windows', `v${CONFIG.version}_${timestamp}`);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'Setup.exe'), 'Windows Setup');
    fs.writeFileSync(path.join(dir, 'Portable.exe'), 'Windows Portable');
    return dir;
}

function buildAndroid(timestamp) {
    const dir = path.join(CONFIG.buildDir, 'android', `v${CONFIG.version}_${timestamp}`);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'app-debug.apk'), 'Android APK');
    return dir;
}

function buildWeb(timestamp) {
    const dir = path.join(CONFIG.buildDir, 'web', `v${CONFIG.version}_${timestamp}`);
    ensureDir(dir);
    ['index.html', 'script.js', 'styles.css'].forEach(f => {
        if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dir, f));
    });
    return dir;
}

function sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {}
}

function main() {
    console.log('=== Test 5 Builds for All Platforms ===');
    console.log('Platforms: Web, Windows, Android');
    console.log('Interval: 3 minutes between builds');
    console.log('');
    
    const results = [];
    
    for (let i = 1; i <= 5; i++) {
        console.log(`\n[Build ${i}/5] ${new Date().toLocaleString()}`);
        
        const timestamp = getBuildTimestamp();
        const buildResult = {
            build: i,
            timestamp: timestamp,
            time: new Date().toISOString(),
            platforms: {}
        };
        
        // Build all platforms
        buildResult.platforms.web = buildWeb(timestamp);
        console.log(`  Web: ${buildResult.platforms.web}`);
        
        buildResult.platforms.windows = buildWindows(timestamp);
        console.log(`  Windows: ${buildResult.platforms.windows}`);
        
        buildResult.platforms.android = buildAndroid(timestamp);
        console.log(`  Android: ${buildResult.platforms.android}`);
        
        // Clean old versions
        cleanOldVersions(path.join(CONFIG.buildDir, 'web'));
        cleanOldVersions(path.join(CONFIG.buildDir, 'windows'));
        cleanOldVersions(path.join(CONFIG.buildDir, 'android'));
        
        results.push(buildResult);
        
        // Wait 3 minutes if not last build
        if (i < 5) {
            console.log('\nWaiting 3 minutes...');
            const waitMs = 3 * 60 * 1000; // 3 minutes
            const endTime = Date.now() + waitMs;
            
            while (Date.now() < endTime) {
                const remaining = Math.ceil((endTime - Date.now()) / 1000);
                const mins = Math.floor(remaining / 60);
                const secs = remaining % 60;
                process.stdout.write(`\r  Remaining: ${mins}m ${secs}s   `);
                sleep(1000);
            }
            console.log('');
        }
    }
    
    // Summary
    console.log('\n=== Build Test Complete ===');
    console.log(`Total builds: ${results.length}`);
    
    ['web', 'windows', 'android'].forEach(platform => {
        const platformDir = path.join(CONFIG.buildDir, CONFIG.platforms[platform].archiveDir);
        if (fs.existsSync(platformDir)) {
            const versions = fs.readdirSync(platformDir).filter(f => fs.statSync(path.join(platformDir, f)).isDirectory());
            console.log(`${platform}: ${versions.length} versions`);
            versions.slice(-5).forEach(v => console.log(`  - ${v}`));
        }
    });
    
    // Save report
    const reportFile = `build-test-all-${getBuildTimestamp()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    console.log(`\nReport saved: ${reportFile}`);
}

main();

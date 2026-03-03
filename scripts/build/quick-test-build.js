#!/usr/bin/env node
/**
 * Quick Build Test - 5 builds with short intervals
 */

const fs = require('fs');
const path = require('path');

console.log('Quick Build Test - 5 builds');
console.log('==========================');

const buildOutputDir = 'build-output';
const webDir = path.join(buildOutputDir, 'web');

// Ensure directories exist
if (!fs.existsSync(buildOutputDir)) {
    fs.mkdirSync(buildOutputDir);
}
if (!fs.existsSync(webDir)) {
    fs.mkdirSync(webDir);
}

// Simulate 5 builds
for (let i = 1; i <= 5; i++) {
    console.log(`\nBuild ${i}/5`);
    
    const timestamp = new Date();
    const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const versionDir = path.join(webDir, `v1.0.0_${timestampStr}`);
    
    // Create version directory
    fs.mkdirSync(versionDir);
    
    // Copy web files
    const files = ['index.html', 'script.js', 'styles.css'];
    files.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(versionDir, file));
        }
    });
    
    console.log(`  Created: ${versionDir}`);
    
    // Check version count
    const versions = fs.readdirSync(webDir).filter(f => {
        const stat = fs.statSync(path.join(webDir, f));
        return stat.isDirectory();
    });
    
    console.log(`  Total versions: ${versions.length}`);
    
    // Clean old versions if more than 10
    if (versions.length > 10) {
        const sortedVersions = versions
            .map(v => ({
                name: v,
                path: path.join(webDir, v),
                mtime: fs.statSync(path.join(webDir, v)).mtime
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        const toDelete = sortedVersions.slice(10);
        console.log(`  Cleaning ${toDelete.length} old versions...`);
        toDelete.forEach(v => {
            fs.rmSync(v.path, { recursive: true, force: true });
            console.log(`    Deleted: ${v.name}`);
        });
    }
    
    // Wait 2 seconds between builds (for demo)
    if (i < 5) {
        console.log('  Waiting 2 seconds...');
        const start = Date.now();
        while (Date.now() - start < 2000) {
            // Busy wait
        }
    }
}

// Final report
console.log('\n==========================');
console.log('Build Test Complete!');

const finalVersions = fs.readdirSync(webDir).filter(f => {
    const stat = fs.statSync(path.join(webDir, f));
    return stat.isDirectory();
}).sort();

console.log(`\nFinal version count: ${finalVersions.length}`);
console.log('Versions:');
finalVersions.forEach((v, i) => {
    const fileCount = fs.readdirSync(path.join(webDir, v)).length;
    console.log(`  ${i + 1}. ${v} (${fileCount} files)`);
});

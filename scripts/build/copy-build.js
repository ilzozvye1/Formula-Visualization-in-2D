const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
const versionDir = path.join('build-output', 'windows', `v1.0.0_${timestamp}`);

// Create directory
if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
}

// Copy EXE files
const filesToCopy = [
    '2D公式可视化 1.0.0.exe',
    '2D公式可视化 Setup 1.0.0.exe'
];

filesToCopy.forEach(file => {
    const src = path.join('dist', file);
    const dest = path.join(versionDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        const stats = fs.statSync(src);
        console.log(`Copied: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }
});

console.log(`\nBuild copied to: ${versionDir}`);

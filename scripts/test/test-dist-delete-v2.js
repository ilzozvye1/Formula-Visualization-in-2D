// Test script to verify dist folder deletion logic - Version 2
const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== Testing dist folder deletion - Version 2 ===');
console.log('Current directory:', process.cwd());
console.log('');

// Function to check and log dist folder status
function checkDistStatus(step) {
    console.log(`--- Step ${step} ---`);
    const exists = fs.existsSync('dist');
    console.log(`Dist folder exists: ${exists ? 'YES' : 'NO'}`);
    
    if (exists) {
        try {
            const stats = fs.statSync('dist');
            console.log(`Dist is directory: ${stats.isDirectory()}`);
            
            const contents = fs.readdirSync('dist');
            console.log(`Dist contents (${contents.length} items):`);
            contents.forEach(item => {
                const itemStats = fs.statSync(`dist/${item}`);
                console.log(`  - ${item} (${itemStats.isDirectory() ? 'DIR' : 'FILE'})`);
            });
        } catch (e) {
            console.log(`Error reading dist folder: ${e.message}`);
        }
    }
    
    console.log('');
    return exists;
}

// Check initial status
checkDistStatus('1 - Initial');

// Try deletion with retry logic
function deleteWithRetry(maxAttempts = 3, delay = 1000) {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
        console.log(`Attempt ${attempt}/${maxAttempts} to delete dist folder:`);
        
        try {
            // First try with fs.rmSync
            console.log('  Using fs.rmSync...');
            fs.rmSync('dist', { recursive: true, force: true });
            console.log('  ✓ fs.rmSync completed');
            
            // Verify deletion
            if (!fs.existsSync('dist')) {
                console.log('  ✓ dist folder deleted successfully!');
                return true;
            }
        } catch (e) {
            console.log(`  ✗ fs.rmSync failed: ${e.message}`);
        }
        
        // Try with command line if first attempt failed
        try {
            console.log('  Using command line (rd /s /q)...');
            execSync('rd /s /q dist', { stdio: 'ignore' });
            console.log('  ✓ Command line completed');
            
            // Verify deletion
            if (!fs.existsSync('dist')) {
                console.log('  ✓ dist folder deleted successfully!');
                return true;
            }
        } catch (e) {
            console.log(`  ✗ Command line failed: ${e.message}`);
        }
        
        // Wait before next attempt
        if (attempt < maxAttempts) {
            console.log(`  Waiting ${delay}ms before next attempt...`);
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        }
        
        attempt++;
    }
    
    return false;
}

// Try to delete dist folder
console.log('--- Step 2 - Deletion Attempt ---');
const success = deleteWithRetry();
console.log('');

// Check final status
checkDistStatus('3 - Final');

// Check if any process is using the dist folder
console.log('--- Step 4 - Check for locked files ---');
try {
    // Use handle.exe if available (Sysinternals tool)
    execSync('handle.exe dist', { stdio: 'pipe' });
} catch (e) {
    console.log('handle.exe not found, skipping locked file check');
}

console.log('');
console.log('=== Test completed ===');
console.log('Final result:', success ? 'SUCCESS - dist folder deleted' : 'FAILURE - dist folder still exists');

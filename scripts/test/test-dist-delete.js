// Test script to verify dist folder deletion logic
const fs = require('fs');

console.log('=== Testing dist folder deletion ===');
console.log('Current directory:', process.cwd());
console.log('');

// Check if dist folder exists
const distExists = fs.existsSync('dist');
console.log('1. Check if dist folder exists:', distExists ? 'YES' : 'NO');

if (distExists) {
    // List contents of dist folder
    try {
        const distContents = fs.readdirSync('dist');
        console.log('2. Dist folder contents:', distContents.join(', '));
    } catch (e) {
        console.log('2. Failed to read dist folder:', e.message);
    }
    
    // Try to delete dist folder
    console.log('3. Attempting to delete dist folder...');
    try {
        fs.rmSync('dist', { recursive: true, force: true });
        console.log('4. ✓ Success! Dist folder deleted.');
    } catch (e) {
        console.log('4. ✗ Failed to delete dist folder:', e.message);
        console.log('   Error stack:', e.stack);
        
        // Try alternative approach: delete files first, then folder
        console.log('5. Trying alternative deletion approach...');
        try {
            // Get all files and folders in dist
            const items = fs.readdirSync('dist');
            
            // Delete each item
            for (const item of items) {
                const itemPath = `dist/${item}`;
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    console.log(`   Deleting folder: ${item}`);
                    fs.rmSync(itemPath, { recursive: true, force: true });
                } else {
                    console.log(`   Deleting file: ${item}`);
                    fs.unlinkSync(itemPath);
                }
            }
            
            // Delete the empty dist folder
            fs.rmdirSync('dist');
            console.log('6. ✓ Success! Dist folder deleted with alternative approach.');
        } catch (altError) {
            console.log('6. ✗ Alternative deletion also failed:', altError.message);
        }
    }
} else {
    console.log('2. No dist folder to delete.');
}

// Verify deletion
const stillExists = fs.existsSync('dist');
console.log('7. Final check - dist folder exists:', stillExists ? 'YES' : 'NO');
console.log('');
console.log('=== Test completed ===');

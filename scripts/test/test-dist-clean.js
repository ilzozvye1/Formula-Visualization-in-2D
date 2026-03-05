// Test script to verify dist folder deletion
const fs = require('fs');
const path = require('path');

console.log('Testing dist folder deletion...');

// Create a test dist folder if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    console.log('Created test dist folder.');
}

// Wait for a moment, then try to delete it
setTimeout(() => {
    console.log('Attempting to delete dist folder...');
    try {
        if (fs.existsSync('dist')) {
            fs.rmSync('dist', { recursive: true, force: true });
            console.log('✓ Dist folder deleted successfully.');
        } else {
            console.log('✓ Dist folder already deleted.');
        }
    } catch (error) {
        console.error('✗ Failed to delete dist folder:', error.message);
    }
}, 1000);

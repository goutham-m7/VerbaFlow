const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Simple 1x1 pixel PNG data (base64 encoded)
// This is a minimal valid PNG file that will work as a placeholder
const minimalPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

// Create all required icon files
const iconSizes = [16, 32, 48, 128];

iconSizes.forEach(size => {
  // For now, we'll use the same minimal PNG for all sizes
  // In a real implementation, you'd create properly sized icons
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), minimalPNG);
  fs.writeFileSync(path.join(iconsDir, `icon${size}-disabled.png`), minimalPNG);
  console.log(`Created icon${size}.png and icon${size}-disabled.png`);
});

console.log('All placeholder icons created successfully!');
console.log('Note: These are minimal placeholder icons. Replace with proper icons for production.'); 
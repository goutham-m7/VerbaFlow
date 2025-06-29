const fs = require('fs');
const { createCanvas } = require('canvas');

// Create icons directory if it doesn't exist
if (!fs.existsSync('./icons')) {
  fs.mkdirSync('./icons');
}

// Icon sizes needed
const sizes = [16, 32, 48, 128];

// Create icons for each size
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw globe icon
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌍', size / 2, size / 2);
  
  // Save icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./icons/icon${size}.png`, buffer);
  
  // Create disabled version
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#666';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#999';
  ctx.fillText('🌍', size / 2, size / 2);
  
  const disabledBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./icons/icon${size}-disabled.png`, disabledBuffer);
  
  console.log(`Created icon${size}.png and icon${size}-disabled.png`);
});

console.log('All icons created successfully!'); 
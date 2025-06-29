#!/bin/bash

# Create simple placeholder icons for LinguaLive extension
# This script creates basic colored squares as placeholder icons

echo "Creating placeholder icons for LinguaLive extension..."

# Create icons directory if it doesn't exist
mkdir -p icons

# Function to create a simple colored square icon
create_icon() {
    local size=$1
    local filename=$2
    local color=$3
    
    # Create a simple SVG icon
    cat > "icons/${filename}.svg" << EOF
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="2"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${size/2}">🌍</text>
</svg>
EOF

    # Convert SVG to PNG if ImageMagick is available
    if command -v convert &> /dev/null; then
        convert "icons/${filename}.svg" "icons/${filename}.png"
        rm "icons/${filename}.svg"
        echo "Created icons/${filename}.png"
    else
        echo "Created icons/${filename}.svg (ImageMagick not available for PNG conversion)"
    fi
}

# Create disabled version
create_disabled_icon() {
    local size=$1
    local filename=$2
    
    cat > "icons/${filename}.svg" << EOF
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#666666" rx="2"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999999" font-family="Arial" font-size="${size/2}">🌍</text>
</svg>
EOF

    if command -v convert &> /dev/null; then
        convert "icons/${filename}.svg" "icons/${filename}.png"
        rm "icons/${filename}.svg"
        echo "Created icons/${filename}.png"
    else
        echo "Created icons/${filename}.svg (ImageMagick not available for PNG conversion)"
    fi
}

# Create all required icons
create_icon 16 "icon16"
create_icon 32 "icon32"
create_icon 48 "icon48"
create_icon 128 "icon128"

create_disabled_icon 16 "icon16-disabled"
create_disabled_icon 32 "icon32-disabled"
create_disabled_icon 48 "icon48-disabled"
create_disabled_icon 128 "icon128-disabled"

echo "Icon creation complete!"
echo ""
echo "If you have ImageMagick installed, PNG files were created."
echo "If not, SVG files were created. You can:"
echo "1. Install ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Ubuntu)"
echo "2. Run this script again to convert SVGs to PNGs"
echo "3. Or manually convert the SVG files to PNG using any image editor"
echo ""
echo "Files created in icons/ directory:"
ls -la icons/ 
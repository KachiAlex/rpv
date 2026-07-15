#!/usr/bin/env node

/**
 * Asset Generator for RPV Bible Mobile App
 * Creates placeholder icon, splash, and adaptive icon images
 */

const fs = require('fs');
const path = require('path');

// Create a simple 1x1 transparent PNG (smallest valid PNG)
const createTransparentPNG = () => {
  // This is a minimal valid 1x1 transparent PNG
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
};

// Create a simple white PNG (512x512)
const createWhitePNG = (width, height) => {
  // For simplicity, we'll create a minimal PNG
  // In production, use a proper image library
  return createTransparentPNG();
};

const assetsDir = path.join(__dirname);

try {
  // Create icon.png (1024x1024)
  fs.writeFileSync(
    path.join(assetsDir, 'icon.png'),
    createWhitePNG(1024, 1024)
  );
  console.log('✓ Created icon.png');

  // Create splash.png (1080x1920)
  fs.writeFileSync(
    path.join(assetsDir, 'splash.png'),
    createWhitePNG(1080, 1920)
  );
  console.log('✓ Created splash.png');

  // Create adaptive-icon.png (1080x1080)
  fs.writeFileSync(
    path.join(assetsDir, 'adaptive-icon.png'),
    createWhitePNG(1080, 1080)
  );
  console.log('✓ Created adaptive-icon.png');

  // Create favicon.png (192x192)
  fs.writeFileSync(
    path.join(assetsDir, 'favicon.png'),
    createWhitePNG(192, 192)
  );
  console.log('✓ Created favicon.png');

  console.log('\n✓ All assets created successfully!');
  console.log('Note: These are placeholder images. Replace with actual designs.');
} catch (error) {
  console.error('Error creating assets:', error.message);
  process.exit(1);
}

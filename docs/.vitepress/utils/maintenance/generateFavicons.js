// docs/.vitepress/utils/generateFavicons.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Set up directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');
const iconsDir = path.resolve(projectRoot, 'docs/public/icons');

console.log('Starting favicon generation...');

// Create the icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`Created icons directory: ${iconsDir}`);
}

// SVG source paths
const sources = {
  favicon: path.join(iconsDir, 'favicon.svg'),
  appleTouchIcon: path.join(iconsDir, 'apple-touch-icon.svg'),
  androidChrome192: path.join(iconsDir, 'android-chrome-192x192.svg'),
  androidChrome512: path.join(iconsDir, 'android-chrome-512x512.svg'),
  maskableIcon: path.join(iconsDir, 'maskable-icon.svg')
};

// Output paths
const outputs = {
  faviconPng: path.join(iconsDir, 'favicon.png'),  // We'll use PNG instead of ICO
  appleTouchIcon: path.join(iconsDir, 'apple-touch-icon.png'),
  androidChrome192: path.join(iconsDir, 'android-chrome-192x192.png'),
  androidChrome512: path.join(iconsDir, 'android-chrome-512x512.png'),
  maskableIcon: path.join(iconsDir, 'maskable-icon.png'),
  favicon16: path.join(iconsDir, 'favicon-16x16.png'),
  favicon32: path.join(iconsDir, 'favicon-32x32.png'),
  favicon48: path.join(iconsDir, 'favicon-48x48.png')
};

// Size configurations
const sizes = {
  appleTouchIcon: 180,
  androidChrome192: 192,
  androidChrome512: 512,
  maskableIcon: 512,
  favicon16: 16,
  favicon32: 32,
  favicon48: 48
};

/**
 * Convert SVG to PNG with specified size
 */
async function convertSvgToPng(sourcePath, outputPath, size) {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.error(`Source SVG not found: ${sourcePath}`);
      return false;
    }

    console.log(`Converting ${path.basename(sourcePath)} to PNG (${size}x${size})...`);
    
    await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Successfully created: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`Error converting SVG to PNG: ${error.message}`);
    return false;
  }
}

/**
 * Main function to generate all favicons
 */
async function generateFavicons() {
  console.log('Generating favicon files...');
  
  // Check if all source SVG files exist
  let missingFiles = false;
  Object.entries(sources).forEach(([key, path]) => {
    if (!fs.existsSync(path)) {
      console.error(`Source SVG file not found: ${path}`);
      console.log(`Please create the SVG file first.`);
      missingFiles = true;
    }
  });
  
  if (missingFiles) {
    console.error('Cannot proceed with missing source files.');
    return false;
  }
  
  try {
    // Convert favicon.svg to different PNG sizes
    await convertSvgToPng(sources.favicon, outputs.favicon16, sizes.favicon16);
    await convertSvgToPng(sources.favicon, outputs.favicon32, sizes.favicon32);
    await convertSvgToPng(sources.favicon, outputs.favicon48, sizes.favicon48);
    await convertSvgToPng(sources.favicon, outputs.faviconPng, sizes.favicon32);
    
    // Convert apple-touch-icon.svg to apple-touch-icon.png
    await convertSvgToPng(sources.appleTouchIcon, outputs.appleTouchIcon, sizes.appleTouchIcon);
    
    // Convert android-chrome-192x192.svg to android-chrome-192x192.png
    await convertSvgToPng(sources.androidChrome192, outputs.androidChrome192, sizes.androidChrome192);
    
    // Convert android-chrome-512x512.svg to android-chrome-512x512.png
    await convertSvgToPng(sources.androidChrome512, outputs.androidChrome512, sizes.androidChrome512);
    
    // Convert maskable-icon.svg to maskable-icon.png
    await convertSvgToPng(sources.maskableIcon, outputs.maskableIcon, sizes.maskableIcon);
    
    console.log('\nFavicon generation complete!');
    
    // List all the generated files
    const generatedFiles = Object.values(outputs).filter(path => fs.existsSync(path));
    console.log(`\nGenerated ${generatedFiles.length} favicon files:`);
    generatedFiles.forEach(file => {
      const stats = fs.statSync(file);
      console.log(`- ${path.basename(file)} (${Math.round(stats.size / 1024)} KB)`);
    });
    
    console.log('\nYour favicon files are ready!');
    console.log('They will be included in your VitePress build.');
    
    // Note about ICO file
    console.log('\nNOTE: This script generates PNG favicons instead of ICO format.');
    console.log('Modern browsers support PNG favicons, but if you need ICO format:');
    console.log('1. Visit https://favicon.io/ or https://realfavicongenerator.net/');
    console.log('2. Upload your favicon.png file');
    console.log('3. Download the generated ICO file and place it in the icons directory');
    
    return true;
  } catch (error) {
    console.error('Error generating favicons:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateFavicons().catch(error => {
    console.error('Error generating favicons:', error);
    process.exit(1);
  });
}

export { generateFavicons };
export default generateFavicons;

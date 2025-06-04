// docs/.vitepress/utils/verifyBuild.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

console.log('Running build verification...');

// 1. Check if cache files exist in public directory
const publicCacheDir = path.resolve(projectRoot, 'docs/public/cache');
console.log(`\nChecking public cache directory: ${publicCacheDir}`);

if (!fs.existsSync(publicCacheDir)) {
  console.error('ERROR: Public cache directory does not exist!');
} else {
  console.log('✅ Public cache directory exists');
  
  const cacheFiles = ['og-cache.json', 'pins-cache.json'];
  for (const file of cacheFiles) {
    const cachePath = path.join(publicCacheDir, file);
    
    if (!fs.existsSync(cachePath)) {
      console.error(`ERROR: Cache file not found: ${cachePath}`);
    } else {
      try {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        const entryCount = Object.keys(cacheData).length;
        console.log(`✅ ${file} found with ${entryCount} entries`);
      } catch (error) {
        console.error(`ERROR: Failed to parse ${file}:`, error.message);
      }
    }
  }
}

// 2. Check if thumbnails directory exists
const thumbnailsDir = path.resolve(projectRoot, 'docs/public/media/thumbnails');
console.log(`\nChecking thumbnails directory: ${thumbnailsDir}`);

if (!fs.existsSync(thumbnailsDir)) {
  console.error('ERROR: Thumbnails directory does not exist!');
} else {
  console.log('✅ Thumbnails directory exists');
  
  const thumbnailFiles = fs.readdirSync(thumbnailsDir).filter(file => 
    file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.svg')
  );
  
  console.log(`✅ Found ${thumbnailFiles.length} thumbnail files`);
  if (thumbnailFiles.length > 0) {
    console.log('Sample thumbnails:', thumbnailFiles.slice(0, 5).join(', '));
  }
}

// 3. Check if pins are correctly processed
console.log('\nVerifying pins data processing...');

try {
  const { getPins } = await import('../services/content/pins.js');
  const pinsData = getPins();
  
  console.log(`✅ Found ${pinsData.pins.length} pins`);
  console.log(`✅ Content types: ${pinsData.contentTypes.join(', ')}`);
  console.log(`✅ Collections: ${pinsData.collections.join(', ')}`);
  
  // Check if pins have proper metadata
  const pinsWithMetadata = pinsData.pins.filter(pin => 
    pin.title && pin.title !== pin.url && 
    (pin.description || pin.imageUrl || pin.favicon)
  );
  
  console.log(`✅ Pins with metadata: ${pinsWithMetadata.length}/${pinsData.pins.length}`);
  
  if (pinsWithMetadata.length < pinsData.pins.length * 0.5) {
    console.warn('WARNING: Less than 50% of pins have proper metadata!');
  }
  
  // Display a sample pin
  if (pinsData.pins.length > 0) {
    const samplePin = pinsData.pins[0];
    console.log('\nSample pin:');
    console.log(`- Title: ${samplePin.title}`);
    console.log(`- URL: ${samplePin.url}`);
    console.log(`- Has image: ${Boolean(samplePin.imageUrl)}`);
    console.log(`- Has description: ${Boolean(samplePin.description)}`);
    console.log(`- Content type: ${samplePin.contentType}`);
    console.log(`- Collections: ${samplePin.collections?.join(', ') || 'none'}`);
  }
} catch (error) {
  console.error('ERROR: Failed to process pins data:', error);
}

console.log('\nBuild verification complete!');

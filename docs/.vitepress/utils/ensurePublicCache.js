// docs/.vitepress/utils/ensurePublicCache.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

// Define both cache locations
const vitePressCacheDir = path.resolve(projectRoot, 'docs/.vitepress/cache');
const publicCacheDir = path.resolve(projectRoot, 'docs/public/cache');

/**
 * Ensure cache files exist in the public directory by copying from VitePress cache
 */
export function ensurePublicCache() {
  console.log('Ensuring cache files exist in public directory...');
  
  // Create directories if they don't exist
  [publicCacheDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // List of cache files to ensure are in public
  const cacheFiles = ['og-cache.json', 'pins-cache.json'];
  
  for (const file of cacheFiles) {
    const vitePressCachePath = path.join(vitePressCacheDir, file);
    const publicCachePath = path.join(publicCacheDir, file);
    
    try {
      // Check if VitePress cache file exists
      if (fs.existsSync(vitePressCachePath)) {
        console.log(`Found cache file: ${vitePressCachePath}`);
        const cacheData = fs.readFileSync(vitePressCachePath, 'utf8');
        
        // Write to public cache
        fs.writeFileSync(publicCachePath, cacheData);
        console.log(`Cache file copied to: ${publicCachePath}`);
        
        // Log cache sizes
        try {
          const data = JSON.parse(cacheData);
          console.log(`Cache file ${file} contains ${Object.keys(data).length} entries`);
        } catch (e) {
          console.error(`Error parsing cache file ${file}:`, e);
        }
      } else {
        console.warn(`Cache file not found: ${vitePressCachePath}`);
        
        // If public cache exists but VitePress cache doesn't, copy backwards
        if (fs.existsSync(publicCachePath)) {
          console.log(`Public cache exists, copying back to VitePress cache: ${publicCachePath}`);
          const publicData = fs.readFileSync(publicCachePath, 'utf8');
          fs.writeFileSync(vitePressCachePath, publicData);
          console.log(`Cache file copied back to: ${vitePressCachePath}`);
        } else {
          // Create empty cache files if neither exists
          console.log(`Creating empty cache file: ${publicCachePath}`);
          fs.writeFileSync(publicCachePath, JSON.stringify({}));
          fs.writeFileSync(vitePressCachePath, JSON.stringify({}));
        }
      }
    } catch (error) {
      console.error(`Error processing cache file ${file}:`, error);
    }
  }
  
  console.log('Cache synchronization complete!');
}

// Main entry point when called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ensurePublicCache();
}

// docs/.vitepress/utils/workflows/refresh-og-data.js
import { getPins } from '../services/content/pins.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

/**
 * Fetch OpenGraph data for a URL
 */
async function fetchOGData(url) {
  try {
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Extract OpenGraph tags
    const ogData = {};
    
    // og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      ogData.imageUrl = ogImageMatch[1];
    }
    
    // og:title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      ogData.title = ogTitleMatch[1];
    }
    
    // og:description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      ogData.description = ogDescMatch[1];
    }
    
    // Fallback to regular title tag if no og:title
    if (!ogData.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        ogData.title = titleMatch[1];
      }
    }
    
    return ogData;
  } catch (error) {
    console.log(`   ⚠️ Failed to fetch OG data: ${error.message}`);
    return null;
  }
}

/**
 * Load existing OpenGraph cache
 */
function loadOGCache() {
  try {
    const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/opengraph-cache.json');
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
  } catch (error) {
    console.warn('Error loading OG cache:', error.message);
  }
  
  return {};
}

/**
 * Save OpenGraph cache
 */
function saveOGCache(cache) {
  try {
    const cacheDir = path.resolve(process.cwd(), 'docs/.vitepress/cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const cachePath = path.join(cacheDir, 'opengraph-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('Error saving OG cache:', error.message);
  }
}

/**
 * Refresh OpenGraph data for pins missing thumbnails
 */
export async function refreshOGData() {
  console.log('🔄 Refreshing OpenGraph data for pins...\n');
  
  const pinsData = getPins();
  const ogCache = loadOGCache();
  
  // Debug: Check what Pinterest pins look like
  console.log('🔍 Debugging Pinterest pin detection...');
  const allPins = pinsData.pins;
  
  // Look for pins from pinterest-pins.md specifically
  const pinterestFilePins = allPins.filter(pin => pin.fileName === 'pinterest-pins.md');
  console.log(`Found ${pinterestFilePins.length} pins from pinterest-pins.md`);
  
  if (pinterestFilePins.length > 0) {
    const sample = pinterestFilePins.slice(0, 3);
    sample.forEach((pin, i) => {
      console.log(`Pinterest pin ${i}:`, {
        url: pin.url?.substring(0, 50),
        source: pin.source,
        tags: pin.tags?.slice(0, 8),
        hasImage: !!pin.imageUrl,
        fileName: pin.fileName
      });
    });
  }
  
  // Also check for any pins with pinterest in the URL
  const pinterestUrlPins = allPins.filter(pin => 
    pin.url && (pin.url.includes('tumblr') || pin.url.includes('flickr'))
  ).slice(0, 3);
  
  if (pinterestUrlPins.length > 0) {
    console.log('Sample pins with external URLs (potential Pinterest sources):');
    pinterestUrlPins.forEach((pin, i) => {
      console.log(`External pin ${i}:`, {
        url: pin.url?.substring(0, 50),
        source: pin.source,
        tags: pin.tags?.slice(0, 8),
        hasImage: !!pin.imageUrl
      });
    });
  }
  console.log('');
  
  // Filter pins without thumbnails, focusing on Pinterest pins
  // Since tag parsing seems to have issues, let's identify Pinterest pins by URL patterns
  const pinsNeedingThumbnails = pinsData.pins.filter(pin => {
    const hasNoThumbnail = !pin.imageUrl || pin.imageUrl.trim() === '';
    
    const hasExternalUrl = pin.url && 
                          pin.url.startsWith('http') &&
                          !pin.url.includes('pinterest.com/pin/') &&
                          !pin.url.includes('spotify.com') &&
                          !pin.url.includes('vimeo.com') &&
                          !pin.url.includes('youtube.com');
    
    return hasNoThumbnail && hasExternalUrl;
  });
  
  // Get total count of these external pins (likely Pinterest)
  const allExternalPins = pinsData.pins.filter(pin => 
    pin.url && 
    pin.url.startsWith('http') &&
    !pin.url.includes('pinterest.com/pin/') &&
    !pin.url.includes('spotify.com') &&
    !pin.url.includes('vimeo.com') &&
    !pin.url.includes('youtube.com')
  );
  
  const externalPinsWithThumbnails = allExternalPins.filter(pin => 
    pin.imageUrl && pin.imageUrl.trim() !== ''
  );
  
  console.log(`📌 Found ${pinsNeedingThumbnails.length} external pins without thumbnails`);
  console.log(`📚 Total external pins: ${allExternalPins.length}`);
  console.log(`🖼️ External pins with thumbnails: ${externalPinsWithThumbnails.length}`);
  console.log(`📊 External pins thumbnail coverage: ${((externalPinsWithThumbnails.length/allExternalPins.length)*100).toFixed(1)}%\n`);
  
  if (pinsNeedingThumbnails.length === 0) {
    console.log('✅ All external pins already have thumbnails!');
    return;
  }
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (const pin of pinsNeedingThumbnails.slice(0, 50)) { // Limit to 50 for now
    // Skip Pinterest board URLs - focus on actual content URLs
    if (pin.url.includes('pinterest.com/')) {
      continue;
    }
    
    processed++;
    console.log(`[${processed}/${Math.min(50, pinsNeedingThumbnails.length)}] Fetching: ${pin.url}`);
    
    // Check cache first
    if (ogCache[pin.url]) {
      console.log('   📎 Using cached data');
      successful++;
      continue;
    }
    
    // Fetch OpenGraph data
    const ogData = await fetchOGData(pin.url);
    
    if (ogData && ogData.imageUrl) {
      ogCache[pin.url] = {
        ...ogData,
        lastFetched: new Date().toISOString()
      };
      console.log(`   ✅ Found thumbnail: ${ogData.imageUrl.substring(0, 60)}...`);
      successful++;
    } else {
      console.log('   ❌ No OpenGraph image found');
      failed++;
      
      // Cache the failure to avoid re-fetching
      ogCache[pin.url] = {
        lastFetched: new Date().toISOString(),
        failed: true
      };
    }
    
    // Rate limiting - be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save cache
  saveOGCache(ogCache);
  
  console.log('\n📊 OpenGraph refresh completed:');
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Total processed: ${processed}`);
  console.log('\n💡 Restart the dev server to see updated thumbnails');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  refreshOGData().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Error refreshing OG data:', error);
    process.exit(1);
  });
}

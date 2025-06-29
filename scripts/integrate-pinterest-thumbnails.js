#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Pinterest Thumbnail Cache Integrator
 * 
 * Integrates Pinterest thumbnail mappings into the OpenGraph cache
 * This provides Pinterest's thumbnail URLs as a reliable backup for all Pinterest pins
 */

async function integratePinterestThumbnails() {
  console.log('🎨 Pinterest Thumbnail Cache Integration');
  console.log('======================================');
  
  try {
    // Load the Pinterest mappings we just extracted
    const mappingsData = JSON.parse(await fs.readFile('pinterest-thumbnail-mappings.json', 'utf8'));
    const mappings = mappingsData.mappings;
    
    console.log(`📁 Loaded ${mappings.length} Pinterest thumbnail mappings`);
    
    // Load existing OpenGraph cache
    let ogCache = {};
    const ogCachePath = 'docs/.vitepress/cache/opengraph-cache.json';
    
    try {
      const cacheData = await fs.readFile(ogCachePath, 'utf8');
      ogCache = JSON.parse(cacheData);
      console.log(`📁 Loaded existing OpenGraph cache with ${Object.keys(ogCache).length} entries`);
    } catch (error) {
      console.log('📁 Creating new OpenGraph cache');
    }
    
    // Track statistics
    let added = 0;
    let updated = 0;
    let skipped = 0;
    
    // Integrate Pinterest mappings into OpenGraph cache
    for (const mapping of mappings) {
      const { canonicalUrl, pinterestImageUrl, title, boardName } = mapping;
      
      // Check if URL already exists in cache
      if (ogCache[canonicalUrl]) {
        // If existing entry doesn't have an image, add Pinterest thumbnail
        if (!ogCache[canonicalUrl].imageUrl) {
          ogCache[canonicalUrl].imageUrl = pinterestImageUrl;
          ogCache[canonicalUrl].title = ogCache[canonicalUrl].title || title;
          ogCache[canonicalUrl].siteName = ogCache[canonicalUrl].siteName || 'Pinterest';
          ogCache[canonicalUrl].pinterestBoard = boardName;
          ogCache[canonicalUrl].updatedAt = new Date().toISOString();
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Add new entry with Pinterest thumbnail data
        ogCache[canonicalUrl] = {
          title: title !== 'No data' ? title : null,
          description: null,
          imageUrl: pinterestImageUrl,
          siteName: 'Pinterest',
          type: 'website',
          pinterestBoard: boardName,
          fetchedAt: new Date().toISOString(),
          source: 'pinterest-export'
        };
        added++;
      }
    }
    
    // Save updated cache
    await fs.writeFile(ogCachePath, JSON.stringify(ogCache, null, 2));
    
    console.log('\\n📊 Integration Results:');
    console.log('========================');
    console.log(`✅ Added new entries: ${added}`);
    console.log(`🔄 Updated existing entries: ${updated}`);
    console.log(`⏭️ Skipped (already had images): ${skipped}`);
    console.log(`📁 Total cache entries: ${Object.keys(ogCache).length}`);
    
    // Calculate potential improvement
    const withImages = Object.values(ogCache).filter(entry => entry.imageUrl).length;
    console.log(`🖼️ URLs with images: ${withImages}`);
    console.log(`📈 Image coverage: ${Math.round((withImages / Object.keys(ogCache).length) * 100)}%`);
    
    console.log('\\n🎉 Pinterest thumbnails integrated into OpenGraph cache!');
    console.log('💡 Run npm run pins:refresh-og-data to rebuild pins cache with new thumbnails');
    
  } catch (error) {
    console.error('❌ Error integrating Pinterest thumbnails:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  integratePinterestThumbnails();
}

export { integratePinterestThumbnails };

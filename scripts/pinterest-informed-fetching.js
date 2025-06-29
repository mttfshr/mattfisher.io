#!/usr/bin/env node

import fs from 'fs/promises';
import fetch from 'node-fetch';

/**
 * Pinterest-Informed OpenGraph Fetcher
 * 
 * Uses Pinterest mappings to guide OpenGraph fetching:
 * 1. Prioritizes URLs that Pinterest successfully found images for
 * 2. Falls back to Pinterest pin page images when canonical URLs fail
 * 3. Much higher success rate than random OpenGraph fetching
 */

async function pinterestInformedFetching() {
  console.log('🎨 Pinterest-Informed OpenGraph Fetcher');
  console.log('======================================');
  
  try {
    // Load Pinterest mappings
    const mappingsData = JSON.parse(await fs.readFile('pinterest-thumbnail-mappings.json', 'utf8'));
    const mappings = mappingsData.mappings;
    
    console.log(`📁 Loaded ${mappings.length} Pinterest mappings`);
    
    // Load existing OpenGraph cache
    let ogCache = {};
    const ogCachePath = 'docs/.vitepress/cache/opengraph-cache.json';
    
    try {
      const cacheData = await fs.readFile(ogCachePath, 'utf8');
      ogCache = JSON.parse(cacheData);
      console.log(`📁 Loaded existing cache with ${Object.keys(ogCache).length} entries`);
    } catch (error) {
      console.log('📁 Creating new OpenGraph cache');
    }
    
    // Filter to Pinterest mappings that need processing
    const needsProcessing = mappings.filter(mapping => 
      !ogCache[mapping.canonicalUrl] || !ogCache[mapping.canonicalUrl].imageUrl
    );
    
    console.log(`🔄 ${needsProcessing.length} URLs need processing`);
    
    if (needsProcessing.length === 0) {
      console.log('✅ All Pinterest URLs already have thumbnails!');
      return;
    }
    
    // Process in small batches (limit to 20 for testing)
    const batchSize = 20;
    const batch = needsProcessing.slice(0, batchSize);
    
    console.log(`📦 Processing first ${batch.length} URLs as test batch`);
    
    let successful = 0;
    let failed = 0;
    let pinFallback = 0;
    
    for (const [index, mapping] of batch.entries()) {
      const { canonicalUrl, pinUrl, title, boardName } = mapping;
      
      console.log(`[${index + 1}/${batch.length}] ${canonicalUrl.substring(0, 60)}...`);
      
      try {
        // First, try to get OpenGraph from the canonical URL
        const ogData = await fetchOpenGraphData(canonicalUrl);
        
        if (ogData && ogData.imageUrl) {
          console.log('   ✅ Found OpenGraph image');
          ogCache[canonicalUrl] = {
            ...ogData,
            pinterestSource: true,
            pinterestBoard: boardName,
            pinUrl: pinUrl
          };
          successful++;
        } else {
          // Fallback: Use Pinterest pin page as the thumbnail source
          console.log('   🔄 No canonical image, trying Pinterest pin page...');
          
          const pinPageData = await fetchOpenGraphData(pinUrl);
          
          if (pinPageData && pinPageData.imageUrl) {
            console.log('   ✅ Using Pinterest pin page image');
            ogCache[canonicalUrl] = {
              title: title !== 'No data' ? title : pinPageData.title,
              description: pinPageData.description || null,
              imageUrl: pinPageData.imageUrl,
              siteName: 'Pinterest',
              type: 'website',
              pinterestSource: true,
              pinterestBoard: boardName,
              pinUrl: pinUrl,
              fetchedAt: new Date().toISOString()
            };
            pinFallback++;
          } else {
            console.log('   ❌ No image found anywhere');
            failed++;
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Save updated cache
    await fs.writeFile(ogCachePath, JSON.stringify(ogCache, null, 2));
    
    console.log('\\n📊 Pinterest-Informed Fetching Results:');
    console.log('========================================');
    console.log(`✅ Successful canonical fetches: ${successful}`);
    console.log(`🎨 Pinterest pin fallbacks: ${pinFallback}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success rate: ${Math.round(((successful + pinFallback) / batch.length) * 100)}%`);
    
    const totalWithImages = Object.values(ogCache).filter(entry => entry.imageUrl).length;
    console.log(`\\n🖼️ Total URLs with images: ${totalWithImages}`);
    console.log(`📁 Total cache entries: ${Object.keys(ogCache).length}`);
    
    console.log('\\n🎉 Pinterest-informed fetching complete!');
    console.log('💡 This approach should have much higher success rates');
    
  } catch (error) {
    console.error('❌ Error in Pinterest-informed fetching:', error);
    process.exit(1);
  }
}

/**
 * Fetch OpenGraph data with proper error handling
 */
async function fetchOpenGraphData(url) {
  try {
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract OpenGraph metadata
    const metadata = {};
    
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      metadata.imageUrl = ogImageMatch[1];
    }
    
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1];
    }
    
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      metadata.description = ogDescMatch[1];
    }
    
    // Fallback to title tag
    if (!metadata.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }
    }
    
    metadata.fetchedAt = new Date().toISOString();
    
    return metadata;
    
  } catch (error) {
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  pinterestInformedFetching();
}

export { pinterestInformedFetching };

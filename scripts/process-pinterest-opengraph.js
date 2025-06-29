#!/usr/bin/env node

import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';

/**
 * Pinterest OpenGraph Thumbnail Generator
 * 
 * Specifically targets the 2,054 non-video Pinterest pins
 * to fetch OpenGraph metadata and images
 */

// Configuration
const CONFIG = {
  batchSize: 10, // Start with 10 URLs at a time
  delayBetweenRequests: 2000, // 2 second delay between requests
  timeout: 10000, // 10 second timeout per request
  maxRetries: 2
};

/**
 * Fetch OpenGraph metadata for a URL with retries
 */
async function fetchOpenGraphData(url, retries = 0) {
  try {
    const response = await fetch(url, {
      timeout: CONFIG.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract OpenGraph and fallback metadata
    const metadata = {
      title: null,
      description: null,
      imageUrl: null,
      siteName: null,
      type: null,
      fetchedAt: new Date().toISOString()
    };
    
    // og:image (primary target)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      metadata.imageUrl = ogImageMatch[1];
    }
    
    // og:title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1];
    }
    
    // og:description  
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      metadata.description = ogDescMatch[1];
    }
    
    // og:site_name
    const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (ogSiteMatch) {
      metadata.siteName = ogSiteMatch[1];
    }
    
    // og:type
    const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i);
    if (ogTypeMatch) {
      metadata.type = ogTypeMatch[1];
    }
    
    // Fallbacks if no OpenGraph data
    if (!metadata.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }
    }
    
    if (!metadata.description) {
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (descMatch) {
        metadata.description = descMatch[1];
      }
    }
    
    // Try alternative image sources if no og:image
    if (!metadata.imageUrl) {
      // Try twitter:image
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (twitterImageMatch) {
        metadata.imageUrl = twitterImageMatch[1];
      }
    }
    
    return metadata;
    
  } catch (error) {
    if (retries < CONFIG.maxRetries) {
      console.log(`   ⚠️ Retry ${retries + 1}/${CONFIG.maxRetries}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      return fetchOpenGraphData(url, retries + 1);
    }
    
    throw error;
  }
}

/**
 * Load existing OpenGraph cache
 */
async function loadOpenGraphCache() {
  try {
    const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/opengraph-cache.json');
    const data = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('📁 Creating new OpenGraph cache');
    return {};
  }
}

/**
 * Save OpenGraph cache
 */
async function saveOpenGraphCache(cache) {
  try {
    const cacheDir = path.resolve(process.cwd(), 'docs/.vitepress/cache');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cachePath = path.join(cacheDir, 'opengraph-cache.json');
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('❌ Error saving OpenGraph cache:', error.message);
  }
}

/**
 * Extract Pinterest URLs from pinterest-pins.md
 */
async function extractPinterestUrls() {
  const content = await fs.readFile('docs/pins/pinterest-pins.md', 'utf8');
  
  // Extract all URLs
  const urlMatches = content.match(/\(https?:\/\/[^)]+\)/g) || [];
  const allUrls = urlMatches.map(match => match.slice(1, -1));
  
  // Filter to non-video URLs (our target for OpenGraph)
  const nonVideoUrls = allUrls.filter(url => 
    !url.includes('youtube.com') && 
    !url.includes('vimeo.com')
  );
  
  return nonVideoUrls;
}

/**
 * Main processing function
 */
async function processPinterestThumbnails() {
  console.log('🎨 Pinterest OpenGraph Thumbnail Generator');
  console.log('==========================================');
  
  try {
    // Load URLs and cache
    const pinterestUrls = await extractPinterestUrls();
    const ogCache = await loadOpenGraphCache();
    
    console.log(`📌 Found ${pinterestUrls.length} Pinterest URLs to process`);
    console.log(`📁 Loaded cache with ${Object.keys(ogCache).length} existing entries`);
    
    // Filter URLs that need processing (limit to first 100 for initial run)
    const urlsToProcess = pinterestUrls.filter(url => !ogCache[url]).slice(0, 100);
    
    console.log(`🔄 Need to process ${urlsToProcess.length} new URLs`);
    
    if (urlsToProcess.length === 0) {
      console.log('✅ All Pinterest URLs already cached!');
      return;
    }
    
    // Process in batches
    const batches = [];
    for (let i = 0; i < urlsToProcess.length; i += CONFIG.batchSize) {
      batches.push(urlsToProcess.slice(i, i + CONFIG.batchSize));
    }
    
    console.log(`📦 Processing ${batches.length} batches of ${CONFIG.batchSize} URLs each`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}`);
      
      for (const url of batch) {
        processed++;
        const progress = `[${processed}/${urlsToProcess.length}]`;
        
        try {
          console.log(`${progress} Fetching: ${url.substring(0, 70)}...`);
          
          const metadata = await fetchOpenGraphData(url);
          ogCache[url] = metadata;
          
          if (metadata.imageUrl) {
            console.log(`   ✅ Found image: ${metadata.title || 'No title'}`);
            successful++;
          } else {
            console.log(`   ⚠️ No image found: ${metadata.title || 'No title'}`);
          }
          
        } catch (error) {
          console.log(`   ❌ Failed: ${error.message}`);
          ogCache[url] = {
            error: error.message,
            fetchedAt: new Date().toISOString()
          };
          failed++;
        }
        
        // Rate limiting
        if (processed % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
        }
      }
      
      // Save cache after each batch
      await saveOpenGraphCache(ogCache);
      console.log(`💾 Saved batch ${batchIndex + 1} to cache`);
      
      // Longer delay between batches
      if (batchIndex < batches.length - 1) {
        console.log(`⏱️ Waiting ${CONFIG.delayBetweenRequests * 2}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests * 2));
      }
    }
    
    console.log('\n🎉 Pinterest OpenGraph Processing Complete!');
    console.log('===========================================');
    console.log(`📊 Processed: ${processed} URLs`);
    console.log(`✅ Successful: ${successful} (${Math.round(successful/processed*100)}%)`);
    console.log(`❌ Failed: ${failed} (${Math.round(failed/processed*100)}%)`);
    console.log(`📁 Total cache entries: ${Object.keys(ogCache).length}`);
    
    // Count URLs with images
    const urlsWithImages = Object.values(ogCache).filter(data => data.imageUrl);
    console.log(`🖼️ URLs with images: ${urlsWithImages.length}`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processPinterestThumbnails();
}

export { processPinterestThumbnails };

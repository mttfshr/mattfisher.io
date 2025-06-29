#!/usr/bin/env node

import { getPins } from '../docs/.vitepress/utils/services/content/pins.js';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Existing Pins Thumbnail Generator
 * 
 * Processes all existing pins to generate thumbnails for content that doesn't have them yet.
 * Uses the same infrastructure as the new add-content.js system.
 */

/**
 * Import existing thumbnail processing infrastructure
 */
const thumbnailServicePath = path.resolve(process.cwd(), 'docs/.vitepress/utils/services/media/thumbnails.js');
let thumbnailService = null;

try {
  const module = await import(thumbnailServicePath);
  thumbnailService = module;
} catch (error) {
  console.warn('⚠️  Could not load thumbnail service - video thumbnails will be skipped');
}

/**
 * Extract URLs from all pin formats
 */
function extractUrlFromPin(pin) {
  // New format: pin.url is already extracted
  if (pin.url) {
    return pin.url;
  }
  
  // Legacy format: might need to extract from content
  if (pin.content && pin.content.includes('http')) {
    // Extract URL from markdown link format: [title](url)
    const linkMatch = pin.content.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return linkMatch[2];
    }
    
    // Extract plain URL
    const urlMatch = pin.content.match(/https?:\/\/[^\s)]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
  }
  
  return null;
}

/**
 * Fetch OpenGraph metadata for a URL
 */
async function fetchMetadata(url) {
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
    
    const metadata = {};
    
    // OpenGraph title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1];
    }
    
    // Fallback to title tag
    if (!metadata.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }
    }
    
    // OpenGraph description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      metadata.description = ogDescMatch[1];
    }
    
    // OpenGraph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      metadata.imageUrl = ogImageMatch[1];
    }
    
    return metadata;
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Generate thumbnail for video content
 */
async function generateVideoThumbnail(url) {
  if (!thumbnailService) {
    return null;
  }
  
  const urlLower = url.toLowerCase();
  
  try {
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      console.log('      🎬 Generating YouTube thumbnail...');
      await thumbnailService.processThumbnails('youtube', { 
        input: [url], 
        verbose: false 
      });
      return 'youtube';
    } else if (urlLower.includes('vimeo.com')) {
      console.log('      🎬 Generating Vimeo thumbnail...');
      await thumbnailService.processThumbnails('vimeo', { 
        input: [url], 
        verbose: false 
      });
      return 'vimeo';
    }
    
    return null;
  } catch (error) {
    console.log(`      ⚠️  Error generating video thumbnail: ${error.message}`);
    return null;
  }
}

/**
 * Process OpenGraph image as thumbnail
 */
async function processOgImageThumbnail(url, metadata) {
  if (!metadata.imageUrl) {
    return null;
  }

  try {
    // Create thumbnail data
    const thumbnailData = {
      sourceUrl: url,
      imageUrl: metadata.imageUrl,
      title: metadata.title,
      processedAt: new Date().toISOString()
    };
    
    // Load existing cache
    const cacheDir = path.resolve(process.cwd(), 'docs/.vitepress/cache');
    const cachePath = path.resolve(cacheDir, 'og-images-cache.json');
    
    let cache = {};
    try {
      const cacheContent = await fs.readFile(cachePath, 'utf8');
      cache = JSON.parse(cacheContent);
    } catch (error) {
      // Cache doesn't exist yet, start fresh
    }
    
    // Create URL-based key
    const urlKey = url.replace(/[^a-zA-Z0-9]/g, '_');
    cache[urlKey] = thumbnailData;
    
    // Ensure cache directory exists
    await fs.mkdir(cacheDir, { recursive: true });
    
    // Save updated cache
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
    
    return thumbnailData;
    
  } catch (error) {
    console.log(`      ⚠️  Error caching OG image: ${error.message}`);
    return null;
  }
}

/**
 * Determine content type from URL
 */
function getContentType(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'video';
  } else if (urlLower.includes('vimeo.com')) {
    return 'video';
  } else if (urlLower.includes('github.com')) {
    return 'code';
  } else if (urlLower.includes('instagram.com') || urlLower.includes('flickr.com')) {
    return 'visual';
  } else if (urlLower.includes('spotify.com') || urlLower.includes('bandcamp.com')) {
    return 'music';
  } else {
    return 'article';
  }
}

/**
 * Main function to process existing pins
 */
async function processExistingPins(options = {}) {
  const { dryRun = false, limit = null, contentType = null } = options;
  
  console.log('🔄 Processing Existing Pins for Thumbnail Generation');
  console.log('===================================================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }
  
  console.log('');
  
  try {
    // Get all pins
    console.log('📌 Loading existing pins...');
    const pinsData = getPins();
    const allPins = pinsData.pins;
    
    console.log(`📊 Total pins found: ${allPins.length}`);
    
    // Extract URLs and identify pins needing thumbnails
    const pinsWithUrls = [];
    
    for (const pin of allPins) {
      const url = extractUrlFromPin(pin);
      if (url && url.startsWith('http')) {
        const type = getContentType(url);
        
        // Filter by content type if specified
        if (contentType && type !== contentType) {
          continue;
        }
        
        pinsWithUrls.push({
          ...pin,
          extractedUrl: url,
          contentType: type,
          needsThumbnail: !pin.imageUrl || pin.imageUrl.trim() === ''
        });
      }
    }
    
    console.log(`🔗 Pins with URLs: ${pinsWithUrls.length}`);
    
    // Filter to pins that need thumbnails
    const pinsNeedingThumbnails = pinsWithUrls.filter(pin => pin.needsThumbnail);
    console.log(`🖼️  Pins needing thumbnails: ${pinsNeedingThumbnails.length}`);
    
    // Show breakdown by content type
    const typeBreakdown = {};
    pinsNeedingThumbnails.forEach(pin => {
      typeBreakdown[pin.contentType] = (typeBreakdown[pin.contentType] || 0) + 1;
    });
    
    console.log('\\n📊 Content type breakdown:');
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} pins`);
    });
    
    if (pinsNeedingThumbnails.length === 0) {
      console.log('\\n✅ All pins already have thumbnails!');
      return;
    }
    
    // Process pins (with limit if specified)
    const pinsToProcess = limit ? pinsNeedingThumbnails.slice(0, limit) : pinsNeedingThumbnails;
    
    console.log(`\\n🚀 Processing ${pinsToProcess.length} pins...`);
    console.log('');
    
    let processed = 0;
    let successful = 0;
    let videoThumbnails = 0;
    let ogThumbnails = 0;
    let failed = 0;
    
    for (const pin of pinsToProcess) {
      processed++;
      const url = pin.extractedUrl;
      
      console.log(`[${processed}/${pinsToProcess.length}] Processing: ${pin.contentType} - ${url.substring(0, 60)}...`);
      
      if (dryRun) {
        console.log('      🔍 DRY RUN - Would process this URL');
        successful++;
        continue;
      }
      
      try {
        // Fetch metadata
        console.log('      📡 Fetching metadata...');
        const metadata = await fetchMetadata(url);
        
        if (metadata.error) {
          console.log(`      ❌ Failed to fetch metadata: ${metadata.error}`);
          failed++;
          continue;
        }
        
        console.log(`      📄 Title: ${metadata.title?.substring(0, 50) || 'No title'}...`);
        
        // Generate thumbnails based on content type
        let thumbnailResult = null;
        
        if (pin.contentType === 'video') {
          thumbnailResult = await generateVideoThumbnail(url);
          if (thumbnailResult) {
            videoThumbnails++;
          }
        }
        
        // Process OG image if available (for all content types)
        if (metadata.imageUrl) {
          console.log('      🖼️  Processing OpenGraph image...');
          const ogResult = await processOgImageThumbnail(url, metadata);
          if (ogResult) {
            ogThumbnails++;
          }
        }
        
        if (thumbnailResult || metadata.imageUrl) {
          successful++;
          console.log('      ✅ Thumbnail processed successfully');
        } else {
          console.log('      ⚠️  No thumbnail available for this URL');
        }
        
        // Small delay to be respectful to servers
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`      ❌ Error processing: ${error.message}`);
        failed++;
      }
      
      console.log('');
    }
    
    // Summary
    console.log('🎯 Processing Complete!');
    console.log('======================');
    console.log(`📊 Total processed: ${processed}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`🎬 Video thumbnails: ${videoThumbnails}`);
    console.log(`🖼️  OG image thumbnails: ${ogThumbnails}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (!dryRun) {
      console.log('\\n💡 Thumbnails are now cached and will be available for your pins display!');
    }
    
  } catch (error) {
    console.error('❌ Error processing existing pins:', error);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
  const typeIndex = args.indexOf('--type');
  const contentType = typeIndex !== -1 ? args[typeIndex + 1] : null;
  
  if (args.includes('--help')) {
    console.log('Usage: node generate-existing-thumbnails.js [options]');
    console.log('');
    console.log('📸 Generate thumbnails for all existing pins');
    console.log('============================================');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run              Preview what would be processed without making changes');
    console.log('  --limit N              Process only the first N pins (useful for testing)');
    console.log('  --type TYPE            Process only specific content type (video, article, code, visual, music)');
    console.log('  --help                 Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node generate-existing-thumbnails.js --dry-run');
    console.log('  node generate-existing-thumbnails.js --limit 10');
    console.log('  node generate-existing-thumbnails.js --type video');
    console.log('  node generate-existing-thumbnails.js --type article --limit 20');
    process.exit(0);
  }
  
  processExistingPins({ dryRun, limit, contentType }).catch(console.error);
}
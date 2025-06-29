#!/usr/bin/env node

import { getPins } from '../docs/.vitepress/utils/services/content/pins.js';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

/**
 * Pinterest Pins Thumbnail Generator - LONG RUN BATCH PROCESSOR
 * 
 * Processes all Pinterest pins to extract OpenGraph images for thumbnails.
 * Designed for long-running batch processing with progress tracking.
 */

/**
 * Extract URLs from Pinterest pins
 */
function extractUrlFromPin(pin) {
  if (pin.url) {
    return pin.url;
  }
  
  if (pin.content && pin.content.includes('http')) {
    const linkMatch = pin.content.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return linkMatch[2];
    }
    
    const urlMatch = pin.content.match(/https?:\/\/[^\s)]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
  }
  
  return null;
}

/**
 * Fetch OpenGraph metadata with retries
 */
async function fetchMetadataWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      const metadata = {};
      
      // OpenGraph image
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImageMatch) {
        metadata.imageUrl = ogImageMatch[1];
      }
      
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
      
      return metadata;
      
    } catch (error) {
      console.log(`      Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt === maxRetries) {
        return { error: error.message };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

/**
 * Process and cache OpenGraph image
 */
async function cacheOgImage(url, metadata) {
  if (!metadata.imageUrl) {
    return null;
  }

  try {
    const thumbnailData = {
      sourceUrl: url,
      imageUrl: metadata.imageUrl,
      title: metadata.title,
      description: metadata.description,
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
      // Cache doesn't exist yet
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
    console.log(`      ⚠️  Cache error: ${error.message}`);
    return null;
  }
}

/**
 * Save progress to resume file
 */
async function saveProgress(processed, successful, failed, lastProcessedIndex) {
  try {
    const progressData = {
      processed,
      successful,
      failed,
      lastProcessedIndex,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.resolve(process.cwd(), 'pinterest-thumbnails-progress.json'),
      JSON.stringify(progressData, null, 2)
    );
  } catch (error) {
    console.log(`⚠️  Could not save progress: ${error.message}`);
  }
}

/**
 * Load previous progress
 */
async function loadProgress() {
  try {
    const progressFile = path.resolve(process.cwd(), 'pinterest-thumbnails-progress.json');
    const content = await fs.readFile(progressFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Main processing function
 */
async function processPinterestThumbnails() {
  console.log('🎨 Pinterest Thumbnails - LONG RUN BATCH PROCESSOR');
  console.log('==================================================');
  console.log('This will process ALL Pinterest pins for thumbnail generation.');
  console.log('This may take 1-3 hours depending on network conditions.');
  console.log('Progress is saved automatically - you can resume if interrupted.');
  console.log('');
  
  try {
    // Load pins data
    console.log('📌 Loading Pinterest pins...');
    const pinsData = getPins();
    
    // Filter to Pinterest pins only
    const pinterestPins = pinsData.pins.filter(pin => {
      const url = extractUrlFromPin(pin);
      return url && (
        url.includes('pinterest.com') ||
        url.includes('tumblr.com') ||
        url.includes('flickr.com') ||
        url.includes('instagram.com') ||
        url.includes('behance.net') ||
        url.includes('dribbble.com') ||
        pin.fileName === 'pinterest-pins.md'
      );
    });
    
    console.log(`📊 Found ${pinterestPins.length} Pinterest/visual pins to process`);
    
    // Filter to pins needing thumbnails
    const pinsNeedingThumbnails = pinterestPins.filter(pin => 
      !pin.imageUrl || pin.imageUrl.trim() === ''
    );
    
    console.log(`🖼️  Pins needing thumbnails: ${pinsNeedingThumbnails.length}`);
    
    if (pinsNeedingThumbnails.length === 0) {
      console.log('✅ All Pinterest pins already have thumbnails!');
      return;
    }
    
    // Load previous progress
    const progress = await loadProgress();
    let startIndex = 0;
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    if (progress) {
      console.log(`🔄 Resuming from previous session...`);
      console.log(`   Previous progress: ${progress.processed} processed, ${progress.successful} successful, ${progress.failed} failed`);
      startIndex = progress.lastProcessedIndex + 1;
      processed = progress.processed;
      successful = progress.successful;
      failed = progress.failed;
    }
    
    console.log(`\\n🚀 Starting batch processing from index ${startIndex}...`);
    console.log('');
    
    const startTime = Date.now();
    
    for (let i = startIndex; i < pinsNeedingThumbnails.length; i++) {
      const pin = pinsNeedingThumbnails[i];
      const url = extractUrlFromPin(pin);
      
      if (!url) {
        continue;
      }
      
      processed++;
      
      // Progress indicator
      const percent = ((i + 1) / pinsNeedingThumbnails.length * 100).toFixed(1);
      console.log(`[${i + 1}/${pinsNeedingThumbnails.length}] (${percent}%) Processing: ${url.substring(0, 80)}...`);
      
      try {
        // Fetch metadata
        const metadata = await fetchMetadataWithRetry(url);
        
        if (metadata.error) {
          console.log(`      ❌ Failed: ${metadata.error}`);
          failed++;
        } else if (metadata.imageUrl) {
          console.log(`      📄 Title: ${metadata.title?.substring(0, 60) || 'No title'}...`);
          console.log(`      🖼️  Image: ${metadata.imageUrl.substring(0, 60)}...`);
          
          // Cache the image
          const cached = await cacheOgImage(url, metadata);
          if (cached) {
            console.log(`      ✅ Cached successfully`);
            successful++;
          } else {
            console.log(`      ⚠️  Cache failed`);
          }
        } else {
          console.log(`      ⚠️  No image found`);
        }
        
        // Save progress every 10 items
        if (processed % 10 === 0) {
          await saveProgress(processed, successful, failed, i);
          
          // Show progress summary
          const elapsed = Date.now() - startTime;
          const avgTime = elapsed / processed;
          const remaining = (pinsNeedingThumbnails.length - i - 1) * avgTime;
          const eta = new Date(Date.now() + remaining).toLocaleTimeString();
          
          console.log(`      📊 Progress: ${processed} processed, ${successful} successful, ${failed} failed`);
          console.log(`      ⏱️  ETA: ${eta} (${Math.round(remaining / 60000)}min remaining)`);
        }
        
        // Be respectful to servers - delay between requests
        await new Promise(resolve => setTimeout(resolve, 750));
        
      } catch (error) {
        console.log(`      ❌ Processing error: ${error.message}`);
        failed++;
      }
      
      console.log('');
    }
    
    // Final summary
    const totalTime = (Date.now() - startTime) / 1000 / 60; // minutes
    
    console.log('🎯 BATCH PROCESSING COMPLETE!');
    console.log('=============================');
    console.log(`📊 Total processed: ${processed}`);
    console.log(`✅ Successful thumbnails: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)} minutes`);
    console.log(`📈 Success rate: ${(successful / processed * 100).toFixed(1)}%`);
    console.log('');
    console.log('💡 Thumbnails are now cached and available for your pins display!');
    console.log('🗑️  You can delete pinterest-thumbnails-progress.json if desired.');
    
    // Clean up progress file
    try {
      await fs.unlink(path.resolve(process.cwd(), 'pinterest-thumbnails-progress.json'));
    } catch (error) {
      // Progress file doesn't exist or couldn't be deleted
    }
    
  } catch (error) {
    console.error('❌ Batch processing error:', error);
  }
}

// Run the processor
processPinterestThumbnails().catch(console.error);
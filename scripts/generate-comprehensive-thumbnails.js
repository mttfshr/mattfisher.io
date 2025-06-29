#!/usr/bin/env node

import { getPins } from '../docs/.vitepress/utils/services/content/pins.js';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

/**
 * COMPREHENSIVE Pins Thumbnail Generator - FULL SITE PROCESSOR
 * 
 * Processes ALL pins needing thumbnails across the entire site.
 * Handles Pinterest, articles, blogs, videos, code repos, music, everything.
 * Designed for very long-running batch processing (3-5 hours).
 */

/**
 * Extract URLs from all pin formats
 */
function extractUrlFromPin(pin) {
  if (pin.url) {
    return pin.url;
  }
  
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
 * Determine content type from URL for progress tracking
 */
function getContentType(url) {
  const urlLower = url.toLowerCase();
  const domain = new URL(url).hostname.replace('www.', '');
  
  if (urlLower.includes('pinterest.com')) return 'pinterest';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  if (urlLower.includes('vimeo.com')) return 'vimeo';
  if (urlLower.includes('github.com')) return 'github';
  if (urlLower.includes('instagram.com')) return 'instagram'; 
  if (['flickr.com', 'behance.net', 'dribbble.com'].includes(domain)) return 'visual';
  if (['spotify.com', 'bandcamp.com', 'soundcloud.com'].includes(domain)) return 'music';
  if (['tumblr.com'].includes(domain)) return 'tumblr';
  if (['designboom.com', 'dezeen.com', 'archdaily.com', 'core77.com'].includes(domain)) return 'design';
  if (['artsy.net', 'artnet.com', 'moma.org', 'tate.org.uk'].includes(domain)) return 'art';
  
  return 'article';
}

/**
 * Fetch OpenGraph metadata with enhanced retry logic and better error handling
 */
async function fetchMetadataWithRetry(url, maxRetries = 3) {
  // Skip obviously problematic URLs
  if (url.includes('tumblr.com/dashboard') || 
      url.includes('pinterest.com/pin/') ||
      url.includes('instagram.com/p/') ||
      url.includes('flickr.com/photos/') && url.split('/').length > 6) {
    return { error: 'Skipped - likely requires authentication' };
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      const metadata = {};
      
      // OpenGraph image - try multiple patterns
      let ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (!ogImageMatch) {
        ogImageMatch = html.match(/<meta[^>]*name=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      }
      if (ogImageMatch) {
        metadata.imageUrl = ogImageMatch[1];
      }
      
      // Twitter card image as fallback
      if (!metadata.imageUrl) {
        const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        if (twitterImageMatch) {
          metadata.imageUrl = twitterImageMatch[1];
        }
      }
      
      // OpenGraph title
      let ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      if (!ogTitleMatch) {
        ogTitleMatch = html.match(/<meta[^>]*name=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      }
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
      let ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      if (!ogDescMatch) {
        ogDescMatch = html.match(/<meta[^>]*name=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      }
      // Fallback to meta description
      if (!ogDescMatch) {
        ogDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      }
      if (ogDescMatch) {
        metadata.description = ogDescMatch[1];
      }
      
      return metadata;
      
    } catch (error) {
      const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
      if (attempt === maxRetries) {
        return { error: errorMsg };
      }
      
      // Progressive delay: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
}

/**
 * Process and cache OpenGraph image
 */
async function cacheOgImage(url, metadata, contentType) {
  if (!metadata.imageUrl) {
    return null;
  }

  try {
    const thumbnailData = {
      sourceUrl: url,
      imageUrl: metadata.imageUrl,
      title: metadata.title,
      description: metadata.description,
      contentType: contentType,
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
    
    // Save updated cache (batch save every 25 items for performance)
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
    
    return thumbnailData;
    
  } catch (error) {
    return null;
  }
}

/**
 * Save comprehensive progress with detailed stats
 */
async function saveProgress(stats, lastProcessedIndex) {
  try {
    const progressData = {
      ...stats,
      lastProcessedIndex,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.resolve(process.cwd(), 'comprehensive-thumbnails-progress.json'),
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
    const progressFile = path.resolve(process.cwd(), 'comprehensive-thumbnails-progress.json');
    const content = await fs.readFile(progressFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Main comprehensive processing function
 */
async function processComprehensiveThumbnails() {
  console.log('🌍 COMPREHENSIVE PINS THUMBNAIL GENERATOR');
  console.log('=========================================');
  console.log('This will process ALL pins needing thumbnails across your entire site.');
  console.log('Expected runtime: 3-5 hours for ~1,940 pins');
  console.log('Progress saved automatically - resumable if interrupted.');
  console.log('');
  
  try {
    // Load pins data
    console.log('📌 Loading all pins...');
    const pinsData = getPins();
    
    // Get all pins with URLs that need thumbnails
    const allPinsWithUrls = pinsData.pins
      .map(pin => ({
        ...pin,
        extractedUrl: extractUrlFromPin(pin)
      }))
      .filter(pin => pin.extractedUrl && pin.extractedUrl.startsWith('http'))
      .filter(pin => !pin.imageUrl || pin.imageUrl.trim() === ''); // Need thumbnails
    
    console.log(`📊 Total pins needing thumbnails: ${allPinsWithUrls.length}`);
    
    // Categorize by content type for progress tracking
    const typeBreakdown = {};
    allPinsWithUrls.forEach(pin => {
      const type = getContentType(pin.extractedUrl);
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });
    
    console.log('\\n📊 Content type breakdown:');
    Object.entries(typeBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} pins`);
      });
    
    if (allPinsWithUrls.length === 0) {
      console.log('\\n✅ All pins already have thumbnails!');
      return;
    }
    
    // Load previous progress
    const progress = await loadProgress();
    let startIndex = 0;
    let stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      byType: {}
    };
    
    if (progress) {
      console.log(`\\n🔄 Resuming from previous session...`);
      console.log(`   Previous: ${progress.processed} processed, ${progress.successful} successful, ${progress.failed} failed`);
      startIndex = progress.lastProcessedIndex + 1;
      stats = { ...progress };
      delete stats.lastProcessedIndex;
      delete stats.timestamp;
    }
    
    console.log(`\\n🚀 Starting comprehensive processing from index ${startIndex}...`);
    console.log('');
    
    const startTime = Date.now();
    
    for (let i = startIndex; i < allPinsWithUrls.length; i++) {
      const pin = allPinsWithUrls[i];
      const url = pin.extractedUrl;
      const contentType = getContentType(url);
      
      stats.processed++;
      
      // Initialize type stats if needed
      if (!stats.byType[contentType]) {
        stats.byType[contentType] = { processed: 0, successful: 0, failed: 0 };
      }
      stats.byType[contentType].processed++;
      
      // Progress indicator
      const percent = ((i + 1) / allPinsWithUrls.length * 100).toFixed(1);
      console.log(`[${i + 1}/${allPinsWithUrls.length}] (${percent}%) ${contentType.toUpperCase()}`);
      console.log(`   ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
      
      try {
        // Fetch metadata
        const metadata = await fetchMetadataWithRetry(url);
        
        if (metadata.error) {
          console.log(`   ❌ ${metadata.error}`);
          stats.failed++;
          stats.byType[contentType].failed++;
        } else if (metadata.imageUrl) {
          console.log(`   📄 ${metadata.title?.substring(0, 70) || 'No title'}${metadata.title?.length > 70 ? '...' : ''}`);
          console.log(`   🖼️  ${metadata.imageUrl.substring(0, 80)}${metadata.imageUrl.length > 80 ? '...' : ''}`);
          
          // Cache the image
          const cached = await cacheOgImage(url, metadata, contentType);
          if (cached) {
            console.log(`   ✅ Cached`);
            stats.successful++;
            stats.byType[contentType].successful++;
          } else {
            console.log(`   ⚠️  Cache failed`);
          }
        } else {
          console.log(`   ⚠️  No image found`);
          stats.skipped++;
        }
        
        // Save progress every 25 items
        if (stats.processed % 25 === 0) {
          await saveProgress(stats, i);
          
          // Progress summary
          const elapsed = Date.now() - startTime;
          const avgTime = elapsed / (i - startIndex + 1);
          const remaining = (allPinsWithUrls.length - i - 1) * avgTime;
          const eta = new Date(Date.now() + remaining).toLocaleTimeString();
          
          console.log(`   📊 Session: ${stats.processed} processed, ${stats.successful} successful (${(stats.successful/stats.processed*100).toFixed(1)}%)`);
          console.log(`   ⏱️  ETA: ${eta} (~${Math.round(remaining / 60000)}min remaining)`);
        }
        
        // Respectful delay - vary by content type
        let delay = 1000; // Default 1 second
        if (contentType === 'pinterest') delay = 1500;
        if (contentType === 'tumblr') delay = 800;
        if (contentType === 'github') delay = 500;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.log(`   ❌ Processing error: ${error.message}`);
        stats.failed++;
        stats.byType[contentType].failed++;
      }
      
      console.log('');
    }
    
    // Final comprehensive summary
    const totalTime = (Date.now() - startTime) / 1000 / 60; // minutes
    
    console.log('🎯 COMPREHENSIVE PROCESSING COMPLETE!');
    console.log('====================================');
    console.log(`📊 Total processed: ${stats.processed}`);
    console.log(`✅ Successful thumbnails: ${stats.successful}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`⚠️  Skipped (no image): ${stats.skipped}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)} minutes (${(totalTime/60).toFixed(1)} hours)`);
    console.log(`📈 Success rate: ${(stats.successful / stats.processed * 100).toFixed(1)}%`);
    
    console.log('\\n📊 Results by content type:');
    Object.entries(stats.byType)
      .sort(([,a], [,b]) => b.successful - a.successful)
      .forEach(([type, typeStats]) => {
        const rate = typeStats.processed > 0 ? (typeStats.successful / typeStats.processed * 100).toFixed(1) : '0.0';
        console.log(`   ${type}: ${typeStats.successful}/${typeStats.processed} (${rate}%)`);
      });
    
    console.log('\\n💡 All thumbnails are now cached and available for your pins display!');
    console.log('🗑️  You can delete comprehensive-thumbnails-progress.json if desired.');
    
    // Clean up progress file
    try {
      await fs.unlink(path.resolve(process.cwd(), 'comprehensive-thumbnails-progress.json'));
    } catch (error) {
      // Progress file doesn't exist or couldn't be deleted
    }
    
  } catch (error) {
    console.error('❌ Comprehensive processing error:', error);
  }
}

// Run the comprehensive processor
processComprehensiveThumbnails().catch(console.error);
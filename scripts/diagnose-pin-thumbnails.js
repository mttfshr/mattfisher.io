#!/usr/bin/env node

/**
 * Diagnostic script to identify pins with missing thumbnails
 * This helps debug the thumbnail loading issues in the pins system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced Vimeo ID extraction (same as pins.js)
function extractVimeoId(url) {
  // Pattern 1: Standard numeric URLs
  const numericMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (numericMatch) {
    return numericMatch[1];
  }
  
  // Pattern 2: Username/slug format
  const userSlugMatch = url.match(/vimeo\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (userSlugMatch) {
    return null; // Can't extract ID from username/slug format
  }
  
  // Pattern 3: Vimeo embed URLs
  const embedMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (embedMatch) {
    return embedMatch[1];
  }
  
  // Pattern 4: Vimeo channels or groups
  const channelMatch = url.match(/vimeo\.com\/(?:channels|groups)\/[^\/]+\/(\d+)/);
  if (channelMatch) {
    return channelMatch[1];
  }
  
  return null;
}

// Check if URL should have a Cloudflare thumbnail
function checkThumbnailAvailability(url, catalog) {
  const isVimeo = url.includes('vimeo.com');
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  
  if (!isVimeo && !isYoutube) {
    return { shouldHave: false, reason: 'Not a video URL' };
  }
  
  let videoId = null;
  let platform = null;
  
  if (isVimeo) {
    videoId = extractVimeoId(url);
    platform = 'vimeo';
  } else if (isYoutube) {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      videoId = youtubeMatch[1];
      platform = 'youtube';
    }
  }
  
  if (!videoId) {
    return { 
      shouldHave: true, 
      reason: `Could not extract ${platform} ID from URL`,
      url,
      platform 
    };
  }
  
  const thumbnailKey = `${platform}-${videoId}`;
  const hasCloudflare = catalog.videoThumbnails && catalog.videoThumbnails[thumbnailKey];
  
  return {
    shouldHave: true,
    hasCloudflare,
    thumbnailKey,
    videoId,
    platform,
    url,
    cloudflareUrl: hasCloudflare ? catalog.videoThumbnails[thumbnailKey].cloudflareUrl : null
  };
}

// Read pins from markdown files
function readPinsFromMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const pins = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const urlMatch = line.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        const title = linkMatch ? linkMatch[1] : url;
        
        pins.push({ url, title, source: path.basename(filePath) });
      }
    }
  }
  
  return pins;
}

// Main diagnostic function
function diagnosePinThumbnails() {
  console.log('🔍 Pin Thumbnail Diagnostic Tool\n');
  
  // Load Cloudflare catalog
  const catalogPath = path.resolve(process.cwd(), 'catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.error('❌ catalog.json not found');
    return;
  }
  
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`✅ Loaded catalog with ${Object.keys(catalog.videoThumbnails || {}).length} video thumbnails\n`);
  
  // Read all pins
  const pinsDir = path.resolve(process.cwd(), 'docs/pins');
  const pinFiles = fs.readdirSync(pinsDir).filter(file => file.endsWith('.md') && file !== 'index.md');
  
  let allPins = [];
  pinFiles.forEach(file => {
    const filePath = path.join(pinsDir, file);
    const pins = readPinsFromMarkdown(filePath);
    allPins = allPins.concat(pins);
  });
  
  console.log(`📌 Found ${allPins.length} pins across ${pinFiles.length} files\n`);
  
  // Analyze thumbnails
  let videoPins = 0;
  let withCloudflare = 0;
  let missingThumbnails = [];
  let usernameSlugUrls = [];
  
  allPins.forEach(pin => {
    const result = checkThumbnailAvailability(pin.url, catalog);
    
    if (result.shouldHave) {
      videoPins++;
      
      if (result.hasCloudflare) {
        withCloudflare++;
      } else {
        if (result.reason && result.reason.includes('Could not extract')) {
          usernameSlugUrls.push({ ...pin, ...result });
        } else {
          missingThumbnails.push({ ...pin, ...result });
        }
      }
    }
  });
  
  // Report results
  console.log('📊 SUMMARY:');
  console.log(`   Total pins: ${allPins.length}`);
  console.log(`   Video pins: ${videoPins}`);
  console.log(`   With Cloudflare thumbnails: ${withCloudflare}`);
  console.log(`   Username/slug URLs (can't extract ID): ${usernameSlugUrls.length}`);
  console.log(`   Missing thumbnails: ${missingThumbnails.length}\n`);
  
  if (usernameSlugUrls.length > 0) {
    console.log('🔗 USERNAME/SLUG URLs (need manual mapping):');
    usernameSlugUrls.slice(0, 10).forEach(pin => {
      console.log(`   ${pin.title}`);
      console.log(`   ${pin.url}`);
      console.log(`   Source: ${pin.source}\n`);
    });
    if (usernameSlugUrls.length > 10) {
      console.log(`   ... and ${usernameSlugUrls.length - 10} more\n`);
    }
  }
  
  if (missingThumbnails.length > 0) {
    console.log('❌ MISSING THUMBNAILS (should be in catalog):');
    missingThumbnails.slice(0, 10).forEach(pin => {
      console.log(`   ${pin.title}`);
      console.log(`   ${pin.url}`);
      console.log(`   Expected key: ${pin.thumbnailKey}`);
      console.log(`   Source: ${pin.source}\n`);
    });
    if (missingThumbnails.length > 10) {
      console.log(`   ... and ${missingThumbnails.length - 10} more\n`);
    }
  }
  
  // Success rate
  const successRate = videoPins > 0 ? ((withCloudflare / videoPins) * 100).toFixed(1) : 0;
  console.log(`✅ Thumbnail success rate: ${successRate}% (${withCloudflare}/${videoPins})`);
  
  if (successRate < 80) {
    console.log('\n💡 RECOMMENDATIONS:');
    if (usernameSlugUrls.length > 0) {
      console.log('   1. Add manual mappings for username/slug Vimeo URLs');
    }
    if (missingThumbnails.length > 0) {
      console.log('   2. Run thumbnail generation for missing video IDs');
    }
  }
}

// Run the diagnostic
diagnosePinThumbnails();

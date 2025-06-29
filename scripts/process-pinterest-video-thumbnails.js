#!/usr/bin/env node

import fs from 'fs/promises';
import { VideoThumbnailProcessor } from './video-thumbnail-processor.js';

/**
 * Generate thumbnails specifically for Pinterest video pins
 */
async function processPinterestVideoThumbnails() {
  console.log('🎯 Processing Pinterest Video Thumbnails');
  console.log('========================================');
  
  try {
    // Read Pinterest pins file
    const content = await fs.readFile('docs/pins/pinterest-pins.md', 'utf8');
    
    // Extract all URLs from Pinterest pins
    const urlMatches = content.match(/\(https?:\/\/[^)]+\)/g) || [];
    const pinterestUrls = urlMatches.map(match => match.slice(1, -1));
    
    // Filter to video URLs only
    const pinterestVideoUrls = pinterestUrls.filter(url => 
      url.includes('youtube.com') || url.includes('vimeo.com')
    );
    
    console.log(`📹 Found ${pinterestVideoUrls.length} video URLs in Pinterest pins`);
    
    // Process thumbnails for these specific URLs
    const processor = new VideoThumbnailProcessor({ 
      verbose: true,
      dryRun: false,
      platforms: ['youtube', 'vimeo']
    });
    
    await processor.init();
    
    console.log(`\n🎯 Processing ${pinterestVideoUrls.length} Pinterest video URLs...`);
    
    // Convert URLs to the format expected by processVideos
    const urlObjects = pinterestVideoUrls.map(url => ({
      url,
      platform: url.includes('youtube.com') ? 'youtube' : 'vimeo',
      source: 'pinterest',
      title: 'Pinterest Pin'
    }));
    
    await processor.processVideos(urlObjects);
    
    console.log('\n✅ Pinterest video thumbnail processing complete!');
    
  } catch (error) {
    console.error('❌ Error processing Pinterest video thumbnails:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processPinterestVideoThumbnails();
}

export { processPinterestVideoThumbnails };

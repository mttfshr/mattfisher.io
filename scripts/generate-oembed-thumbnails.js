#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

/**
 * oEmbed Thumbnail Generator for Remaining Pins
 * 
 * Uses oEmbed APIs to get thumbnails for platforms that blocked scraping.
 * Focus on YouTube, Vimeo, Instagram, and other oEmbed-supporting platforms.
 */

/**
 * oEmbed endpoint configurations
 */
const OEMBED_PROVIDERS = {
  'youtube.com': {
    endpoint: 'https://www.youtube.com/oembed',
    urlParam: 'url',
    formats: ['json']
  },
  'youtu.be': {
    endpoint: 'https://www.youtube.com/oembed', 
    urlParam: 'url',
    formats: ['json']
  },
  'vimeo.com': {
    endpoint: 'https://vimeo.com/api/oembed.json',
    urlParam: 'url',
    formats: ['json']
  },
  'instagram.com': {
    endpoint: 'https://graph.facebook.com/v18.0/instagram_oembed',
    urlParam: 'url',
    formats: ['json'],
    requiresAccessToken: true // Instagram requires access token
  },
  'twitter.com': {
    endpoint: 'https://publish.twitter.com/oembed',
    urlParam: 'url', 
    formats: ['json']
  },
  'x.com': {
    endpoint: 'https://publish.twitter.com/oembed',
    urlParam: 'url',
    formats: ['json']
  },
  'flickr.com': {
    endpoint: 'https://www.flickr.com/services/oembed/',
    urlParam: 'url',
    formats: ['json']
  },
  'soundcloud.com': {
    endpoint: 'https://soundcloud.com/oembed',
    urlParam: 'url',
    formats: ['json']
  }
};

/**
 * Extract video ID from YouTube URLs
 */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/attribution_link\?.*u=([^&]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      if (pattern.source.includes('attribution_link')) {
        // Decode the URL parameter
        try {
          const decoded = decodeURIComponent(match[1]);
          const idMatch = decoded.match(/[?&]v=([^&]+)/);
          return idMatch ? idMatch[1] : null;
        } catch (e) {
          continue;
        }
      } else {
        return match[1];
      }
    }
  }
  return null;
}

/**
 * Extract video ID from Vimeo URLs
 */
function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch oEmbed data
 */
async function fetchOEmbedData(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const provider = OEMBED_PROVIDERS[domain];
    
    if (!provider) {
      return { error: 'No oEmbed provider for this domain' };
    }
    
    if (provider.requiresAccessToken) {
      return { error: 'Requires access token (Instagram)' };
    }
    
    // Build oEmbed request URL
    const oembedUrl = new URL(provider.endpoint);
    oembedUrl.searchParams.set(provider.urlParam, url);
    oembedUrl.searchParams.set('format', 'json');
    oembedUrl.searchParams.set('maxwidth', '800');
    oembedUrl.searchParams.set('maxheight', '600');
    
    console.log(`      🔗 oEmbed: ${oembedUrl.toString().substring(0, 100)}...`);
    
    const response = await fetch(oembedUrl.toString(), {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; oEmbed-client/1.0)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      title: data.title,
      description: data.description || '',
      imageUrl: data.thumbnail_url,
      width: data.thumbnail_width,
      height: data.thumbnail_height,
      type: data.type,
      providerName: data.provider_name,
      authorName: data.author_name
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Fallback: Try direct thumbnail URLs for YouTube/Vimeo
 */
async function tryDirectThumbnail(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    
    if (domain === 'youtube.com' || domain === 'youtu.be') {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        // Try different YouTube thumbnail qualities
        const thumbnailUrls = [
          `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        ];
        
        for (const thumbnailUrl of thumbnailUrls) {
          try {
            const response = await fetch(thumbnailUrl, { method: 'HEAD', timeout: 5000 });
            if (response.ok) {
              return {
                title: `YouTube Video ${videoId}`,
                imageUrl: thumbnailUrl,
                type: 'video'
              };
            }
          } catch (e) {
            continue;
          }
        }
      }
    } else if (domain === 'vimeo.com') {
      const videoId = extractVimeoId(url);
      if (videoId) {
        // Try Vimeo thumbnail API
        try {
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`, {
            timeout: 10000
          });
          if (response.ok) {
            const data = await response.json();
            if (data[0]) {
              return {
                title: data[0].title,
                description: data[0].description,
                imageUrl: data[0].thumbnail_large || data[0].thumbnail_medium,
                type: 'video'
              };
            }
          }
        } catch (e) {
          // Fall back to standard thumbnail pattern
          return {
            title: `Vimeo Video ${videoId}`,
            imageUrl: `https://i.vimeocdn.com/video/${videoId}_640.jpg`,
            type: 'video'
          };
        }
      }
    }
    
    return { error: 'No direct thumbnail available' };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Cache thumbnail data
 */
async function cacheThumbnail(url, metadata) {
  if (!metadata.imageUrl) {
    return null;
  }

  try {
    const thumbnailData = {
      sourceUrl: url,
      imageUrl: metadata.imageUrl,
      title: metadata.title,
      description: metadata.description,
      type: metadata.type,
      method: 'oembed',
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
    return null;
  }
}

/**
 * Load the failed URLs from comprehensive processing
 */
async function loadFailedUrls() {
  try {
    // Read the og-images-cache to see what we already have
    const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/og-images-cache.json');
    const cacheContent = await fs.readFile(cachePath, 'utf8');
    const cache = JSON.parse(cacheContent);
    const cachedUrls = new Set(Object.values(cache).map(entry => entry.sourceUrl));
    
    // We'll focus on video platforms and oEmbed-supporting sites that likely failed
    const targetDomains = [
      'youtube.com', 'youtu.be', 'vimeo.com', 'twitter.com', 'x.com',
      'soundcloud.com', 'flickr.com'
    ];
    
    // For this demo, we'll create some test URLs
    // In reality, you'd parse your pins to find failed URLs from these domains
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com/148751763',
      'https://soundcloud.com/user-example/track-example'
    ];
    
    return testUrls.filter(url => !cachedUrls.has(url));
    
  } catch (error) {
    console.log('Could not load failed URLs, using test set');
    return [];
  }
}

/**
 * Main oEmbed processing function
 */
async function processOEmbedThumbnails() {
  console.log('🔗 oEmbed Thumbnail Generator');
  console.log('=============================');
  console.log('Processing remaining pins using oEmbed APIs for video platforms');
  console.log('');
  
  try {
    // For now, let's create a targeted test for video platforms
    // You can modify this to read your actual failed URLs
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ', 
      'https://vimeo.com/148751763',
      'https://www.youtube.com/attribution_link?a=fdQ5KJqHCI4&u=/watch%3Fv%3DJr_8RmjXK54%26feature%3Dshare'
    ];
    
    console.log(`🎯 Testing oEmbed approach with ${testUrls.length} video URLs`);
    console.log('');
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (const url of testUrls) {
      processed++;
      
      console.log(`[${processed}/${testUrls.length}] Processing: ${url}`);
      
      try {
        // Try oEmbed first
        let metadata = await fetchOEmbedData(url);
        
        if (metadata.error) {
          console.log(`      ⚠️  oEmbed failed: ${metadata.error}`);
          console.log(`      🔄 Trying direct thumbnail...`);
          
          // Fallback to direct thumbnail
          metadata = await tryDirectThumbnail(url);
        }
        
        if (metadata.error) {
          console.log(`      ❌ Failed: ${metadata.error}`);
          failed++;
        } else if (metadata.imageUrl) {
          console.log(`      📄 Title: ${metadata.title?.substring(0, 60) || 'No title'}...`);
          console.log(`      🖼️  Thumbnail: ${metadata.imageUrl.substring(0, 80)}...`);
          
          // Cache the thumbnail
          const cached = await cacheThumbnail(url, metadata);
          if (cached) {
            console.log(`      ✅ Cached successfully`);
            successful++;
          } else {
            console.log(`      ⚠️  Cache failed`);
          }
        } else {
          console.log(`      ⚠️  No thumbnail found`);
        }
        
        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`      ❌ Processing error: ${error.message}`);
        failed++;
      }
      
      console.log('');
    }
    
    // Summary
    console.log('🎯 oEmbed Processing Complete!');
    console.log('==============================');
    console.log(`📊 Total processed: ${processed}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success rate: ${(successful / processed * 100).toFixed(1)}%`);
    
    if (successful > 0) {
      console.log('\\n💡 New thumbnails cached! Restart your dev server to see them.');
      console.log('🔄 Run: npm run docs:dev');
    }
    
  } catch (error) {
    console.error('❌ oEmbed processing error:', error);
  }
}

// Run the oEmbed processor
processOEmbedThumbnails().catch(console.error);
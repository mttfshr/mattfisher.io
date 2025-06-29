#!/usr/bin/env node

import { getPins } from '../docs/.vitepress/utils/services/content/pins.js';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

/**
 * oEmbed Thumbnail Generator for Actual Failed URLs
 * 
 * Processes real failed URLs from your pins collection using oEmbed APIs
 */

/**
 * Extract URLs from all pin formats
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
 * Check if URL supports oEmbed or direct thumbnails
 */
function supportsOEmbed(url) {
  const domain = new URL(url).hostname.replace('www.', '');
  const supportedDomains = [
    'youtube.com', 'youtu.be', 'vimeo.com', 'twitter.com', 'x.com',
    'soundcloud.com', 'flickr.com', 'instagram.com'
  ];
  
  return supportedDomains.includes(domain);
}

/**
 * oEmbed configurations
 */
const OEMBED_PROVIDERS = {
  'youtube.com': { endpoint: 'https://www.youtube.com/oembed', urlParam: 'url' },
  'youtu.be': { endpoint: 'https://www.youtube.com/oembed', urlParam: 'url' },
  'vimeo.com': { endpoint: 'https://vimeo.com/api/oembed.json', urlParam: 'url' },
  'twitter.com': { endpoint: 'https://publish.twitter.com/oembed', urlParam: 'url' },
  'x.com': { endpoint: 'https://publish.twitter.com/oembed', urlParam: 'url' },
  'flickr.com': { endpoint: 'https://www.flickr.com/services/oembed/', urlParam: 'url' },
  'soundcloud.com': { endpoint: 'https://soundcloud.com/oembed', urlParam: 'url' }
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
      return { error: 'No oEmbed provider' };
    }
    
    const oembedUrl = new URL(provider.endpoint);
    oembedUrl.searchParams.set(provider.urlParam, url);
    oembedUrl.searchParams.set('format', 'json');
    oembedUrl.searchParams.set('maxwidth', '800');
    
    const response = await fetch(oembedUrl.toString(), {
      timeout: 10000,
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
      type: data.type,
      method: 'oembed'
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Try direct thumbnail URLs
 */
async function tryDirectThumbnail(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    
    if (domain === 'youtube.com' || domain === 'youtu.be') {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        const thumbnailUrls = [
          `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        ];
        
        for (const thumbnailUrl of thumbnailUrls) {
          try {
            const response = await fetch(thumbnailUrl, { method: 'HEAD', timeout: 5000 });
            if (response.ok) {
              return {
                title: `YouTube Video ${videoId}`,
                imageUrl: thumbnailUrl,
                type: 'video',
                method: 'direct'
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
        try {
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`, {
            timeout: 8000
          });
          if (response.ok) {
            const data = await response.json();
            if (data[0]) {
              return {
                title: data[0].title,
                description: data[0].description,
                imageUrl: data[0].thumbnail_large || data[0].thumbnail_medium,
                type: 'video',
                method: 'vimeo-api'
              };
            }
          }
        } catch (e) {
          // Continue to fallback
        }
      }
    }
    
    return { error: 'No direct thumbnail available' };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Cache thumbnail
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
      method: metadata.method,
      processedAt: new Date().toISOString()
    };
    
    const cacheDir = path.resolve(process.cwd(), 'docs/.vitepress/cache');
    const cachePath = path.resolve(cacheDir, 'og-images-cache.json');
    
    let cache = {};
    try {
      const cacheContent = await fs.readFile(cachePath, 'utf8');
      cache = JSON.parse(cacheContent);
    } catch (error) {
      // Cache doesn't exist yet
    }
    
    const urlKey = url.replace(/[^a-zA-Z0-9]/g, '_');
    cache[urlKey] = thumbnailData;
    
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
    
    return thumbnailData;
    
  } catch (error) {
    return null;
  }
}

/**
 * Main oEmbed processing for actual failed URLs
 */
async function processActualFailedUrls() {
  console.log('🔗 oEmbed Processing for Actual Failed URLs');
  console.log('===========================================');
  
  try {
    // Load existing cache to see what we already have
    const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/og-images-cache.json');
    let cache = {};
    try {
      const cacheContent = await fs.readFile(cachePath, 'utf8');
      cache = JSON.parse(cacheContent);
    } catch (error) {
      console.log('No existing cache found');
    }
    
    const cachedUrls = new Set(Object.values(cache).map(entry => entry.sourceUrl));
    console.log(`📊 Found ${cachedUrls.size} already cached URLs`);
    
    // Load all pins
    const pinsData = getPins();
    const allPinsWithUrls = pinsData.pins
      .map(pin => ({
        ...pin,
        extractedUrl: extractUrlFromPin(pin)
      }))
      .filter(pin => pin.extractedUrl && pin.extractedUrl.startsWith('http'))
      .filter(pin => !pin.imageUrl || pin.imageUrl.trim() === '') // Still need thumbnails
      .filter(pin => !cachedUrls.has(pin.extractedUrl)); // Not already cached
    
    console.log(`📊 Total pins still needing thumbnails: ${allPinsWithUrls.length}`);
    
    // Filter to oEmbed-supported platforms
    const oembedSupportedPins = allPinsWithUrls.filter(pin => 
      supportsOEmbed(pin.extractedUrl)
    );
    
    console.log(`🎯 Pins on oEmbed-supported platforms: ${oembedSupportedPins.length}`);
    
    if (oembedSupportedPins.length === 0) {
      console.log('✅ No remaining pins on oEmbed-supported platforms');
      return;
    }
    
    // Show breakdown by platform
    const platformBreakdown = {};
    oembedSupportedPins.forEach(pin => {
      const domain = new URL(pin.extractedUrl).hostname.replace('www.', '');
      platformBreakdown[domain] = (platformBreakdown[domain] || 0) + 1;
    });
    
    console.log('\\n📊 Platform breakdown:');
    Object.entries(platformBreakdown).forEach(([domain, count]) => {
      console.log(`   ${domain}: ${count} pins`);
    });
    
    console.log(`\\n🚀 Processing ${oembedSupportedPins.length} pins...`);
    console.log('');
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (const pin of oembedSupportedPins) {
      const url = pin.extractedUrl;
      const domain = new URL(url).hostname.replace('www.', '');
      
      processed++;
      
      console.log(`[${processed}/${oembedSupportedPins.length}] ${domain.toUpperCase()}:`);
      console.log(`   ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
      
      try {
        // Try oEmbed first
        let metadata = await fetchOEmbedData(url);
        
        if (metadata.error) {
          console.log(`   ⚠️  oEmbed failed: ${metadata.error}`);
          console.log(`   🔄 Trying direct thumbnail...`);
          
          // Fallback to direct thumbnail
          metadata = await tryDirectThumbnail(url);
        }
        
        if (metadata.error) {
          console.log(`   ❌ Failed: ${metadata.error}`);
          failed++;
        } else if (metadata.imageUrl) {
          console.log(`   📄 ${metadata.title?.substring(0, 60) || 'No title'}${metadata.title?.length > 60 ? '...' : ''}`);
          console.log(`   🖼️  ${metadata.imageUrl.substring(0, 80)}${metadata.imageUrl.length > 80 ? '...' : ''}`);
          
          // Cache the thumbnail
          const cached = await cacheThumbnail(url, metadata);
          if (cached) {
            console.log(`   ✅ Cached (${metadata.method})`);
            successful++;
          } else {
            console.log(`   ⚠️  Cache failed`);
          }
        } else {
          console.log(`   ⚠️  No thumbnail found`);
        }
        
        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failed++;
      }
      
      console.log('');
    }
    
    // Final summary
    console.log('🎯 oEmbed Processing Complete!');
    console.log('==============================');
    console.log(`📊 Total processed: ${processed}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success rate: ${(successful / processed * 100).toFixed(1)}%`);
    
    if (successful > 0) {
      console.log('\\n💡 New thumbnails cached! Clear VitePress cache and restart dev server:');
      console.log('rm -f docs/.vitepress/cache/pins-processed.json && npm run docs:dev');
    }
    
  } catch (error) {
    console.error('❌ oEmbed processing error:', error);
  }
}

// Run the processor
processActualFailedUrls().catch(console.error);
// docs/.vitepress/utils/improvedOGCache.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

/**
 * Decode HTML entities in a string
 * @param {string} html - String with HTML entities
 * @returns {string} - Decoded string
 */
function decodeHtmlEntities(html) {
  if (!html) return '';
  
  return html
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9A-F]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Set up directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

// Ensure cache directories exist in both locations to handle different environments
const vitePressCacheDir = path.resolve(projectRoot, 'docs/.vitepress/cache');
const publicCacheDir = path.resolve(projectRoot, 'docs/public/cache');

// Create cache directories if they don't exist
[vitePressCacheDir, publicCacheDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating cache directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Helper function to create URL-friendly slugs
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Extracts URLs from a markdown file
 */
function extractUrlsFromMarkdown(filePath) {
  console.log(`Extracting URLs from ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract URLs using regular expressions
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = [];
  let match;
  
  while ((match = urlRegex.exec(content)) !== null) {
    urls.push(match[0]);
  }
  
  console.log(`Found ${urls.length} URLs in ${filePath}`);
  return urls;
}

/**
 * Get all pins directly from Markdown files
 * @param {string[]} targetFiles - Optional array of pin filenames to target 
 * @returns {string[]} - Array of URLs found in the markdown files
 */
function getAllPins(targetFiles = []) {
  console.log('Getting pins data directly from markdown files...');
  
  const pinsDir = path.resolve(projectRoot, 'docs/pins');
  const allPins = [];
  
  if (!fs.existsSync(pinsDir)) {
    console.warn('Pins directory not found:', pinsDir);
    return [];
  }
  
  // Get all markdown files in the pins directory
  let mdFiles = fs.readdirSync(pinsDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md');
  
  // Filter to target files if specified
  if (targetFiles.length > 0) {
    mdFiles = mdFiles.filter(file => targetFiles.includes(file));
    console.log(`Targeting specific files: ${mdFiles.join(', ')}`);
  }
  
  console.log(`Found ${mdFiles.length} markdown files in pins directory:`, mdFiles);
  
  // Process each markdown file
  for (const file of mdFiles) {
    const filePath = path.join(pinsDir, file);
    console.log(`Processing ${filePath}...`);
    
    try {
      const urls = extractUrlsFromMarkdown(filePath);
      allPins.push(...urls);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  // Remove duplicates
  const uniquePins = [...new Set(allPins)];
  console.log(`Found ${uniquePins.length} unique URLs across all pin files`);
  
  return uniquePins;
}

/**
 * Fetch Open Graph data for a URL
 */
async function fetchOgData(url) {
  try {
    console.log(`Fetching OG data for: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      },
      timeout: 15000, // Extended timeout for slower sites
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract meta tags
    const metaTags = document.querySelectorAll('meta');
    const ogData = {
      title: '',
      description: '',
      imageUrl: '',
      siteName: '',
      type: 'website',
      favicon: '',
      fetchedAt: new Date().toISOString() // Add timestamp to track freshness
    };

    // Try to get title from various sources
    ogData.title = getMetaContent(metaTags, 'og:title') || 
                  getMetaContent(metaTags, 'twitter:title') || 
                  document.querySelector('title')?.textContent || 
                  new URL(url).hostname;

    // Get other metadata
    ogData.description = getMetaContent(metaTags, 'og:description') || 
                         getMetaContent(metaTags, 'twitter:description') || 
                         getMetaContent(metaTags, 'description') || '';
    
    ogData.imageUrl = getMetaContent(metaTags, 'og:image') || 
                      getMetaContent(metaTags, 'twitter:image') || '';
    
    ogData.siteName = getMetaContent(metaTags, 'og:site_name') || 
                      new URL(url).hostname.replace('www.', '');
    
    ogData.type = getMetaContent(metaTags, 'og:type') || 'website';
    
    // Try to get favicon
    const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (faviconEl) {
      const faviconHref = faviconEl.getAttribute('href');
      if (faviconHref) {
        // Handle relative URLs
        if (faviconHref.startsWith('/')) {
          const baseUrl = new URL(url);
          ogData.favicon = `${baseUrl.protocol}//${baseUrl.host}${faviconHref}`;
        } else if (!faviconHref.startsWith('http')) {
          const baseUrl = new URL(url);
          ogData.favicon = `${baseUrl.protocol}//${baseUrl.host}/${faviconHref}`;
        } else {
          ogData.favicon = faviconHref;
        }
      }
    } else {
      // Try common favicon location
      const baseUrl = new URL(url);
      ogData.favicon = `${baseUrl.protocol}//${baseUrl.host}/favicon.ico`;
    }
    
    // Clean up and decode HTML entities in title and description
    ogData.title = decodeHtmlEntities(ogData.title);
    ogData.description = decodeHtmlEntities(ogData.description.replace(/\\n/g, ' ').trim());
    
    return ogData;
  } catch (error) {
    console.error(`Error fetching OG data for ${url}:`, error.message);
    return {
      title: getHostnameFromUrl(url),
      description: '',
      imageUrl: '',
      siteName: getHostnameFromUrl(url),
      type: 'website',
      favicon: '',
      fetchedAt: new Date().toISOString(),
      error: error.message // Store the error for debugging
    };
  }
}

/**
 * Get hostname from URL with error handling
 */
function getHostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    return url.split('/')[2] || url;
  }
}

/**
 * Helper to get meta tag content
 */
function getMetaContent(metaTags, name) {
  let content = '';
  
  metaTags.forEach(meta => {
    const property = meta.getAttribute('property') || meta.getAttribute('name');
    if (property === name) {
      content = meta.getAttribute('content') || '';
    }
  });
  
  return content;
}

/**
 * Cache downloaded images locally
 */
async function cacheImage(imageUrl, pinUrl) {
  if (!imageUrl) return null;
  
  try {
    // Create a unique filename based on the URL
    const urlHash = slugify(pinUrl).substring(0, 40);
    const extension = imageUrl.split('.').pop().split('?')[0].toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const fileExtension = validExtensions.includes(extension) ? extension : 'jpg';
    
    const localFileName = `${urlHash}.${fileExtension}`;
    const localFilePath = path.join(publicCacheDir, 'images', localFileName);
    const localFileDir = path.dirname(localFilePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(localFileDir)) {
      fs.mkdirSync(localFileDir, { recursive: true });
    }
    
    // Check if we already have this image cached
    if (fs.existsSync(localFilePath)) {
      console.log(`Image already cached: ${localFilePath}`);
      return `/cache/images/${localFileName}`;
    }
    
    // Download the image
    console.log(`Downloading image: ${imageUrl}`);
    const response = await fetch(imageUrl, { timeout: 10000 });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    fs.writeFileSync(localFilePath, buffer);
    
    console.log(`Cached image at: ${localFilePath}`);
    return `/cache/images/${localFileName}`;
  } catch (error) {
    console.error(`Error caching image for ${pinUrl}:`, error.message);
    return null;
  }
}

/**
 * Save cache to multiple locations for redundancy
 */
function saveCache(ogCache, pinsCache) {
  // Save to VitePress cache directory
  fs.writeFileSync(path.join(vitePressCacheDir, 'og-cache.json'), JSON.stringify(ogCache, null, 2));
  fs.writeFileSync(path.join(vitePressCacheDir, 'pins-cache.json'), JSON.stringify(pinsCache, null, 2));
  
  // Also save to public cache directory for production access
  fs.writeFileSync(path.join(publicCacheDir, 'og-cache.json'), JSON.stringify(ogCache, null, 2));
  fs.writeFileSync(path.join(publicCacheDir, 'pins-cache.json'), JSON.stringify(pinsCache, null, 2));
  
  console.log('Cache saved to both VitePress cache and public cache directories');
}

/**
 * Main function to generate OG cache
 * @param {boolean} forceRefresh - Whether to force refresh all entries
 * @param {string[]} targetFiles - Optional array of pin filenames to target
 */
export async function generateOgCache(forceRefresh = false, targetFiles = []) {
  console.log('Starting OG cache generation...');
  
  // Load existing cache if it exists
  let ogCache = {};
  let pinsCache = {};
  
  if (!forceRefresh) {
    try {
      const ogCachePath = path.join(vitePressCacheDir, 'og-cache.json');
      const pinsCachePath = path.join(vitePressCacheDir, 'pins-cache.json');
      
      if (fs.existsSync(ogCachePath)) {
        ogCache = JSON.parse(fs.readFileSync(ogCachePath, 'utf8'));
        console.log(`Loaded ${Object.keys(ogCache).length} entries from existing OG cache`);
      }
      
      if (fs.existsSync(pinsCachePath)) {
        pinsCache = JSON.parse(fs.readFileSync(pinsCachePath, 'utf8'));
        console.log(`Loaded ${Object.keys(pinsCache).length} entries from existing pins cache`);
      }
    } catch (error) {
      console.warn('Error loading cache files:', error.message);
    }
  } else {
    console.log('Force refresh enabled - creating new cache');
  }
  
  // Get all pin URLs directly from markdown files
  const pinUrls = getAllPins(targetFiles);
  console.log(`Processing ${pinUrls.length} pin URLs for OG data...`);
  
  // Create images directory if it doesn't exist
  const imagesDir = path.join(publicCacheDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  // Process each pin URL to get OG data
  let newEntries = 0;
  for (let i = 0; i < pinUrls.length; i++) {
    const url = pinUrls[i];
    const currentTimestamp = new Date().getTime();
    
    // Skip if we already have fresh data for this URL (less than 7 days old)
    // Unless force refresh is enabled
    if (!forceRefresh && ogCache[url] && pinsCache[url]) {
      const fetchedAt = new Date(ogCache[url].fetchedAt || 0).getTime();
      const ageInDays = (currentTimestamp - fetchedAt) / (1000 * 60 * 60 * 24);
      
      if (ageInDays < 7) {
        console.log(`Using cached data for: ${url} (${Math.round(ageInDays)} days old)`);
        continue;
      } else {
        console.log(`Cache for ${url} is ${Math.round(ageInDays)} days old - refreshing`);
      }
    }
    
    try {
      // Fetch OG data
      const ogData = await fetchOgData(url);
      
      // Try to cache the image locally
      if (ogData.imageUrl) {
        const localImagePath = await cacheImage(ogData.imageUrl, url);
        if (localImagePath) {
          // Keep both the original URL and the local path
          ogData.originalImageUrl = ogData.imageUrl;
          ogData.localImageUrl = localImagePath;
        }
      }
      
      // Save to both caches
      ogCache[url] = ogData;
      pinsCache[url] = ogData;
      newEntries++;
      
      // Save cache periodically
      if (i % 5 === 0 || i === pinUrls.length - 1) {
        saveCache(ogCache, pinsCache);
        console.log(`Cache saved at URL ${i + 1}/${pinUrls.length}`);
      }
      
      // Add a small delay between requests to be nice to servers
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error.message);
    }
  }
  
  // Save final cache
  saveCache(ogCache, pinsCache);
  
  console.log('OG cache generation complete!');
  console.log(`- OG cache: ${Object.keys(ogCache).length} entries`);
  console.log(`- Pins cache: ${Object.keys(pinsCache).length} entries`);
  console.log(`- New entries added/updated: ${newEntries}`);
  
  return {
    totalEntries: Object.keys(ogCache).length,
    newEntries,
    timestamp: new Date().toISOString()
  };
}

// Main entry point when called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const forceRefresh = process.argv.includes('--force');
  
  // Check for targetFiles parameters
  let targetFiles = [];
  const targetIndex = process.argv.indexOf('--target');
  if (targetIndex !== -1 && process.argv.length > targetIndex + 1) {
    // Parse comma-separated file names
    targetFiles = process.argv[targetIndex + 1].split(',');
  }
  
  generateOgCache(forceRefresh, targetFiles).catch(error => {
    console.error('Error generating OG cache:', error);
    process.exit(1);
  });
}

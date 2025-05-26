#!/usr/bin/env node

/*
 * This script refreshes the OG cache for Vimeo pins and fixes any HTML entities in descriptions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Set up directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');
const pinsDir = path.resolve(projectRoot, 'docs/pins');
const vimeoFile = path.join(pinsDir, 'vimeo.md');
const cachePath = path.resolve(projectRoot, 'docs/.vitepress/cache/og-cache.json');
const pinsCachePath = path.resolve(projectRoot, 'docs/.vitepress/cache/pins-cache.json');
const publicCachePath = path.resolve(projectRoot, 'docs/public/cache/og-cache.json');
const publicPinsCachePath = path.resolve(projectRoot, 'docs/public/cache/pins-cache.json');

// Ensure cache directories exist
const cacheDir = path.dirname(cachePath);
const publicCacheDir = path.dirname(publicCachePath);

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

if (!fs.existsSync(publicCacheDir)) {
  fs.mkdirSync(publicCacheDir, { recursive: true });
}

// HTML Entity decoder
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

// Extract URLs from Vimeo markdown file
function extractVimeoUrls() {
  console.log(`Reading Vimeo pins from ${vimeoFile}`);
  
  if (!fs.existsSync(vimeoFile)) {
    console.error(`Error: Vimeo file not found at ${vimeoFile}`);
    return [];
  }
  
  const content = fs.readFileSync(vimeoFile, 'utf8');
  const urlRegex = /https?:\/\/vimeo\.com\/[^\s)]+/g;
  const urls = [];
  let match;
  
  while ((match = urlRegex.exec(content)) !== null) {
    urls.push(match[0]);
  }
  
  console.log(`Found ${urls.length} Vimeo URLs`);
  return urls;
}

// Fetch OG data for a URL
async function fetchOgData(url) {
  try {
    console.log(`Fetching OG data for: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      },
      timeout: 15000,
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
      fetchedAt: new Date().toISOString()
    };

    // Get title
    ogData.title = getMetaContent(metaTags, 'og:title') || 
                  getMetaContent(metaTags, 'twitter:title') || 
                  document.querySelector('title')?.textContent || 
                  new URL(url).hostname;

    // Get description
    ogData.description = getMetaContent(metaTags, 'og:description') || 
                         getMetaContent(metaTags, 'twitter:description') || 
                         getMetaContent(metaTags, 'description') || '';
    
    // Get image
    ogData.imageUrl = getMetaContent(metaTags, 'og:image') || 
                      getMetaContent(metaTags, 'twitter:image') || '';
    
    // Get site name
    ogData.siteName = getMetaContent(metaTags, 'og:site_name') || 
                      new URL(url).hostname.replace('www.', '');
    
    // Get content type
    ogData.type = getMetaContent(metaTags, 'og:type') || 'website';
    
    // Get favicon
    const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (faviconEl) {
      const faviconHref = faviconEl.getAttribute('href');
      if (faviconHref) {
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
      const baseUrl = new URL(url);
      ogData.favicon = `${baseUrl.protocol}//${baseUrl.host}/favicon.ico`;
    }
    
    // Decode HTML entities
    ogData.title = decodeHtmlEntities(ogData.title);
    ogData.description = decodeHtmlEntities(ogData.description.replace(/\\n/g, ' ').trim());
    
    console.log(`Title: ${ogData.title}`);
    console.log(`Description: ${ogData.description.substring(0, 50)}...`);
    
    return ogData;
  } catch (error) {
    console.error(`Error fetching OG data for ${url}:`, error.message);
    return {
      title: new URL(url).hostname,
      description: '',
      imageUrl: '',
      siteName: new URL(url).hostname.replace('www.', ''),
      type: 'website',
      favicon: '',
      fetchedAt: new Date().toISOString(),
      error: error.message
    };
  }
}

// Helper to get meta tag content
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

// Update OG cache with fixed descriptions
async function updateOgCache() {
  console.log('\n=== VIMEO OG CACHE UPDATE ===');
  console.log('This script will update the OG cache for all Vimeo pins and fix HTML entities in descriptions.');
  
  // Get Vimeo URLs
  const vimeoUrls = extractVimeoUrls();
  
  if (vimeoUrls.length === 0) {
    console.error('No Vimeo URLs found. Please run update-pins:vimeo first.');
    return;
  }
  
  // Load existing cache
  let ogCache = {};
  let pinsCache = {};
  
  try {
    if (fs.existsSync(cachePath)) {
      const cacheContent = fs.readFileSync(cachePath, 'utf8');
      ogCache = JSON.parse(cacheContent);
      console.log(`Loaded existing OG cache with ${Object.keys(ogCache).length} entries`);
    }
    
    if (fs.existsSync(pinsCachePath)) {
      const pinsCacheContent = fs.readFileSync(pinsCachePath, 'utf8');
      pinsCache = JSON.parse(pinsCacheContent);
      console.log(`Loaded existing pins cache with ${Object.keys(pinsCache).length} entries`);
    }
  } catch (error) {
    console.warn('Error loading existing cache:', error.message);
    console.log('Creating new cache');
  }
  
  // Process each Vimeo URL
  console.log(`\nProcessing ${vimeoUrls.length} Vimeo URLs...`);
  
  for (let i = 0; i < vimeoUrls.length; i++) {
    const url = vimeoUrls[i];
    console.log(`\n[${i+1}/${vimeoUrls.length}] Processing: ${url}`);
    
    // Fetch OG data with entity decoding
    const ogData = await fetchOgData(url);
    
    // Update cache
    ogCache[url] = ogData;
    pinsCache[url] = ogData;
    
    // Add a short delay
    if (i < vimeoUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Save updated cache
  console.log('\nSaving updated cache...');
  fs.writeFileSync(cachePath, JSON.stringify(ogCache, null, 2));
  fs.writeFileSync(pinsCachePath, JSON.stringify(pinsCache, null, 2));
  fs.writeFileSync(publicCachePath, JSON.stringify(ogCache, null, 2));
  fs.writeFileSync(publicPinsCachePath, JSON.stringify(pinsCache, null, 2));
  
  console.log('Cache updated successfully!');
  console.log(`- Total OG cache entries: ${Object.keys(ogCache).length}`);
  console.log(`- Total pins cache entries: ${Object.keys(pinsCache).length}`);
  console.log(`- Updated Vimeo entries: ${vimeoUrls.length}`);
  console.log('\nHTML entities in descriptions should now be fixed.');
}

// Run the script
updateOgCache().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

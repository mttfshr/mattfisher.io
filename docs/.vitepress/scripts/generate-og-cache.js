// docs/.vitepress/scripts/generate-og-cache.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';

// Set up directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

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
 * Get all pins directly from Markdown files
 * This is a simplified version of the logic in getPins.js
 */
function getAllPins() {
  console.log('Getting pins data directly from markdown files...');
  
  const pinsDir = path.resolve(projectRoot, 'docs/pins');
  const allPins = [];
  
  if (!fs.existsSync(pinsDir)) {
    console.warn('Pins directory not found:', pinsDir);
    return [];
  }
  
  // Get all markdown files in the pins directory
  const mdFiles = fs.readdirSync(pinsDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md');
  
  console.log(`Found ${mdFiles.length} markdown files in pins directory:`, mdFiles);
  
  // Process each markdown file
  for (const file of mdFiles) {
    const filePath = path.join(pinsDir, file);
    console.log(`Processing ${filePath}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: markdownBody } = matter(content);
      
      // Extract URLs
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const urls = [];
      let match;
      
      while ((match = urlRegex.exec(markdownBody)) !== null) {
        urls.push(match[0]);
      }
      
      console.log(`Found ${urls.length} URLs in ${file}`);
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
      timeout: 10000, // 10 second timeout
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
      favicon: ''
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
    
    // Clean up description
    ogData.description = ogData.description.replace(/\\n/g, ' ').trim();
    
    return ogData;
  } catch (error) {
    console.error(`Error fetching OG data for ${url}:`, error.message);
    return {
      title: getHostnameFromUrl(url),
      description: '',
      imageUrl: '',
      siteName: getHostnameFromUrl(url),
      type: 'website',
      favicon: ''
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
 * Main function to generate OG cache
 */
async function generateOgCache() {
  console.log('Starting OG cache generation...');
  
  // Make sure cache directory exists
  const cacheDir = path.resolve(projectRoot, 'docs/.vitepress/cache');
  if (!fs.existsSync(cacheDir)) {
    console.log(`Creating cache directory: ${cacheDir}`);
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  // Load existing cache if it exists
  const ogCachePath = path.resolve(cacheDir, 'og-cache.json');
  const pinsCachePath = path.resolve(cacheDir, 'pins-cache.json');
  
  console.log('OG cache path:', ogCachePath);
  console.log('Pins cache path:', pinsCachePath);
  
  let ogCache = {};
  let pinsCache = {};
  
  try {
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
  
  // Get all pin URLs directly from markdown files
  const pinUrls = getAllPins();
  
  console.log(`Processing ${pinUrls.length} pin URLs for OG data...`);
  
  // Process each pin URL to get OG data
  let newEntries = 0;
  for (let i = 0; i < pinUrls.length; i++) {
    const url = pinUrls[i];
    
    // Skip if we already have data for this URL
    if (ogCache[url] || pinsCache[url]) {
      console.log(`Using cached data for: ${url}`);
      continue;
    }
    
    try {
      // Fetch OG data
      const ogData = await fetchOgData(url);
      
      // Save to both caches
      ogCache[url] = ogData;
      pinsCache[url] = ogData;
      newEntries++;
      
      // Save cache periodically
      if (i % 10 === 0 || i === pinUrls.length - 1) {
        fs.writeFileSync(ogCachePath, JSON.stringify(ogCache, null, 2));
        fs.writeFileSync(pinsCachePath, JSON.stringify(pinsCache, null, 2));
        console.log(`Cache saved at URL ${i + 1}/${pinUrls.length}`);
      }
      
      // Add a small delay between requests to be nice to servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error.message);
    }
  }
  
  // Save final cache
  fs.writeFileSync(ogCachePath, JSON.stringify(ogCache, null, 2));
  fs.writeFileSync(pinsCachePath, JSON.stringify(pinsCache, null, 2));
  
  console.log('OG cache generation complete!');
  console.log(`- OG cache: ${Object.keys(ogCache).length} entries`);
  console.log(`- Pins cache: ${Object.keys(pinsCache).length} entries`);
  console.log(`- New entries added: ${newEntries}`);
}

// Run the main function
generateOgCache().catch(error => {
  console.error('Error generating OG cache:', error);
  process.exit(1);
});
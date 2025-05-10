// docs/_scripts/generatePinsData.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';
import nodeFetch from 'node-fetch';
const fetch = nodeFetch.default || nodeFetch;

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for OG data
let ogCache = {};
const CACHE_PATH = path.join(__dirname, '../_cache/pins-cache.json');

// Load existing cache
try {
  if (fs.existsSync(CACHE_PATH)) {
    ogCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    console.log(`Loaded pins cache with ${Object.keys(ogCache).length} entries`);
  }
} catch (error) {
  console.warn('Error loading pins cache:', error);
  ogCache = {};
}

/**
 * Save cache to disk
 */
function saveCache() {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(ogCache, null, 2));
    console.log(`Saved pins cache with ${Object.keys(ogCache).length} entries`);
  } catch (error) {
    console.error('Error saving pins cache:', error);
  }
}

/**
 * Infer content type from URL and OG data
 */
async function inferContentType(url, ogData) {
  try {
    // Domain-based inference
    const domain = new URL(url).hostname.replace('www.', '');
    
    // Music services
    if (['spotify.com', 'bandcamp.com', 'soundcloud.com', 'tidal.com', 
         'music.apple.com', 'deezer.com'].includes(domain)) {
      return 'music';
    }
    
    // Video platforms
    if (['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 
         'dailymotion.com', 'netflix.com', 'hulu.com'].includes(domain)) {
      return 'video';
    }
    
    // Code repositories
    if (['github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
         'npmjs.com', 'codesandbox.io'].includes(domain)) {
      return 'code';
    }
    
    // Design platforms
    if (['dribbble.com', 'behance.net', 'figma.com', 'sketch.com',
         'adobe.com', 'canva.com'].includes(domain)) {
      return 'design';
    }
    
    // Reading platforms
    if (['medium.com', 'dev.to', 'hackernoon.com', 'substack.com',
         'nytimes.com', 'washingtonpost.com'].includes(domain) ||
        domain.includes('blog.')) {
      return 'article';
    }
    
    // Social media
    if (['twitter.com', 'instagram.com', 'facebook.com', 'linkedin.com',
         'pinterest.com', 'reddit.com'].includes(domain)) {
      return 'social';
    }
    
    // Path-based inference
    const pathname = new URL(url).pathname;
    
    if (pathname.match(/\.(mp3|wav|ogg|flac)$/i)) {
      return 'music';
    }
    
    if (pathname.match(/\.(mp4|avi|mov|wmv)$/i)) {
      return 'video';
    }
    
    if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return 'image';
    }
    
    if (pathname.match(/\.(pdf|doc|docx|epub)$/i)) {
      return 'document';
    }
    
    // OG-tag based inference
    if (ogData) {
      if (ogData.type) {
        if (ogData.type.startsWith('music')) return 'music';
        if (ogData.type.startsWith('video')) return 'video';
        if (ogData.type === 'article') return 'article';
      }
      
      // Check meta title and description for clues
      const textToCheck = `${ogData.title || ''} ${ogData.description || ''}`.toLowerCase();
      
      if (textToCheck.includes('podcast') || textToCheck.includes('episode')) {
        return 'podcast';
      }
      
      if ((textToCheck.includes('tutorial') || textToCheck.includes('guide') || 
           textToCheck.includes('how to')) && !textToCheck.includes('video')) {
        return 'article';
      }
    }
  } catch (error) {
    console.error(`Error inferring content type for ${url}:`, error);
  }
  
  // Default classification
  return 'link';
}

/**
 * Fetch OG data for a URL
 */
async function fetchOgData(url) {
  // Check cache first
  if (ogCache[url]) {
    return ogCache[url];
  }
  
  try {
    console.log(`Fetching OG data for ${url}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MattFisherPins/1.0; +http://mattfisher.io)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract OG data
    const ogData = {
      title: $('meta[property="og:title"]').attr('content') || 
             $('meta[name="twitter:title"]').attr('content') || 
             $('title').text() || '',
             
      description: $('meta[property="og:description"]').attr('content') || 
                  $('meta[name="twitter:description"]').attr('content') || 
                  $('meta[name="description"]').attr('content') || '',
                  
      imageUrl: $('meta[property="og:image"]').attr('content') || 
               $('meta[name="twitter:image"]').attr('content') || '',
               
      siteName: $('meta[property="og:site_name"]').attr('content') || 
                new URL(url).hostname.replace('www.', ''),
                
      type: $('meta[property="og:type"]').attr('content') || 'website'
    };
    
    // Additional domain-specific extractors
    if (url.includes('spotify.com')) {
      // Extract Spotify-specific data (artists, album, etc.)
      ogData.contentType = 'music';
      
      // Extract artist from various possible locations
      ogData.artist = $('meta[property="music:musician"]').attr('content') || 
                     $('meta[property="music:creator"]').attr('content') || 
                     '';
    } else if (url.includes('youtube.com') || url.includes('vimeo.com')) {
      ogData.contentType = 'video';
      ogData.duration = $('meta[property="video:duration"]').attr('content') || '';
    } else if (url.includes('github.com')) {
      ogData.contentType = 'code';
      // Extract language, stars, etc.
    }
    
    // Cache the results
    ogCache[url] = ogData;
    
    // Save updated cache every few requests
    if (Object.keys(ogCache).length % 5 === 0) {
      saveCache();
    }
    
    return ogData;
  } catch (error) {
    console.error(`Error fetching OG data for ${url}:`, error);
    const fallbackData = {
      title: url,
      description: '',
      imageUrl: '',
      siteName: url.includes('://') ? new URL(url).hostname.replace('www.', '') : '',
      type: 'website',
      error: true
    };
    
    // Cache the fallback data
    ogCache[url] = fallbackData;
    
    return fallbackData;
  }
}

/**
 * Helper function to create URL-friendly slugs
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

/**
 * Parse a markdown file to extract pins
 */
async function extractPinsFromMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, content: markdownBody } = matter(content);
  
  // Track sections for organization
  let currentSection = 'General';
  const pins = [];
  
  // Split content by lines
  const lines = markdownBody.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track sections (## headings)
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim();
      continue;
    }
    
    // Skip other heading levels
    if (line.startsWith('#') && !line.startsWith('##')) continue;
    
    // Look for list items with links
    if (line.startsWith('- ') || line.startsWith('* ')) {
      // Extract the URL
      const urlMatch = line.match(/https?:\/\/[^\s)]+/);
      if (!urlMatch) continue;
      
      const url = urlMatch[0];
      
      // Check if there's a next line that might contain notes
      let notes = '';
      let tags = [];
      
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        
        // If next line is indented (starts with spaces) and not a new list item
        if (lines[i + 1].startsWith('  ') && 
            !nextLine.startsWith('- ') && 
            !nextLine.startsWith('* ') && 
            !nextLine.startsWith('#')) {
          
          notes = nextLine;
          
          // Extract any hashtags
          notes = notes.replace(/#(\w+)/g, (match, tag) => {
            tags.push(tag);
            return ''; // Remove the tag from notes
          }).trim();
          
          i++; // Skip the notes line since we've processed it
        }
      }
      
      // Create pin object with unique ID
      const pinId = `pin-${uuidv4().substring(0, 8)}`;
      const pin = {
        id: pinId,
        url,
        notes: notes || '',
        tags,
        section: currentSection,
        pinDate: new Date().toISOString() // Use current date as default
      };
      
      pins.push(pin);
    }
  }
  
  // Enrich pins with OG data and content type inference
  const enrichedPins = await Promise.all(
    pins.map(async pin => {
      const ogData = await fetchOgData(pin.url);
      const contentType = await inferContentType(pin.url, ogData);
      
      // If we have no user-provided tags, at least add the content type
      if (pin.tags.length === 0) {
        pin.tags.push(contentType);
      } else if (!pin.tags.includes(contentType)) {
        // Add content type if not already in tags
        pin.tags.push(contentType);
      }
      
      return { 
        ...pin, 
        ...ogData,
        contentType,
        // Generate a slug from the title or URL
        slug: ogData.title 
          ? slugify(ogData.title)
          : slugify(new URL(pin.url).pathname.split('/').pop() || pin.id)
      };
    })
  );
  
  return enrichedPins;
}

/**
 * Main function to generate pins data
 */
export async function generatePinsData() {
  const pinsFile = path.join(__dirname, '../pins/pins.md');
  const outputFile = path.join(__dirname, '../.vitepress/data/pinsData.js');
  
  console.log('Processing pins from', pinsFile);
  
  // Process the pins file
  const pins = await extractPinsFromMarkdown(pinsFile);
  
  console.log(`Processed ${pins.length} pins`);
  
  // Extract unique content types
  const contentTypes = [...new Set(pins.map(pin => pin.contentType))].sort();
  
  // Extract all unique tags (including content types)
  const allTags = [...new Set(pins.flatMap(pin => pin.tags))].sort();
  
  // Extract user-defined tags (excluding content types)
  const userTags = allTags.filter(tag => !contentTypes.includes(tag));
  
  // Create a unified data structure
  const pinsData = {
    pins,
    contentTypes,
    allTags,
    userTags,
    sections: [...new Set(pins.map(pin => pin.section))].sort()
  };
  
  // Ensure directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write to output file
  const outputContent = `// Auto-generated pins data
export const pinsData = ${JSON.stringify(pinsData, null, 2)};
`;
  
  fs.writeFileSync(outputFile, outputContent);
  console.log(`Generated pins data with ${pins.length} pins`);
  
  // Save the cache
  saveCache();
  
  return pinsData;
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePinsData().catch(console.error);
}

// docs/.vitepress/utils/getPins.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';

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
 * Infer content type from URL and optional metadata
 */
function inferContentType(url, metadata = null) {
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
    
    // Metadata-based inference if available
    if (metadata) {
      if (metadata.type) {
        if (metadata.type.startsWith('music')) return 'music';
        if (metadata.type.startsWith('video')) return 'video';
        if (metadata.type === 'article') return 'article';
      }
    }
  } catch (error) {
    console.error(`Error inferring content type for ${url}:`, error);
  }
  
  // Default classification
  return 'link';
}

/**
 * Get OG data from cache if available
 */
function getOgDataFromCache(url) {
  try {
    // Try to read from the OG cache
    const cachePath = path.resolve(process.cwd(), 'docs/_cache/pins-cache.json');
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (cache[url]) {
        return cache[url];
      }
    }
    
    // Alternative: try the global OG cache
    const globalCachePath = path.resolve(process.cwd(), 'docs/_cache/og-cache.json');
    if (fs.existsSync(globalCachePath)) {
      const globalCache = JSON.parse(fs.readFileSync(globalCachePath, 'utf8'));
      if (globalCache[url]) {
        return globalCache[url];
      }
    }
  } catch (error) {
    console.warn(`Error reading OG cache for ${url}:`, error);
  }
  
  // Return a minimal fallback if no cache data available
  return {
    title: new URL(url).hostname,
    description: '',
    imageUrl: '',
    siteName: new URL(url).hostname.replace('www.', ''),
    type: 'website'
  };
}

/**
 * Extract pins from a markdown file
 */
function extractPinsFromMarkdown(filePath) {
  console.log('Processing pins from', filePath);
  
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
      
      // Get OG data from cache
      try {
        const ogData = getOgDataFromCache(url);
        const contentType = inferContentType(url, ogData);
        
        // If we have no user-provided tags, at least add the content type
        if (tags.length === 0) {
          tags.push(contentType);
        } else if (!tags.includes(contentType)) {
          // Add content type if not already in tags
          tags.push(contentType);
        }
        
        pins.push({
          id: pinId,
          url,
          notes: notes || '',
          tags,
          section: currentSection,
          pinDate: new Date().toISOString(), // Use current date as default
          
          // OG data
          title: ogData.title || url,
          description: ogData.description || '',
          imageUrl: ogData.imageUrl || '',
          siteName: ogData.siteName || new URL(url).hostname.replace('www.', ''),
          type: ogData.type || 'website',
          contentType,
          
          // Generate a slug from the title or URL
          slug: ogData.title 
            ? slugify(ogData.title)
            : slugify(new URL(url).pathname.split('/').pop() || pinId)
        });
      } catch (error) {
        console.error(`Error processing pin ${url}:`, error);
        // Add a minimal pin with the url if OG data fails
        pins.push({
          id: pinId,
          url,
          notes: notes || '',
          tags: [...tags, 'link'],
          section: currentSection,
          pinDate: new Date().toISOString(),
          title: url,
          description: '',
          imageUrl: '',
          siteName: '',
          contentType: 'link',
          slug: slugify(pinId)
        });
      }
    }
  }
  
  console.log(`Processed ${pins.length} pins`);
  return pins;
}

/**
 * Main function to get pins data
 */
export function getPins() {
  console.log('Getting pins data...');
  
  try {
    const pinsFile = path.resolve(process.cwd(), 'docs/pins/pins.md');
    if (!fs.existsSync(pinsFile)) {
      console.warn('Pins file not found:', pinsFile);
      return {
        pins: [],
        contentTypes: [],
        allTags: [],
        userTags: [],
        sections: []
      };
    }
    
    // Process the pins file
    const pins = extractPinsFromMarkdown(pinsFile);
    
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
    
    return pinsData;
  } catch (error) {
    console.error('Error processing pins data:', error);
    return {
      pins: [],
      contentTypes: [],
      allTags: [],
      userTags: [],
      sections: []
    };
  }
}
// docs/.vitepress/utils/getPins.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

/**
 * Calculate MD5 hash of file content for change detection
 */
function calculateFileHash(content) {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Load pins processing cache
 */
function loadPinsCache() {
  try {
    const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/pins-processed.json');
    if (fs.existsSync(cachePath)) {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      return cacheData;
    }
  } catch (error) {
    console.warn('Error loading pins cache:', error.message);
  }
  
  return {
    processedPins: {},
    fileHashes: {},
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Save pins processing cache
 */
function savePinsCache(cacheData) {
  try {
    const cacheDir = path.resolve(process.cwd(), 'docs/.vitepress/cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const cachePath = path.join(cacheDir, 'pins-processed.json');
    cacheData.lastUpdate = new Date().toISOString();
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.warn('Error saving pins cache:', error.message);
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
 * Infer structured metadata from URL and OG data
 * @param {string} url - The URL to analyze
 * @param {Object} ogData - Open Graph metadata if available
 * @returns {Object} Structured metadata including content type and more
 */
function inferStructuredMetadata(url, ogData = null) {
  const metadata = {
    type: [],       // Content type (e.g., music, video, article)
    source: [],     // Source platform (e.g., spotify, vimeo, medium)
    contentType: [] // More specific content classification
  };
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const pathname = urlObj.pathname;
    
    // Infer source from domain
    if (domain.includes('spotify.com')) {
      metadata.source.push('spotify');
      
      // Infer more specific content types for Spotify
      if (pathname.includes('/album/')) {
        metadata.contentType.push('album');
      } else if (pathname.includes('/playlist/')) {
        metadata.contentType.push('playlist');
      } else if (pathname.includes('/track/')) {
        metadata.contentType.push('track');
      } else if (pathname.includes('/artist/')) {
        metadata.contentType.push('artist');
      }
      
      metadata.type.push('music');
    } else if (domain.includes('vimeo.com')) {
      metadata.source.push('vimeo');
      metadata.type.push('video');
    } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      metadata.source.push('youtube');
      metadata.type.push('video');
    } else if (domain.includes('github.com')) {
      metadata.source.push('github');
      metadata.type.push('code');
      
      // Determine if it's a repository, profile, etc.
      const pathParts = pathname.split('/').filter(p => p);
      if (pathParts.length === 1) {
        metadata.contentType.push('profile');
      } else if (pathParts.length >= 2) {
        metadata.contentType.push('repository');
      }
    } else if (domain.includes('bandcamp.com')) {
      metadata.source.push('bandcamp');
      metadata.type.push('music');
    } else if (domain.includes('medium.com') || domain.includes('dev.to')) {
      metadata.source.push(domain.split('.')[0]);
      metadata.type.push('article');
    } else if (domain.includes('twitter.com') || domain.includes('instagram.com')) {
      metadata.source.push(domain.split('.')[0]);
      metadata.type.push('social');
    }
    
    // More domain-based inference for common sites
    if (['dribbble.com', 'behance.net', 'figma.com'].includes(domain)) {
      metadata.source.push(domain.split('.')[0]);
      metadata.type.push('design');
    }
    
    // Extract publication year from OG data if available
    if (ogData && ogData.datePublished) {
      const pubYear = new Date(ogData.datePublished).getFullYear();
      if (!isNaN(pubYear)) {
        metadata.year = [pubYear.toString()];
      }
    }
    
    // Extract author or artist from OG data
    if (ogData && ogData.author) {
      metadata.author = [ogData.author];
    }
    
    // If we have OG type, use it to enhance our type inference
    if (ogData && ogData.type) {
      const ogType = ogData.type.toLowerCase();
      
      if (ogType === 'article' && !metadata.type.includes('article')) {
        metadata.type.push('article');
      } else if (ogType === 'video' && !metadata.type.includes('video')) {
        metadata.type.push('video');
      } else if (ogType === 'music' && !metadata.type.includes('music')) {
        metadata.type.push('music');
      }
    }
    
    // Infer from file extension in path
    if (pathname.match(/\.(mp3|wav|ogg|flac)$/i)) {
      metadata.type.push('music');
      metadata.contentType.push('audio-file');
    } else if (pathname.match(/\.(mp4|avi|mov|wmv)$/i)) {
      metadata.type.push('video');
      metadata.contentType.push('video-file');
    } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      metadata.type.push('image');
    } else if (pathname.match(/\.(pdf|doc|docx|epub)$/i)) {
      metadata.type.push('document');
    }
    
    // Remove duplicates
    metadata.type = [...new Set(metadata.type)];
    metadata.source = [...new Set(metadata.source)];
    metadata.contentType = [...new Set(metadata.contentType)];
    
    // If we couldn't determine a type, use a default
    if (metadata.type.length === 0) {
      metadata.type.push('link');
    }
    
    return metadata;
  } catch (error) {
    console.error(`Error inferring metadata for ${url}:`, error);
    return { type: ['link'] };
  }
}

/**
 * Process all tags, combining manual key:value pairs with inferred metadata
 * @param {Array} manualTags - Tags from markdown content
 * @param {string} url - The URL to analyze
 * @param {Object} ogData - Open Graph metadata if available
 * @returns {Object} Combined structured metadata
 */
function processAllMetadata(manualTags, url, ogData) {
  // Extract manual key:value pairs
  const manualMetadata = {};
  const plainTags = [];
  const collections = [];
  
  for (const tag of manualTags) {
    if (tag.includes(':')) {
      // This is a key:value tag
      const [key, value] = tag.split(':', 2);
      
      if (key === 'collection') {
        collections.push(value);
      } else {
        if (!manualMetadata[key]) {
          manualMetadata[key] = [];
        }
        manualMetadata[key].push(value);
      }
    } else {
      // Regular tag without key:value format
      plainTags.push(tag);
    }
  }
  
  // Get automatically inferred metadata
  const inferredMetadata = inferStructuredMetadata(url, ogData);
  
  // Track which metadata was inferred vs manual
  const metadataSource = {};
  
  // Start with inferred metadata
  const combinedMetadata = {...inferredMetadata};
  Object.keys(inferredMetadata).forEach(key => {
    if (inferredMetadata[key] && inferredMetadata[key].length > 0) {
      metadataSource[key] = 'inferred';
    }
  });
  
  // Add manual metadata, potentially overriding inferred values
  Object.entries(manualMetadata).forEach(([key, values]) => {
    combinedMetadata[key] = values;
    metadataSource[key] = 'manual';
  });
  
  return {
    metadata: combinedMetadata,
    metadataSource,
    plainTags,
    collections
  };
}

/**
 * Enhanced Vimeo ID extraction from various URL formats
 * @param {string} url - The Vimeo URL to extract ID from
 * @returns {string|null} - The numeric Vimeo ID or null if not found
 */
function extractVimeoId(url) {
  // Pattern 1: Standard numeric URLs
  // https://vimeo.com/326204191
  // https://player.vimeo.com/video/326204191
  const numericMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (numericMatch) {
    return numericMatch[1];
  }
  
  // Pattern 2: Username/slug format (requires Vimeo API or manual mapping)
  // https://vimeo.com/jakefried/openeyes
  // https://vimeo.com/winstonhacking/animalcollectivewegoback
  const userSlugMatch = url.match(/vimeo\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (userSlugMatch) {
    const username = userSlugMatch[1];
    const slug = userSlugMatch[2];
    
    // Check if we have a manual mapping for this URL pattern
    const manualMappings = getVimeoManualMappings();
    const mappingKey = `${username}/${slug}`;
    if (manualMappings[mappingKey]) {
      return manualMappings[mappingKey];
    }
    
    // Log for manual mapping if not found
    console.log(`🔍 Vimeo username/slug URL needs manual mapping: ${url} (${mappingKey})`);
    return null;
  }
  
  // Pattern 3: Vimeo embed URLs
  // https://player.vimeo.com/video/326204191?h=abc123
  const embedMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (embedMatch) {
    return embedMatch[1];
  }
  
  // Pattern 4: Vimeo channels or groups
  // https://vimeo.com/channels/staffpicks/326204191
  const channelMatch = url.match(/vimeo\.com\/(?:channels|groups)\/[^\/]+\/(\d+)/);
  if (channelMatch) {
    return channelMatch[1];
  }
  
  return null;
}

/**
 * Manual mappings for Vimeo username/slug URLs to numeric IDs
 * This helps handle URLs like vimeo.com/username/videoname
 * @returns {Object} Mapping of "username/slug" to numeric ID
 */
function getVimeoManualMappings() {
  // Manual mappings for known username/slug URLs
  // These can be populated as needed when specific URLs are identified
  return {
    // Format: "username/slug": "numericId"
    // Example: "jakefried/openeyes": "123456789"
    
    // Add mappings as needed for specific pins that use username/slug format
    // These would need to be discovered by checking the actual Vimeo URLs
  };
}

/**
 * Extract Spotify album ID from various URL formats
 */
function extractSpotifyAlbumId(url) {
  const albumMatch = url.match(/\/album\/([a-zA-Z0-9]+)/);
  return albumMatch ? albumMatch[1] : null;
}

/**
 * Extract Spotify playlist ID from URL
 */
function extractSpotifyPlaylistId(url) {
  const playlistMatch = url.match(/\/playlist\/([a-zA-Z0-9]+)/);
  return playlistMatch ? playlistMatch[1] : null;
}

/**
 * Get Spotify artwork URL from enhanced catalog with Spotify thumbnails
 */
function getSpotifyArtworkUrl(url) {
  try {
    const catalogPath = path.resolve(process.cwd(), 'catalog.json');
    if (!fs.existsSync(catalogPath)) {
      return null;
    }
    
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    if (!catalog.spotifyThumbnails) {
      return null;
    }
    
    // Extract album or playlist ID from URL
    const albumId = extractSpotifyAlbumId(url);
    const playlistId = extractSpotifyPlaylistId(url);
    
    let thumbnailKey = null;
    if (albumId) {
      thumbnailKey = `spotify-album-${albumId}`;
    } else if (playlistId) {
      thumbnailKey = `spotify-playlist-${playlistId}`;
    }
    
    if (thumbnailKey && catalog.spotifyThumbnails[thumbnailKey]) {
      return catalog.spotifyThumbnails[thumbnailKey].artworkUrl;
    }
    
    return null;
  } catch (error) {
    console.warn(`Error reading Spotify catalog for ${url}:`, error.message);
    return null;
  }
}

/**
 * Get Cloudflare Images URL for video pins from catalog with enhanced URL matching
 */
function getCloudflareImageUrl(url) {
  try {
    const catalogPath = path.resolve(process.cwd(), 'catalog.json');
    if (!fs.existsSync(catalogPath)) {
      return null;
    }
    
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    if (!catalog.videoThumbnails) {
      return null;
    }
    
    // Enhanced video ID extraction
    let thumbnailKey = null;
    
    // Check for Vimeo URLs with enhanced extraction
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      thumbnailKey = `vimeo-${vimeoId}`;
    } else {
      // Check for YouTube URLs
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (youtubeMatch) {
        thumbnailKey = `youtube-${youtubeMatch[1]}`;
      }
    }
    
    if (thumbnailKey && catalog.videoThumbnails[thumbnailKey]) {
      return catalog.videoThumbnails[thumbnailKey].cloudflareUrl;
    }
    
    return null;
  } catch (error) {
    console.warn(`Error reading Cloudflare catalog for ${url}:`, error.message);
    return null;
  }
}

/**
 * Get OG data from cache if available
 */
function getOgDataFromCache(url) {
  try {
    // Try to read from the production-ready public cache first
    const publicCachePath = path.resolve(process.cwd(), 'docs/public/cache/pins-cache.json');
    if (fs.existsSync(publicCachePath)) {
      try {
        const cache = JSON.parse(fs.readFileSync(publicCachePath, 'utf8'));
        if (cache[url]) {
          return cache[url];
        }
      } catch (err) {
        console.warn(`Error reading public cache for ${url}:`, err.message);
      }
    }
    
    // Then try the standard VitePress cache
    const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/pins-cache.json');
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (cache[url]) {
        return cache[url];
      }
    }
    
    // Alternative: try the global OG cache
    const globalCachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/og-cache.json');
    if (fs.existsSync(globalCachePath)) {
      const globalCache = JSON.parse(fs.readFileSync(globalCachePath, 'utf8'));
      if (globalCache[url]) {
        return globalCache[url];
      }
    }

    // NEW: Try the OpenGraph images cache from thumbnail generation
    const ogImagesCachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/og-images-cache.json');
    if (fs.existsSync(ogImagesCachePath)) {
      const ogImagesCache = JSON.parse(fs.readFileSync(ogImagesCachePath, 'utf8'));
      const urlKey = url.replace(/[^a-zA-Z0-9]/g, '_');
      if (ogImagesCache[urlKey]) {
        return ogImagesCache[urlKey];
      }
    }

    // Also try the global OG cache in public directory
    const publicGlobalCachePath = path.resolve(process.cwd(), 'docs/public/cache/og-cache.json');
    if (fs.existsSync(publicGlobalCachePath)) {
      try {
        const publicGlobalCache = JSON.parse(fs.readFileSync(publicGlobalCachePath, 'utf8'));
        if (publicGlobalCache[url]) {
          return publicGlobalCache[url];
        }
      } catch (err) {
        console.warn(`Error reading public global cache for ${url}:`, err.message);
      }
    }
  } catch (error) {
    console.warn(`Error reading OG cache for ${url}:`, error);
  }
  
  // Return a minimal fallback if no cache data available
  try {
    return {
      title: new URL(url).hostname,
      description: '',
      imageUrl: '',
      siteName: new URL(url).hostname.replace('www.', ''),
      type: 'website',
      favicon: ''
    };
  } catch (e) {
    return {
      title: url,
      description: '',
      imageUrl: '',
      siteName: '',
      type: 'website',
      favicon: ''
    };
  }
}

/**
 * Extract pins from a markdown file with incremental processing
 */
function extractPinsFromMarkdown(filePath, defaultSection = 'General', processedPinsCache = {}) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, content: markdownBody } = matter(content);
  
  // Calculate file hash for change detection
  const fileHash = calculateFileHash(content);
  const filename = path.basename(filePath);
  
  // Get base filename without extension to use as fallback section name
  const filenameWithoutExt = path.basename(filePath, '.md');
  
  // Determine default section based on filename
  // For service-specific files like spotify.md, use the service name as the section
  if (filenameWithoutExt !== 'pins') {
    defaultSection = filenameWithoutExt.charAt(0).toUpperCase() + filenameWithoutExt.slice(1);
  }
  
  // Track sections for organization
  let currentSection = defaultSection;
  const pins = [];
  
  // Split content by lines
  const lines = markdownBody.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
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
      
      // Check if there's a markdown link with title
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      let title = null;
      if (linkMatch) {
        title = linkMatch[1];
      }
      
      // Extract hashtags from the line - match both regular hashtags and key:value hashtags
      const tagMatches = line.match(/#([a-zA-Z0-9_:]+)/g) || [];
      const tags = tagMatches.map(tag => tag.substring(1));
      
      // Check if there's a next line that might contain notes
      let notes = '';
      
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        
        // If next line is indented (starts with spaces) and not a new list item
        if ((lines[i + 1].startsWith('  ') || !nextLine.startsWith('- ')) && 
            !nextLine.startsWith('* ') && 
            !nextLine.startsWith('#')) {
          
          notes = nextLine;
          
          // Extract any hashtags from notes
          const noteTagMatches = notes.match(/#([a-zA-Z0-9_:]+)/g) || [];
          const noteTags = noteTagMatches.map(tag => tag.substring(1));
          
          // Add tags from notes
          tags.push(...noteTags);
          
          // Remove the tags from notes text
          notes = notes.replace(/#\w+/g, '').trim();
          
          i++; // Skip the notes line since we've processed it
        }
      }
      
      // Create pin object with unique ID
      const pinId = `pin-${uuidv4().substring(0, 8)}`;
      
      // Create a timestamp that preserves file order (newer items have higher timestamps)
      // Use a base date and subtract the line number to maintain chronological order
      const baseDate = new Date();
      const preservedOrderDate = new Date(baseDate.getTime() - (i * 1000)); // Each line is 1 second earlier
      
      // Check if this URL is already in our processed cache
      if (processedPinsCache[url]) {
        // Use cached pin data, but update section if needed
        const cachedPin = { ...processedPinsCache[url] };
        cachedPin.section = currentSection;
        pins.push(cachedPin);
        continue;
      }
      
      try {
        // Get OG data from cache
        const ogData = getOgDataFromCache(url);
        
        // Process all metadata (inferred + manual)
        const processedData = processAllMetadata(tags, url, ogData);
        
        // Maintain backward compatibility with contentType
        const contentType = processedData.metadata.type && processedData.metadata.type.length > 0 
          ? processedData.metadata.type[0] 
          : 'link';
        
        // Enhanced thumbnail priority logic:
        // 1. OpenGraph imageUrl (best quality, creator-chosen)
        // 2. Spotify album artwork (high quality for music)
        // 3. Cloudflare video thumbnails (fallback for videos when no OG image)
        // 4. Empty string (component shows fallback icon)
        let finalImageUrl = '';
        if (ogData.imageUrl) {
          // Use OpenGraph image if available (first priority)
          finalImageUrl = ogData.imageUrl;
        } else if (url.includes('spotify.com')) {
          // Check for Spotify album artwork (second priority for Spotify URLs)
          const spotifyArtworkUrl = getSpotifyArtworkUrl(url);
          finalImageUrl = spotifyArtworkUrl || '';
        } else {
          // Fallback to Cloudflare video thumbnail for non-Spotify URLs
          const cloudflareImageUrl = getCloudflareImageUrl(url);
          finalImageUrl = cloudflareImageUrl || '';
        }
        
        pins.push({
          id: pinId,
          url,
          notes: notes || '',
          tags: processedData.plainTags, // Regular non-key:value tags
          rawTags: tags, // All original tags for reference
          collections: processedData.collections, // Collection memberships
          metadata: processedData.metadata, // Structured metadata
          metadataSource: processedData.metadataSource, // Track which metadata was inferred vs manual
          section: currentSection,
          pinDate: preservedOrderDate.toISOString(), // Use preserved file order
          contentType, // Keep the original contentType for backward compatibility
          
          // OG data (with proper priority: OG first, then Cloudflare fallback)
          title: title || ogData.title || url,
          description: ogData.description || '',
          imageUrl: finalImageUrl,
          favicon: ogData.favicon || '',
          siteName: ogData.siteName || new URL(url).hostname.replace('www.', ''),
          
          // Generate a slug from the title or URL
          slug: (title || ogData.title) 
            ? slugify(title || ogData.title)
            : slugify(new URL(url).pathname.split('/').pop() || pinId)
        });
      } catch (error) {
        console.error(`Error processing pin ${url}:`, error);
        
        // Enhanced fallback image URL with proper priority even in error case
        let fallbackImageUrl = '';
        if (url.includes('spotify.com')) {
          // First try to get Spotify artwork as fallback
          const spotifyArtworkUrl = getSpotifyArtworkUrl(url);
          fallbackImageUrl = spotifyArtworkUrl || '';
        } else {
          // For non-Spotify URLs, try Cloudflare video thumbnail as fallback
          const cloudflareImageUrl = getCloudflareImageUrl(url);
          fallbackImageUrl = cloudflareImageUrl || '';
        }
        
        // Add a minimal pin with the url if OG data fails
        pins.push({
          id: pinId,
          url,
          notes: notes || '',
          tags: tags.filter(tag => !tag.includes(':')), // Only non-key:value tags
          rawTags: tags, // All original tags 
          collections: tags.filter(tag => tag.startsWith('collection:')).map(tag => tag.split(':')[1]),
          metadata: { type: ['link'] },
          metadataSource: { type: 'fallback' },
          section: currentSection,
          pinDate: preservedOrderDate.toISOString(), // Use preserved file order
          title: title || url,
          description: '',
          imageUrl: fallbackImageUrl,
          favicon: '',
          siteName: '',
          contentType: 'link',
          slug: slugify(pinId)
        });
      }
    }
  }
  
  // Log summary instead of individual pins
  const fileBasename = path.basename(filePath);
  console.log(`Processed ${pins.length} pins from ${fileBasename}`);
  return { pins, fileHash };
}

/**
 * Main function to get pins data with incremental processing
 */
export function getPins() {
  console.log('Getting pins data...');
  
  try {
    const pinsDir = path.resolve(process.cwd(), 'docs/pins');
    const allPins = [];
    
    // Load processing cache
    const cache = loadPinsCache();
    let cacheUpdated = false;
    
    // Check if the pins directory exists
    if (!fs.existsSync(pinsDir)) {
      console.warn('Pins directory not found:', pinsDir);
      return {
        pins: [],
        contentTypes: [],
        allTags: [],
        userTags: [],
        sections: [],
        metadataKeys: {},
        collections: []
      };
    }
    
    // Get all markdown files in the pins directory
    const mdFiles = fs.readdirSync(pinsDir)
      .filter(file => file.endsWith('.md') && file !== 'index.md');
    
    console.log(`Found ${mdFiles.length} markdown files in pins directory:`, mdFiles);
    
    // Process pins.md first (if it exists) since it's the primary file
    if (mdFiles.includes('pins.md')) {
      const pinsFile = path.join(pinsDir, 'pins.md');
      const filename = 'pins.md';
      
      // Check if file has changed
      const content = fs.readFileSync(pinsFile, 'utf8');
      const currentHash = calculateFileHash(content);
      const cachedHash = cache.fileHashes[filename];
      
      if (currentHash === cachedHash) {
        // File unchanged, use cached pins
        const cachedPins = Object.values(cache.processedPins).filter(pin => 
          pin.sourceFile === filename
        );
        allPins.push(...cachedPins);
        console.log(`Used cached data for ${filename} (${cachedPins.length} pins)`);
      } else {
        // File changed, reprocess
        const result = extractPinsFromMarkdown(pinsFile, 'General', cache.processedPins);
        
        // Mark pins with source file for cache management
        result.pins.forEach(pin => {
          pin.sourceFile = filename;
          cache.processedPins[pin.url] = pin;
        });
        
        allPins.push(...result.pins);
        cache.fileHashes[filename] = result.fileHash;
        cacheUpdated = true;
        
        console.log(`Reprocessed ${filename} (${result.pins.length} pins)`);
      }
      
      // Remove pins.md from the array to avoid processing it twice
      const index = mdFiles.indexOf('pins.md');
      if (index > -1) {
        mdFiles.splice(index, 1);
      }
    }
    
    // Process all other markdown files in the pins directory
    for (const file of mdFiles) {
      const filePath = path.join(pinsDir, file);
      
      // Check if file has changed
      const content = fs.readFileSync(filePath, 'utf8');
      const currentHash = calculateFileHash(content);
      const cachedHash = cache.fileHashes[file];
      
      if (currentHash === cachedHash) {
        // File unchanged, use cached pins
        const cachedPins = Object.values(cache.processedPins).filter(pin => 
          pin.sourceFile === file
        );
        allPins.push(...cachedPins);
        console.log(`Used cached data for ${file} (${cachedPins.length} pins)`);
      } else {
        // File changed, reprocess
        const result = extractPinsFromMarkdown(filePath, 'General', cache.processedPins);
        
        // Mark pins with source file for cache management  
        result.pins.forEach(pin => {
          pin.sourceFile = file;
          cache.processedPins[pin.url] = pin;
        });
        
        allPins.push(...result.pins);
        cache.fileHashes[file] = result.fileHash;
        cacheUpdated = true;
        
        console.log(`Reprocessed ${file} (${result.pins.length} pins)`);
      }
    }
    
    // Save updated cache if needed
    if (cacheUpdated) {
      savePinsCache(cache);
      console.log('Updated pins processing cache');
    }
    
    // Extract metadata information
    const metadataKeys = {};
    const collections = new Set();
    
    allPins.forEach(pin => {
      // Track all metadata keys and their possible values
      if (pin.metadata) {
        Object.entries(pin.metadata).forEach(([key, values]) => {
          if (!metadataKeys[key]) {
            metadataKeys[key] = new Set();
          }
          
          values.forEach(value => metadataKeys[key].add(value));
        });
      }
      
      // Track all collections
      if (pin.collections) {
        pin.collections.forEach(collection => collections.add(collection));
      }
    });
    
    // Convert Sets to sorted Arrays
    Object.keys(metadataKeys).forEach(key => {
      metadataKeys[key] = Array.from(metadataKeys[key]).sort();
    });
    
    // Extract content types (for backward compatibility)
    const contentTypes = [...new Set(allPins.map(pin => pin.contentType))].sort();
    
    // Extract all unique tags (plain tags only, not key:value pairs)
    const allTags = [...new Set(allPins.flatMap(pin => pin.tags))].sort();
    
    // Extract user-defined tags (excluding content types)
    const userTags = allTags.filter(tag => !contentTypes.includes(tag));
    
    // Create a unified data structure
    const pinsData = {
      pins: allPins,
      contentTypes,
      allTags,
      userTags,
      sections: [...new Set(allPins.map(pin => pin.section))].sort(),
      metadataKeys,
      collections: Array.from(collections).sort()
    };
    
    // Calculate thumbnail statistics
    const thumbnailStats = {
      total: allPins.length,
      withImages: allPins.filter(pin => pin.imageUrl && pin.imageUrl.trim()).length,
      spotify: allPins.filter(pin => pin.imageUrl && (pin.imageUrl.includes('scdn.co') || pin.imageUrl.includes('spotifycdn.com'))).length,
      cloudflare: allPins.filter(pin => pin.imageUrl && pin.imageUrl.includes('imagedelivery.net')).length,
      opengraph: allPins.filter(pin => pin.imageUrl && !pin.imageUrl.includes('scdn.co') && !pin.imageUrl.includes('spotifycdn.com') && !pin.imageUrl.includes('imagedelivery.net')).length
    };
    
    console.log(`Total pins processed: ${allPins.length}`);
    console.log(`Content types found: ${contentTypes.length} types`);
    console.log(`Collections found: ${Array.from(collections).length} collections`);
    console.log(`\n📷 Thumbnail Summary:`);
    console.log(`   With thumbnails: ${thumbnailStats.withImages}/${thumbnailStats.total} (${((thumbnailStats.withImages/thumbnailStats.total)*100).toFixed(1)}%)`);
    if (thumbnailStats.spotify > 0) console.log(`   🎵 Spotify artwork: ${thumbnailStats.spotify}`);
    if (thumbnailStats.cloudflare > 0) console.log(`   🎞️ Cloudflare CDN: ${thumbnailStats.cloudflare}`);
    if (thumbnailStats.opengraph > 0) console.log(`   🌐 OpenGraph images: ${thumbnailStats.opengraph}`);
    
    return pinsData;
  } catch (error) {
    console.error('Error processing pins data:', error);
    return {
      pins: [],
      contentTypes: [],
      allTags: [],
      userTags: [],
      sections: [],
      metadataKeys: {},
      collections: []
    };
  }
}

/**
 * Enhanced thumbnail resolution with multiple fallback strategies
 * @param {string} url - The pin URL
 * @param {Object} ogData - OpenGraph data from cache
 * @returns {Object} Resolved thumbnail info with metadata
 */
function resolveEnhancedThumbnail(url, ogData) {
  const result = {
    imageUrl: '',
    source: 'none',
    confidence: 'low',
    alternatives: []
  };
  
  // Strategy 1: OpenGraph image (highest priority)
  if (ogData?.imageUrl && ogData.imageUrl.trim()) {
    result.imageUrl = ogData.imageUrl;
    result.source = 'opengraph';
    result.confidence = 'high';
    return result;
  }
  
  // Strategy 2: Cloudflare video thumbnails (for video content)
  const cloudflareImageUrl = getCloudflareImageUrl(url);
  if (cloudflareImageUrl) {
    result.imageUrl = cloudflareImageUrl;
    result.source = 'cloudflare-video';
    result.confidence = 'medium';
    return result;
  }
  
  // Strategy 3: Service-specific defaults (for known platforms)
  const serviceDefault = getServiceDefaultThumbnail(url);
  if (serviceDefault) {
    result.imageUrl = serviceDefault.url;
    result.source = `service-default-${serviceDefault.platform}`;
    result.confidence = 'low';
    result.alternatives.push('Generate custom thumbnail for this platform');
    return result;
  }
  
  // Strategy 4: Domain favicon as last resort
  if (ogData?.favicon) {
    result.alternatives.push({
      type: 'favicon',
      url: ogData.favicon,
      note: 'Site favicon as minimal fallback'
    });
  }
  
  // Missing thumbnail - logged silently for cleaner output
  
  return result;
}

/**
 * Get service-specific default thumbnails for known platforms
 * @param {string} url - The URL to analyze
 * @returns {Object|null} Default thumbnail info or null
 */
function getServiceDefaultThumbnail(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Platform-specific defaults (could be moved to config)
    const serviceDefaults = {
      'spotify.com': {
        platform: 'spotify',
        url: '/media/placeholders/spotify-default.png',
        note: 'Generic Spotify placeholder'
      },
      'bandcamp.com': {
        platform: 'bandcamp',
        url: '/media/placeholders/bandcamp-default.png',
        note: 'Generic Bandcamp placeholder'
      },
      'github.com': {
        platform: 'github',
        url: '/media/placeholders/github-default.png',
        note: 'Generic GitHub placeholder'
      }
    };
    
    return serviceDefaults[domain] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Batch refresh OpenGraph data for pins with missing thumbnails
 * @param {Array} pinUrls - URLs to refresh OG data for
 */
export async function refreshOpenGraphData(pinUrls) {
  console.log(`🔄 Refreshing OpenGraph data for ${pinUrls.length} URLs...`);
  
  const refreshedData = {};
  const ogCachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/pins-cache.json');
  
  for (const url of pinUrls) {
    try {
      console.log(`Fetching OG data for: ${url}`);
      
      // Use your existing OG fetching logic here
      const ogData = await fetchOpenGraphData(url);
      
      if (ogData && ogData.imageUrl) {
        refreshedData[url] = ogData;
        console.log(`✅ Found thumbnail: ${ogData.imageUrl}`);
      } else {
        console.log(`❌ No thumbnail found for: ${url}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching OG data for ${url}:`, error.message);
    }
  }
  
  // Update cache
  if (Object.keys(refreshedData).length > 0) {
    try {
      let existingCache = {};
      if (fs.existsSync(ogCachePath)) {
        existingCache = JSON.parse(fs.readFileSync(ogCachePath, 'utf8'));
      }
      
      const updatedCache = { ...existingCache, ...refreshedData };
      fs.writeFileSync(ogCachePath, JSON.stringify(updatedCache, null, 2));
      
      console.log(`💾 Updated cache with ${Object.keys(refreshedData).length} new entries`);
    } catch (error) {
      console.error('Error updating OG cache:', error);
    }
  }
  
  return refreshedData;
}

/**
 * Audit Cloudflare video thumbnail coverage
 */
export function auditVideoThumbnailCoverage() {
  console.log('🎬 Auditing video thumbnail coverage...\n');
  
  const pinsData = getPins();
  const videoUrls = pinsData.pins.filter(pin => 
    pin.contentType === 'video' || 
    pin.url.includes('youtube') || 
    pin.url.includes('vimeo')
  );
  
  console.log(`Found ${videoUrls.length} video URLs in pins`);
  
  const cloudflareMatches = [];
  const missingFromCloudflare = [];
  
  videoUrls.forEach(pin => {
    const cloudflareUrl = getCloudflareImageUrl(pin.url);
    
    if (cloudflareUrl) {
      cloudflareMatches.push({
        url: pin.url,
        title: pin.title,
        cloudflareUrl
      });
    } else {
      missingFromCloudflare.push({
        url: pin.url,
        title: pin.title,
        platform: pin.url.includes('vimeo') ? 'vimeo' : 'youtube'
      });
    }
  });
  
  console.log(`✅ ${cloudflareMatches.length} videos have Cloudflare thumbnails`);
  console.log(`❌ ${missingFromCloudflare.length} videos missing from Cloudflare\n`);
  
  if (missingFromCloudflare.length > 0) {
    console.log('MISSING FROM CLOUDFLARE:');
    missingFromCloudflare.forEach(video => {
      console.log(`  📹 ${video.platform}: ${video.url}`);
    });
    
    console.log('\n💡 To generate missing thumbnails:');
    console.log('   npm run media:generate-video-thumbnails');
  }
  
  return {
    total: videoUrls.length,
    withThumbnails: cloudflareMatches.length,
    missing: missingFromCloudflare
  };
}
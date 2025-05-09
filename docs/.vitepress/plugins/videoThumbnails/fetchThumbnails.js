// fetchThumbnails.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

/**
 * Fetches thumbnails for Vimeo and YouTube videos and saves them locally.
 * This can be run as a build step to ensure thumbnails are available.
 */
export async function fetchVideoThumbnails(workbookItems, options = {}) {
  const {
    outputDir = path.resolve(process.cwd(), 'docs/_media/thumbnails'),
    width = 640,
    height = 360,
    quality = 80,
    skipExisting = true,
  } = options;
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Process each workbook item that has a video
  const promises = workbookItems
    .filter(item => item.mediaType === 'video' || (item.media && item.media.type === 'video'))
    .map(async item => {
      try {
        // Skip if item already has a thumbnail and skipExisting is true
        if (skipExisting && item.thumbnailUrl) {
          console.log(`Item ${item.title} already has a thumbnail, skipping`);
          return;
        }
        
        // Check if it's using the new or old format
        const provider = item.videoProvider || (item.media ? item.media.provider : '');
        const mediaUrl = item.mediaUrl || (item.media ? item.media.url : '');
        
        // We'll handle Vimeo and YouTube differently
        if (provider === 'vimeo') {
          await processVimeoVideo(item, outputDir, { width, height, quality });
        } else if (provider === 'youtube') {
          await processYouTubeVideo(item, outputDir);
        } else if (provider === '') {
          // Handle known slugs with custom thumbnails
          await processCustomThumbnail(item, outputDir);
        }
      } catch (error) {
        console.error(`Error processing thumbnail for ${item.title}:`, error.message);
      }
    });
  
  await Promise.all(promises);
  console.log('Video thumbnails processed successfully!');
}

async function processVimeoVideo(item, outputDir, options) {
  // Get the Vimeo ID from either the new or old format
  const mediaUrl = item.mediaUrl || (item.media ? item.media.url : '');
  const vimeoId = extractVimeoId(mediaUrl);
  if (!vimeoId) return;
  
  const outputPath = path.join(outputDir, `vimeo-${vimeoId}.jpg`);
  
  // Skip if thumbnail already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Thumbnail already exists for Vimeo video ${vimeoId}`);
    // Still update the item with the thumbnail path
    item.thumbnailUrl = `/_media/thumbnails/vimeo-${vimeoId}.jpg`;
    return;
  }
  
  try {
    // Use Vimeo's oEmbed API to get video info including thumbnail
    const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}&width=${options.width}`;
    
    const response = await fetch(oEmbedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Vimeo oEmbed data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract the thumbnail URL and download it
    if (data.thumbnail_url) {
      const thumbnailResponse = await fetch(data.thumbnail_url);
      if (!thumbnailResponse.ok) {
        throw new Error(`Failed to fetch thumbnail: ${thumbnailResponse.statusText}`);
      }
      
      const buffer = await thumbnailResponse.buffer();
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Saved thumbnail for Vimeo video ${vimeoId}`);
      
      // Update the item with the thumbnail path
      item.thumbnailUrl = `/_media/thumbnails/vimeo-${vimeoId}.jpg`;
    }
  } catch (error) {
    console.error(`Error processing Vimeo video ${vimeoId}:`, error.message);
    
    // Create a SVG placeholder instead
    const svgPath = path.join(outputDir, `${item.slug}.svg`);
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="640" height="360" viewBox="0 0 640 360" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="360" fill="#222222"/>
  <rect x="120" y="120" width="400" height="120" fill="#333333"/>
  <text x="320" y="190" font-family="IBM Plex Mono, monospace" font-size="24" text-anchor="middle" fill="#ffffff">${item.title}</text>
  <g transform="translate(540, 40)">
    <circle r="25" fill="rgba(0, 173, 239, 0.8)"/>
    <text x="0" y="8" font-family="IBM Plex Mono, monospace" font-size="20" text-anchor="middle" fill="#ffffff">V</text>
  </g>
</svg>`;
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created SVG placeholder for ${item.title}`);
    
    // Update the item with the SVG placeholder path
    item.thumbnailUrl = `/_media/thumbnails/${item.slug}.svg`;
  }
}

async function processYouTubeVideo(item, outputDir) {
  // Get the YouTube ID from either the new or old format
  const mediaUrl = item.mediaUrl || (item.media ? item.media.url : '');
  const youtubeId = extractYouTubeId(mediaUrl);
  if (!youtubeId) return;
  
  const outputPath = path.join(outputDir, `youtube-${youtubeId}.jpg`);
  
  // Skip if thumbnail already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Thumbnail already exists for YouTube video ${youtubeId}`);
    // Still update the item with the thumbnail path
    item.thumbnailUrl = `/_media/thumbnails/youtube-${youtubeId}.jpg`;
    return;
  }
  
  try {
    // YouTube provides predictable thumbnail URLs
    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    
    const response = await fetch(thumbnailUrl);
    
    // If maxresdefault is not available, try hqdefault
    if (!response.ok) {
      const fallbackUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      const fallbackResponse = await fetch(fallbackUrl);
      
      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch YouTube thumbnail: ${fallbackResponse.statusText}`);
      }
      
      const buffer = await fallbackResponse.buffer();
      fs.writeFileSync(outputPath, buffer);
    } else {
      const buffer = await response.buffer();
      fs.writeFileSync(outputPath, buffer);
    }
    
    console.log(`Saved thumbnail for YouTube video ${youtubeId}`);
    
    // Update the item with the thumbnail path
    item.thumbnailUrl = `/_media/thumbnails/youtube-${youtubeId}.jpg`;
  } catch (error) {
    console.error(`Error processing YouTube video ${youtubeId}:`, error.message);
    
    // Create a placeholder instead
    const placeholderPath = path.join(outputDir, `${item.slug}.svg`);
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="640" height="360" viewBox="0 0 640 360" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="360" fill="#222222"/>
  <rect x="120" y="120" width="400" height="120" fill="#333333"/>
  <text x="320" y="190" font-family="IBM Plex Mono, monospace" font-size="24" text-anchor="middle" fill="#ffffff">${item.title}</text>
  <g transform="translate(540, 40)">
    <circle r="25" fill="rgba(255, 0, 0, 0.8)"/>
    <text x="0" y="8" font-family="IBM Plex Mono, monospace" font-size="20" text-anchor="middle" fill="#ffffff">YT</text>
  </g>
</svg>`;
    fs.writeFileSync(placeholderPath, svgContent);
    
    // Update the item with the placeholder path
    item.thumbnailUrl = `/_media/thumbnails/${item.slug}.svg`;
  }
}

async function processCustomThumbnail(item, outputDir) {
  // Special handling for certain slugs
  const specialSlugs = {
    'motion-studies': 'Motion Studies',
    'sound-viz': 'Sound Visualization'
  };
  
  if (specialSlugs[item.slug]) {
    const svgPath = path.join(outputDir, `${item.slug}.svg`);
    
    // Check if SVG already exists
    if (!fs.existsSync(svgPath)) {
      const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="640" height="360" viewBox="0 0 640 360" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="360" fill="#222222"/>
  <rect x="120" y="120" width="400" height="120" fill="#333333"/>
  <text x="320" y="190" font-family="IBM Plex Mono, monospace" font-size="24" text-anchor="middle" fill="#ffffff">${specialSlugs[item.slug]}</text>
  <g transform="translate(540, 40)">
    <circle r="25" fill="rgba(0, 173, 239, 0.8)"/>
    <text x="0" y="8" font-family="IBM Plex Mono, monospace" font-size="20" text-anchor="middle" fill="#ffffff">V</text>
  </g>
</svg>`;
      fs.writeFileSync(svgPath, svgContent);
      console.log(`Created SVG placeholder for ${item.title}`);
    }
    
    // Update the item with the SVG placeholder path
    item.thumbnailUrl = `/_media/thumbnails/${item.slug}.svg`;
  }
}

// Helper function to extract Vimeo ID
function extractVimeoId(url) {
  if (!url) return null;
  
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}

// Helper function to extract YouTube ID
function extractYouTubeId(url) {
  if (!url) return null;
  
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}
// docs/.vitepress/plugins/videoThumbnails/fetchThumbnails.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

/**
* Fetches thumbnails for Vimeo and YouTube videos and saves them to the standard VitePress location.
*/
export async function fetchVideoThumbnails(workbookItems, options = {}) {
  const {
  outputDir = path.resolve(process.cwd(), 'docs/public/media/thumbnails'),
width = 640,
height = 360,
quality = 80,
skipExisting = true,
} = options;

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  console.log(`Creating thumbnails directory: ${outputDir}`);
fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Processing ${workbookItems.length} workbook items for video thumbnails`);

// Process each workbook item that has a video
const promises = workbookItems
.filter(item => item.media && item.media.type === 'video')
.map(async item => {
try {
  // Get provider and URL from the media object
  const { provider, url } = item.media;

  // Skip if provider is not supported
  if (!provider || (provider !== 'vimeo' && provider !== 'youtube')) {
    console.log(`Skipping ${item.title}: Unsupported provider ${provider}`);
  return;
  }
    
  // Process based on provider
  if (provider === 'vimeo') {
      await processVimeoVideo(item, url, outputDir, { width, height, quality });
      } else if (provider === 'youtube') {
        await processYouTubeVideo(item, url, outputDir);
      }
    } catch (error) {
    console.error(`Error processing thumbnail for ${item.title}:`, error.message);
  }
});

await Promise.all(promises);
console.log('Video thumbnails processed successfully!');
}

async function processVimeoVideo(item, mediaUrl, outputDir, options) {
// Get the Vimeo ID
const vimeoId = extractVimeoId(mediaUrl);
if (!vimeoId) {
console.log(`Could not extract Vimeo ID from ${mediaUrl}`);
return;
}

const outputPath = path.join(outputDir, `vimeo-${vimeoId}.jpg`);
const relativePath = `/media/thumbnails/vimeo-${vimeoId}.jpg`;

// Skip if thumbnail already exists and update the item
if (fs.existsSync(outputPath) && item.thumbnailUrl === relativePath) {
console.log(`Thumbnail already exists for Vimeo video ${vimeoId}`);
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
    item.thumbnailUrl = relativePath;
  }
} catch (error) {
  console.error(`Error processing Vimeo video ${vimeoId}:`, error.message);
  
  // Create a SVG placeholder instead
const svgPath = path.join(outputDir, `${item.slug}.svg`);
const relativeSvgPath = `/media/thumbnails/${item.slug}.svg`;

const svgContent = createVideoPlaceholderSvg(item.title, 'V');
fs.writeFileSync(svgPath, svgContent);

console.log(`Created SVG placeholder for ${item.title}`);

// Update the item with the SVG placeholder path
item.thumbnailUrl = relativeSvgPath;
}
}

async function processYouTubeVideo(item, mediaUrl, outputDir) {
// Get the YouTube ID
const youtubeId = extractYouTubeId(mediaUrl);
if (!youtubeId) {
console.log(`Could not extract YouTube ID from ${mediaUrl}`);
return;
}

const outputPath = path.join(outputDir, `youtube-${youtubeId}.jpg`);
const relativePath = `/media/thumbnails/youtube-${youtubeId}.jpg`;

// Skip if thumbnail already exists and update the item
if (fs.existsSync(outputPath) && item.thumbnailUrl === relativePath) {
console.log(`Thumbnail already exists for YouTube video ${youtubeId}`);
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
item.thumbnailUrl = relativePath;
} catch (error) {
console.error(`Error processing YouTube video ${youtubeId}:`, error.message);

// Create a placeholder instead
const placeholderPath = path.join(outputDir, `${item.slug}.svg`);
const relativePlaceholderPath = `/media/thumbnails/${item.slug}.svg`;

const svgContent = createVideoPlaceholderSvg(item.title, 'YT');
fs.writeFileSync(placeholderPath, svgContent);

// Update the item with the placeholder path
item.thumbnailUrl = relativePlaceholderPath;
}
}

// Helper function to create placeholder SVG
function createVideoPlaceholderSvg(title, providerLabel) {
return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="640" height="360" viewBox="0 0 640 360" version="1.1" xmlns="http://www.w3.org/2000/svg">
<rect width="640" height="360" fill="#222222"/>
<rect x="120" y="120" width="400" height="120" fill="#333333"/>
<text x="320" y="190" font-family="IBM Plex Mono, monospace" font-size="24" text-anchor="middle" fill="#ffffff">${title}</text>
<g transform="translate(540, 40)">
<circle r="25" fill="rgba(0, 173, 239, 0.8)"/>
<text x="0" y="8" font-family="IBM Plex Mono, monospace" font-size="20" text-anchor="middle" fill="#ffffff">${providerLabel}</text>
</g>
</svg>`;
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

const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
const match = url.match(regex);

return match ? match[1] : null;
}
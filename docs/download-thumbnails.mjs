#!/usr/bin/env node
// download-thumbnails.mjs
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function downloadThumbnail(videoId, provider, options = {}) {
  try {
    const { 
      outputDir = './docs/public/_media/thumbnails',
      skipExisting = true,
    } = options;
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${provider}-${videoId}.jpg`);
    
    // Skip if thumbnail already exists and skipExisting is true
    if (skipExisting && fs.existsSync(outputPath)) {
      console.log(`Thumbnail already exists for ${provider} video ${videoId}, skipping`);
      return `/_media/thumbnails/${provider}-${videoId}.jpg`;
    }
    
    if (provider === 'vimeo') {
      // Use Vimeo's oEmbed API to get video info including thumbnail
      const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=640`;
      console.log(`Fetching Vimeo thumbnail info for video ${videoId}...`);
      
      try {
        const response = await fetch(oEmbedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch Vimeo oEmbed data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract the thumbnail URL and download it
        if (data.thumbnail_url) {
          console.log(`Found thumbnail: ${data.thumbnail_url}`);
          const thumbResponse = await fetch(data.thumbnail_url);
          if (!thumbResponse.ok) {
            throw new Error(`Failed to fetch thumbnail: ${thumbResponse.statusText}`);
          }
          
          const buffer = await thumbResponse.buffer();
          fs.writeFileSync(outputPath, buffer);
          
          console.log(`Saved thumbnail to ${outputPath}`);
          return `/_media/thumbnails/${provider}-${videoId}.jpg`;
        } else {
          console.log('No thumbnail URL found in oEmbed data');
        }
      } catch (error) {
        console.error(`Error fetching Vimeo thumbnail for ${videoId}:`, error.message);
        console.log('Creating placeholder thumbnail instead');
        
        // Create a simple SVG placeholder if fetch fails
        const svgPath = path.join(outputDir, `${videoId}.svg`);
        const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="640" height="360" viewBox="0 0 640 360" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="360" fill="#222222"/>
  <rect x="120" y="120" width="400" height="120" fill="#333333"/>
  <text x="320" y="190" font-family="IBM Plex Mono, monospace" font-size="32" text-anchor="middle" fill="#ffffff">Vimeo ID: ${videoId}</text>
  <g transform="translate(540, 40)">
    <circle r="25" fill="rgba(0, 173, 239, 0.8)"/>
    <text x="0" y="8" font-family="IBM Plex Mono, monospace" font-size="20" text-anchor="middle" fill="#ffffff">V</text>
  </g>
</svg>`;
        fs.writeFileSync(svgPath, svgContent);
        console.log(`Created SVG placeholder at ${svgPath}`);
        
        // Copy a placeholder JPG
        const placeholderPath = path.join(__dirname, 'docs', 'public', '_media', 'video-placeholder.svg');
        if (fs.existsSync(placeholderPath)) {
          fs.copyFileSync(placeholderPath, outputPath);
          console.log(`Copied placeholder image to ${outputPath}`);
        }
        
        return `/_media/thumbnails/${provider}-${videoId}.jpg`;
      }
    } else if (provider === 'youtube') {
      // YouTube provides predictable thumbnail URLs
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      console.log(`Fetching YouTube thumbnail for video ${videoId}...`);
      
      try {
        const response = await fetch(thumbnailUrl);
        
        // If maxresdefault is not available, try hqdefault
        if (!response.ok) {
          console.log('maxresdefault not available, trying hqdefault...');
          const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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
        
        console.log(`Saved thumbnail to ${outputPath}`);
        return `/_media/thumbnails/${provider}-${videoId}.jpg`;
      } catch (error) {
        console.error(`Error fetching YouTube thumbnail for ${videoId}:`, error.message);
        console.log('Using placeholder thumbnail instead');
        return '/_media/video-placeholder.svg';
      }
    } else {
      console.log(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error downloading thumbnail:`, error.message);
  }
  
  return null;
}

// Videos to process - add your videos here
const videos = [];

// Custom placeholders for specific entries
const customPlaceholders = [];

async function downloadAll() {
  for (const video of videos) {
    console.log(`Processing ${video.provider} video ${video.id}...`);
    const thumbPath = await downloadThumbnail(video.id, video.provider);
    
    if (thumbPath) {
      console.log(`Downloaded thumbnail: ${thumbPath}`);
      
      if (video.slug) {
        const mdPath = `./docs/workbook/${video.slug}.md`;
        
        if (fs.existsSync(mdPath)) {
          let content = fs.readFileSync(mdPath, 'utf8');
          
          // Check if thumbnail already exists
          if (!content.includes('thumbnail:')) {
            // Add thumbnail property after media section
            content = content.replace(
              /(media:[\s\S]*?embed: true\n)/,
              `$1thumbnail: ${thumbPath}\n`
            );
            
            fs.writeFileSync(mdPath, content, 'utf8');
            console.log(`Updated ${mdPath} with thumbnail info`);
          }
        }
      }
    }
  }
  
  // Process custom placeholders
  for (const placeholder of customPlaceholders) {
    console.log(`Creating placeholder for ${placeholder.slug}...`);
    
    // SVG already created earlier in this script
    const mdPath = `./docs/workbook/${placeholder.slug}.md`;
    
    if (fs.existsSync(mdPath)) {
      let content = fs.readFileSync(mdPath, 'utf8');
      
      // Check if thumbnail already exists
      if (!content.includes('thumbnail:')) {
        // Add thumbnail property after media section if it exists
        if (content.includes('media:')) {
          content = content.replace(
            /(media:[\s\S]*?embed: true\n)/,
            `$1thumbnail: /_media/thumbnails/${placeholder.svgFilename}\n`
          );
        } else {
          // Or add it after layout if there's no media section
          content = content.replace(
            /(layout:.*\n)/,
            `$1thumbnail: /_media/thumbnails/${placeholder.svgFilename}\n`
          );
        }
        
        fs.writeFileSync(mdPath, content, 'utf8');
        console.log(`Updated ${mdPath} with thumbnail info`);
      }
    }
  }
}

downloadAll();
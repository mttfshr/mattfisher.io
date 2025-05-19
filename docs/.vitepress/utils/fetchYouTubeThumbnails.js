// docs/.vitepress/utils/fetchYouTubeThumbnails.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { extractYouTubeId } from './mediaUtils.js';

/**
 * Fetches and saves thumbnails for YouTube videos
 * @param {string[]} urls - Array of YouTube URLs to fetch thumbnails for
 * @param {Object} options - Options for thumbnail fetching
 * @returns {Object} - Map of URLs to thumbnail paths
 */
export async function fetchYouTubeThumbnails(urls, options = {}) {
  const {
    outputDir = path.resolve(process.cwd(), 'docs/public/media/thumbnails'),
    quality = 'maxresdefault', // Options: maxresdefault, hqdefault, mqdefault, sddefault
    skipExisting = true,
  } = options;

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating thumbnails directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Processing ${urls.length} YouTube URLs for thumbnails`);
  const thumbnailMap = {};

  // Process each YouTube URL
  const promises = urls.map(async (url) => {
    try {
      // Get the YouTube ID
      const youtubeId = extractYouTubeId(url);
      if (!youtubeId) {
        console.log(`Could not extract YouTube ID from ${url}`);
        return;
      }

      const outputPath = path.join(outputDir, `youtube-${youtubeId}.jpg`);
      const relativePath = `/media/thumbnails/youtube-${youtubeId}.jpg`;

      // Skip if thumbnail already exists
      if (skipExisting && fs.existsSync(outputPath)) {
        console.log(`Thumbnail already exists for YouTube video ${youtubeId}`);
        thumbnailMap[url] = relativePath;
        return;
      }

      // YouTube provides predictable thumbnail URLs
      const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`;
      
      const response = await fetch(thumbnailUrl);
      
      // If requested quality is not available, try hqdefault
      if (!response.ok) {
        console.log(`Quality ${quality} not available for ${youtubeId}, trying hqdefault`);
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
      thumbnailMap[url] = relativePath;
    } catch (error) {
      console.error(`Error processing YouTube thumbnail for ${url}:`, error.message);
    }
  });

  await Promise.all(promises);
  console.log('YouTube thumbnails processed successfully!');
  
  return thumbnailMap;
}

/**
 * Helper function to extract YouTube ID
 * @param {string} url - YouTube URL
 * @returns {string|null} - YouTube video ID or null if not found
 */
function extractYouTubeId(url) {
  if (!url) return null;

  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);

  return match ? match[1] : null;
}

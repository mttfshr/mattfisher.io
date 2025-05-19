// updateYouTubeThumbnails.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { extractYouTubeId } from './mediaUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The directory structure is already:
// /Users/matt/Github/mattfisher.io/docs/.vitepress/utils/updateYouTubeThumbnails.js
// So to get to the root 'docs' directory, we need to go up two levels
const docsDir = path.resolve(__dirname, '../..');

/**
 * Updates thumbnails for existing YouTube links in pins
 */
async function updateYouTubeThumbnails() {
  console.log('Starting YouTube thumbnails update...');
  
  // Define thumbnail directories
  const thumbnailDirs = [
    path.join(docsDir, 'public/media/thumbnails'),
    path.join(docsDir, '.vitepress/public/media/thumbnails')
  ];
  
  // Create thumbnail directories if they don't exist
  for (const dir of thumbnailDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Ensured thumbnail directory exists: ${dir}`);
    } catch (error) {
      console.error(`Error creating thumbnail directory ${dir}:`, error.message);
    }
  }
  
  // Get YouTube URLs from pins
  const pinsDir = path.join(docsDir, 'pins');
  const youtubeUrls = await extractYouTubeUrlsFromPins(pinsDir);
  
  console.log(`Found ${youtubeUrls.length} YouTube URLs in pins`);
  
  // Process each URL to fetch its thumbnail
  for (const url of youtubeUrls) {
    try {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        console.warn(`Could not extract YouTube ID from URL: ${url}`);
        continue;
      }
      
      const thumbnailFilename = `youtube-${videoId}.jpg`;
      
      // Check if thumbnail already exists in any of the directories
      let exists = false;
      for (const dir of thumbnailDirs) {
        const thumbnailPath = path.join(dir, thumbnailFilename);
        try {
          await fs.access(thumbnailPath);
          exists = true;
          console.log(`Thumbnail already exists: ${thumbnailPath}`);
          break;
        } catch (error) {
          // File doesn't exist, continue
        }
      }
      
      // Skip if thumbnail already exists
      if (exists) continue;
      
      // Fetch the thumbnail from YouTube
      const qualityVariants = ['maxresdefault', 'hqdefault', 'mqdefault', 'sddefault'];
      
      let thumbnailBuffer = null;
      
      // Try each quality variant until one works
      for (const quality of qualityVariants) {
        try {
          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
          console.log(`Trying to fetch ${thumbnailUrl}`);
          
          const response = await fetch(thumbnailUrl);
          
          if (response.ok) {
            thumbnailBuffer = await response.buffer();
            console.log(`Fetched ${quality} thumbnail for video ${videoId}`);
            break;
          }
        } catch (error) {
          // Continue to next quality variant
        }
      }
      
      // Save the thumbnail to all directories if we got it
      if (thumbnailBuffer) {
        for (const dir of thumbnailDirs) {
          const thumbnailPath = path.join(dir, thumbnailFilename);
          await fs.writeFile(thumbnailPath, thumbnailBuffer);
          console.log(`Saved thumbnail to ${thumbnailPath}`);
        }
      } else {
        console.warn(`Could not fetch any thumbnail for video ${videoId}`);
      }
      
      // Add a small delay to be nice to YouTube servers
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching thumbnail for URL ${url}:`, error.message);
    }
  }
  
  console.log('YouTube thumbnails update completed');
}

/**
 * Extract YouTube URLs from all pins files
 * @param {string} pinsDir - Path to pins directory
 * @returns {string[]} - Array of YouTube URLs
 */
async function extractYouTubeUrlsFromPins(pinsDir) {
  const youtubeUrls = [];
  
  try {
    // Get all markdown files in the pins directory
    const files = await fs.readdir(pinsDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    for (const file of mdFiles) {
      const filePath = path.join(pinsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Extract URLs from the markdown content
      const regex = /\bhttps?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)\b/g;
      
      let match;
      while ((match = regex.exec(content)) !== null) {
        youtubeUrls.push(match[0]);
      }
    }
  } catch (error) {
    console.error('Error extracting YouTube URLs from pins:', error.message);
  }
  
  return youtubeUrls;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateYouTubeThumbnails().catch(error => {
    console.error('Error updating YouTube thumbnails:', error);
    process.exit(1);
  });
}

export default updateYouTubeThumbnails;
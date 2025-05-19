// youtube.js
import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import verifyYoutubeConfig from './verifyYoutubeConfig.js';
import { extractYouTubeId } from '../mediaUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchYouTubeLikedVideos(docsDir, options = {}) {
  try {
    console.log('Starting YouTube liked videos fetch...');
    
    // Check and verify credentials first
    const configStatus = await verifyYoutubeConfig();
    if (!configStatus.allPresent) {
      throw new Error('Missing YouTube API credentials. Please run "npm run verify-youtube" for guidance.');
    }
    
    // Default options
    const defaultOptions = {
      maxResults: 50, // YouTube API limit per page
      fetchAll: true, // Whether to fetch all pages or just the first
      pageSize: 50,   // Number of results per page (max 50 for YouTube)
      fetchThumbnails: true, // Whether to fetch thumbnails for videos
    };
    
    // Merge with provided options
    const finalOptions = { ...defaultOptions, ...options };
    
    // Initialize the OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      'http://localhost:3000/callback' // Redirect URI (not used here, but required)
    );
    
    // Set credentials using the refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    });
    
    // Initialize the YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    console.log('Fetching liked videos from YouTube API...');
    
    // List of all liked videos
    let allLikedVideos = [];
    let nextPageToken = undefined;
    let totalFetched = 0;
    
    // Fetch all pages if requested
    do {
      try {
        // Fetch liked videos
        const response = await youtube.videos.list({
          part: 'snippet,contentDetails,statistics',
          myRating: 'like',
          maxResults: finalOptions.pageSize,
          pageToken: nextPageToken
        });
        
        // Store next page token
        nextPageToken = finalOptions.fetchAll ? response.data.nextPageToken : undefined;
        
        // Add videos to the list
        if (response.data.items && response.data.items.length > 0) {
          allLikedVideos = [...allLikedVideos, ...response.data.items];
          totalFetched += response.data.items.length;
          console.log(`Fetched ${response.data.items.length} videos (total: ${totalFetched})`);
        } else {
          console.log('No videos found in this page.');
          nextPageToken = undefined; // End loop if no items
        }
      } catch (error) {
        console.error('Error fetching page:', error.message);
        // If we hit an error with the API, stop pagination
        nextPageToken = undefined;
      }
    } while (nextPageToken);
    
    console.log(`Total liked videos fetched: ${allLikedVideos.length}`);
    
    // Fetch thumbnails if enabled
    if (finalOptions.fetchThumbnails && allLikedVideos.length > 0) {
      await fetchVideoThumbnails(allLikedVideos, docsDir);
    }
    
    // Generate markdown
    let markdown = '# YouTube Liked Videos\n\n';
    
    if (allLikedVideos.length === 0) {
      markdown += '*No YouTube liked videos found. This could be due to API limitations or you have no liked videos.*\n';
    } else {
      // Sort by newest first (publish date)
      allLikedVideos.sort((a, b) => {
        const dateA = new Date(a.snippet.publishedAt);
        const dateB = new Date(b.snippet.publishedAt);
        return dateB - dateA;
      });
      
      // Process each video
      allLikedVideos.forEach(video => {
        const { title } = video.snippet;
        const videoId = video.id;
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Clean the title - remove special characters and quotes that might break markdown
        const cleanTitle = title.replace(/[[\]"]/g, '');
        
        markdown += `- [${cleanTitle}](${url}) #type:video #source:youtube #collection:youtube_liked\n`;
      });
    }
    
    // Write to file
    const outputPath = path.resolve(docsDir, 'pins/youtube.md');
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    console.log(`✅ Successfully wrote ${allLikedVideos.length} YouTube liked videos to ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error fetching YouTube liked videos:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Check for common issues
    if (error.message.includes('invalid_grant')) {
      console.error('\n⚠️ Your refresh token is invalid or expired.');
      console.error('Try running "npm run youtube-auth" to get a new token.');
    }
    
    // If the file already exists, don't overwrite it
    const outputPath = path.resolve(docsDir, 'pins/youtube.md');
    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      // Create a placeholder file
      const markdown = '# YouTube Liked Videos\n\n*Unable to fetch YouTube liked videos. Please check API credentials and try again.*\n';
      await fs.writeFile(outputPath, markdown, 'utf-8');
      console.log(`Created placeholder file at ${outputPath}`);
    }
    
    throw error;
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Get docs directory from command-line arguments or use default
  const projectRoot = path.resolve(__dirname, '../../../..');
  const docsDir = path.join(projectRoot, 'docs');
  
  fetchYouTubeLikedVideos(docsDir)
    .then(() => console.log('YouTube fetch completed successfully'))
    .catch(error => {
      console.error('YouTube fetch failed:', error);
      process.exit(1);
    });
}

/**
 * Fetches and saves thumbnails for YouTube videos
 * @param {Array} videos - Array of video objects from the API
 * @param {string} docsDir - Path to the docs directory
 */
async function fetchVideoThumbnails(videos, docsDir) {
  console.log(`Fetching thumbnails for ${videos.length} YouTube videos...`);
  
  // Define thumbnail directories - ensure both public paths exist for dev and production
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
  
  // Process each video to fetch its thumbnail
  for (const video of videos) {
    try {
      const videoId = video.id;
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
      console.error(`Error fetching thumbnail for video:`, error.message);
    }
  }
  
  console.log('YouTube thumbnails fetching completed');
}

export default fetchYouTubeLikedVideos;

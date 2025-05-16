import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

async function fetchYouTubeFavorites(docsDir) {
  try {
    // Check for environment variable
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing YouTube API key in .env file');
    }
    
    // Initialize the YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
    
    // Fetch liked videos
    // Note: This requires OAuth with a user's account
    // For simplicity, we're using a playlist ID here
    // You can replace 'LL' with a public playlist ID if needed
    const response = await youtube.playlistItems.list({
      playlistId: 'LL', // 'LL' is the playlist ID for liked videos
      part: 'snippet,contentDetails',
      maxResults: 50
    });
    
    // Generate markdown
    let markdown = '# YouTube Favorites\n\n';
    
    if (!response.data.items || response.data.items.length === 0) {
      markdown += '*No YouTube favorites found. This could be due to API limitations or no liked videos.*\n';
    } else {
      // Process each video
      response.data.items.forEach(item => {
        const { title } = item.snippet;
        const videoId = item.contentDetails.videoId;
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        markdown += `- [${title}](${url}) #video #youtube\n`;
      });
    }
    
    // Write to file
    const outputPath = path.resolve(docsDir, 'pins/youtube.md');
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    return true;
  } catch (error) {
    console.error('Error fetching YouTube favorites:', error.message);
    
    // If the file already exists, don't overwrite it
    const outputPath = path.resolve(docsDir, 'pins/youtube.md');
    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      // Create a placeholder file
      const markdown = '# YouTube Favorites\n\n*Unable to fetch YouTube favorites. Please check API credentials and try again.*\n';
      await fs.writeFile(outputPath, markdown, 'utf-8');
    }
    
    throw error;
  }
}

export default fetchYouTubeFavorites;
// docs/.vitepress/utils/connectors/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fetchSpotifyFavorites from './spotify.js';
import fetchVimeoFavorites from './vimeo.js';
import fetchYouTubeLikedVideos from './youtube.js';

// Load environment variables
dotenv.config();

// Resolve paths relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');
const docsDir = projectRoot;

/**
 * Run a specific connector
 * @param {string} connector - The connector to run ('spotify', 'vimeo', 'all')
 * @returns {Promise<boolean>} - Success status
 */
async function runConnector(connector) {
  console.log(`Running ${connector === 'all' ? 'all connectors' : connector + ' connector'}...`);
  
  try {
    // Ensure pins directory exists
    const pinsDir = path.join(docsDir, 'pins');
    try {
      await fs.access(pinsDir);
      console.log(`Pins directory exists at: ${pinsDir}`);
    } catch (error) {
      console.log(`Creating pins directory at: ${pinsDir}`);
      await fs.mkdir(pinsDir, { recursive: true });
      console.log('Pins directory created successfully');
    }
    
    let spotifySuccess = true;
    let vimeoSuccess = true;
    let youtubeSuccess = true;
    
    // Run Spotify connector if requested
    if (connector === 'all' || connector === 'spotify') {
      console.log('\n---------------------------------------');
      console.log('Starting Spotify connector...');
      console.log('---------------------------------------');
      
      try {
        await fetchSpotifyFavorites(docsDir);
        console.log('✅ Spotify favorites updated successfully!');
      } catch (error) {
        console.error('❌ Error updating Spotify favorites:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Check for common issues
        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_REFRESH_TOKEN) {
          console.error('\nMissing Spotify credentials! Please run:');
          console.error('npm run verify-spotify');
          console.error('npm run spotify-auth');
        }
        
        spotifySuccess = false;
      }
    }
    
    // Run Vimeo connector if requested
    if (connector === 'all' || connector === 'vimeo') {
      console.log('\n---------------------------------------');
      console.log('Starting Vimeo connector...');
      console.log('---------------------------------------');
      
      try {
        await fetchVimeoFavorites(docsDir, {
          limit: 0, // Fetch all likes
          pageSize: 100 // 100 items per page
        });
        console.log('✅ Vimeo favorites updated successfully!');
      } catch (error) {
        console.error('❌ Error updating Vimeo favorites:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Check for common issues
        if (!process.env.VIMEO_ACCESS_TOKEN) {
          console.error('\nMissing Vimeo access token! Please set VIMEO_ACCESS_TOKEN in your .env file.');
          console.error('See docs/.vitepress/utils/connectors/VIMEO_GUIDE.md for setup instructions.');
        }
        
        vimeoSuccess = false;
      }
    }
    
    // Run YouTube connector if requested
    if (connector === 'all' || connector === 'youtube') {
      console.log('\n---------------------------------------');
      console.log('Starting YouTube connector...');
      console.log('---------------------------------------');
      
      try {
        await fetchYouTubeLikedVideos(docsDir, {
          fetchAll: true,      // Fetch all pages of liked videos
          pageSize: 50,        // 50 items per page (YouTube maximum)
          fetchThumbnails: false // Don't download thumbnails for pins - use OpenGraph URLs
        });
        console.log('✅ YouTube liked videos updated successfully!');
      } catch (error) {
        console.error('❌ Error updating YouTube liked videos:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Check for common issues
        if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
          console.error('\nMissing YouTube credentials! Please run:');
          console.error('npm run verify-youtube');
          console.error('npm run youtube-auth');
        }
        
        youtubeSuccess = false;
      }
    }
    
    console.log('\n=======================================');
    console.log('Connector execution completed!');
    console.log('=======================================');
    
    // Return overall success status
    if (connector === 'all') {
      return spotifySuccess && vimeoSuccess && youtubeSuccess;
    } else if (connector === 'spotify') {
      return spotifySuccess;
    } else if (connector === 'vimeo') {
      return vimeoSuccess;
    } else if (connector === 'youtube') {
      return youtubeSuccess;
    }
    
    return true;
  } catch (error) {
    console.error('Error in runConnector:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Update all favorites
 * Legacy function for backward compatibility
 */
async function updateAllFavorites() {
  console.log('=======================================');
  console.log('Starting favorites update process...');
  console.log('=======================================');
  console.log(`Current directory: ${__dirname}`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Docs directory: ${docsDir}`);
  
  return runConnector('all');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Check if a specific connector was specified
  const connector = process.argv[2] || 'all';
  
  if (!['all', 'spotify', 'vimeo', 'youtube'].includes(connector)) {
    console.error(`Invalid connector: ${connector}`);
    console.error('Valid options: all, spotify, vimeo, youtube');
    process.exit(1);
  }
  
  runConnector(connector).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runConnector, updateAllFavorites };
export default updateAllFavorites;

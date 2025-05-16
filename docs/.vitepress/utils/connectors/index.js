// docs/.vitepress/utils/connectors/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fetchSpotifyFavorites from './spotify.js';

// Load environment variables
dotenv.config();

// Resolve paths relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
const docsDir = path.join(projectRoot, 'docs');

async function updateAllFavorites() {
  console.log('=======================================');
  console.log('Starting favorites update process...');
  console.log('=======================================');
  console.log(`Current directory: ${__dirname}`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Docs directory: ${docsDir}`);
  
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
    
    // Run Spotify connector
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
    }
    
    console.log('\n=======================================');
    console.log('Favorites update process completed!');
    console.log('=======================================');
  } catch (error) {
    console.error('Error in updateAllFavorites:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateAllFavorites().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default updateAllFavorites;

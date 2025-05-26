// verifyYoutubeConfig.js
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');

async function verifyYoutubeConfig() {
  console.log('🔍 Verifying YouTube API configuration...');
  
  // Check for required environment variables
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  
  // Create a status object to track what's missing
  const status = {
    clientId: Boolean(clientId),
    clientSecret: Boolean(clientSecret),
    refreshToken: Boolean(refreshToken),
    allPresent: false
  };
  
  // Update allPresent status
  status.allPresent = status.clientId && status.clientSecret && status.refreshToken;
  
  // Output status
  console.log('\n📋 YouTube API Configuration Status:');
  console.log(`Client ID: ${status.clientId ? '✅ Present' : '❌ Missing'}`);
  console.log(`Client Secret: ${status.clientSecret ? '✅ Present' : '❌ Missing'}`);
  console.log(`Refresh Token: ${status.refreshToken ? '✅ Present' : '❌ Missing'}`);
  
  if (status.allPresent) {
    console.log('\n✅ YouTube API configuration is complete!');
    console.log('You can now use: npm run update-pins:youtube');
  } else {
    console.log('\n❌ YouTube API configuration is incomplete.');
    console.log('Please follow these steps:');
    
    if (!status.clientId || !status.clientSecret) {
      console.log('\n1. Set up a project in Google Cloud Console:');
      console.log('   - Go to https://console.cloud.google.com/');
      console.log('   - Create a new project or select an existing one');
      console.log('   - Enable the YouTube Data API v3');
      console.log('   - Go to "APIs & Services" > "Credentials"');
      console.log('   - Create OAuth 2.0 Client ID (type: Web application)');
      console.log('   - Add redirect URI: http://localhost:3000/callback');
      console.log('   - Copy the Client ID and Client Secret');
      console.log('\n2. Add these values to your .env file:');
      console.log('   YOUTUBE_CLIENT_ID=your_client_id');
      console.log('   YOUTUBE_CLIENT_SECRET=your_client_secret');
    }
    
    if (!status.refreshToken && status.clientId && status.clientSecret) {
      console.log('\n3. Run the authentication script to get a refresh token:');
      console.log('   npm run youtube-auth');
    } else if (!status.refreshToken) {
      console.log('\n3. After setting up Client ID and Client Secret, run:');
      console.log('   npm run youtube-auth');
    }
    
    console.log('\nFor more detailed instructions, see:');
    console.log('docs/.vitepress/utils/connectors/YOUTUBE_GUIDE.md');
  }
  
  return status;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyYoutubeConfig();
}

export default verifyYoutubeConfig;

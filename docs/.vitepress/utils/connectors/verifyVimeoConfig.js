// docs/.vitepress/utils/connectors/verifyVimeoConfig.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../..');
const envPath = path.join(projectRoot, '.env');

// Load environment variables
dotenv.config();

async function verifyVimeoConfig() {
  console.log('Verifying Vimeo API credentials...');
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.error(`Expected at: ${envPath}`);
    console.error('Please create a .env file based on .env.example');
    return false;
  }
  
  // Check for required environment variables
  const accessToken = process.env.VIMEO_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ Missing environment variable: VIMEO_ACCESS_TOKEN');
    console.error('Please add this to your .env file.');
    console.error('See docs/.vitepress/utils/connectors/VIMEO_GUIDE.md for setup instructions.');
    return false;
  }
  
  // Test the credentials using direct API calls
  console.log('Testing Vimeo API connection...');
  
  try {
    // Fetch user profile
    console.log('Fetching user profile...');
    const userResponse = await fetch('https://api.vimeo.com/me', {
      headers: {
        'Authorization': `bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      throw new Error(`User profile API error: ${userResponse.status} ${userResponse.statusText}`);
    }
    
    const user = await userResponse.json();
    
    console.log(`✅ Successfully authenticated as: ${user.name}`);
    
    // Fetch liked videos
    console.log('Fetching liked videos...');
    const likesResponse = await fetch('https://api.vimeo.com/me/likes?per_page=1', {
      headers: {
        'Authorization': `bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!likesResponse.ok) {
      throw new Error(`Likes API error: ${likesResponse.status} ${likesResponse.statusText}`);
    }
    
    const likes = await likesResponse.json();
    
    console.log(`✅ Successfully accessed liked videos (${likes.total} total likes found)`);
    
    if (likes.total === 0) {
      console.warn('\n⚠️ Note: Your Vimeo account has no liked videos.');
      console.warn('Like some videos on Vimeo to see them in your site.');
    } else {
      console.log('\n✅ Your Vimeo integration is fully configured and ready to use!');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Vimeo API authentication failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\nYour access token appears to be invalid or expired.');
      console.error('Please generate a new token in the Vimeo Developer Dashboard:');
      console.error('https://developer.vimeo.com/apps/');
    }
    
    console.error('\nSee docs/.vitepress/utils/connectors/VIMEO_GUIDE.md for setup instructions.');
    return false;
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyVimeoConfig().then(success => {
    if (!success) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default verifyVimeoConfig;

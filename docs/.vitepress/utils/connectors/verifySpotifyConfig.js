// docs/.vitepress/utils/connectors/verifySpotifyConfig.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../../');

console.log('Spotify Configuration Verification\n');

// Check if .env file exists
const envPath = path.join(rootDir, '.env');
console.log(`.env file exists: ${fs.existsSync(envPath) ? 'Yes ✅' : 'No ❌'}`);

// Check for required environment variables
console.log('\nEnvironment Variables:');
console.log(`SPOTIFY_CLIENT_ID: ${process.env.SPOTIFY_CLIENT_ID ? 'Found ✅' : 'Missing ❌'}`);
console.log(`SPOTIFY_CLIENT_SECRET: ${process.env.SPOTIFY_CLIENT_SECRET ? 'Found ✅' : 'Missing ❌'}`);
console.log(`SPOTIFY_REFRESH_TOKEN: ${process.env.SPOTIFY_REFRESH_TOKEN ? 'Found ✅' : 'Missing ❌'}`);

// Show redirect URI
console.log('\nRedirect URI:');
console.log('http://localhost:8888/callback');
console.log('\nMake sure this EXACTLY matches the redirect URI in your Spotify Developer Dashboard');

// Instructions
console.log('\nTroubleshooting Steps:');
console.log('1. Go to https://developer.spotify.com/dashboard/');
console.log('2. Select your app');
console.log('3. Click "Edit Settings"');
console.log('4. Under "Redirect URIs", add: http://localhost:8888/callback');
console.log('5. Save your changes');
console.log('6. Copy your Client ID and Client Secret to your .env file');
console.log('7. Run "npm run spotify-auth" to get a refresh token');
console.log('8. Add the refresh token to your .env file');
console.log('9. Run "npm run update-pins" to fetch your Spotify favorites');

// If .env file exists, remind about format
if (fs.existsSync(envPath)) {
  console.log('\nYour .env file should look like this:');
  console.log('SPOTIFY_CLIENT_ID=your_client_id_from_dashboard');
  console.log('SPOTIFY_CLIENT_SECRET=your_client_secret_from_dashboard');
  console.log('SPOTIFY_REFRESH_TOKEN=your_refresh_token_after_auth');
} else {
  console.log('\nCreate a .env file in the project root with:');
  console.log('SPOTIFY_CLIENT_ID=your_client_id_from_dashboard');
  console.log('SPOTIFY_CLIENT_SECRET=your_client_secret_from_dashboard');
  console.log('SPOTIFY_REFRESH_TOKEN=your_refresh_token_after_auth');
}

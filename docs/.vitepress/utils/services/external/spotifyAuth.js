// docs/.vitepress/utils/connectors/spotifyAuth.js
import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a new instance of the Spotify Web API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://127.0.0.1:8888/callback'
});

// Create the express app
const app = express();

// Scopes needed for reading user's saved content
const scopes = [
  'user-library-read',        // Read saved albums
  'playlist-read-private',    // Read private playlists
  'playlist-read-collaborative' // Read collaborative playlists
];

console.log('Using Client ID:', process.env.SPOTIFY_CLIENT_ID);
console.log('Using Redirect URI: http://localhost:8888/callback');
console.log('Please make sure this EXACTLY matches what you registered in the Spotify Developer Dashboard');

// Create the authorization URL
const authorizeURL = spotifyApi.createAuthorizeURL(scopes);

// Start server and initiate authorization
app.listen(8888, () => {
  console.log('Spotify authorization server started on port 8888');
  console.log('Please visit the following URL to authorize this application:');
  console.log(authorizeURL);
});

// Handle the callback from Spotify
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // Exchange the code for an access token and refresh token
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    // Create a config file with the tokens
    const configPath = path.join(__dirname, 'config.js');
    const configContent = `export default {
  spotify: {
    clientId: "${process.env.SPOTIFY_CLIENT_ID}",
    clientSecret: "${process.env.SPOTIFY_CLIENT_SECRET}",
    accessToken: "${data.body.access_token}",
    refreshToken: "${data.body.refresh_token}"
  }
};`;
    
    fs.writeFileSync(configPath, configContent);
    
    console.log('Authorization successful! Tokens have been saved to config.js');
    console.log('Access Token:', data.body.access_token);
    console.log('Refresh Token:', data.body.refresh_token);
    console.log('This refresh token never expires unless you revoke access.');
    console.log('Save it in your .env file as SPOTIFY_REFRESH_TOKEN.');
    
    res.send('Authorization successful! You can close this window and check the console.');
    
    // Exit the process after a short delay
    setTimeout(() => {
      process.exit(0);
    }, 3000);
  } catch (error) {
    console.error('Error during authorization:', error);
    console.error('\nCommon issues:');
    console.error('1. Redirect URI mismatch: Make sure the URI in the Spotify Dashboard EXACTLY matches http://localhost:8888/callback');
    console.error('2. Invalid Client ID or Secret: Check your .env file has the correct values');
    console.error('3. Missing scopes: Make sure the scopes are correctly specified');
    console.error('\nFor more help, see: https://developer.spotify.com/documentation/general/guides/authorization/app-settings/');
    
    res.status(500).send('Error during authorization. Check the console.');
  }
});

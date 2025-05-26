# API Connectors Implementation Guide

This document outlines the implementation plan for adding API connectors to automatically fetch favorites from Spotify, Vimeo, and YouTube for the pins section.

## Overview

The goal is to automate the process of updating the pins section with the latest favorites from various online services. Currently, this process is manual, requiring copy-pasting from these services. The new system will:

1. Fetch data from service APIs at build time
2. Generate markdown files for each service
3. Combine these with the manually maintained pins.md
4. Process all pins together through the VitePress data pipeline

## Directory Structure

```
docs/
├── .vitepress/
│   ├── utils/
│   │   ├── getPins.js            # Existing utility 
│   │   ├── connectors/           # New subfolder for API connectors
│   │   │   ├── index.js          # Main connector script
│   │   │   ├── spotify.js        # Spotify connector
│   │   │   ├── vimeo.js          # Vimeo connector
│   │   │   └── youtube.js        # YouTube connector
│   │   └── ... (other utilities)
│   └── config.mts                # VitePress configuration
└── pins/
    ├── pins.md                   # Manual pins (remains unchanged)
    ├── spotify.md                # Auto-generated from Spotify API
    ├── vimeo.md                  # Auto-generated from Vimeo API
    └── youtube.md                # Auto-generated from YouTube API
```

## Implementation Steps

### 1. Setup Environment Variables

Create `.env` and `.env.example` files in the project root:

**.env.example:**
```
# Spotify API credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token

# Vimeo API credentials
VIMEO_CLIENT_ID=your_vimeo_client_id
VIMEO_CLIENT_SECRET=your_vimeo_client_secret
VIMEO_ACCESS_TOKEN=your_vimeo_access_token

# YouTube API credentials
YOUTUBE_API_KEY=your_youtube_api_key
```

Add `.env` to `.gitignore`.

### 2. Install Dependencies

```bash
npm install --save-dev dotenv spotify-web-api-node vimeo googleapis
```

### 3. Create Main Connector Script

**docs/.vitepress/utils/connectors/index.js:**
```javascript
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fetchSpotifyFavorites from './spotify.js';
import fetchVimeoFavorites from './vimeo.js';
import fetchYouTubeFavorites from './youtube.js';

// Load environment variables
dotenv.config();

// Resolve paths relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../../../');
const pinsDir = path.resolve(docsDir, 'pins');

async function updateAllFavorites() {
  try {
    // Ensure pins directory exists
    try {
      await fs.access(pinsDir);
    } catch (error) {
      console.log('Creating pins directory...');
      await fs.mkdir(pinsDir, { recursive: true });
    }
    
    // Run all connectors in parallel
    const results = await Promise.allSettled([
      fetchSpotifyFavorites(docsDir),
      fetchVimeoFavorites(docsDir),
      fetchYouTubeFavorites(docsDir)
    ]);
    
    // Log results
    results.forEach((result, index) => {
      const services = ['Spotify', 'Vimeo', 'YouTube'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${services[index]} favorites updated successfully!`);
      } else {
        console.error(`❌ Error updating ${services[index]} favorites:`, result.reason);
      }
    });
    
    console.log('Favorites update process completed!');
  } catch (error) {
    console.error('Error in updateAllFavorites:', error);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  updateAllFavorites();
}

export default updateAllFavorites;
```

### 4. Implement Service-Specific Connectors

#### Spotify Connector

**docs/.vitepress/utils/connectors/spotify.js:**
```javascript
import SpotifyWebApi from 'spotify-web-api-node';
import fs from 'fs/promises';
import path from 'path';

async function fetchSpotifyFavorites(docsDir) {
  try {
    // Check for environment variables
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing Spotify API credentials in .env file');
    }
    
    // Initialize the Spotify API client
    const spotify = new SpotifyWebApi({
      clientId,
      clientSecret,
    });
    
    // Set refresh token and get access token
    spotify.setRefreshToken(refreshToken);
    const data = await spotify.refreshAccessToken();
    spotify.setAccessToken(data.body.access_token);
    
    // Fetch saved tracks
    const savedTracks = await spotify.getMySavedTracks({ limit: 50 });
    
    // Generate markdown
    let markdown = '# Spotify Favorites\n\n';
    
    if (savedTracks.body.items.length === 0) {
      markdown += '*No Spotify favorites found. This could be due to API limitations or no saved tracks.*\n';
    } else {
      // Process each track
      savedTracks.body.items.forEach(item => {
        const track = item.track;
        const artists = track.artists.map(a => a.name).join(', ');
        const url = track.external_urls.spotify;
        
        markdown += `- [${track.name} - ${artists}](${url}) #music #spotify\n`;
      });
    }
    
    // Write to file
    const outputPath = path.resolve(docsDir, 'pins/spotify.md');
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    return true;
  } catch (error) {
    console.error('Error fetching Spotify favorites:', error.message);
    
    // If the file already exists, don't overwrite it
    const outputPath = path.resolve(docsDir, 'pins/spotify.md');
    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      // Create a placeholder file
      const markdown = '# Spotify Favorites\n\n*Unable to fetch Spotify favorites. Please check API credentials and try again.*\n';
      await fs.writeFile(outputPath, markdown, 'utf-8');
    }
    
    throw error;
  }
}

export default fetchSpotifyFavorites;
```

#### Vimeo Connector

**docs/.vitepress/utils/connectors/vimeo.js:**
```javascript
import Vimeo from 'vimeo';
import fs from 'fs/promises';
import path from 'path';

async function fetchVimeoFavorites(docsDir) {
  try {
    // Check for environment variables
    const clientId = process.env.VIMEO_CLIENT_ID;
    const clientSecret = process.env.VIMEO_CLIENT_SECRET;
    const accessToken = process.env.VIMEO_ACCESS_TOKEN;
    
    if (!clientId || !clientSecret || !accessToken) {
      throw new Error('Missing Vimeo API credentials in .env file');
    }
    
    // Initialize the Vimeo client
    const client = new Vimeo.Client({
      clientId,
      clientSecret,
      accessToken,
    });
    
    // Fetch likes
    const response = await new Promise((resolve, reject) => {
      client.request({
        method: 'GET',
        path: '/me/likes',
        query: {
          per_page: 50,
          fields: 'name,link,description'
        }
      }, (error, body) => {
        if (error) reject(error);
        else resolve(body);
      });
    });
    
    // Generate markdown
    let markdown = '# Vimeo Favorites\n\n';
    
    if (!response.data || response.data.length === 0) {
      markdown += '*No Vimeo favorites found. This could be due to API limitations or no liked videos.*\n';
    } else {
      // Process each video
      response.data.forEach(video => {
        markdown += `- [${video.name}](${video.link}) #video #vimeo\n`;
        if (video.description) {
          // Add first line of description as a note
          const firstLine = video.description.split('\n')[0].trim();
          if (firstLine) {
            markdown += `  ${firstLine}\n`;
          }
        }
      });
    }
    
    // Write to file
    const outputPath = path.resolve(docsDir, 'pins/vimeo.md');
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    return true;
  } catch (error) {
    console.error('Error fetching Vimeo favorites:', error.message);
    
    // If the file already exists, don't overwrite it
    const outputPath = path.resolve(docsDir, 'pins/vimeo.md');
    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      // Create a placeholder file
      const markdown = '# Vimeo Favorites\n\n*Unable to fetch Vimeo favorites. Please check API credentials and try again.*\n';
      await fs.writeFile(outputPath, markdown, 'utf-8');
    }
    
    throw error;
  }
}

export default fetchVimeoFavorites;
```

#### YouTube Connector

**docs/.vitepress/utils/connectors/youtube.js:**
```javascript
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
```

### 5. Update package.json Scripts

Add the following scripts to package.json:

```json
{
  "scripts": {
    "update-pins": "node docs/.vitepress/utils/connectors/index.js",
    "prebuild": "npm run update-pins && npm run generate-og-cache",
    "build": "vitepress build docs",
    "dev": "vitepress dev docs",
    "preview": "vitepress preview docs"
  }
}
```

### 6. Update getPins Utility

Modify the existing `getPins.js` utility to combine all pin sources:

**docs/.vitepress/utils/getPins.js:**
```javascript
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pinsDir = path.resolve(__dirname, '../../pins');

export function getPins() {
  // List of pin sources (manual and auto-generated)
  const pinFiles = [
    'pins.md',      // Manual pins
    'spotify.md',   // Auto-generated
    'vimeo.md',     // Auto-generated
    'youtube.md',   // Auto-generated
  ];
  
  // Gather pins from all files
  const allPins = [];
  
  pinFiles.forEach(file => {
    const filePath = path.join(pinsDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { content: markdown } = matter(content);
        
        // Extract pins (using your existing extraction logic)
        const pins = extractPinsFromMarkdown(markdown);
        
        // Add source information
        pins.forEach(pin => {
          pin.source = file.replace('.md', '');
        });
        
        allPins.push(...pins);
      } catch (error) {
        console.warn(`Warning: Could not process ${file}:`, error.message);
      }
    }
  });
  
  // Sort by date (newest first)
  allPins.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return allPins;
}

function extractPinsFromMarkdown(markdown) {
  // Your existing pin extraction logic
  // This will depend on your current implementation
}
```

## API Credentials Setup

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Set up a redirect URI (can be http://localhost:8888/callback)
4. Note your Client ID and Client Secret
5. Follow the OAuth 2.0 flow to get a refresh token:
   - Use the Authorization Code flow
   - Request the `user-library-read` scope
   - Exchange the code for tokens
   - Save the refresh token

### Vimeo API Setup

1. Go to [Vimeo Developer](https://developer.vimeo.com/)
2. Create a new app
3. Request the scope for viewing your liked videos
4. Generate an access token with the necessary permissions
5. Note your Client ID, Client Secret, and Access Token

### YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the YouTube Data API v3
4. Create an API key
5. Restrict the API key to YouTube Data API v3 only

## Future Enhancements

1. **Caching**: Implement a caching mechanism to avoid unnecessary API calls
2. **More Services**: Add connectors for other services (e.g., GitHub stars, Bandcamp collection)
3. **Selective Updates**: Add ability to update only specific services
4. **Rate Limiting**: Add protection against API rate limits
5. **Status Reporting**: Add detailed status reporting for the update process
6. **Thumbnail Fetching**: Pre-fetch thumbnails during the API connector process

// docs/.vitepress/utils/connectors/spotify.js
import SpotifyWebApi from 'spotify-web-api-node';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Sanitize a string for use in a hashtag
 * Replace spaces and special characters with underscores
 */
function sanitizeForTag(text) {
  if (!text) return '';
  return text
    .replace(/[\s&'",.:\-\/\(\)]+/g, '_') // Replace spaces and special chars with underscores
    .replace(/_+/g, '_')                  // Replace multiple underscores with a single one
    .replace(/^_|_$/g, '')                // Remove underscores at start/end
    .trim();
}

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
      refreshToken
    });
    
    // Set refresh token and get access token
    console.log('Refreshing access token...');
    const data = await spotify.refreshAccessToken();
    spotify.setAccessToken(data.body.access_token);
    console.log('Access token refreshed successfully!');
    
    // Create markdown content
    let markdown = '# Spotify Favorites\n\n';
    
    // Fetch all saved albums using pagination
    console.log('Fetching saved albums...');
    const allAlbums = await fetchAllItems(
      spotify, 
      spotify.getMySavedAlbums.bind(spotify), 
      50,
      'albums'
    );
    
    if (allAlbums.length > 0) {
      // No count in the header - just the title
      markdown += `## Saved Albums\n\n`;
      
      for (const item of allAlbums) {
        const album = item.album;
        const artists = album.artists.map(a => a.name).join(', ');
        const url = album.external_urls.spotify;
        const releaseDate = album.release_date;
        const releaseYear = releaseDate ? releaseDate.substring(0, 4) : '';
        
        // Build key:value tags
        let tags = `#type:album #source:spotify #collection:music_library #saved`;
        
        // Add artist tags
        album.artists.forEach(artist => {
          if (artist.name) {
            tags += ` #artist:${sanitizeForTag(artist.name)}`;
          }
        });
        
        // Add genres if available
        if (album.genres && album.genres.length > 0) {
          album.genres.forEach(genre => {
            tags += ` #genre:${sanitizeForTag(genre)}`;
          });
        }
        
        // Add year tag if available
        if (releaseYear) {
          tags += ` #year:${releaseYear}`;
        }
        
        // Add popularity tag if available (categorized)
        if (album.popularity !== undefined) {
          if (album.popularity >= 75) {
            tags += ` #popularity:high`;
          } else if (album.popularity >= 50) {
            tags += ` #popularity:medium`;
          } else {
            tags += ` #popularity:low`;
          }
        }
        
        markdown += `- [${album.name} - ${artists}](${url}) ${tags}\n`;
      }
      
      markdown += '\n';
      console.log(`Found ${allAlbums.length} saved albums`);
    }
    
    // Fetch all user's playlists using pagination
    console.log('Fetching user playlists...');
    const allPlaylists = await fetchAllItems(
      spotify, 
      spotify.getUserPlaylists.bind(spotify), 
      50,
      'playlists'
    );
    
    console.log('Fetching user profile...');
    const me = await spotify.getMe();
    const myId = me.body.id;
    console.log(`User ID: ${myId}`);
    
    // Filter playlists created by the user
    const myPlaylists = allPlaylists.filter(playlist => playlist.owner.id === myId);
    
    if (myPlaylists.length > 0) {
      // No count in the header - just the title
      markdown += `## My Playlists\n\n`;
      
      for (const playlist of myPlaylists) {
        const url = playlist.external_urls.spotify;
        const trackCount = playlist.tracks.total;
        
        // Build key:value tags
        let tags = `#type:playlist #source:spotify #collection:my_playlists #creator:me`;
        
        // Add playlist details as tags
        tags += ` #tracks:${trackCount}`;
        
        // Add collaborative status if applicable
        if (playlist.collaborative) {
          tags += ` #collaborative:yes`;
        }
        
        // Add public status
        tags += ` #public:${playlist.public ? 'yes' : 'no'}`;
        
        markdown += `- [${playlist.name}](${url}) ${tags}\n`;
      }
      
      markdown += '\n';
      console.log(`Found ${myPlaylists.length} playlists created by you`);
      
      // Also include followed playlists
      const followedPlaylists = allPlaylists.filter(playlist => playlist.owner.id !== myId);
      
      if (followedPlaylists.length > 0) {
        // No count in the header - just the title
        markdown += `## Followed Playlists\n\n`;
        
        for (const playlist of followedPlaylists) {
          const url = playlist.external_urls.spotify;
          const trackCount = playlist.tracks.total;
          const owner = playlist.owner.display_name || playlist.owner.id;
          
          // Build key:value tags
          let tags = `#type:playlist #source:spotify #collection:followed_playlists`;
          
          // Add owner as tag
          tags += ` #creator:${sanitizeForTag(owner)}`;
          
          // Add track count as tag
          tags += ` #tracks:${trackCount}`;
          
          markdown += `- [${playlist.name}](${url}) ${tags}\n`;
        }
        
        markdown += '\n';
        console.log(`Found ${followedPlaylists.length} playlists you follow`);
      }
    }
    
    // Write to file
    const outputPath = path.join(docsDir, 'pins', 'spotify.md');
    
    // Log the resolved path for debugging
    console.log('Writing Spotify favorites to:', outputPath);
    
    // Ensure the directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write the file
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    console.log('Spotify favorites saved successfully to:', outputPath);
    return true;
  } catch (error) {
    console.error('Error fetching Spotify favorites:', error);
    console.error('Error message:', error.message);
    
    // If there's a status code in the error, log it
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
    
    // If the file already exists, don't overwrite it
    const outputPath = path.join(docsDir, 'pins', 'spotify.md');
    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      // Ensure the directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Create a placeholder file
      const markdown = '# Spotify Favorites\n\n*Unable to fetch Spotify favorites. Please check API credentials and try again.*\n';
      await fs.writeFile(outputPath, markdown, 'utf-8');
      console.log('Created placeholder file at:', outputPath);
    }
    
    throw error;
  }
}

/**
 * Helper function to fetch all items using pagination
 * @param {Object} spotify - The Spotify API client
 * @param {Function} method - The Spotify API method to call (e.g., spotify.getMySavedAlbums)
 * @param {number} limit - Number of items per page
 * @param {string} itemType - Type of items being fetched (for logging)
 * @returns {Array} All items from all pages
 */
async function fetchAllItems(spotify, method, limit = 50, itemType = 'items') {
  let offset = 0;
  let hasMore = true;
  const allItems = [];
  let pageCount = 0;
  
  while (hasMore) {
    try {
      pageCount++;
      console.log(`Fetching ${itemType} page ${pageCount} (offset: ${offset}, limit: ${limit})...`);
      
      const response = await method({ limit, offset });
      
      // Log response structure for debugging (first page only)
      if (pageCount === 1) {
        console.log(`Response structure for ${itemType}:`, 
          Object.keys(response.body).join(', '));
        console.log(`Total ${itemType} reported by API:`, response.body.total || 'unknown');
      }
      
      const items = response.body.items;
      
      // Check if we've reached the end
      if (!items || items.length === 0) {
        console.log(`No more ${itemType} to fetch. Pagination complete.`);
        hasMore = false;
      } else {
        allItems.push(...items);
        offset += items.length; // Use actual length instead of limit
        console.log(`Fetched ${items.length} ${itemType}, total so far: ${allItems.length}`);
        
        // Check if we've fetched all available items
        if (response.body.total && allItems.length >= response.body.total) {
          console.log(`Reached total of ${response.body.total} ${itemType}. Pagination complete.`);
          hasMore = false;
        }
        
        // Add a small delay to avoid rate limiting
        if (hasMore) {
          console.log(`Waiting before fetching next page of ${itemType}...`);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${pageCount} of ${itemType}:`, error.message);
      
      // If it's a rate limiting error, wait longer and retry
      if (error.statusCode === 429) {
        const retryAfter = error.headers['retry-after'] || 3;
        console.log(`Rate limited. Waiting ${retryAfter} seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        // For other errors, stop pagination
        console.error(`Stopping pagination for ${itemType} due to error`);
        hasMore = false;
      }
    }
  }
  
  console.log(`Completed fetching all ${itemType}. Total fetched: ${allItems.length}`);
  return allItems;
}

export default fetchSpotifyFavorites;
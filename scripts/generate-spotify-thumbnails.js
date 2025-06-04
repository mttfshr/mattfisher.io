#!/usr/bin/env node

/**
 * Spotify Thumbnail Generator Script
 */

import SpotifyWebApi from 'spotify-web-api-node';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function extractSpotifyAlbumId(url) {
  const albumMatch = url.match(/\/album\/([a-zA-Z0-9]+)/);
  return albumMatch ? albumMatch[1] : null;
}

function extractSpotifyPlaylistId(url) {
  const playlistMatch = url.match(/\/playlist\/([a-zA-Z0-9]+)/);
  return playlistMatch ? playlistMatch[1] : null;
}

function getBestAlbumArtwork(images) {
  if (!images || images.length === 0) return null;
  const preferredSize = images.find(img => img.width >= 300 && img.width <= 640);
  return preferredSize ? preferredSize.url : images[0].url;
}

async function readSpotifyUrlsFromPins() {
  try {
    const spotifyPinsPath = path.resolve(process.cwd(), 'docs/pins/spotify.md');
    const content = await fs.readFile(spotifyPinsPath, 'utf8');
    
    const urls = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim().startsWith('- ')) {
        const urlMatch = line.match(/https:\/\/open\.spotify\.com\/[^\s)]+/);
        if (urlMatch) {
          const linkMatch = line.match(/\[([^\]]+)\]/);
          const title = linkMatch ? linkMatch[1] : 'Unknown';
          urls.push({ url: urlMatch[0], title, line: line.trim() });
        }
      }
    }
    
    console.log(`📌 Found ${urls.length} Spotify URLs in pins/spotify.md`);
    return urls;
  } catch (error) {
    console.error('Error reading Spotify pins:', error);
    return [];
  }
}

async function generateSpotifyThumbnails() {
  console.log('🎨 Spotify Thumbnail Generator Starting...\n');
  
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing Spotify API credentials in .env file');
    }
    
    const spotify = new SpotifyWebApi({ clientId, clientSecret, refreshToken });
    
    console.log('🔑 Refreshing Spotify access token...');
    const tokenData = await spotify.refreshAccessToken();
    spotify.setAccessToken(tokenData.body.access_token);
    console.log('✅ Access token refreshed\n');
    
    const spotifyUrls = await readSpotifyUrlsFromPins();
    if (spotifyUrls.length === 0) {
      console.log('❌ No Spotify URLs found in pins/spotify.md');
      return;
    }
    
    const albumIds = [];
    const playlistIds = [];
    
    for (const item of spotifyUrls) {
      const albumId = extractSpotifyAlbumId(item.url);
      const playlistId = extractSpotifyPlaylistId(item.url);
      
      if (albumId) albumIds.push(albumId);
      else if (playlistId) playlistIds.push(playlistId);
    }
    
    console.log(`📊 Processing ${albumIds.length} albums and ${playlistIds.length} playlists\n`);
    
    const spotifyThumbnails = {};
    
    // Process albums in batches
    const batchSize = 20;
    for (let i = 0; i < albumIds.length; i += batchSize) {
      const batch = albumIds.slice(i, i + batchSize);
      console.log(`🎵 Fetching albums ${i + 1}-${Math.min(i + batchSize, albumIds.length)}...`);
      
      try {
        const response = await spotify.getAlbums(batch);
        for (const album of response.body.albums) {
          if (album) {
            const artworkUrl = getBestAlbumArtwork(album.images);
            if (artworkUrl) {
              spotifyThumbnails[`spotify-album-${album.id}`] = {
                albumId: album.id,
                albumUrl: `https://open.spotify.com/album/${album.id}`,
                albumName: album.name,
                artists: album.artists.map(a => a.name),
                artworkUrl,
                cacheDate: new Date().toISOString()
              };
              console.log(`  ✅ ${album.name}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching batch: ${error.message}`);
      }
      
      if (i + batchSize < albumIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Process playlists individually (Spotify API doesn't support batch playlist fetching)
    for (let i = 0; i < playlistIds.length; i++) {
      const playlistId = playlistIds[i];
      console.log(`🎧 Fetching playlist ${i + 1}/${playlistIds.length}: ${playlistId}...`);
      
      try {
        const response = await spotify.getPlaylist(playlistId);
        const playlist = response.body;
        
        if (playlist) {
          const artworkUrl = getBestAlbumArtwork(playlist.images);
          if (artworkUrl) {
            spotifyThumbnails[`spotify-playlist-${playlist.id}`] = {
              playlistId: playlist.id,
              playlistUrl: `https://open.spotify.com/playlist/${playlist.id}`,
              playlistName: playlist.name,
              description: playlist.description || '',
              owner: playlist.owner ? playlist.owner.display_name : '',
              trackCount: playlist.tracks ? playlist.tracks.total : 0,
              artworkUrl,
              cacheDate: new Date().toISOString()
            };
            console.log(`  ✅ ${playlist.name} (${playlist.tracks?.total || 0} tracks)`);
          } else {
            console.log(`  ⚠️ No artwork found for playlist: ${playlist.name}`);
          }
        }
      } catch (error) {
        console.error(`Error fetching playlist ${playlistId}: ${error.message}`);
      }
      
      // Rate limiting for individual playlist requests
      if (i < playlistIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`\n🎨 Generated ${Object.keys(spotifyThumbnails).length} Spotify thumbnails`);
    
    const catalogPath = path.resolve(process.cwd(), 'catalog.json');
    let catalog = {};
    
    try {
      const catalogContent = await fs.readFile(catalogPath, 'utf8');
      catalog = JSON.parse(catalogContent);
    } catch (error) {
      console.log('📁 Creating new catalog.json...');
      catalog = { images: {}, videoThumbnails: {} };
    }
    
    catalog.spotifyThumbnails = spotifyThumbnails;
    catalog.lastSpotifyUpdate = new Date().toISOString();
    
    await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2));
    
    console.log(`✅ Updated catalog.json with ${Object.keys(spotifyThumbnails).length} Spotify thumbnails`);
    
    const albumCount = Object.keys(spotifyThumbnails).filter(key => key.startsWith('spotify-album-')).length;
    const playlistCount = Object.keys(spotifyThumbnails).filter(key => key.startsWith('spotify-playlist-')).length;
    const totalProcessed = albumIds.length + playlistIds.length;
    const successRate = totalProcessed > 0 ? ((Object.keys(spotifyThumbnails).length / totalProcessed) * 100).toFixed(1) : '0.0';
    
    console.log(`\n📊 Results Summary:`);
    console.log(`   Albums processed: ${albumCount}/${albumIds.length}`);
    console.log(`   Playlists processed: ${playlistCount}/${playlistIds.length}`);
    console.log(`   Overall success rate: ${successRate}%`);
    
  } catch (error) {
    console.error('❌ Error generating Spotify thumbnails:', error);
    throw error;
  }
}

generateSpotifyThumbnails().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});

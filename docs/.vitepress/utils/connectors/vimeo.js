// docs/.vitepress/utils/connectors/vimeo.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { decodeHtmlEntitiesNode } from '../htmlEntities.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Fetch a user's Vimeo likes and save them as a markdown file
 * @param {string} docsDir - Path to the docs directory
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} - True if successful
 */
async function fetchVimeoFavorites(docsDir, options = {}) {
  const {
    limit = 0, // 0 means fetch all
    pageSize = 100, // Number of items per page
    includeDescription = false, // Changed default to false
    includeHashtags = false, // Changed default to false
    fallbackMessage = '*Unable to fetch Vimeo favorites. Please check API credentials and try again.*'
  } = options;
  
  console.log(`Fetching up to ${limit} Vimeo favorites...`);
  
  try {
    // Check for environment variables
    const accessToken = process.env.VIMEO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Missing Vimeo access token in .env file. Please set VIMEO_ACCESS_TOKEN.');
    }
    
    // Fetch likes from the Vimeo API with pagination
    console.log(`Fetching Vimeo likes${limit > 0 ? ` (limited to ${limit})` : ' (all)'}...`);
    
    // Prepare to collect all likes
    let allLikes = [];
    let page = 1;
    let hasMore = true;
    let totalLikes = 0;
    
    // Fetch pages until we have all likes or reach the limit
    while (hasMore) {
      console.log(`Fetching page ${page}...`);
      
      const response = await fetch(
        `https://api.vimeo.com/me/likes?page=${page}&per_page=${pageSize}&fields=name,link,duration`, 
        {
          headers: {
            'Authorization': `bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.vimeo.*+json;version=3.4'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add this page's results to our collection
      if (data.data && data.data.length > 0) {
        allLikes = allLikes.concat(data.data);
        console.log(`Received ${data.data.length} likes (total so far: ${allLikes.length})`);
        
        // Set total if we haven't already
        if (totalLikes === 0) {
          totalLikes = data.total || 0;
          console.log(`Total likes available: ${totalLikes}`);
        }
      } else {
        console.log('Received 0 likes on this page.');
      }
      
      // Determine if we should fetch more pages
      if (limit > 0 && allLikes.length >= limit) {
        // We've reached the requested limit
        allLikes = allLikes.slice(0, limit); // Ensure we don't exceed the limit
        hasMore = false;
        console.log(`Reached requested limit of ${limit} likes.`);
      } else if (!data.paging || !data.paging.next) {
        // No more pages available
        hasMore = false;
        console.log('No more pages available.');
      } else {
        // Move to the next page
        page++;
      }
    }
    
    console.log(`Fetched a total of ${allLikes.length} likes out of ${totalLikes} available.`);
    
    // Generate markdown
    let markdown = '# Vimeo Favorites\n\n';
    
    if (!allLikes || allLikes.length === 0) {
      console.warn('No Vimeo favorites found in the response.');
      markdown += '*No Vimeo favorites found. This could be due to API limitations or no liked videos.*\n';
    } else {
      console.log(`Found ${allLikes.length} Vimeo favorites.`);
      
      // Process each video, only requesting minimal data
      allLikes.forEach(video => {
        // Decode HTML entities in the video title
        const decodedTitle = decodeHtmlEntitiesNode(video.name);
        
        // Format duration if available
        let durationNote = '';
        if (video.duration) {
          const minutes = Math.floor(video.duration / 60);
          const seconds = video.duration % 60;
          durationNote = ` (${minutes}:${seconds.toString().padStart(2, '0')})`;
        }
        
        // Create the markdown entry - clean and simple format
        markdown += `- [${decodedTitle}${durationNote}](${video.link}) #collection:vimeo\n\n`;
      });
    }
    
    // Write to file
    const outputPath = path.resolve(docsDir, 'pins/vimeo.md');
    console.log(`Writing ${allLikes ? allLikes.length : 0} Vimeo favorites to ${outputPath}`);
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    console.log('Vimeo favorites successfully fetched and saved!');
    return true;
  } catch (error) {
    console.error('Error fetching Vimeo favorites:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\nYour Vimeo access token appears to be invalid or expired.');
      console.error('Please generate a new access token in the Vimeo Developer Dashboard:');
      console.error('https://developer.vimeo.com/apps/');
    }
    
    // If the file already exists, don't overwrite it
    const outputPath = path.resolve(docsDir, 'pins/vimeo.md');
    let fileExists = false;
    
    try {
      await fs.access(outputPath);
      fileExists = true;
    } catch (e) {
      fileExists = false;
    }
    
    if (!fileExists) {
      // Create a placeholder file
      const markdown = `# Vimeo Favorites\n\n${fallbackMessage}\n`;
      await fs.writeFile(outputPath, markdown, 'utf-8');
      console.log(`Created placeholder file at ${outputPath}`);
    }
    
    throw error;
  }
}

export default fetchVimeoFavorites;

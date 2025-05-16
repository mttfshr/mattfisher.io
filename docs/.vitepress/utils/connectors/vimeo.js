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
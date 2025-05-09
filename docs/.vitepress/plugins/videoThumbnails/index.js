// videoThumbnails/index.js
import { fetchVideoThumbnails } from './fetchThumbnails.js';
import fs from 'fs';
import path from 'path';

/**
 * VitePress plugin to generate thumbnails for video embeds
 */
export function videoThumbnailsPlugin() {
  return {
    name: 'vitepress-video-thumbnails-plugin',
    
    // Hook into the build process at the end
    async buildEnd() {
      try {
        console.log('Generating video thumbnails...');
        
        // Path to the workbook items data file
        const dataPath = path.resolve(process.cwd(), 'docs/.vitepress/data/workbookItems.js');
        
        // Check if the file exists
        if (!fs.existsSync(dataPath)) {
          console.warn('workbookItems.js file not found, skipping thumbnail generation');
          return;
        }
        
        // Read the workbook items data
        const content = fs.readFileSync(dataPath, 'utf8');
        
        // Extract the array using regex
        const match = content.match(/export const workbookItems = (\[[\s\S]*?\]);/);
        if (!match) {
          console.warn('Could not extract workbookItems array from file');
          return;
        }
        
        // Parse the array
        const workbookItemsString = match[1];
        let workbookItems;
        
        try {
          // Use eval safely since we're just parsing our own data structure
          workbookItems = eval(workbookItemsString);
        } catch (error) {
          console.error('Error parsing workbookItems:', error.message);
          
          // Try a simpler approach with JSON.parse
          try {
            workbookItems = JSON.parse(workbookItemsString);
          } catch (jsonError) {
            console.error('Error parsing workbookItems as JSON:', jsonError.message);
            return;
          }
        }
        
        if (!workbookItems || !Array.isArray(workbookItems)) {
          console.warn('workbookItems is not an array or is empty');
          return;
        }
        
        // Process thumbnails
        await fetchVideoThumbnails(workbookItems);
        
        // Update the workbookItems file with the new thumbnail paths
        const updatedContent = content.replace(
          /export const workbookItems = (\[[\s\S]*?\]);/,
          `export const workbookItems = ${JSON.stringify(workbookItems, null, 2)};`
        );
        
        fs.writeFileSync(dataPath, updatedContent, 'utf8');
        
        console.log('Video thumbnails updated in workbookItems.js');
      } catch (error) {
        console.error('Error generating video thumbnails:', error.message);
      }
    }
  };
}
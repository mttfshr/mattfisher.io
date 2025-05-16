// docs/.vitepress/plugins/videoThumbnails/index.js
import { fetchVideoThumbnails } from './fetchThumbnails.js';
import fs from 'fs';
import path from 'path';

/**
 * VitePress plugin to generate thumbnails for video embeds
 * This uses the standard VitePress public directory for assets
 */
export function videoThumbnailsPlugin() {
  return {
    name: 'vitepress-video-thumbnails-plugin',
    
    buildStart() {
      console.log('Video Thumbnails Plugin: Processing thumbnails');
      
      try {
        // Import the workbookItems directly from the config
        import('../../config.mts').then(({ default: config }) => {
          const workbookItems = config?.themeConfig?.workbookItems || [];
          
          if (workbookItems.length === 0) {
            console.log('No workbook items found in themeConfig');
            return;
          }
          
          console.log(`Found ${workbookItems.length} workbook items to process`);
          
          // Make sure thumbnail directory exists in the public folder
          // Using the standard VitePress public directory structure
          const outputDir = path.resolve(process.cwd(), 'docs/public/media/thumbnails');
          if (!fs.existsSync(outputDir)) {
            console.log(`Creating thumbnails directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Process thumbnails
          fetchVideoThumbnails(workbookItems, {
            outputDir,
            width: 640,
            height: 360,
            quality: 80,
            skipExisting: true
          });
          
          console.log('Video Thumbnails Plugin: Successfully processed workbook items');
        }).catch(configError => {
          console.error('Error loading config:', configError);
        });
      } catch (error) {
        console.error('Video Thumbnails Plugin: Error in buildStart hook:', error);
      }
    }
  };
}
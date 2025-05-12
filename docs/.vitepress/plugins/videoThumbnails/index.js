// docs/.vitepress/plugins/videoThumbnails/index.js
import { fetchVideoThumbnails } from './fetchThumbnails.js';
import fs from 'fs';
import path from 'path';

/**
 * VitePress plugin to generate thumbnails for video embeds
 * This updated version works with the VitePress-native data handling approach
 */
export function videoThumbnailsPlugin() {
  // Process thumbnails immediately on plugin instantiation
  (async () => {
    try {
      // Run for both development and production
      console.log('Video Thumbnails Plugin: Processing thumbnails on plugin initialization');
      
      // Get the base path
      const basePath = process.cwd();
      
      try {
        // Dynamically import the config
        const { default: config } = await import(`${basePath}/docs/.vitepress/config.mts`);
        const workbookItems = config?.themeConfig?.workbookItems || [];
        
        if (workbookItems.length === 0) {
          console.log('No workbook items found in themeConfig');
          return;
        }
        
        console.log(`Found ${workbookItems.length} workbook items to process`);
        
        // Make sure thumbnail directory exists in the media directory
        const outputDir = path.resolve(basePath, 'docs/media/thumbnails');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Also ensure the public directory and its media subdirectory exist
        const publicDir = path.resolve(basePath, 'docs/public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Create a public/media directory and public/media/thumbnails directory
        const publicMediaDir = path.resolve(publicDir, 'media');
        if (!fs.existsSync(publicMediaDir)) {
          fs.mkdirSync(publicMediaDir, { recursive: true });
        }
        
        const publicThumbnailsDir = path.resolve(publicMediaDir, 'thumbnails');
        if (!fs.existsSync(publicThumbnailsDir)) {
          fs.mkdirSync(publicThumbnailsDir, { recursive: true });
        }
        
        // Copy any SVG placeholders from media directory to public if they don't exist yet
        const placeholderSvg = path.resolve(basePath, 'docs/media/video-placeholder.svg');
        if (fs.existsSync(placeholderSvg)) {
          const publicPlaceholderSvg = path.resolve(publicMediaDir, 'video-placeholder.svg');
          if (!fs.existsSync(publicPlaceholderSvg)) {
            const svgContent = fs.readFileSync(placeholderSvg, 'utf8');
            fs.writeFileSync(publicPlaceholderSvg, svgContent);
            console.log('Copied video-placeholder.svg to public directory');
          }
        }
        
        // Process video thumbnails
        fetchVideoThumbnails(workbookItems, {
          outputDir,
          width: 640,
          height: 360,
          quality: 80,
          skipExisting: true
        });
      } catch (error) {
        console.error('Error loading config:', error);
      }
    } catch (error) {
      console.error('Error pre-processing thumbnails:', error);
    }
  })();
  
  return {
    name: 'vitepress-video-thumbnails-plugin',
    
    // We need to use a different hook - configResolved doesn't give us access to themeConfig yet
    // Let's use the buildStart hook after the Vite config is resolved
    async buildStart() {
      // Process in both dev and build mode to ensure thumbnails are available
      // if (process.env.NODE_ENV !== 'production') return;
      
      console.log('Video Thumbnails Plugin: Processing thumbnails');
      
      try {
        // Import the workbookItems directly from the config to get access to the data
        const { default: config } = await import('../../config.mts');
        const workbookItems = config?.themeConfig?.workbookItems || [];
        
        if (workbookItems.length === 0) {
          console.log('No workbook items found in themeConfig');
          return;
        }
        
        console.log(`Found ${workbookItems.length} workbook items to process`);
        
        // Make sure thumbnail directory exists
        const outputDir = path.resolve(process.cwd(), 'docs/media/thumbnails');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Also ensure the public directory and its media subdirectory exist
        const publicDir = path.resolve(process.cwd(), 'docs/public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Create a public/media directory and public/media/thumbnails directory
        const publicMediaDir = path.resolve(publicDir, 'media');
        if (!fs.existsSync(publicMediaDir)) {
          fs.mkdirSync(publicMediaDir, { recursive: true });
        }
        
        const publicThumbnailsDir = path.resolve(publicMediaDir, 'thumbnails');
        if (!fs.existsSync(publicThumbnailsDir)) {
          fs.mkdirSync(publicThumbnailsDir, { recursive: true });
        }
        
        // Process video thumbnails
        await fetchVideoThumbnails(workbookItems, {
          outputDir,
          width: 640,
          height: 360,
          quality: 80,
          skipExisting: true
        });
        
        console.log('Video Thumbnails Plugin: Successfully generated thumbnails');
      } catch (error) {
        console.error('Video Thumbnails Plugin: Error generating thumbnails:', error);
      }
    }
  };
}
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
      
      // Import the config directly
      const fs = await import('fs');
      const path = await import('path');
      
      // Get the base path
      const basePath = process.cwd();
      const configPath = path.resolve(basePath, 'docs/.vitepress/config.mts');
      
      // Check if the config exists
      if (!fs.existsSync(configPath)) {
        console.error('Config file not found:', configPath);
        return;
      }
      
      // Dynamically import the config
      const { default: config } = await import(configPath);
      const workbookItems = config?.themeConfig?.workbookItems || [];
      
      if (workbookItems.length === 0) {
        console.log('No workbook items found in themeConfig');
        return;
      }
      
      console.log(`Found ${workbookItems.length} workbook items to process`);
      
      // Make sure thumbnail directory exists
      const outputDir = path.resolve(basePath, 'docs/media/thumbnails');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Also ensure the public directory exists
      const publicDir = path.resolve(basePath, 'docs/public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Create a symlink from public to media if it doesn't exist
      const publicMediaDir = path.resolve(publicDir, 'media');
      if (!fs.existsSync(publicMediaDir)) {
        const targetDir = path.resolve(basePath, 'docs/media');
        if (fs.existsSync(targetDir)) {
          fs.symlinkSync(targetDir, publicMediaDir, 'dir');
          console.log('Created symlink from public/media to media');
        } else {
          console.error('Target directory does not exist:', targetDir);
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
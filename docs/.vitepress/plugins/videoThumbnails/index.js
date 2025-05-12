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
          console.log(`Creating media/thumbnails directory: ${outputDir}`);
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Ensure the media directory is properly set up for VitePress
        // We'll create a special .vitepress/public/media symlink to ensure media files are included in the build
        const publicDir = path.resolve(basePath, 'docs/.vitepress/public');
        if (!fs.existsSync(publicDir)) {
          console.log(`Creating .vitepress/public directory: ${publicDir}`);
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // This is the proper VitePress public directory approach
        // VitePress copies everything from .vitepress/public to the root of the built site
        // Create a symbolic link or copy directory based on environment
        const mediaDir = path.resolve(basePath, 'docs/media');
        const publicMediaDir = path.resolve(publicDir, 'media');
        
        // If running in a CI environment, we'll copy the media directory instead of symlinking
        const isCI = process.env.CI || process.env.NETLIFY || process.env.CLOUDFLARE;
        
        if (isCI) {
          // In CI environments, copy the media directory
          console.log('Running in CI environment, copying media directory instead of symlinking');
          
          // If the public/media directory exists as a symlink, remove it first
          if (fs.existsSync(publicMediaDir)) {
            try {
              const stats = fs.lstatSync(publicMediaDir);
              if (stats.isSymbolicLink()) {
                fs.unlinkSync(publicMediaDir);
                console.log(`Removed existing symlink: ${publicMediaDir}`);
              }
            } catch (error) {
              console.error('Error checking symlink:', error);
            }
          }
          
          // Create the directory if it doesn't exist
          if (!fs.existsSync(publicMediaDir)) {
            console.log(`Creating .vitepress/public/media directory: ${publicMediaDir}`);
            fs.mkdirSync(publicMediaDir, { recursive: true });
          }
          
          // We'll use a simple existence check here since full copying would be handled separately
          if (!fs.existsSync(path.resolve(publicMediaDir, 'thumbnails'))) {
            fs.mkdirSync(path.resolve(publicMediaDir, 'thumbnails'), { recursive: true });
            console.log('Created thumbnails directory in .vitepress/public/media');
          }
          
          // Copy essential files for thumbnails
          if (fs.existsSync(path.resolve(mediaDir, 'video-placeholder.svg'))) {
            const source = path.resolve(mediaDir, 'video-placeholder.svg');
            const dest = path.resolve(publicMediaDir, 'video-placeholder.svg');
            fs.copyFileSync(source, dest);
            console.log('Copied video-placeholder.svg to .vitepress/public/media');
          }
        } else {
          // In development, use a symbolic link for better performance
          if (fs.existsSync(publicMediaDir)) {
            try {
              const stats = fs.lstatSync(publicMediaDir);
              // Only remove if it's not already a symbolic link to our media directory
              if (!stats.isSymbolicLink()) {
                fs.rmSync(publicMediaDir, { recursive: true, force: true });
                console.log(`Removed existing directory: ${publicMediaDir}`);
              }
            } catch (error) {
              console.error('Error checking directory:', error);
            }
          }
          
          // Create the symbolic link if it doesn't exist
          if (!fs.existsSync(publicMediaDir)) {
            try {
              // Create an absolute symlink for better reliability
              // In VitePress, we need to make sure the path is correctly resolved
              const targetPath = path.resolve(mediaDir);
              fs.symlinkSync(targetPath, publicMediaDir, 'dir');
              console.log(`Created symlink: ${publicMediaDir} -> ${targetPath}`);
            } catch (error) {
              console.error('Error creating symlink:', error);
              // If symlink fails (e.g., on Windows without admin), fall back to copying
              if (!fs.existsSync(publicMediaDir)) {
                fs.mkdirSync(publicMediaDir, { recursive: true });
                console.log(`Created directory instead of symlink: ${publicMediaDir}`);
              }
            }
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
          console.log(`Creating media/thumbnails directory: ${outputDir}`);
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Set up .vitepress/public/media for the build
        const publicDir = path.resolve(process.cwd(), 'docs/.vitepress/public');
        if (!fs.existsSync(publicDir)) {
          console.log(`Creating .vitepress/public directory: ${publicDir}`);
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        const mediaDir = path.resolve(process.cwd(), 'docs/media');
        const publicMediaDir = path.resolve(publicDir, 'media');
        
        // Detect if we're in a CI environment
        const isCI = process.env.CI || process.env.NETLIFY || process.env.CLOUDFLARE;
        
        if (isCI) {
          // In CI environments like Cloudflare, create a copy instead of a symlink
          console.log('Running in CI environment, copying media directory instead of symlinking');
          
          // Create the directory if it doesn't exist
          if (!fs.existsSync(publicMediaDir)) {
            console.log(`Creating .vitepress/public/media directory: ${publicMediaDir}`);
            fs.mkdirSync(publicMediaDir, { recursive: true });
          }
          
          // Create the thumbnails directory
          const publicThumbnailsDir = path.resolve(publicMediaDir, 'thumbnails');
          if (!fs.existsSync(publicThumbnailsDir)) {
            console.log(`Creating .vitepress/public/media/thumbnails directory: ${publicThumbnailsDir}`);
            fs.mkdirSync(publicThumbnailsDir, { recursive: true });
          }
          
          // Copy the placeholder SVG if it exists
          const placeholderSvg = path.resolve(mediaDir, 'video-placeholder.svg');
          if (fs.existsSync(placeholderSvg)) {
            const publicPlaceholderSvg = path.resolve(publicMediaDir, 'video-placeholder.svg');
            fs.copyFileSync(placeholderSvg, publicPlaceholderSvg);
            console.log('Copied video-placeholder.svg to public directory');
          }
          
          // In buildStart phase of the plugin, we don't need to copy all thumbnails yet
          // They will be copied as part of the fetchThumbnails function
        } else {
          // In development, use a symbolic link
          if (!fs.existsSync(publicMediaDir)) {
            try {
              // Create an absolute symlink for better reliability
              // In VitePress, we need to make sure the path is correctly resolved
              const targetPath = path.resolve(mediaDir);
              fs.symlinkSync(targetPath, publicMediaDir, 'dir');
              console.log(`Created symlink: ${publicMediaDir} -> ${targetPath}`);
            } catch (error) {
              console.error('Error creating symlink:', error);
              // If symlink fails, create the directory and will copy files as needed
              if (!fs.existsSync(publicMediaDir)) {
                fs.mkdirSync(publicMediaDir, { recursive: true });
                fs.mkdirSync(path.resolve(publicMediaDir, 'thumbnails'), { recursive: true });
                console.log(`Created directory instead of symlink: ${publicMediaDir}`);
              }
            }
          }
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
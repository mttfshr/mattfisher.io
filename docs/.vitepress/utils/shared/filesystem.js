// shared/filesystem.js
// Shared filesystem utilities

import fs from 'fs'
import path from 'path'

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path to ensure exists
 * @param {string} description - Description for logging
 */
export function ensureDirectoryExists(dirPath, description = 'directory') {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating ${description}: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create standard media directories for VitePress
 */
export function createMediaDirectories() {
  // Using standard VitePress public directory location
  const publicDir = path.resolve(process.cwd(), 'docs/public');
  const mediaDir = path.resolve(publicDir, 'media');
  const thumbnailsDir = path.resolve(mediaDir, 'thumbnails');

  // Create the media directory if it doesn't exist
  ensureDirectoryExists(mediaDir, 'standard VitePress public media directory');

  // Create the thumbnails directory if it doesn't exist
  ensureDirectoryExists(thumbnailsDir, 'thumbnails directory');

  return {
    publicDir,
    mediaDir,
    thumbnailsDir
  };
}

/**
 * Copy collection files from old location to new location if needed
 */
export function migrateCollectionFiles() {
  try {
    const oldCollectionsDir = path.resolve(process.cwd(), 'docs/collections');
    const newCollectionsDir = path.resolve(process.cwd(), 'docs/workbook/collections');
    
    // If the old directory exists and has files, copy them to the new location
    if (fs.existsSync(oldCollectionsDir)) {
      const files = fs.readdirSync(oldCollectionsDir).filter(file => 
        file.endsWith('.md') && file !== 'index.md'
      );
      
      console.log(`Found ${files.length} files in old collections directory`);
      
      // Ensure the new directory exists
      ensureDirectoryExists(newCollectionsDir, 'new collections directory');
      
      // Copy each file
      for (const file of files) {
        const srcPath = path.join(oldCollectionsDir, file);
        const destPath = path.join(newCollectionsDir, file);
        
        // Only copy if the file doesn't already exist
        if (!fs.existsSync(destPath)) {
          console.log(`Copying ${file} to new collections directory`);
          const content = fs.readFileSync(srcPath, 'utf-8');
          fs.writeFileSync(destPath, content);
        }
      }
    }
  } catch (error) {
    console.error('Error copying collection files:', error);
  }
}

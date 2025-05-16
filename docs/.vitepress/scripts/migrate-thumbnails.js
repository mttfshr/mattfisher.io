// docs/.vitepress/scripts/migrate-thumbnails.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * This script migrates thumbnails to the VitePress standard location
 */
function migrateThumbnails() {
  console.log('Starting thumbnail migration...');
  
  // Get the current directory in ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Navigate to the public directory
  const rootDir = path.resolve(__dirname, '../../public');
  const wrongPath = path.join(rootDir, 'thumbnails');
  const correctPath = path.join(rootDir, 'media/thumbnails');
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(correctPath)) {
    console.log(`Creating target directory: ${correctPath}`);
    fs.mkdirSync(correctPath, { recursive: true });
  }
  
  // Check if source directory exists
  if (!fs.existsSync(wrongPath)) {
    console.log(`Source directory doesn't exist: ${wrongPath}`);
    return;
  }
  
  try {
    // Get all files from source directory
    const files = fs.readdirSync(wrongPath);
    console.log(`Found ${files.length} files to migrate`);
    
    // Copy each file to the target directory
    files.forEach(file => {
      const sourcePath = path.join(wrongPath, file);
      const targetPath = path.join(correctPath, file);
      
      // Check if it's a directory or file
      const isDir = fs.statSync(sourcePath).isDirectory();
      
      if (isDir) {
        console.log(`Skipping directory: ${file}`);
        return;
      }
      
      // Check if file already exists in target
      if (fs.existsSync(targetPath)) {
        const sourceStats = fs.statSync(sourcePath);
        const targetStats = fs.statSync(targetPath);
        
        // If target is older, replace it
        if (targetStats.mtime < sourceStats.mtime) {
          console.log(`Replacing older file: ${file}`);
          fs.copyFileSync(sourcePath, targetPath);
        } else {
          console.log(`Skipping existing file: ${file}`);
        }
      } else {
        // Copy the file
        console.log(`Copying new file: ${file}`);
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
    
    console.log('Migration completed successfully!');
    console.log('You can now remove the /thumbnails directory if desired.');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
migrateThumbnails();

// Export for module support
export { migrateThumbnails };

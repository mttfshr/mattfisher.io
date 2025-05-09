// scripts/watchLogFiles.js
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateLogData } from './generateLogEntries.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOG_DIR = path.join(__dirname, '../docs/log');
const CONSOLIDATED_FILE = path.join(LOG_DIR, 'entries.md');

// Determine which files to watch
const pathsToWatch = fs.existsSync(CONSOLIDATED_FILE) 
  ? CONSOLIDATED_FILE 
  : path.join(LOG_DIR, '*.md');

// Initialize watcher
const watcher = chokidar.watch(pathsToWatch, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

console.log(`Watching for changes in log files...`);

// Add event listeners
watcher
  .on('add', path => {
    console.log(`File ${path} has been added`);
    regenerateLogData();
  })
  .on('change', path => {
    console.log(`File ${path} has been changed`);
    regenerateLogData();
  })
  .on('unlink', path => {
    console.log(`File ${path} has been removed`);
    regenerateLogData();
  });

// Helper function to regenerate log data
function regenerateLogData() {
  console.log('Regenerating log data...');
  generateLogData()
    .then(() => console.log('Log data regenerated successfully'))
    .catch(error => console.error('Error regenerating log data:', error));
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing file watcher...');
  watcher.close();
  process.exit(0);
});

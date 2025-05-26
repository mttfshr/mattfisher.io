#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  catalogPath: path.resolve(process.cwd(), 'catalog.json'),
  thumbnailsDir: path.resolve(process.cwd(), 'docs/public/media/thumbnails'),
  
  // Files to preserve (infrastructure assets)
  preserveFiles: [
    '.gitkeep',
    'placeholder.jpg', 
    'sample-thumbnail.jpg',
    'video-placeholder.svg',
    // Test files
    'test-custom.svg',
    'test-standard.svg', 
    'test-thumbnail.svg'
  ]
};

class ThumbnailCleanup {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.catalog = null;
    this.stats = {
      totalFiles: 0,
      migratedFiles: 0,
      preservedFiles: 0,
      removedFiles: 0,
      errors: []
    };
  }

  async init() {
    // Load catalog
    try {
      const catalogData = await fs.readFile(CONFIG.catalogPath, 'utf8');
      this.catalog = JSON.parse(catalogData);
      this.log(`📁 Loaded catalog with ${Object.keys(this.catalog.videoThumbnails).length} video thumbnails`);
    } catch (error) {
      throw new Error(`Failed to load catalog: ${error.message}`);
    }
  }

  async cleanup() {
    this.log(`🔍 Scanning thumbnails directory: ${CONFIG.thumbnailsDir}`);
    
    try {
      const files = await fs.readdir(CONFIG.thumbnailsDir);
      this.stats.totalFiles = files.length;
      
      this.log(`📄 Found ${files.length} files in thumbnails directory`);

      for (const file of files) {
        await this.processFile(file);
      }

      this.printSummary();
      
    } catch (error) {
      throw new Error(`Failed to read thumbnails directory: ${error.message}`);
    }
  }

  async processFile(filename) {
    const filePath = path.join(CONFIG.thumbnailsDir, filename);
    
    // Check if this is a preserved file
    if (this.shouldPreserveFile(filename)) {
      this.stats.preservedFiles++;
      this.log(`🛡️  Preserving infrastructure file: ${filename}`);
      return;
    }

    // Check if this is a migrated video thumbnail
    if (this.isMigratedThumbnail(filename)) {
      this.stats.migratedFiles++;
      
      if (this.dryRun) {
        this.log(`🔍 [DRY RUN] Would remove migrated thumbnail: ${filename}`);
      } else {
        try {
          await fs.unlink(filePath);
          this.stats.removedFiles++;
          this.log(`🗑️  Removed migrated thumbnail: ${filename}`);
        } catch (error) {
          this.stats.errors.push({ file: filename, error: error.message });
          this.log(`❌ Failed to remove ${filename}: ${error.message}`);
        }
      }
    } else {
      // Unknown file - preserve it to be safe
      this.stats.preservedFiles++;
      this.log(`⚠️  Preserving unknown file: ${filename}`);
    }
  }

  shouldPreserveFile(filename) {
    return CONFIG.preserveFiles.includes(filename);
  }

  isMigratedThumbnail(filename) {
    // Check if this thumbnail is in our catalog
    const match = filename.match(/^(youtube|vimeo)-([^.]+)\.(jpg|png|svg)$/);
    if (!match) {
      return false;
    }

    const [, platform, videoId] = match;
    const thumbnailKey = `${platform}-${videoId}`;
    
    // Check if it exists in catalog with Cloudflare URL
    const catalogEntry = this.catalog.videoThumbnails[thumbnailKey];
    return catalogEntry && catalogEntry.cloudflareUrl;
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🧹 CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total files processed: ${this.stats.totalFiles}`);
    console.log(`Infrastructure files preserved: ${this.stats.preservedFiles}`);
    console.log(`Migrated thumbnails found: ${this.stats.migratedFiles}`);
    
    if (this.dryRun) {
      console.log(`Files that would be removed: ${this.stats.migratedFiles}`);
      console.log('\n🔍 This was a dry run. No files were actually removed.');
    } else {
      console.log(`Files successfully removed: ${this.stats.removedFiles}`);
      
      if (this.stats.removedFiles > 0) {
        console.log(`\n✅ Cleaned up ${this.stats.removedFiles} migrated thumbnail files`);
        console.log('📦 Repository size reduced - thumbnails now served via Cloudflare CDN');
      }
    }
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.stats.errors.length}):`);
      this.stats.errors.forEach(({ file, error }) => {
        console.log(`  ${file}: ${error}`);
      });
    }

    // Show what was preserved
    if (this.stats.preservedFiles > 0) {
      console.log(`\n🛡️  Preserved ${this.stats.preservedFiles} infrastructure/unknown files`);
    }
  }

  log(message) {
    if (this.verbose || this.dryRun) {
      console.log(message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  if (args.includes('--help')) {
    console.log('Usage: node scripts/cleanup-migrated-thumbnails.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Preview what would be removed without making changes');
    console.log('  --verbose    Show detailed logging');
    console.log('  --help       Show this help message');
    console.log('');
    console.log('This script removes video thumbnails that have been successfully');
    console.log('migrated to Cloudflare Images, while preserving infrastructure assets.');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/cleanup-migrated-thumbnails.js --dry-run');
    console.log('  node scripts/cleanup-migrated-thumbnails.js --verbose');
    return;
  }

  console.log('🚀 Starting thumbnail cleanup utility...');
  if (dryRun) console.log('🔍 DRY RUN MODE - No files will be removed');
  
  try {
    const cleanup = new ThumbnailCleanup({ dryRun, verbose });
    await cleanup.init();
    await cleanup.cleanup();
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ThumbnailCleanup };

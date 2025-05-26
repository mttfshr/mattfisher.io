#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment variables
const CONFIG = {
  nasBaseUrl: process.env.NAS_BASE_URL,
  nasHostname: process.env.NAS_HOSTNAME,
  nasPort: process.env.NAS_PORT || '8080',
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  catalogPath: path.resolve(process.cwd(), 'catalog.json'),
  
  // Video URL patterns for thumbnail extraction
  vimeoUrlPattern: /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/,
  youtubeUrlPattern: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  
  // Local thumbnail directory
  thumbnailsDir: path.resolve(process.cwd(), 'docs/public/media/thumbnails')
};

// Validate configuration and build dynamic patterns
function validateConfig() {
  if (!CONFIG.nasBaseUrl && !CONFIG.nasHostname) {
    throw new Error('NAS configuration missing. Set NAS_BASE_URL or NAS_HOSTNAME in .env file.');
  }
  
  // Build base URL if not provided directly
  if (!CONFIG.nasBaseUrl && CONFIG.nasHostname) {
    CONFIG.nasBaseUrl = `http://${CONFIG.nasHostname}:${CONFIG.nasPort}`;
  }
  
  // Create dynamic URL pattern based on configuration
  const escapedBaseUrl = CONFIG.nasBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  CONFIG.nasUrlPattern = new RegExp(`${escapedBaseUrl}/([^\\s\\)]+)`, 'g');
  
  return CONFIG;
}

class MediaUploader {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.migrateLocalThumbnails = options.migrateLocalThumbnails || false;
    this.catalog = { images: {}, videoThumbnails: {} };
    this.stats = {
      filesProcessed: 0,
      imagesUploaded: 0,
      thumbnailsUploaded: 0,
      localThumbnailsMigrated: 0,
      linksReplaced: 0,
      errors: []
    };
  }

  async init() {
    // Validate and build configuration
    validateConfig();
    
    this.log(`🔧 NAS Base URL: ${CONFIG.nasBaseUrl}`);
    
    // Load existing catalog
    try {
      const catalogData = await fs.readFile(CONFIG.catalogPath, 'utf8');
      this.catalog = JSON.parse(catalogData);
      this.log(`📁 Loaded catalog with ${Object.keys(this.catalog.images).length} images and ${Object.keys(this.catalog.videoThumbnails).length} video thumbnails`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      this.log('📁 Creating new catalog');
    }

    // Validate Cloudflare configuration
    if (!this.dryRun) {
      if (!CONFIG.cloudflareAccountId || !CONFIG.cloudflareApiToken) {
        throw new Error('Cloudflare credentials not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.');
      }
    }
  }

  async processDirectory(dirPath) {
    this.log(`🔍 Scanning directory: ${dirPath}`);
    
    // Migrate local thumbnails if requested
    if (this.migrateLocalThumbnails) {
      await this.migrateLocalThumbnailsToCloudflare();
    }

    const markdownFiles = await this.findMarkdownFiles(dirPath);
    this.log(`📄 Found ${markdownFiles.length} markdown files`);

    for (const filePath of markdownFiles) {
      await this.processFile(filePath);
    }

    await this.saveCatalog();
    this.printSummary();
  }

  async migrateLocalThumbnailsToCloudflare() {
    this.log(`\n🔄 Migrating local thumbnails from ${CONFIG.thumbnailsDir}`);
    
    try {
      const thumbnailFiles = await fs.readdir(CONFIG.thumbnailsDir);
      const videoThumbnails = thumbnailFiles.filter(file => 
        (file.startsWith('youtube-') || file.startsWith('vimeo-')) && 
        (file.endsWith('.jpg') || file.endsWith('.png')) &&
        !file.includes('test') // Skip test files
      );

      this.log(`📎 Found ${videoThumbnails.length} video thumbnails to migrate`);

      for (const thumbnailFile of videoThumbnails) {
        await this.migrateLocalThumbnail(thumbnailFile);
      }
    } catch (error) {
      this.log(`❌ Error reading thumbnails directory: ${error.message}`);
    }
  }

  async migrateLocalThumbnail(thumbnailFile) {
    const filePath = path.join(CONFIG.thumbnailsDir, thumbnailFile);
    
    // Parse thumbnail filename to extract video info
    const match = thumbnailFile.match(/^(youtube|vimeo)-([^.]+)\.(jpg|png)$/);
    if (!match) {
      this.log(`⚠️  Skipping invalid thumbnail filename: ${thumbnailFile}`);
      return;
    }

    const [, platform, videoId, extension] = match;
    const thumbnailKey = `${platform}-${videoId}`;
    
    // Check if already in catalog
    if (this.catalog.videoThumbnails[thumbnailKey]) {
      this.log(`📎 Thumbnail already migrated: ${thumbnailKey}`);
      return;
    }

    this.log(`🖼️  Migrating local thumbnail: ${thumbnailKey}`);

    if (this.dryRun) {
      this.log(`🔍 [DRY RUN] Would migrate: ${thumbnailFile}`);
      this.stats.localThumbnailsMigrated++;
      return;
    }

    try {
      // Read local thumbnail file
      const thumbnailBuffer = await fs.readFile(filePath);
      
      // Upload to Cloudflare Images
      const cloudflareResult = await this.uploadToCloudflare(
        thumbnailBuffer, 
        thumbnailFile
      );
      
      // Add to catalog with appropriate metadata
      const catalogEntry = {
        [`${platform}Id`]: videoId,
        localThumbnailPath: filePath,
        cloudflareId: cloudflareResult.id,
        cloudflareUrl: cloudflareResult.url,
        uploadDate: new Date().toISOString(),
        migratedFromLocal: true
      };

      // Add platform-specific URL if we can determine it
      if (platform === 'youtube') {
        catalogEntry.youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      } else if (platform === 'vimeo') {
        catalogEntry.vimeoUrl = `https://vimeo.com/${videoId}`;
      }

      this.catalog.videoThumbnails[thumbnailKey] = catalogEntry;

      this.stats.localThumbnailsMigrated++;
      this.log(`✅ Migrated local thumbnail: ${cloudflareResult.url}`);
      
    } catch (error) {
      this.log(`❌ Failed to migrate thumbnail: ${error.message}`);
      this.stats.errors.push({ file: thumbnailFile, error: error.message });
    }
  }

  async findMarkdownFiles(dirPath) {
    const files = [];
    
    async function scan(currentPath) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dirPath);
    return files;
  }

  async processFile(filePath) {
    this.stats.filesProcessed++;
    this.log(`\n📝 Processing: ${path.relative(process.cwd(), filePath)}`);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      let updatedContent = markdownContent;
      let hasChanges = false;

      // Process NAS image URLs in markdown content
      const imageMatches = [...markdownContent.matchAll(CONFIG.nasUrlPattern)];
      
      for (const match of imageMatches) {
        const [fullUrl, relativePath] = match;
        const result = await this.processImage(fullUrl, relativePath);
        
        if (result.cloudflareUrl) {
          updatedContent = updatedContent.replace(fullUrl, result.cloudflareUrl);
          hasChanges = true;
          this.stats.linksReplaced++;
        }
      }

      // Process video thumbnails from frontmatter
      if (frontmatter.media?.url) {
        // Check for Vimeo
        const vimeoMatch = frontmatter.media.url.match(CONFIG.vimeoUrlPattern);
        if (vimeoMatch) {
          const vimeoId = vimeoMatch[1];
          const result = await this.processVideoThumbnail('vimeo', vimeoId);
          
          if (result.cloudflareUrl) {
            frontmatter.media.thumbnail = result.cloudflareUrl;
            hasChanges = true;
          }
        }

        // Check for YouTube
        const youtubeMatch = frontmatter.media.url.match(CONFIG.youtubeUrlPattern);
        if (youtubeMatch) {
          const youtubeId = youtubeMatch[1];
          const result = await this.processVideoThumbnail('youtube', youtubeId);
          
          if (result.cloudflareUrl) {
            frontmatter.media.thumbnail = result.cloudflareUrl;
            hasChanges = true;
          }
        }
      }

      // Save updated file if changes were made
      if (hasChanges && !this.dryRun) {
        const updatedMatter = matter.stringify(updatedContent, frontmatter);
        await fs.writeFile(filePath, updatedMatter);
        this.log(`💾 Updated file with Cloudflare URLs`);
      } else if (hasChanges && this.dryRun) {
        this.log(`🔍 [DRY RUN] Would update file with Cloudflare URLs`);
      }

    } catch (error) {
      this.stats.errors.push({ file: filePath, error: error.message });
      this.log(`❌ Error processing file: ${error.message}`);
    }
  }

  async processImage(nasUrl, relativePath) {
    const imageKey = this.generateImageKey(relativePath);
    
    // Check if already in catalog
    if (this.catalog.images[imageKey]) {
      this.log(`📎 Using cached image: ${relativePath}`);
      return { cloudflareUrl: this.catalog.images[imageKey].cloudflareUrl };
    }

    this.log(`🖼️  Processing image: ${relativePath}`);

    if (this.dryRun) {
      this.log(`🔍 [DRY RUN] Would upload: ${nasUrl}`);
      return { cloudflareUrl: `https://imagedelivery.net/HASH/DRY-RUN-ID/public` };
    }

    try {
      // Download image from NAS
      const imageResponse = await fetch(nasUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.buffer();
      
      // Upload to Cloudflare Images
      const cloudflareResult = await this.uploadToCloudflare(imageBuffer, path.basename(relativePath));
      
      // Add to catalog
      this.catalog.images[imageKey] = {
        localPath: relativePath,
        nasUrl: nasUrl,
        cloudflareId: cloudflareResult.id,
        cloudflareUrl: cloudflareResult.url,
        uploadDate: new Date().toISOString(),
        originalFilename: path.basename(relativePath),
        fileSize: imageBuffer.length
      };

      this.stats.imagesUploaded++;
      this.log(`✅ Uploaded image: ${cloudflareResult.url}`);
      
      return { cloudflareUrl: cloudflareResult.url };

    } catch (error) {
      this.log(`❌ Failed to upload image: ${error.message}`);
      this.stats.errors.push({ file: relativePath, error: error.message });
      return { cloudflareUrl: null };
    }
  }

  async processVideoThumbnail(platform, videoId) {
    const thumbnailKey = `${platform}-${videoId}`;
    
    // Check if already in catalog
    if (this.catalog.videoThumbnails[thumbnailKey]) {
      this.log(`📎 Using cached video thumbnail: ${videoId}`);
      return { cloudflareUrl: this.catalog.videoThumbnails[thumbnailKey].cloudflareUrl };
    }

    this.log(`🎬 Processing ${platform} thumbnail for ID: ${videoId}`);

    if (this.dryRun) {
      this.log(`🔍 [DRY RUN] Would fetch and upload thumbnail for ${platform} ${videoId}`);
      return { cloudflareUrl: `https://imagedelivery.net/HASH/DRY-RUN-THUMBNAIL-ID/public` };
    }

    try {
      let thumbnailUrl;
      let thumbnailBuffer;

      if (platform === 'vimeo') {
        // Fetch video info from Vimeo API
        const vimeoResponse = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
        if (!vimeoResponse.ok) {
          throw new Error(`Failed to fetch Vimeo info: ${vimeoResponse.statusText}`);
        }

        const vimeoData = await vimeoResponse.json();
        thumbnailUrl = vimeoData.thumbnail_url;

        if (!thumbnailUrl) {
          throw new Error('No thumbnail URL found in Vimeo response');
        }

        // Download thumbnail
        const thumbnailResponse = await fetch(thumbnailUrl);
        if (!thumbnailResponse.ok) {
          throw new Error(`Failed to fetch thumbnail: ${thumbnailResponse.statusText}`);
        }

        thumbnailBuffer = await thumbnailResponse.buffer();

      } else if (platform === 'youtube') {
        // Try to use local thumbnail first
        const localThumbnailPath = path.join(CONFIG.thumbnailsDir, `youtube-${videoId}.jpg`);
        try {
          thumbnailBuffer = await fs.readFile(localThumbnailPath);
          this.log(`📁 Using local YouTube thumbnail: ${videoId}`);
        } catch (error) {
          // Fallback to YouTube API thumbnail
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          const thumbnailResponse = await fetch(thumbnailUrl);
          if (!thumbnailResponse.ok) {
            // Try standard quality if maxres fails
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            const fallbackResponse = await fetch(thumbnailUrl);
            if (!fallbackResponse.ok) {
              throw new Error(`Failed to fetch YouTube thumbnail: ${fallbackResponse.statusText}`);
            }
            thumbnailBuffer = await fallbackResponse.buffer();
          } else {
            thumbnailBuffer = await thumbnailResponse.buffer();
          }
          this.log(`🌐 Downloaded YouTube thumbnail from API: ${videoId}`);
        }
      }
      
      // Upload to Cloudflare Images
      const cloudflareResult = await this.uploadToCloudflare(
        thumbnailBuffer, 
        `${platform}-${videoId}-thumbnail.jpg`
      );
      
      // Add to catalog
      const catalogEntry = {
        [`${platform}Id`]: videoId,
        cloudflareId: cloudflareResult.id,
        cloudflareUrl: cloudflareResult.url,
        uploadDate: new Date().toISOString()
      };

      // Add platform-specific metadata
      if (platform === 'vimeo' && thumbnailUrl) {
        catalogEntry.vimeoThumbnailUrl = thumbnailUrl;
      } else if (platform === 'youtube') {
        catalogEntry.youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }

      this.catalog.videoThumbnails[thumbnailKey] = catalogEntry;

      this.stats.thumbnailsUploaded++;
      this.log(`✅ Uploaded ${platform} thumbnail: ${cloudflareResult.url}`);
      
      return { cloudflareUrl: cloudflareResult.url };

    } catch (error) {
      this.log(`❌ Failed to upload ${platform} thumbnail: ${error.message}`);
      this.stats.errors.push({ file: `${platform}-${videoId}`, error: error.message });
      return { cloudflareUrl: null };
    }
  }

  async uploadToCloudflare(buffer, filename) {
    const formData = new FormData();
    formData.append('file', buffer, filename);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CONFIG.cloudflareAccountId}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.cloudflareApiToken}`,
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare upload failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(result.errors)}`);
    }

    return {
      id: result.result.id,
      url: result.result.variants[0] // Use the first variant URL
    };
  }

  generateImageKey(relativePath) {
    // Create a simple key from the relative path
    return relativePath.replace(/[^a-zA-Z0-9]/g, '_');
  }

  async saveCatalog() {
    if (!this.dryRun) {
      await fs.writeFile(CONFIG.catalogPath, JSON.stringify(this.catalog, null, 2));
      this.log(`💾 Saved catalog to ${CONFIG.catalogPath}`);
    } else {
      this.log(`🔍 [DRY RUN] Would save catalog to ${CONFIG.catalogPath}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 UPLOAD SUMMARY');
    console.log('='.repeat(50));
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Images uploaded: ${this.stats.imagesUploaded}`);
    console.log(`Video thumbnails uploaded: ${this.stats.thumbnailsUploaded}`);
    console.log(`Local thumbnails migrated: ${this.stats.localThumbnailsMigrated}`);
    console.log(`Links replaced: ${this.stats.linksReplaced}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(({ file, error }) => {
        console.log(`  ${file}: ${error}`);
      });
    }
    
    if (this.dryRun) {
      console.log('\n🔍 This was a dry run. No files were modified or uploaded.');
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
  
  if (args.length === 0) {
    console.log('Usage: node scripts/upload-media-enhanced.js <directory> [options]');
    console.log('Options:');
    console.log('  --dry-run              Preview what would be uploaded without making changes');
    console.log('  --verbose              Show detailed logging');
    console.log('  --migrate-thumbnails   Migrate local video thumbnails to Cloudflare');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/upload-media-enhanced.js docs/workbook');
    console.log('  node scripts/upload-media-enhanced.js docs/workbook --dry-run');
    console.log('  node scripts/upload-media-enhanced.js . --migrate-thumbnails --verbose');
    console.log('  node scripts/upload-media-enhanced.js . --migrate-thumbnails --dry-run');
    return;
  }

  const targetDir = args[0];
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  const migrateLocalThumbnails = args.includes('--migrate-thumbnails');

  try {
    await fs.access(targetDir);
  } catch (error) {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }

  console.log('🚀 Starting enhanced media upload utility...');
  console.log(`📂 Target directory: ${targetDir}`);
  if (dryRun) console.log('🔍 DRY RUN MODE - No changes will be made');
  if (migrateLocalThumbnails) console.log('🔄 THUMBNAIL MIGRATION MODE - Will process local thumbnails');
  
  try {
    const uploader = new MediaUploader({ dryRun, verbose, migrateLocalThumbnails });
    await uploader.init();
    await uploader.processDirectory(targetDir);
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MediaUploader, CONFIG };

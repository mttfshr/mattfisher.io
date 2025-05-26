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

// Configuration
const CONFIG = {
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  catalogPath: path.resolve(process.cwd(), 'catalog.json'),
  
  // Video URL patterns
  patterns: {
    vimeo: /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/,
    youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  },
  
  // Local thumbnail directory (legacy support)
  thumbnailsDir: path.resolve(process.cwd(), 'docs/public/media/thumbnails')
};

class VideoThumbnailProcessor {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.platforms = options.platforms || ['youtube', 'vimeo'];
    this.catalog = { images: {}, videoThumbnails: {} };
    this.stats = {
      processed: 0,
      uploaded: 0,
      cached: 0,
      errors: []
    };
  }

  async init() {
    // Validate Cloudflare configuration
    if (!this.dryRun) {
      if (!CONFIG.cloudflareAccountId || !CONFIG.cloudflareApiToken) {
        throw new Error('Cloudflare credentials not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.');
      }
    }

    // Load existing catalog
    try {
      const catalogData = await fs.readFile(CONFIG.catalogPath, 'utf8');
      this.catalog = JSON.parse(catalogData);
      this.log(`📁 Loaded catalog with ${Object.keys(this.catalog.videoThumbnails).length} video thumbnails`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      this.log('📁 Creating new catalog');
    }
  }

  /**
   * Process video URLs from markdown files or direct URLs
   * @param {string|string[]} input - File path, directory path, or array of URLs
   * @param {Object} options - Processing options
   */
  async processVideos(input, options = {}) {
    this.log('🎬 Starting video thumbnail processing...');

    let urls = [];

    if (Array.isArray(input)) {
      // Direct URL array
      urls = input;
    } else if (typeof input === 'string') {
      // File or directory path
      urls = await this.extractUrlsFromPath(input);
    } else {
      throw new Error('Input must be a file path, directory path, or array of URLs');
    }

    this.log(`🔍 Found ${urls.length} video URLs to process`);

    // Process each URL
    for (const urlData of urls) {
      await this.processVideoUrl(urlData);
    }

    await this.saveCatalog();
    this.printSummary();
  }

  /**
   * Extract video URLs from markdown files
   * @param {string} inputPath - File or directory path
   * @returns {Array} Array of URL objects with metadata
   */
  async extractUrlsFromPath(inputPath) {
    const urls = [];
    
    try {
      const stat = await fs.stat(inputPath);
      
      if (stat.isFile()) {
        // Single file
        const fileUrls = await this.extractUrlsFromFile(inputPath);
        urls.push(...fileUrls);
      } else if (stat.isDirectory()) {
        // Directory - scan for markdown files
        const files = await this.findMarkdownFiles(inputPath);
        for (const filePath of files) {
          const fileUrls = await this.extractUrlsFromFile(filePath);
          urls.push(...fileUrls);
        }
      }
    } catch (error) {
      throw new Error(`Failed to read input path: ${error.message}`);
    }

    return urls;
  }

  /**
   * Extract video URLs from a single markdown file
   * @param {string} filePath - Path to markdown file
   * @returns {Array} Array of URL objects
   */
  async extractUrlsFromFile(filePath) {
    const urls = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      // Extract from frontmatter
      if (frontmatter.media?.url) {
        const platform = this.detectPlatform(frontmatter.media.url);
        if (platform) {
          urls.push({
            url: frontmatter.media.url,
            platform,
            source: 'frontmatter',
            filePath,
            title: frontmatter.title || path.basename(filePath, '.md')
          });
        }
      }
      
      // Extract from markdown content
      const allPlatforms = this.platforms.join('|');
      const urlRegex = new RegExp(`https?://(?:www\\.)?(?:${allPlatforms})\\.com/[^\\s\\)]+`, 'g');
      
      let match;
      while ((match = urlRegex.exec(markdownContent)) !== null) {
        const url = match[0];
        const platform = this.detectPlatform(url);
        if (platform) {
          urls.push({
            url,
            platform,
            source: 'content',
            filePath,
            title: frontmatter.title || path.basename(filePath, '.md')
          });
        }
      }
      
    } catch (error) {
      this.log(`⚠️  Error reading file ${filePath}: ${error.message}`);
    }

    return urls;
  }

  /**
   * Find all markdown files in a directory
   * @param {string} dirPath - Directory path
   * @returns {Array} Array of file paths
   */
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

  /**
   * Detect video platform from URL
   * @param {string} url - Video URL
   * @returns {string|null} Platform name or null
   */
  detectPlatform(url) {
    for (const [platform, pattern] of Object.entries(CONFIG.patterns)) {
      if (pattern.test(url)) {
        return platform;
      }
    }
    return null;
  }

  /**
   * Extract video ID from URL
   * @param {string} url - Video URL
   * @param {string} platform - Platform name
   * @returns {string|null} Video ID or null
   */
  extractVideoId(url, platform) {
    const pattern = CONFIG.patterns[platform];
    const match = url.match(pattern);
    return match ? match[1] : null;
  }

  /**
   * Process a single video URL
   * @param {Object} urlData - URL data object
   */
  async processVideoUrl(urlData) {
    const { url, platform, title } = urlData;
    const videoId = this.extractVideoId(url, platform);
    
    if (!videoId) {
      this.log(`⚠️  Could not extract ${platform} ID from: ${url}`);
      this.stats.errors.push({ url, error: 'Could not extract video ID' });
      return;
    }

    const thumbnailKey = `${platform}-${videoId}`;
    
    // Check if already in catalog
    if (this.catalog.videoThumbnails[thumbnailKey]) {
      this.stats.cached++;
      this.log(`📎 Using cached thumbnail: ${thumbnailKey}`);
      return;
    }

    this.stats.processed++;
    this.log(`🎬 Processing ${platform} thumbnail: ${videoId}`);

    if (this.dryRun) {
      this.log(`🔍 [DRY RUN] Would process ${platform} thumbnail for ${videoId}`);
      return;
    }

    try {
      // Get thumbnail from platform
      const thumbnailBuffer = await this.fetchThumbnailFromPlatform(platform, videoId, title);
      
      if (!thumbnailBuffer) {
        throw new Error(`No thumbnail available for ${platform} video ${videoId}`);
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
        uploadDate: new Date().toISOString(),
        title: title || `${platform} ${videoId}`,
        processedByUnified: true
      };

      // Add platform-specific metadata
      if (platform === 'youtube') {
        catalogEntry.youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      } else if (platform === 'vimeo') {
        catalogEntry.vimeoUrl = `https://vimeo.com/${videoId}`;
      }

      this.catalog.videoThumbnails[thumbnailKey] = catalogEntry;
      this.stats.uploaded++;
      
      this.log(`✅ Uploaded ${platform} thumbnail: ${cloudflareResult.url}`);
      
    } catch (error) {
      this.log(`❌ Failed to process ${platform} thumbnail ${videoId}: ${error.message}`);
      this.stats.errors.push({ url, videoId, platform, error: error.message });
    }
  }

  /**
   * Fetch thumbnail from video platform
   * @param {string} platform - Platform name
   * @param {string} videoId - Video ID
   * @param {string} title - Video title
   * @returns {Buffer|null} Thumbnail buffer or null
   */
  async fetchThumbnailFromPlatform(platform, videoId, title) {
    switch (platform) {
      case 'youtube':
        return await this.fetchYouTubeThumbnail(videoId);
      case 'vimeo':
        return await this.fetchVimeoThumbnail(videoId);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Fetch YouTube thumbnail
   * @param {string} videoId - YouTube video ID
   * @returns {Buffer|null} Thumbnail buffer or null
   */
  async fetchYouTubeThumbnail(videoId) {
    // Try local thumbnail first (for migration scenarios)
    const localPath = path.join(CONFIG.thumbnailsDir, `youtube-${videoId}.jpg`);
    try {
      const localBuffer = await fs.readFile(localPath);
      this.log(`📁 Using local YouTube thumbnail: ${videoId}`);
      return localBuffer;
    } catch (error) {
      // Continue to API fetch
    }

    // Try different quality variants
    const qualityVariants = ['maxresdefault', 'hqdefault', 'mqdefault', 'sddefault'];
    
    for (const quality of qualityVariants) {
      try {
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
        const response = await fetch(thumbnailUrl);
        
        if (response.ok) {
          this.log(`🌐 Downloaded YouTube ${quality} thumbnail: ${videoId}`);
          return await response.buffer();
        }
      } catch (error) {
        // Continue to next quality
      }
    }

    return null;
  }

  /**
   * Fetch Vimeo thumbnail
   * @param {string} videoId - Vimeo video ID
   * @returns {Buffer|null} Thumbnail buffer or null
   */
  async fetchVimeoThumbnail(videoId) {
    // Try local thumbnail first (for migration scenarios)
    const localPath = path.join(CONFIG.thumbnailsDir, `vimeo-${videoId}.jpg`);
    try {
      const localBuffer = await fs.readFile(localPath);
      this.log(`📁 Using local Vimeo thumbnail: ${videoId}`);
      return localBuffer;
    } catch (error) {
      // Continue to API fetch
    }

    try {
      // Use Vimeo's oEmbed API
      const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=640`;
      const response = await fetch(oEmbedUrl);
      
      if (!response.ok) {
        throw new Error(`Vimeo oEmbed API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.thumbnail_url) {
        const thumbnailResponse = await fetch(data.thumbnail_url);
        if (thumbnailResponse.ok) {
          this.log(`🌐 Downloaded Vimeo thumbnail: ${videoId}`);
          return await thumbnailResponse.buffer();
        }
      }
    } catch (error) {
      this.log(`⚠️  Vimeo API error for ${videoId}: ${error.message}`);
    }

    return null;
  }

  /**
   * Upload thumbnail to Cloudflare Images
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Filename for upload
   * @returns {Object} Cloudflare response
   */
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
      url: result.result.variants[0]
    };
  }

  /**
   * Save catalog to disk
   */
  async saveCatalog() {
    if (!this.dryRun) {
      await fs.writeFile(CONFIG.catalogPath, JSON.stringify(this.catalog, null, 2));
      this.log(`💾 Saved catalog to ${CONFIG.catalogPath}`);
    } else {
      this.log(`🔍 [DRY RUN] Would save catalog to ${CONFIG.catalogPath}`);
    }
  }

  /**
   * Print summary of processing
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🎬 VIDEO THUMBNAIL PROCESSING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Videos processed: ${this.stats.processed}`);
    console.log(`Thumbnails uploaded: ${this.stats.uploaded}`);
    console.log(`Cached thumbnails used: ${this.stats.cached}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(({ url, videoId, platform, error }) => {
        console.log(`  ${platform || 'unknown'} ${videoId || url}: ${error}`);
      });
    }
    
    if (this.dryRun) {
      console.log('\n🔍 This was a dry run. No uploads or changes were made.');
    } else if (this.stats.uploaded > 0) {
      console.log(`\n✅ Successfully processed ${this.stats.uploaded} video thumbnails`);
      console.log('📦 All thumbnails now available via Cloudflare Images CDN');
    }
  }

  /**
   * Log message if verbose mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.verbose || this.dryRun) {
      console.log(message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node scripts/video-thumbnail-processor.js <input> [options]');
    console.log('');
    console.log('Arguments:');
    console.log('  <input>    File path, directory path, or comma-separated URLs');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run           Preview what would be processed without making changes');
    console.log('  --verbose           Show detailed logging');
    console.log('  --platforms=list    Comma-separated list of platforms (youtube,vimeo)');
    console.log('  --help              Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  # Process all videos in pins directory');
    console.log('  node scripts/video-thumbnail-processor.js docs/pins --verbose');
    console.log('');
    console.log('  # Process specific file');
    console.log('  node scripts/video-thumbnail-processor.js docs/workbook/video-item.md');
    console.log('');
    console.log('  # Process direct URLs');
    console.log('  node scripts/video-thumbnail-processor.js "https://youtube.com/watch?v=abc123,https://vimeo.com/123456"');
    console.log('');
    console.log('  # Dry run with YouTube only');
    console.log('  node scripts/video-thumbnail-processor.js docs/pins --platforms=youtube --dry-run');
    return;
  }

  const input = args[0];
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  
  // Parse platforms option
  let platforms = ['youtube', 'vimeo'];
  const platformsArg = args.find(arg => arg.startsWith('--platforms='));
  if (platformsArg) {
    platforms = platformsArg.split('=')[1].split(',').map(p => p.trim());
  }

  // Handle URL input
  let processInput = input;
  if (input.includes('http')) {
    // Direct URLs - convert to array
    processInput = input.split(',').map(url => url.trim());
  }

  console.log('🚀 Starting unified video thumbnail processor...');
  console.log(`📂 Input: ${Array.isArray(processInput) ? `${processInput.length} URLs` : processInput}`);
  console.log(`🎯 Platforms: ${platforms.join(', ')}`);
  if (dryRun) console.log('🔍 DRY RUN MODE - No changes will be made');
  
  try {
    const processor = new VideoThumbnailProcessor({ dryRun, verbose, platforms });
    await processor.init();
    await processor.processVideos(processInput);
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { VideoThumbnailProcessor };

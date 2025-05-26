#!/usr/bin/env node

import { VideoThumbnailProcessor } from '../../../../../scripts/video-thumbnail-processor.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Media Service - Thumbnail Processing
 * 
 * Unified thumbnail processor that consolidates all video thumbnail processing
 * functionality. Replaces multiple duplicate files:
 * - generateVimeoPinThumbnails.js
 * - updateYouTubeThumbnails.js  
 * - fetchYouTubeThumbnails.js
 * 
 * Single Responsibility: Handle all video thumbnail processing via Cloudflare Images
 */

/**
 * Process thumbnails for a specific platform
 * @param {string} platform - 'youtube', 'vimeo', or 'all'
 * @param {Object} options - Processing options
 * @returns {Promise} Processing result
 */
export async function processThumbnails(platform, options = {}) {
  const {
    dryRun = false,
    verbose = false,
    input = null // Can be file path, directory, or array of URLs
  } = options;

  console.log(`🎬 Thumbnail Service - Processing ${platform} thumbnails`);
  
  try {
    // Determine platforms to process
    let platforms;
    if (platform === 'all') {
      platforms = ['youtube', 'vimeo'];
    } else if (['youtube', 'vimeo'].includes(platform)) {
      platforms = [platform];
    } else {
      throw new Error(`Unsupported platform: ${platform}. Use 'youtube', 'vimeo', or 'all'`);
    }

    const processor = new VideoThumbnailProcessor({ 
      dryRun, 
      verbose, 
      platforms 
    });

    await processor.init();

    // Determine input source
    let processingInput;
    if (input) {
      processingInput = input;
    } else {
      // Default: process pins files for the platform
      const projectRoot = path.resolve(__dirname, '../../../../..');
      if (platform === 'all') {
        processingInput = path.join(projectRoot, 'docs/pins');
      } else {
        processingInput = path.join(projectRoot, `docs/pins/${platform}.md`);
      }
    }

    await processor.processVideos(processingInput);
    
    console.log(`✅ ${platform} thumbnail processing completed`);
    return { success: true, platform, input: processingInput };

  } catch (error) {
    console.error(`❌ ${platform} thumbnail processing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Process Vimeo thumbnails specifically
 * @param {Object} options - Processing options
 * @returns {Promise} Processing result
 */
export async function processVimeoThumbnails(options = {}) {
  return processThumbnails('vimeo', options);
}

/**
 * Process YouTube thumbnails specifically  
 * @param {Object} options - Processing options
 * @returns {Promise} Processing result
 */
export async function processYouTubeThumbnails(options = {}) {
  return processThumbnails('youtube', options);
}

/**
 * Process all platform thumbnails
 * @param {Object} options - Processing options
 * @returns {Promise} Processing result
 */
export async function processAllThumbnails(options = {}) {
  return processThumbnails('all', options);
}

// CLI interface for backward compatibility
async function runCLI() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  // Determine platform from script name or arguments
  let platform = 'all';
  const scriptName = path.basename(process.argv[1]);
  
  if (scriptName.includes('vimeo') || args.includes('--vimeo')) {
    platform = 'vimeo';
  } else if (scriptName.includes('youtube') || args.includes('--youtube')) {
    platform = 'youtube';
  }

  // Check for input argument
  const inputIndex = args.findIndex(arg => !arg.startsWith('--'));
  const input = inputIndex >= 0 ? args[inputIndex] : null;

  try {
    await processThumbnails(platform, { dryRun, verbose, input });
  } catch (error) {
    console.error('Thumbnail processing failed:', error.message);
    process.exit(1);
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI();
}

// Default export for legacy compatibility
export default processThumbnails;

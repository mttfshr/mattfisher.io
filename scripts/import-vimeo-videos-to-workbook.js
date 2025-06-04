#!/usr/bin/env node

/**
 * Import published Vimeo videos as workbook entries
 * Creates individual markdown files for each video with proper frontmatter
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { decodeHtmlEntitiesNode } from '../docs/.vitepress/utils/shared/html.js';

dotenv.config();

/**
 * Create a URL-friendly slug from a title
 */
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format duration as MM:SS
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Extract tags from video description and title
 */
function extractTags(title, description) {
  const tags = ['video', 'vimeo'];
  
  // Add performance-related tags
  if (title.match(/live|performance|show/i) || description.match(/live|performance|show/i)) {
    tags.push('performance');
  }
  
  // Add collaboration tags
  if (title.match(/collab|with|feat/i) || description.match(/collaboration|featuring|with/i)) {
    tags.push('collaboration');
  }
  
  // Add technique tags
  if (title.match(/synthesis|synth/i) || description.match(/synthesis|synthesizer/i)) {
    tags.push('synthesis');
  }
  
  if (title.match(/visual|video/i) || description.match(/visual|video/i)) {
    tags.push('visual');
  }
  
  return tags;
}

/**
 * Check if a workbook entry already exists for this video
 */
async function checkIfExists(vimeoId, workbookDir) {
  try {
    const files = await fs.readdir(workbookDir, { recursive: true });
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(workbookDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check if this file contains the Vimeo ID
        if (content.includes(`vimeo.com/${vimeoId}`) || (content.includes(`provider: vimeo`) && content.includes(`url: https://vimeo.com/${vimeoId}`))) {
          return { exists: true, file: file };
        }
      }
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error checking existing files:', error);
    return { exists: false };
  }
}

/**
 * Create workbook entry markdown content
 */
function createWorkbookEntry(video, options = {}) {
  const {
    includeDescription = true,
    addToCollection = 'vimeo-import',
    defaultTags = ['video', 'vimeo']
  } = options;
  
  // Extract Vimeo ID from URI
  const vimeoId = video.uri.split('/').pop();
  
  // Decode HTML entities in title and description
  const title = decodeHtmlEntitiesNode(video.name);
  const description = video.description ? decodeHtmlEntitiesNode(video.description) : '';
  
  // Extract tags
  const tags = [...defaultTags, ...extractTags(title, description)];
  if (addToCollection) {
    tags.push(`collection:${addToCollection}`);
  }
  
  // Format creation date
  const createdDate = new Date(video.created_time).toISOString().split('T')[0];
  
  // Create frontmatter
  const frontmatter = {
    title: title,
    date: createdDate,
    type: 'video',
    media: {
      provider: 'vimeo',
      url: `https://vimeo.com/${vimeoId}`
    },
    duration: formatDuration(video.duration),
    tags: tags,
    vimeoId: vimeoId
  };
  
  // Add optional fields
  if (video.privacy && video.privacy.view === 'anybody') {
    frontmatter.public = true;
  }
  
  if (video.stats && video.stats.plays) {
    frontmatter.plays = video.stats.plays;
  }
  
  // Build markdown content
  let markdown = '---\n';
  Object.entries(frontmatter).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Handle arrays (like tags)
      markdown += `${key}:\n`;
      value.forEach(item => {
        markdown += `  - ${item}\n`;
      });
    } else if (typeof value === 'object' && value !== null) {
      // Handle objects (like media)
      markdown += `${key}:\n`;
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (Array.isArray(subValue)) {
          markdown += `  ${subKey}:\n`;
          subValue.forEach(item => {
            markdown += `    - ${item}\n`;
          });
        } else {
          markdown += `  ${subKey}: ${subValue}\n`;
        }
      });
    } else {
      // Handle primitives (strings, numbers, booleans)
      markdown += `${key}: ${value}\n`;
    }
  });
  markdown += '---\n\n';
  
  // Add description if available and requested
  if (includeDescription && description.trim()) {
    markdown += `${description}\n\n`;
  }
  
  // Add embed shortcode or note
  markdown += `<!-- Vimeo video: ${title} -->\n`;
  markdown += `<!-- Duration: ${formatDuration(video.duration)} -->\n`;
  markdown += `<!-- Created: ${createdDate} -->\n`;
  
  return markdown;
}

/**
 * Main function to import Vimeo videos to workbook
 */
async function importVimeoVideosToWorkbook(options = {}) {
  const {
    limit = 0,           // 0 means fetch all
    pageSize = 100,      // Videos per API request
    workbookDir = 'docs/workbook/videos',
    dryRun = false,      // Preview without creating files
    skipExisting = true, // Skip videos that already exist in workbook
    filter = 'published', // 'published', 'all', or custom filter
    addToCollection = 'vimeo-import',
    includeDescription = true
  } = options;
  
  console.log('🎬 Vimeo Workbook Importer Starting...\n');
  
  try {
    const accessToken = process.env.VIMEO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Missing Vimeo access token. Please set VIMEO_ACCESS_TOKEN in .env file.');
    }
    
    // Ensure workbook directory exists
    await fs.mkdir(workbookDir, { recursive: true });
    
    console.log(`📂 Fetching videos from Vimeo account${limit > 0 ? ` (limited to ${limit})` : ' (all)'}...`);
    
    let allVideos = [];
    let page = 1;
    let hasMore = true;
    let totalVideos = 0;
    
    // Fetch videos with pagination
    while (hasMore) {
      console.log(`   Fetching page ${page}...`);
      
      // Build API URL with comprehensive fields
      const apiUrl = new URL('https://api.vimeo.com/me/videos');
      apiUrl.searchParams.set('page', page);
      apiUrl.searchParams.set('per_page', pageSize);
      apiUrl.searchParams.set('fields', [
        'name', 'description', 'uri', 'created_time', 'duration',
        'privacy.view', 'stats.plays', 'pictures.base_link'
      ].join(','));
      
      // Add filter if specified
      // Note: Removed 'embeddable' filter as it's too restrictive
      // Most public videos aren't specifically marked as embeddable
      if (filter === 'published') {
        // Filter for public videos instead of embeddable
        apiUrl.searchParams.set('privacy.view', 'anybody');
      }
      
      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Authorization': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        allVideos = allVideos.concat(data.data);
        console.log(`   Received ${data.data.length} videos (total: ${allVideos.length})`);
        
        if (totalVideos === 0) {
          totalVideos = data.total || 0;
          console.log(`   Total videos available: ${totalVideos}`);
        }
      }
      
      // Check if we should continue
      if (limit > 0 && allVideos.length >= limit) {
        allVideos = allVideos.slice(0, limit);
        hasMore = false;
        console.log(`   Reached requested limit of ${limit} videos.`);
      } else if (!data.paging || !data.paging.next) {
        hasMore = false;
        console.log('   No more pages available.');
      } else {
        page++;
      }
    }
    
    console.log(`\n📊 Retrieved ${allVideos.length} videos from Vimeo\n`);
    
    if (allVideos.length === 0) {
      console.log('❌ No videos found. Check your API credentials and account status.');
      return false;
    }
    
    // Process each video
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const video of allVideos) {
      try {
        const vimeoId = video.uri.split('/').pop();
        const title = decodeHtmlEntitiesNode(video.name);
        const slug = createSlug(title);
        
        console.log(`🎥 Processing: "${title}" (${vimeoId})`);
        
        // Check if already exists
        if (skipExisting) {
          const existsCheck = await checkIfExists(vimeoId, workbookDir);
          if (existsCheck.exists) {
            console.log(`   ⏭️  Skipped: Already exists in ${existsCheck.file}`);
            skipped++;
            continue;
          }
        }
        
        // Create the markdown content
        const markdown = createWorkbookEntry(video, {
          includeDescription,
          addToCollection,
          defaultTags: ['video', 'vimeo']
        });
        
        if (dryRun) {
          console.log(`   📋 Would create: ${slug}.md`);
          console.log(`      Duration: ${formatDuration(video.duration)}`);
          console.log(`      Created: ${new Date(video.created_time).toISOString().split('T')[0]}`);
        } else {
          // Create the file
          const filename = `${slug}.md`;
          const filepath = path.join(workbookDir, filename);
          
          await fs.writeFile(filepath, markdown, 'utf-8');
          console.log(`   ✅ Created: ${filename}`);
          created++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing "${video.name}":`, error.message);
        errors++;
      }
    }
    
    // Summary
    console.log(`\n📈 Import Summary:`);
    console.log(`   Total videos processed: ${allVideos.length}`);
    if (dryRun) {
      console.log(`   Would create: ${allVideos.length - skipped - errors} files`);
    } else {
      console.log(`   Created: ${created} files`);
    }
    console.log(`   Skipped: ${skipped} (already exist)`);
    if (errors > 0) {
      console.log(`   Errors: ${errors}`);
    }
    
    if (!dryRun && created > 0) {
      console.log(`\n🎯 Next Steps:`);
      console.log(`   1. Review the created files in ${workbookDir}`);
      console.log(`   2. Edit titles, descriptions, and tags as needed`);
      console.log(`   3. Run 'npm run build' to generate thumbnails`);
      console.log(`   4. Check the workbook gallery to see your videos`);
      
      if (addToCollection) {
        console.log(`   5. Videos are added to collection: ${addToCollection}`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n🔑 Authentication Error:');
      console.error('Your Vimeo access token appears to be invalid or expired.');
      console.error('Please generate a new token at: https://developer.vimeo.com/apps/');
    }
    
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[++i]);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--include-existing') {
      options.skipExisting = false;
    } else if (arg === '--no-description') {
      options.includeDescription = false;
    } else if (arg === '--collection' && i + 1 < args.length) {
      options.addToCollection = args[++i];
    } else if (arg === '--workbook-dir' && i + 1 < args.length) {
      options.workbookDir = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
🎬 Vimeo Workbook Importer

Usage: node scripts/import-vimeo-videos-to-workbook.js [options]

Options:
  --limit N              Import only N videos (default: all)
  --dry-run             Preview without creating files
  --include-existing    Don't skip videos that already exist
  --no-description      Don't include video descriptions in markdown
  --collection NAME     Add videos to specified collection (default: vimeo-import)
  --workbook-dir PATH   Directory for workbook files (default: docs/workbook/videos)
  --help, -h            Show this help message

Examples:
  node scripts/import-vimeo-videos-to-workbook.js --limit 10 --dry-run
  node scripts/import-vimeo-videos-to-workbook.js --collection recent-work
  node scripts/import-vimeo-videos-to-workbook.js --no-description

NPM Scripts:
  npm run vimeo:import-preview    # Preview first 5 videos
  npm run vimeo:import-videos     # Import all videos
      `);
      process.exit(0);
    }
  }
  
  try {
    await importVimeoVideosToWorkbook(options);
    console.log('\n🎉 Import completed successfully!');
  } catch (error) {
    console.error('\n💥 Import failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { importVimeoVideosToWorkbook };
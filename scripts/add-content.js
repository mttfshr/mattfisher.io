#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Import existing thumbnail processing infrastructure
 */
const thumbnailServicePath = path.resolve(process.cwd(), 'docs/.vitepress/utils/services/media/thumbnails.js');
let thumbnailService = null;

try {
  const module = await import(thumbnailServicePath);
  thumbnailService = module;
} catch (error) {
  console.warn('⚠️  Could not load thumbnail service - thumbnails will be skipped');
}

/**
 * Intelligent Pins Bookmarking System
 * 
 * This system is designed EXCLUSIVELY for adding external content to your pins collection.
 * It intelligently categorizes and formats bookmarked content you discover online.
 * 
 * NEVER used for workbook content - that requires deliberate manual curation.
 * Workbook content is your own creative work that you present intentionally.
 */

/**
 * Content classification for pins - focused on categorization and smart tagging
 */
function classifyContent(url, metadata) {
  const classification = {
    contentType: 'bookmark',
    suggestedDestination: 'pins', // ALWAYS pins
    confidence: 0.9,
    reasoning: ['Adding to pins collection'],
    suggestedTags: [],
    suggestedTitle: metadata.title || 'Untitled',
    suggestedCollection: 'general'
  };

  const urlLower = url.toLowerCase();
  const domain = new URL(url).hostname.replace('www.', '');
  const title = (metadata.title || '').toLowerCase();
  
  // Video platforms
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    classification.contentType = 'video';
    classification.suggestedTags.push('video', 'youtube');
    classification.suggestedCollection = 'video';
    classification.reasoning.push('YouTube video detected');
  } else if (urlLower.includes('vimeo.com')) {
    classification.contentType = 'video';
    classification.suggestedTags.push('video', 'vimeo');
    classification.suggestedCollection = 'video';
    classification.reasoning.push('Vimeo video detected');
  }
  
  // Creative/Visual platforms
  else if (['flickr.com', 'instagram.com', 'behance.net', 'dribbble.com'].includes(domain)) {
    classification.contentType = 'visual';
    classification.suggestedTags.push('visual', 'creative');
    classification.suggestedCollection = 'visual';
    classification.reasoning.push('Creative platform detected');
  }
  
  // Art and culture institutions
  else if (['artsy.net', 'artnet.com', 'moma.org', 'tate.org.uk', 'guggenheim.org', 'whitney.org'].includes(domain)) {
    classification.contentType = 'art';
    classification.suggestedTags.push('art', 'culture', 'museum');
    classification.suggestedCollection = 'art';
    classification.reasoning.push('Art/culture institution detected');
  }
  
  // Design and architecture
  else if (['designboom.com', 'dezeen.com', 'archdaily.com', 'core77.com', 'itsnicethat.com'].includes(domain)) {
    classification.contentType = 'design';
    classification.suggestedTags.push('design', 'architecture');
    classification.suggestedCollection = 'design';
    classification.reasoning.push('Design publication detected');
  }
  
  // Music platforms
  else if (['spotify.com', 'soundcloud.com', 'bandcamp.com', 'musicbrainz.org'].includes(domain)) {
    classification.contentType = 'music';
    classification.suggestedTags.push('music', 'audio');
    classification.suggestedCollection = 'music';
    classification.reasoning.push('Music platform detected');
  }
  
  // Technical/development content
  else if (['github.com', 'medium.com', 'dev.to', 'stackoverflow.com', 'hackernews.com'].includes(domain)) {
    classification.contentType = 'technical';
    classification.suggestedTags.push('tech', 'development');
    classification.suggestedCollection = 'tech';
    classification.reasoning.push('Technical platform detected');
  }
  
  // News and articles
  else if (['nytimes.com', 'guardian.com', 'wired.com', 'aeon.co', 'longreads.com'].includes(domain)) {
    classification.contentType = 'article';
    classification.suggestedTags.push('article', 'reading');
    classification.suggestedCollection = 'articles';
    classification.reasoning.push('News/article site detected');
  }
  
  // Default to general bookmark
  else {
    classification.contentType = 'link';
    classification.suggestedTags.push('bookmark', 'web');
    classification.suggestedCollection = 'general';
    classification.reasoning.push('General web content');
  }
  
  // Enhanced tagging based on title content
  if (title) {
    // Technology keywords
    if (/\b(ai|artificial intelligence|machine learning|react|javascript|python|code|programming)\b/.test(title)) {
      classification.suggestedTags.push('tech', 'programming');
    }
    
    // Creative keywords
    if (/\b(art|design|creative|visual|aesthetic|inspiration|gallery)\b/.test(title)) {
      classification.suggestedTags.push('creative', 'inspiration');
    }
    
    // Architecture keywords
    if (/\b(architecture|building|space|structure|interior|urban)\b/.test(title)) {
      classification.suggestedTags.push('architecture', 'space');
    }
    
    // Music/sound keywords
    if (/\b(music|sound|audio|electronic|synthesis|album|artist)\b/.test(title)) {
      classification.suggestedTags.push('music', 'sound');
    }
    
    // Video/film keywords
    if (/\b(film|video|documentary|animation|cinema|director)\b/.test(title)) {
      classification.suggestedTags.push('film', 'video');
    }
  }
  
  // Add domain-based tag
  const domainTag = domain.split('.')[0];
  if (domainTag && domainTag.length > 2) {
    classification.suggestedTags.push(domainTag);
  }
  
  // Add year tag
  classification.suggestedTags.push(new Date().getFullYear().toString());
  
  // Remove duplicates
  classification.suggestedTags = [...new Set(classification.suggestedTags)];
  
  return classification;
}

/**
 * Generate pins markdown format
 */
function generatePinsMarkdown(url, metadata, classification) {
  const { suggestedTitle, suggestedTags } = classification;
  
  // Create tag string
  const tagString = suggestedTags.map(tag => `#${tag.replace(/\s+/g, '-')}`).join(' ');
  
  // Format: - [Title](URL) #tags
  //         Optional description
  let markdown = `- [${suggestedTitle}](${url}) ${tagString}`;
  
  if (metadata.description && metadata.description.length > 0) {
    // Add description on next line, truncated if too long
    const description = metadata.description.substring(0, 150);
    const truncated = metadata.description.length > 150 ? '...' : '';
    markdown += `\n  *${description}${truncated}*`;
  }
  
  markdown += '\n\n';
  
  return markdown;
}

/**
 * Fetch and analyze content from URL
 */
async function fetchContentMetadata(url) {
  try {
    console.log(`🔍 Analyzing: ${url}`);
    
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract metadata
    const metadata = {};
    
    // OpenGraph title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1];
    }
    
    // Fallback to title tag
    if (!metadata.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }
    }
    
    // OpenGraph description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      metadata.description = ogDescMatch[1];
    }
    
    // Fallback to meta description
    if (!metadata.description) {
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (metaDescMatch) {
        metadata.description = metaDescMatch[1];
      }
    }
    
    // OpenGraph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      metadata.imageUrl = ogImageMatch[1];
    }
    
    // Site name
    const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (ogSiteMatch) {
      metadata.siteName = ogSiteMatch[1];
    }
    
    metadata.fetchedAt = new Date().toISOString();
    
    return metadata;
    
  } catch (error) {
    console.log(`⚠️  Error fetching metadata: ${error.message}`);
    return {
      title: new URL(url).hostname,
      description: null,
      imageUrl: null,
      error: error.message,
      fetchedAt: new Date().toISOString()
    };
  }
}

/**
 * Generate thumbnail for supported video platforms
 */
async function generateThumbnail(url, metadata) {
  if (!thumbnailService) {
    console.log('⚠️  Thumbnail service not available - skipping thumbnail generation');
    return null;
  }

  const urlLower = url.toLowerCase();
  
  try {
    // Check if this is a video platform we can generate thumbnails for
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      console.log('🎬 Generating YouTube thumbnail...');
      await thumbnailService.processThumbnails('youtube', { 
        input: [url],
        verbose: true 
      });
      return 'youtube';
    } else if (urlLower.includes('vimeo.com')) {
      console.log('🎬 Generating Vimeo thumbnail...');
      await thumbnailService.processThumbnails('vimeo', { 
        input: [url],
        verbose: true 
      });
      return 'vimeo';
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️  Error generating thumbnail: ${error.message}`);
    return null;
  }
}

/**
 * Process OpenGraph image as thumbnail for non-video content
 */
async function processOgImageThumbnail(url, metadata) {
  if (!metadata.imageUrl) {
    return null;
  }

  try {
    console.log('🖼️  Processing OpenGraph image as thumbnail...');
    
    // Create a simple mapping for OG images
    // This could be enhanced to upload to Cloudflare Images if needed
    const thumbnailData = {
      sourceUrl: url,
      imageUrl: metadata.imageUrl,
      title: metadata.title,
      processedAt: new Date().toISOString()
    };
    
    // Save to a simple OG images cache for now
    const cacheDir = path.resolve(process.cwd(), 'docs/.vitepress/cache');
    const cachePath = path.resolve(cacheDir, 'og-images-cache.json');
    
    let cache = {};
    try {
      const cacheContent = await fs.readFile(cachePath, 'utf8');
      cache = JSON.parse(cacheContent);
    } catch (error) {
      // Cache doesn't exist yet, start fresh
    }
    
    // Create URL-based key
    const urlKey = url.replace(/[^a-zA-Z0-9]/g, '_');
    cache[urlKey] = thumbnailData;
    
    // Ensure cache directory exists
    await fs.mkdir(cacheDir, { recursive: true });
    
    // Save updated cache
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
    
    console.log('✅ OpenGraph image cached for thumbnail use');
    return thumbnailData;
    
  } catch (error) {
    console.warn(`⚠️  Error processing OG image: ${error.message}`);
    return null;
  }
}
export async function bookmarkContent(url, options = {}) {
  console.log('📌 Intelligent Pins Bookmarking');
  console.log('===============================');
  
  try {
    // Validate URL
    new URL(url);
    
    // Fetch metadata
    const metadata = await fetchContentMetadata(url);
    
    // Classify content for pins
    const classification = classifyContent(url, metadata);
    
    // Allow manual tag additions
    if (options.tags) {
      classification.suggestedTags = [...classification.suggestedTags, ...options.tags];
      classification.suggestedTags = [...new Set(classification.suggestedTags)]; // Remove duplicates
    }
    
    // Generate thumbnails if possible
    let thumbnailResult = null;
    if (!options.preview && !options.skipThumbnails) {
      console.log('\n🎬 Processing thumbnails...');
      console.log('==========================');
      
      if (classification.contentType === 'video') {
        thumbnailResult = await generateThumbnail(url, metadata);
      } else if (metadata.imageUrl) {
        thumbnailResult = await processOgImageThumbnail(url, metadata);
      }
    }
    
    // Generate pins markdown
    const markdown = generatePinsMarkdown(url, metadata, classification);
    
    console.log('\n📊 Bookmark Analysis:');
    console.log('=====================');
    console.log(`URL: ${url}`);
    console.log(`Title: ${metadata.title || 'No title'}`);
    console.log(`Content Type: ${classification.contentType}`);
    console.log(`Suggested Collection: ${classification.suggestedCollection}`);
    console.log(`Reasoning: ${classification.reasoning.join(', ')}`);
    console.log(`Suggested Tags: ${classification.suggestedTags.join(', ')}`);
    
    if (metadata.imageUrl) {
      console.log(`Image: ${metadata.imageUrl}`);
    }
    
    if (thumbnailResult) {
      if (typeof thumbnailResult === 'string') {
        console.log(`Thumbnail: ${thumbnailResult} thumbnail generated via Cloudflare Images`);
      } else if (thumbnailResult.imageUrl) {
        console.log(`Thumbnail: OpenGraph image cached (${thumbnailResult.imageUrl})`);
      }
    }
    
    console.log('\n📝 Generated Pins Entry:');
    console.log('========================');
    console.log(markdown);
    
    // Save to pins file if not in preview mode
    if (!options.preview) {
      await saveToPins(markdown);
    }
    
    return {
      metadata,
      classification,
      markdown,
      thumbnailResult,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error in pins bookmarking:', error);
    return {
      error: error.message,
      success: false
    };
  }
}

/**
 * Save content to pins file
 */
async function saveToPins(markdown) {
  try {
    const filePath = path.resolve(process.cwd(), 'docs/pins/pins.md');
    await fs.appendFile(filePath, markdown);
    console.log(`\n💾 Added to pins: ${filePath}`);
  } catch (error) {
    console.error('❌ Error saving to pins:', error);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const skipThumbnails = args.includes('--skip-thumbnails');
  const tagsIndex = args.indexOf('--tags');
  const tags = tagsIndex !== -1 ? args[tagsIndex + 1].split(',').map(t => t.trim()) : [];
  
  // Get URL (first argument that doesn't start with --)
  const url = args.find(arg => !arg.startsWith('--'));
  
  if (!url) {
    console.log('Usage: node add-content.js <URL> [--preview] [--skip-thumbnails] [--tags tag1,tag2,tag3]');
    console.log('');
    console.log('📌 Intelligent Pins Bookmarking System');
    console.log('======================================');
    console.log('');
    console.log('This tool is designed EXCLUSIVELY for adding external content');
    console.log('to your pins collection. It intelligently categorizes and formats');
    console.log('bookmarked content you discover online.');
    console.log('');
    console.log('🎬 AUTOMATIC THUMBNAIL GENERATION:');
    console.log('- Video content (YouTube, Vimeo) → Cloudflare Images thumbnails');
    console.log('- Other content → OpenGraph images cached for thumbnail use');
    console.log('');
    console.log('Examples:');
    console.log('  node add-content.js "https://vimeo.com/123456789"');
    console.log('  node add-content.js "https://example.com/article" --preview');
    console.log('  node add-content.js "https://github.com/user/repo" --tags favorite,reference');
    console.log('  node add-content.js "https://site.com" --skip-thumbnails');
    console.log('');
    console.log('⚠️  NEVER use this for workbook content - that requires deliberate manual curation');
    process.exit(1);
  }
  
  bookmarkContent(url, { preview, skipThumbnails, tags }).catch(console.error);
}
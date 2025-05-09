// scripts/generateLogEntries.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import { extractOpenGraphData } from './enhancedOgExtraction.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts hashtags from content text
 * @param {string} text - The text to extract hashtags from
 * @returns {string[]} - Array of hashtags without the # prefix
 */
function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex) || []
  return matches.map(tag => tag.slice(1)) // Remove the # prefix
}

/**
 * Extracts date and type from filename
 * @param {string} filename - Filename in format YYYY-MM-DD-[update|pin]-title.md
 * @returns {Object} - Object with date and type
 */
function extractFromFilename(filename) {
  // Format: YYYY-MM-DD-[update|pin]-title.md
  const parts = path.basename(filename, '.md').split('-')
  
  if (parts.length >= 4) {
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    const type = parts[3]
    
    return {
      date: `${year}-${month}-${day}`,
      type: type
    }
  }
  
  return { date: null, type: null }
}

/**
 * Extracts image references from markdown content
 * @param {string} content - Markdown content
 * @returns {Array} - Array of image objects with url and alt
 */
function extractImages(content) {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g
  const images = []
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      alt: match[1] || '',
      url: match[2]
    })
  }

  return images
}

/**
 * Processes all log files in a directory
 * @param {string} dir - Directory containing log markdown files
 * @returns {Promise<Array>} - Array of processed log entries
 */
async function processLogEntries(dir) {
  const entries = []
  
  // Read all markdown files in the directory
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
  
  for (const file of files) {
    try {
      const filePath = path.join(dir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const { data: frontmatter, content: bodyContent } = matter(content)
      
      // Extract date and type from filename
      const { date, type } = extractFromFilename(file)
      
      if (!date || !type) {
        console.warn(`Skipping ${file}: Invalid filename format`)
        continue
      }
      
      // Create timestamp (default to noon if not specified)
      const timestamp = frontmatter.timestamp || `${date}T12:00:00Z`
      
      // Process based on type
      if (type === 'update') {
        // For updates
        const tags = frontmatter.tags || extractHashtags(bodyContent)
        const images = frontmatter.images || extractImages(bodyContent)
        
        entries.push({
          id: frontmatter.id || `update-${date}-${uuidv4().slice(0, 8)}`,
          type: 'update',
          content: bodyContent.trim(),
          timestamp,
          tags,
          images
        })
      } else if (type === 'pin') {
        // For pins, URL is required
        if (!frontmatter.url) {
          console.warn(`Skipping ${file}: No URL provided for pin`)
          continue
        }
        
        // Initialize with any provided frontmatter data
        let metadata = {
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          imageUrl: frontmatter.imageUrl || '',
          siteName: frontmatter.siteName || '',
          favicon: frontmatter.favicon || ''
        }
        
        // Only fetch OG data if we're missing metadata
        if (!metadata.title || !metadata.description || !metadata.imageUrl) {
          try {
            console.log(`Fetching OG data for ${frontmatter.url}...`)
            const ogData = await extractOpenGraphData(frontmatter.url)
            
            // Use OG data for any fields not provided in frontmatter
            metadata = {
              title: metadata.title || ogData.title,
              description: metadata.description || ogData.description,
              imageUrl: metadata.imageUrl || ogData.imageUrl,
              siteName: metadata.siteName || ogData.siteName,
              favicon: metadata.favicon || ogData.favicon
            }
          } catch (error) {
            console.error(`Error fetching OG data for ${frontmatter.url}:`, error)
          }
        }
        
        entries.push({
          id: frontmatter.id || `pin-${date}-${uuidv4().slice(0, 8)}`,
          type: 'pin',
          title: metadata.title,
          url: frontmatter.url,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          favicon: metadata.favicon,
          siteName: metadata.siteName,
          pinnedAt: timestamp,
          tags: frontmatter.tags || extractHashtags(bodyContent),
          note: bodyContent.trim()
        })
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error)
    }
  }
  
  return entries
}

/**
 * Process entries from a single consolidated file
 * @param {string} filePath - Path to the consolidated markdown file
 * @returns {Promise<Array>} - Array of processed log entries
 */
async function processConsolidatedFile(filePath) {
  const entries = []
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Split the file by horizontal rule
  const entryTexts = content.split(/\n---\n/)
  
  for (const entryText of entryTexts) {
    try {
      // Parse the entry
      const lines = entryText.trim().split('\n')
      
      // First line is expected to be a header with date and title
      const headerLine = lines[0]
      
      if (!headerLine || !headerLine.startsWith('# ')) {
        console.warn('Skipping entry: Invalid header format')
        continue
      }
      
      // Extract date and title from header
      // Format: # YYYY-MM-DD: Title or # YYYY-MM-DD: [Title](URL)
      const headerMatch = headerLine.match(/# (\d{4}-\d{2}-\d{2}): (?:\[(.*?)\]\((.*?)\)|(.*))/)
      
      if (!headerMatch) {
        console.warn('Skipping entry: Could not parse header')
        continue
      }
      
      const date = headerMatch[1]
      const linkTitle = headerMatch[2]
      const url = headerMatch[3]
      const plainTitle = headerMatch[4]
      
      // Determine if this is a pin or update
      const isPin = !!url
      const timestamp = `${date}T12:00:00Z`
      
      // Extract the content (everything after the header)
      const bodyContent = lines.slice(1).join('\n').trim()
      
      // Extract tags and images
      const tags = extractHashtags(bodyContent)
      const images = extractImages(bodyContent)
      
      if (isPin) {
        // This is a pin - fetch OG data
        console.log(`Fetching OG data for ${url}...`)
        const ogData = await extractOpenGraphData(url)
        
        entries.push({
          id: `pin-${date}-${uuidv4().slice(0, 8)}`,
          type: 'pin',
          title: linkTitle || ogData.title,
          url,
          description: ogData.description,
          imageUrl: ogData.imageUrl,
          favicon: ogData.favicon,
          siteName: ogData.siteName,
          pinnedAt: timestamp,
          tags,
          note: bodyContent
        })
      } else {
        // This is an update
        entries.push({
          id: `update-${date}-${uuidv4().slice(0, 8)}`,
          type: 'update',
          content: bodyContent,
          timestamp,
          tags,
          images
        })
      }
    } catch (error) {
      console.error('Error processing entry:', error)
    }
  }
  
  return entries
}

/**
 * Cache URLs to avoid re-fetching OG data for the same URL
 * @type {Map<string, Object>}
 */
const urlCache = new Map()

/**
 * Cache path for storing OG data between runs
 */
const CACHE_PATH = path.join(__dirname, '../.og-cache.json')

/**
 * Load cache from disk if available
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
      Object.entries(cacheData).forEach(([url, data]) => {
        urlCache.set(url, data)
      })
      console.log(`Loaded cache with ${urlCache.size} entries`)
    }
  } catch (error) {
    console.error('Error loading cache:', error)
  }
}

/**
 * Save cache to disk
 */
function saveCache() {
  try {
    const cacheData = {}
    urlCache.forEach((data, url) => {
      cacheData[url] = data
    })
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheData, null, 2))
    console.log(`Saved cache with ${urlCache.size} entries`)
  } catch (error) {
    console.error('Error saving cache:', error)
  }
}

/**
 * Main function to generate log data
 */
export async function generateLogData() {
  // Configuration
  const LOG_DIR = path.join(__dirname, '../docs/log')
  const CONSOLIDATED_FILE = path.join(LOG_DIR, 'entries.md')
  const OUTPUT_FILE = path.join(__dirname, '../docs/.vitepress/data/logEntries.js')
  
  // Load cache
  loadCache()
  
  let entries = []
  
  // Check if using consolidated file approach
  if (fs.existsSync(CONSOLIDATED_FILE)) {
    console.log('Processing consolidated log file...')
    entries = await processConsolidatedFile(CONSOLIDATED_FILE)
  } else {
    console.log('Processing individual log files...')
    entries = await processLogEntries(LOG_DIR)
  }
  
  // Sort by date (newest first)
  entries.sort((a, b) => {
    const dateA = a.type === 'update' ? new Date(a.timestamp) : new Date(a.pinnedAt)
    const dateB = b.type === 'update' ? new Date(b.timestamp) : new Date(b.pinnedAt)
    return dateB - dateA
  })
  
  // Ensure directory exists
  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // Write to file
  const outputContent = `// Auto-generated log entries
export const logEntries = ${JSON.stringify(entries, null, 2)}
`
  
  fs.writeFileSync(OUTPUT_FILE, outputContent)
  console.log(`Generated log data with ${entries.length} entries`)
  
  // Save cache
  saveCache()
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateLogData().catch(error => {
    console.error('Error generating log data:', error)
    process.exit(1)
  })
}

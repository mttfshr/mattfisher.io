import { defineConfig } from 'vitepress'
import { videoThumbnailsPlugin } from './plugins/videoThumbnails/index.js'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// Ensure the VitePress public directory exists
// Using standard VitePress public directory location
const publicDir = path.resolve(process.cwd(), 'docs/public');
const mediaDir = path.resolve(publicDir, 'media');
const thumbnailsDir = path.resolve(mediaDir, 'thumbnails');

// Create the media directory if it doesn't exist
if (!fs.existsSync(mediaDir)) {
  console.log(`Creating standard VitePress public media directory: ${mediaDir}`);
  fs.mkdirSync(mediaDir, { recursive: true });
}

// Create the thumbnails directory if it doesn't exist
if (!fs.existsSync(thumbnailsDir)) {
  console.log(`Creating thumbnails directory: ${thumbnailsDir}`);
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Import our new getPins function
import { getPins } from './utils/getPins.js'

/**
 * Function to gather notes data at build time
 */
function getNotes() {
  const notesDir = path.resolve(process.cwd(), 'docs/notes')
  const files = fs.readdirSync(notesDir).filter(file => 
    file.endsWith('.md') && file !== 'index.md'
  )
  
  return files.map(file => {
    const filePath = path.join(notesDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter } = matter(content)
    const slug = file.replace(/\.md$/, '')
    
    // Get last modified time from file stats
    const stats = fs.statSync(filePath)
    const lastModified = stats.mtime.getTime()
    
    return {
      title: frontmatter.title || slug,
      slug,
      description: frontmatter.description || '',
      tags: frontmatter.tags || [],
      image: frontmatter.image || '',
      path: `/notes/${slug}`,
      lastUpdated: lastModified // Use file's modified time as lastUpdated
    }
  })
}

/**
 * Extract video IDs from URLs
 */
function extractVimeoId(url) {
  if (!url) return null;
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Function to gather workbook items data at build time
 */
function getWorkbookItems() {
  const workbookDir = path.resolve(process.cwd(), 'docs/workbook')
  const files = fs.readdirSync(workbookDir).filter(file => 
    file.endsWith('.md') && file !== 'index.md'
  )
  
  const workbookItems = files.map(file => {
    const filePath = path.join(workbookDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter } = matter(content)
    const slug = file.replace(/\.md$/, '')
    
    // Get last modified time from file stats
    const stats = fs.statSync(filePath)
    const lastModified = stats.mtime.getTime()
    
    const vimeoId = frontmatter.media?.provider === 'vimeo' && frontmatter.media?.url ? 
      extractVimeoId(frontmatter.media.url) : null;
    
    const youtubeId = frontmatter.media?.provider === 'youtube' && frontmatter.media?.url ? 
      extractYouTubeId(frontmatter.media.url) : null;

    // Set thumbnailUrl based on video provider
    let thumbnailUrl = null;
    if (vimeoId) {
      thumbnailUrl = `/media/thumbnails/vimeo-${vimeoId}.jpg`;
    } else if (youtubeId) {
      thumbnailUrl = `/media/thumbnails/youtube-${youtubeId}.jpg`;
    }
    
    return {
      title: frontmatter.title || slug,
      slug,
      description: frontmatter.description || '',
      date: frontmatter.date || null,
      tags: frontmatter.tags || [],
      media: frontmatter.media || null,
      thumbnailUrl, // Add thumbnailUrl property
      path: `/workbook/${slug}`,
      lastUpdated: lastModified // Use file's modified time as lastUpdated
    }
  })
  
  // Sort items by date (newest first)
  return workbookItems.sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0)
    const dateB = b.date ? new Date(b.date) : new Date(0)
    return dateB - dateA
  })
}

/**
 * Extract hashtags from content text
 */
function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex) || []
  return matches.map(tag => tag.slice(1)) // Remove the # prefix
}

/**
 * Extract image references from markdown content
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
 * Process log entries from the consolidated file
 */
async function getLogEntries() {
  const entriesPath = path.resolve(process.cwd(), 'docs/log/entries.md')
  if (!fs.existsSync(entriesPath)) {
    console.warn('Log entries file not found:', entriesPath)
    return []
  }
  
  const content = fs.readFileSync(entriesPath, 'utf8')
  const entries = []
  
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
        // This is a pin entry
        let ogData = {
          title: linkTitle || '',
          description: '',
          imageUrl: '',
          siteName: '',
          favicon: ''
        }
        
        try {
          // Use require to read from cache if available
          const cachePath = path.resolve(process.cwd(), 'docs/.vitepress/cache/og-cache.json')
          if (fs.existsSync(cachePath)) {
            const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
            if (cache[url]) {
              ogData = cache[url]
            }
          }
        } catch (error) {
          console.warn('Error reading OG cache:', error)
        }
        
        entries.push({
          id: `pin-${date}-${Math.random().toString(36).substring(2, 10)}`,
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
          id: `update-${date}-${Math.random().toString(36).substring(2, 10)}`,
          type: 'update',
          content: bodyContent,
          timestamp,
          tags,
          images
        })
      }
    } catch (error) {
      console.error('Error processing log entry:', error)
    }
  }
  
  // Sort by date (newest first)
  entries.sort((a, b) => {
    const dateA = a.type === 'update' ? new Date(a.timestamp) : new Date(a.pinnedAt)
    const dateB = b.type === 'update' ? new Date(b.timestamp) : new Date(b.pinnedAt)
    return dateB - dateA
  })
  
  return entries
}

export default defineConfig({
  // Basic configuration
  title: "Matt Fisher",
  description: "everything that is not a fragment is invisible",
  base: '/',
  
  // Directory configuration 
  outDir: path.resolve(process.cwd(), 'docs/.vitepress/dist'),
  cacheDir: path.resolve(process.cwd(), 'docs/.vitepress/cache'),
  publicDir: path.resolve(process.cwd(), 'docs/public'),
  
  // Theme configuration
  lastUpdated: true,
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Workbook', link: '/workbook' },
      { text: 'Pins', link: '/pins/' },
      { text: 'Log', link: '/log' },
      { text: 'Notes', link: '/notes' },
      { text: 'Links', items: 
        [
          { text: 'studio', link: 'https://mattfisherstudio.com' },
          { text: 'finishing school', link: 'https://finishing-school-art.net' },
          { text: 'github', link: 'https://github.com/mttfshr' },
          { text: 'bluesky', link: 'https://bsky.app/profile/mattfisher.io' },
          { text: 'vimeo', link: 'https://vimeo.com/mattfisherstudio' },
          { text: 'youtube', link: 'https://www.youtube.com/@mttfshr' },
          { text: 'spotify', link: 'https://open.spotify.com/user/gradientfade' },
          { text: 'bandcamp', link: 'https://bandcamp.com/mattfisher' },
          { text: 'discord', link: 'https://discordapp.com/users/476778097404805145' }
        ]
      }
    ],
    
    // Gather all notes at build time
    notes: getNotes(),
    
    // Gather all workbook items at build time
    workbookItems: getWorkbookItems(),
    
    // Gather all log entries at build time
    logEntries: await getLogEntries(),
    
    // Gather all pins at build time using our new function
    pins: getPins()
  },
  // Configure how assets are processed - unified approach for all media assets
  assetsDir: 'assets',
  
  // Don't exclude the media directory
  srcExclude: [],
  
  // Configure VitePress with simplified media handling
  vite: {
    plugins: [
      videoThumbnailsPlugin()
    ],
    // Disable asset inlining
    build: {
      assetsInlineLimit: 0,
    }
  },
})
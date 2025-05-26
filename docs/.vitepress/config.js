import { defineConfig } from 'vitepress'
import { videoThumbnailsPlugin } from './plugins/videoThumbnails/index.js'
import { cloudflareImagesPlugin } from './plugins/cloudflare-images.js'
import path from 'path'
import { createMediaDirectories, migrateCollectionFiles } from './utils/shared/filesystem.js'
import { getCollections, processCollections } from './utils/services/content/collections.js'
import { getWorkbookItems } from './utils/services/content/workbook.js'
import { getNotes } from './utils/services/content/notes.js'
import { getLogEntries } from './utils/services/content/log.js'
import { getPins } from './utils/services/content/pins.js'

// Ensure the VitePress public directory exists and create media directories
const { publicDir, mediaDir, thumbnailsDir } = createMediaDirectories();

// Migrate collection files if needed
migrateCollectionFiles();

// Get workbook items first, then process collections
const workbookItems = getWorkbookItems();
const collectionsData = getCollections();
console.log(`Found ${collectionsData.length} collection files:`, collectionsData.map(c => c.slug).join(', '));
const collections = processCollections(collectionsData, workbookItems);
console.log(`Processed ${collections.length} collections with items`);

// Log each collection to check if it has items
collections.forEach(collection => {
  console.log(`Collection "${collection.title}" (${collection.slug}): ${collection.totalItems || 0} items`);
});

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
  
  // Add favicon and app icons
  head: [
    ['link', { rel: 'icon', href: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
    ['link', { rel: 'icon', href: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' }],
    ['link', { rel: 'icon', href: '/icons/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#4CAF50' }]
  ],
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Workbook', link: '/workbook' },
      { text: 'Notes', link: '/notes' },
      { text: 'Log', link: '/log' },
      { text: 'Pins', link: '/pins/' },
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
    workbookItems: workbookItems,
    
    // Add collections
    collections: collections,
    
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
      videoThumbnailsPlugin(),
      cloudflareImagesPlugin()
    ],
    // Disable asset inlining
    build: {
      assetsInlineLimit: 0,
    }
  },
})

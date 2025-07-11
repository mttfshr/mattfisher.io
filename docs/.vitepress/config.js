import { defineConfig } from 'vitepress'
// import { videoThumbnailsPlugin } from './plugins/videoThumbnails/index.js' // DISABLED
import { cloudflareImagesPlugin } from './plugins/cloudflare-images.js'
import path from 'path'
import { createMediaDirectories, migrateCollectionFiles } from './utils/shared/filesystem.js'
import { getCollections, processCollections } from './utils/services/content/collections.js'
import { getWorkbookItems } from './utils/services/content/workbook.js'
import { getNotes } from './utils/services/content/notes.js'
import { getLogEntries } from './utils/services/content/log.js'
// import { getSessions } from './utils/services/content/sessions.js' // REMOVED: Sessions moved to project/sessions/
import { getPins } from './utils/services/content/pins.js'

// Development mode detection
const isDev = process.env.NODE_ENV === 'development'

// Ensure the VitePress public directory exists (but NOT media directories - zero media policy)
// const { publicDir, mediaDir, thumbnailsDir } = createMediaDirectories(); // DISABLED

// Migrate collection files if needed
migrateCollectionFiles();

// Get workbook items first, then process collections
const workbookItems = getWorkbookItems();
const collectionsData = getCollections();
const collections = processCollections(collectionsData, workbookItems);
console.log(`📂 Processed ${collections.length} collections with ${collections.reduce((sum, c) => sum + (c.totalItems || 0), 0)} items`);
if (collections.length > 0) {
  collections.forEach(collection => {
    console.log(`   "${collection.title}": ${collection.totalItems || 0} items`);
  });
}

// Load async data synchronously at module level
const logEntries = await getLogEntries();
// const sessions = await getSessions(); // REMOVED: Sessions moved to project/sessions/

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
  
  // Add favicon, app icons, and mobile viewport
  head: [
    // Essential viewport meta tag for mobile rotation and responsiveness
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover' }],
    // iOS-specific meta tags for proper mobile behavior
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { name: 'format-detection', content: 'telephone=no' }],
    ['link', { rel: 'icon', href: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
    ['link', { rel: 'icon', href: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' }],
    ['link', { rel: 'icon', href: '/icons/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#4CAF50' }]
  ],
  
  themeConfig: {
    // Force dark mode only
    appearance: 'dark',
    
    // Remove default navigation (handled by our rail nav)
    nav: [],
    sidebar: false,
    
    // Development-only content management features
    ...(isDev && {
      devTools: {
        enabled: true,
        contentManagement: true,
        adminRoutes: ['/admin', '/admin/pins', '/admin/collections']
      }
    }),
    
    // Social links in footer only
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mttfshr' }
    ],
    
    // Gather all notes at build time
    notes: {
      notes: getNotes(),
      categories: [],
      tags: []
    },
    
    // Gather all workbook items at build time
    workbook: {
      items: workbookItems,
      categories: [],
      tags: []
    },
    
    // Add collections
    collections: collections,
    
    // Load log data with proper structure
    log: {
      entries: logEntries,
      // sessions: sessions, // REMOVED: Sessions moved to project/sessions/
      stats: {}
    },
    
    // Gather all pins at build time using our new function
    pins: getPins()
  },
  // Configure how assets are processed - unified approach for all media assets
  assetsDir: 'assets',
  
  // Don't exclude the media directory
  srcExclude: [],
  
  // Configure VitePress with zero-media-in-repo policy
  vite: {
    plugins: [
      // videoThumbnailsPlugin(), // DISABLED: No local media storage
      cloudflareImagesPlugin(),
      
      // Development-only content management API
      ...(isDev ? [{
        name: 'content-management-api',
        configureServer(server) {
          // Import dev API routes
          import('./dev-tools/api-routes.js').then(({ setupDevAPI }) => {
            setupDevAPI(server);
          });
        }
      }] : [])
    ],
    // Disable asset inlining
    build: {
      assetsInlineLimit: 0,
    }
  },
})

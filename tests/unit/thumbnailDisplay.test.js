// tests/unit/thumbnailDisplay.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * This test specifically targets the thumbnail display issue
 * by analyzing and testing different thumbnail path configurations
 */
describe('Thumbnail Display', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const projectRoot = path.resolve(__dirname, '..')
  const publicDir = path.join(projectRoot, 'docs/.vitepress/public')
  
  it('analyzes current path structure for thumbnails', () => {
    // Check existing directory structure
    const mediaThumbnailsDir = path.join(publicDir, 'media/thumbnails')
    const rootThumbnailsDir = path.join(publicDir, 'thumbnails')
    
    const hasThumbnailsInMedia = fs.existsSync(mediaThumbnailsDir)
    const hasThumbnailsInRoot = fs.existsSync(rootThumbnailsDir)
    
    console.log(`Thumbnails in media directory exists: ${hasThumbnailsInMedia}`)
    console.log(`Thumbnails in root directory exists: ${hasThumbnailsInRoot}`)
    
    if (hasThumbnailsInMedia) {
      const files = fs.readdirSync(mediaThumbnailsDir)
      console.log(`Files in media/thumbnails: ${files.length}`)
      
      if (files.length > 0) {
        console.log('Sample files in media/thumbnails:')
        files.slice(0, 5).forEach(file => console.log(`- ${file}`))
      }
    }
    
    if (hasThumbnailsInRoot) {
      const files = fs.readdirSync(rootThumbnailsDir)
      console.log(`Files in thumbnails: ${files.length}`)
      
      if (files.length > 0) {
        console.log('Sample files in thumbnails:')
        files.slice(0, 5).forEach(file => console.log(`- ${file}`))
      }
    }
    
    // Identify any Vimeo ID patterns to verify correct naming
    const vimeoIdPattern = /vimeo-(\d+)\.jpg/
    
    if (hasThumbnailsInMedia) {
      const files = fs.readdirSync(mediaThumbnailsDir)
      const vimeoFiles = files.filter(file => vimeoIdPattern.test(file))
      
      console.log(`\nVimeo files in media/thumbnails: ${vimeoFiles.length}`)
      
      if (vimeoFiles.length > 0) {
        console.log('Sample Vimeo files:')
        vimeoFiles.slice(0, 5).forEach(file => {
          const match = file.match(vimeoIdPattern)
          const vimeoId = match ? match[1] : 'unknown'
          console.log(`- ${file} (ID: ${vimeoId})`)
        })
      }
    }
    
    if (hasThumbnailsInRoot) {
      const files = fs.readdirSync(rootThumbnailsDir)
      const vimeoFiles = files.filter(file => vimeoIdPattern.test(file))
      
      console.log(`\nVimeo files in thumbnails: ${vimeoFiles.length}`)
      
      if (vimeoFiles.length > 0) {
        console.log('Sample Vimeo files:')
        vimeoFiles.slice(0, 5).forEach(file => {
          const match = file.match(vimeoIdPattern)
          const vimeoId = match ? match[1] : 'unknown'
          console.log(`- ${file} (ID: ${vimeoId})`)
        })
      }
    }
    
    // This is a diagnostic test, always passes
    expect(true).toBe(true)
  })
  
  it('tests path resolution in mediaUtils and WorkbookGallery', () => {
    // Mock a workbook item with Vimeo video
    const mockWorkbookItem = {
      title: 'Test Video',
      slug: 'test-video',
      media: {
        type: 'video',
        provider: 'vimeo',
        url: 'https://vimeo.com/123456789'
      }
    }
    
    // Path that would be generated in mediaUtils.js
    const getMediaUtilsPath = (vimeoId) => {
      // Check by reading the actual file
      const mediaUtilsPath = path.join(projectRoot, 'docs/.vitepress/theme/utils/mediaUtils.js')
      if (fs.existsSync(mediaUtilsPath)) {
        const content = fs.readFileSync(mediaUtilsPath, 'utf-8')
        
        // Determine which pattern is used in the file
        const mediaThumbnailsPattern = `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        const rootThumbnailsPattern = `/thumbnails/vimeo-${vimeoId}.jpg`;
        
        const usesMediaPath = content.includes(mediaThumbnailsPattern) || 
                              content.includes(`/media/thumbnails/`);
        
        const usesRootPath = content.includes(rootThumbnailsPattern) || 
                             content.includes(`/thumbnails/`);
        
        console.log(`mediaUtils.js uses media path: ${usesMediaPath ? 'Yes' : 'No'}`);
        console.log(`mediaUtils.js uses root path: ${usesRootPath ? 'Yes' : 'No'}`);
        
        if (usesMediaPath) {
          return `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        } else if (usesRootPath) {
          return `/thumbnails/vimeo-${vimeoId}.jpg`;
        }
      }
      
      return null;
    }
    
    // Path that would be generated in WorkbookGallery.vue
    const getWorkbookGalleryPath = (vimeoId) => {
      // Check by reading the actual file
      const galleryPath = path.join(projectRoot, 'docs/.vitepress/theme/components/workbook/WorkbookGallery.vue')
      if (fs.existsSync(galleryPath)) {
        const content = fs.readFileSync(galleryPath, 'utf-8')
        
        // Determine which pattern is used in the file
        const mediaThumbnailsPattern = `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        const rootThumbnailsPattern = `/thumbnails/vimeo-${vimeoId}.jpg`;
        
        const usesMediaPath = content.includes(mediaThumbnailsPattern) || 
                              content.includes(`/media/thumbnails/`);
        
        const usesRootPath = content.includes(rootThumbnailsPattern) || 
                             content.includes(`/thumbnails/`);
        
        console.log(`WorkbookGallery.vue uses media path: ${usesMediaPath ? 'Yes' : 'No'}`);
        console.log(`WorkbookGallery.vue uses root path: ${usesRootPath ? 'Yes' : 'No'}`);
        
        if (usesMediaPath) {
          return `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        } else if (usesRootPath) {
          return `/thumbnails/vimeo-${vimeoId}.jpg`;
        }
      }
      
      return null;
    }
    
    // Path that would be generated in config.mts
    const getConfigPath = (vimeoId) => {
      // Check by reading the actual file
      const configPath = path.join(projectRoot, 'docs/.vitepress/config.mts')
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8')
        
        // Determine which pattern is used in the file
        const mediaThumbnailsPattern = `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        const rootThumbnailsPattern = `/thumbnails/vimeo-${vimeoId}.jpg`;
        
        const usesMediaPath = content.includes(mediaThumbnailsPattern) || 
                              content.includes(`/media/thumbnails/`);
        
        const usesRootPath = content.includes(rootThumbnailsPattern) || 
                             content.includes(`/thumbnails/`);
        
        console.log(`config.mts uses media path: ${usesMediaPath ? 'Yes' : 'No'}`);
        console.log(`config.mts uses root path: ${usesRootPath ? 'Yes' : 'No'}`);
        
        if (usesMediaPath) {
          return `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        } else if (usesRootPath) {
          return `/thumbnails/vimeo-${vimeoId}.jpg`;
        }
      }
      
      return null;
    }
    
    // Path that would be generated in fetchThumbnails.js
    const getFetchThumbnailsPath = (vimeoId) => {
      // Check by reading the actual file
      const fetchPath = path.join(projectRoot, 'docs/.vitepress/plugins/videoThumbnails/fetchThumbnails.js')
      if (fs.existsSync(fetchPath)) {
        const content = fs.readFileSync(fetchPath, 'utf-8')
        
        // Determine which pattern is used in the file
        const mediaThumbnailsPattern = `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        const rootThumbnailsPattern = `/thumbnails/vimeo-${vimeoId}.jpg`;
        
        const usesMediaPath = content.includes(mediaThumbnailsPattern) || 
                              content.includes(`/media/thumbnails/`);
        
        const usesRootPath = content.includes(rootThumbnailsPattern) || 
                             content.includes(`/thumbnails/`);
        
        console.log(`fetchThumbnails.js uses media path: ${usesMediaPath ? 'Yes' : 'No'}`);
        console.log(`fetchThumbnails.js uses root path: ${usesRootPath ? 'Yes' : 'No'}`);
        
        if (usesMediaPath) {
          return `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        } else if (usesRootPath) {
          return `/thumbnails/vimeo-${vimeoId}.jpg`;
        }
      }
      
      return null;
    }
    
    const vimeoId = '123456789'
    
    // Get paths from different parts of the code
    const mediaUtilsPath = getMediaUtilsPath(vimeoId)
    const workbookGalleryPath = getWorkbookGalleryPath(vimeoId)
    const configPath = getConfigPath(vimeoId)
    const fetchThumbnailsPath = getFetchThumbnailsPath(vimeoId)
    
    console.log('\nPath comparison:')
    console.log(`mediaUtils.js path: ${mediaUtilsPath}`)
    console.log(`WorkbookGallery.vue path: ${workbookGalleryPath}`)
    console.log(`config.mts path: ${configPath}`)
    console.log(`fetchThumbnails.js path: ${fetchThumbnailsPath}`)
    
    // Check if paths are consistent
    const allPaths = [mediaUtilsPath, workbookGalleryPath, configPath, fetchThumbnailsPath]
      .filter(Boolean) // Remove null values
    
    const uniquePaths = [...new Set(allPaths)]
    
    console.log(`\nUnique paths found: ${uniquePaths.length}`)
    console.log('Unique paths:', uniquePaths)
    
    if (uniquePaths.length > 1) {
      console.log('\n⚠️ Path inconsistency detected!')
      console.log('This is likely the cause of the thumbnail display issue.')
      console.log('All components should use the same path pattern.')
    } else if (uniquePaths.length === 1) {
      console.log('\n✅ Path consistency: All components use the same path pattern.')
      
      // Now check if the path matches where files actually exist
      const pathPattern = uniquePaths[0].includes('/media/thumbnails/') ? 'media' : 'root'
      
      const mediaDir = path.join(publicDir, 'media/thumbnails')
      const rootDir = path.join(publicDir, 'thumbnails')
      
      if (pathPattern === 'media' && !fs.existsSync(mediaDir)) {
        console.log('⚠️ Components reference /media/thumbnails/ but that directory does not exist!')
      } else if (pathPattern === 'root' && !fs.existsSync(rootDir)) {
        console.log('⚠️ Components reference /thumbnails/ but that directory does not exist!')
      } else {
        console.log('✅ Path references match existing directory structure.')
      }
    }
    
    // This test is diagnostic - it should pass to provide information
    expect(true).toBe(true)
  })
  
  it('suggests a fix based on current configuration', () => {
    // Check existing directory structure
    const mediaThumbnailsDir = path.join(publicDir, 'media/thumbnails')
    const rootThumbnailsDir = path.join(publicDir, 'thumbnails')
    
    const hasThumbnailsInMedia = fs.existsSync(mediaThumbnailsDir)
    const hasThumbnailsInRoot = fs.existsSync(rootThumbnailsDir)
    
    // Get components with path references
    const componentsToCheck = [
      {
        name: 'mediaUtils.js',
        path: './docs/.vitepress/theme/utils/mediaUtils.js'
      },
      {
        name: 'WorkbookGallery.vue',
        path: './docs/.vitepress/theme/components/workbook/WorkbookGallery.vue'
      },
      {
        name: 'config.mts',
        path: './docs/.vitepress/config.mts'
      },
      {
        name: 'fetchThumbnails.js',
        path: './docs/.vitepress/plugins/videoThumbnails/fetchThumbnails.js'
      }
    ]
    
    // Count path references in each component
    const pathReferences = {}
    
    componentsToCheck.forEach(component => {
      const fullPath = path.join(projectRoot, component.path)
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        
        const mediaMatches = (content.match(/\/media\/thumbnails\//g) || []).length
        const rootMatches = (content.match(/\/thumbnails\//g) || []).length
        
        pathReferences[component.name] = {
          mediaPath: mediaMatches,
          rootPath: rootMatches
        }
      }
    })
    
    console.log('Path references in components:')
    console.table(pathReferences)
    
    // Count total references
    const totalMediaPathRefs = Object.values(pathReferences)
      .reduce((total, refs) => total + refs.mediaPath, 0)
      
    const totalRootPathRefs = Object.values(pathReferences)
      .reduce((total, refs) => total + refs.rootPath, 0)
    
    console.log(`Total /media/thumbnails/ references: ${totalMediaPathRefs}`)
    console.log(`Total /thumbnails/ references: ${totalRootPathRefs}`)
    
    // Determine the dominant path pattern in code
    const dominantPattern = totalMediaPathRefs >= totalRootPathRefs ? 'media' : 'root'
    console.log(`Dominant path pattern in code: ${dominantPattern === 'media' ? '/media/thumbnails/' : '/thumbnails/'}`)
    
    // Determine the actual directory with thumbnails
    let actualThumbnailLocation
    
    if (hasThumbnailsInMedia && !hasThumbnailsInRoot) {
      actualThumbnailLocation = 'media'
    } else if (!hasThumbnailsInMedia && hasThumbnailsInRoot) {
      actualThumbnailLocation = 'root'
    } else if (hasThumbnailsInMedia && hasThumbnailsInRoot) {
      // Both exist, check which has more files
      const mediaFiles = fs.readdirSync(mediaThumbnailsDir).length
      const rootFiles = fs.readdirSync(rootThumbnailsDir).length
      
      actualThumbnailLocation = mediaFiles >= rootFiles ? 'media' : 'root'
    } else {
      actualThumbnailLocation = null
    }
    
    console.log(`Actual thumbnail location: ${actualThumbnailLocation === 'media' ? '/media/thumbnails/' : actualThumbnailLocation === 'root' ? '/thumbnails/' : 'No thumbnails found'}`)
    
    // Now generate a recommendation
    console.log('\n=== Fix Recommendation ===')
    
    if (actualThumbnailLocation === dominantPattern) {
      console.log('✅ Path consistency: The dominant path pattern in code matches the actual thumbnail location!')
      console.log('However, there still might be inconsistencies in some components.')
      
      // Identify components that need fixing
      const componentsToFix = Object.entries(pathReferences)
        .filter(([_, refs]) => {
          if (dominantPattern === 'media') {
            return refs.rootPath > 0
          } else {
            return refs.mediaPath > 0
          }
        })
        .map(([name]) => name)
      
      if (componentsToFix.length > 0) {
        console.log(`\nComponents that need path updates:`)
        componentsToFix.forEach(comp => console.log(`- ${comp}`))
        
        console.log(`\nFix: Update these components to use ${dominantPattern === 'media' ? '/media/thumbnails/' : '/thumbnails/'} paths`)
      } else {
        console.log('\nNo components need fixing - check for other issues in the build process')
      }
    } else if (actualThumbnailLocation && dominantPattern) {
      console.log('⚠️ Path inconsistency: The dominant path pattern in code does NOT match where thumbnails are actually stored!')
      
      console.log(`\nOptions to fix:`)
      console.log(`1. Move thumbnails from ${actualThumbnailLocation === 'media' ? '/media/thumbnails/' : '/thumbnails/'} to ${dominantPattern === 'media' ? '/media/thumbnails/' : '/thumbnails/'} to match code references`)
      console.log(`2. OR update all code to use ${actualThumbnailLocation === 'media' ? '/media/thumbnails/' : '/thumbnails/'} to match where thumbnails are actually stored`)
      
      console.log(`\nRecommendation: Option 2 - Update code to match actual file location`)
      
      // List components that need updating
      const componentsToUpdate = Object.entries(pathReferences)
        .filter(([_, refs]) => {
          if (actualThumbnailLocation === 'media') {
            return refs.rootPath > 0
          } else {
            return refs.mediaPath > 0
          }
        })
        .map(([name]) => name)
      
      if (componentsToUpdate.length > 0) {
        console.log(`\nComponents to update:`)
        componentsToUpdate.forEach(comp => console.log(`- ${comp}`))
      }
    } else {
      console.log('⚠️ No thumbnails found or code references are ambiguous')
      console.log('Recommendation: First create the thumbnail directory structure, then update all code to use the same path pattern')
    }
    
    // This test is diagnostic - it should pass to provide information
    expect(true).toBe(true)
  })
})

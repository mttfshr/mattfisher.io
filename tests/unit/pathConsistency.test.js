// tests/unit/pathConsistency.test.js
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * This test checks for path consistency across the codebase
 * to identify issues with thumbnail references
 */
describe('Path Consistency', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const projectRoot = path.resolve(__dirname, '..')
  
  // Files to analyze
  const filesToCheck = [
    './docs/.vitepress/theme/components/workbook/WorkbookGallery.vue',
    './docs/.vitepress/theme/utils/mediaUtils.js',
    './docs/.vitepress/config.mts',
    './docs/.vitepress/plugins/videoThumbnails/index.js',
    './docs/.vitepress/plugins/videoThumbnails/fetchThumbnails.js'
  ]
  
  // Patterns to look for
  const patterns = {
    mediaThumbnails: '/media/thumbnails/',
    rootThumbnails: '/thumbnails/'
  }
  
  it('uses consistent paths across component files', () => {
    const results = {}
    
    filesToCheck.forEach(relativeFilePath => {
      const filePath = path.join(projectRoot, relativeFilePath)
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        results[relativeFilePath] = {
          mediaThumbnailsCount: (content.match(new RegExp(patterns.mediaThumbnails.replace(/\//g, '\\/'), 'g')) || []).length,
          rootThumbnailsCount: (content.match(new RegExp(patterns.rootThumbnails.replace(/\//g, '\\/'), 'g')) || []).length
        }
      } else {
        results[relativeFilePath] = { error: 'File not found' }
      }
    })
    
    // Log results for analysis
    console.table(results)
    
    // Count files that use each pattern
    const filesUsingMediaThumbnails = Object.values(results)
      .filter(r => r.mediaThumbnailsCount > 0)
      .length
      
    const filesUsingRootThumbnails = Object.values(results)
      .filter(r => r.rootThumbnailsCount > 0)
      .length
      
    console.log(`Files using /media/thumbnails/: ${filesUsingMediaThumbnails}`)
    console.log(`Files using /thumbnails/: ${filesUsingRootThumbnails}`)
    
    // Test to determine if we have a consistency issue
    if (filesUsingMediaThumbnails > 0 && filesUsingRootThumbnails > 0) {
      // We have a path consistency issue - paths are mixed
      console.log('⚠️ Path consistency issue detected: Mixed thumbnail paths are used across the codebase')
      
      // Get files with inconsistent paths
      const inconsistentFiles = Object.entries(results)
        .filter(([_, counts]) => counts.mediaThumbnailsCount > 0 && counts.rootThumbnailsCount > 0)
        .map(([file]) => file)
        
      console.log('Files with mixed paths:', inconsistentFiles)
      
      // If most files use /media/thumbnails/, recommend that as the standard
      if (filesUsingMediaThumbnails >= filesUsingRootThumbnails) {
        console.log('Recommendation: Standardize on /media/thumbnails/ path')
        
        // List files that need updating
        const filesToUpdate = Object.entries(results)
          .filter(([_, counts]) => counts.rootThumbnailsCount > 0)
          .map(([file]) => file)
          
        console.log('Files to update:', filesToUpdate)
      } else {
        console.log('Recommendation: Standardize on /thumbnails/ path')
        
        // List files that need updating
        const filesToUpdate = Object.entries(results)
          .filter(([_, counts]) => counts.mediaThumbnailsCount > 0)
          .map(([file]) => file)
          
        console.log('Files to update:', filesToUpdate)
      }
      
      // This test should fail if we have mixed paths to highlight the issue
      expect(filesUsingMediaThumbnails === 0 || filesUsingRootThumbnails === 0)
        .toBe(true, 'The codebase uses mixed thumbnail paths which is causing issues')
    } else {
      // Paths are consistent, no issue here
      console.log('✅ Path consistency check passed')
      expect(true).toBe(true)
    }
  })
  
  it('verifies public directory structure matches code references', () => {
    // Determine which path pattern is dominant in the codebase
    const results = {}
    let mediaThumbnailsCount = 0
    let rootThumbnailsCount = 0
    
    filesToCheck.forEach(relativeFilePath => {
      const filePath = path.join(projectRoot, relativeFilePath)
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        const mediaMatches = (content.match(new RegExp(patterns.mediaThumbnails.replace(/\//g, '\\/'), 'g')) || []).length
        const rootMatches = (content.match(new RegExp(patterns.rootThumbnails.replace(/\//g, '\\/'), 'g')) || []).length
        
        mediaThumbnailsCount += mediaMatches
        rootThumbnailsCount += rootMatches
      }
    })
    
    // Check if public directory structure matches dominant pattern
    const publicDir = path.join(projectRoot, 'docs/.vitepress/public')
    const mediaThumbnailsDir = path.join(publicDir, 'media/thumbnails')
    const rootThumbnailsDir = path.join(publicDir, 'thumbnails')
    
    const hasThumbnailsInMedia = fs.existsSync(mediaThumbnailsDir)
    const hasThumbnailsInRoot = fs.existsSync(rootThumbnailsDir)
    
    console.log(`Total references to /media/thumbnails/: ${mediaThumbnailsCount}`)
    console.log(`Total references to /thumbnails/: ${rootThumbnailsCount}`)
    console.log(`Thumbnails in media directory exists: ${hasThumbnailsInMedia}`)
    console.log(`Thumbnails in root directory exists: ${hasThumbnailsInRoot}`)
    
    // If we're primarily using /media/thumbnails/, that directory should exist
    if (mediaThumbnailsCount > rootThumbnailsCount) {
      if (!hasThumbnailsInMedia) {
        console.log('⚠️ Code references /media/thumbnails/ but that directory does not exist')
        expect(hasThumbnailsInMedia).toBe(true, 'Directory structure does not match code references')
      } else {
        console.log('✅ Directory structure matches code references: using /media/thumbnails/')
        expect(true).toBe(true)
      }
    }
    
    // If we're primarily using /thumbnails/, that directory should exist
    if (rootThumbnailsCount > mediaThumbnailsCount) {
      if (!hasThumbnailsInRoot) {
        console.log('⚠️ Code references /thumbnails/ but that directory does not exist')
        expect(hasThumbnailsInRoot).toBe(true, 'Directory structure does not match code references')
      } else {
        console.log('✅ Directory structure matches code references: using /thumbnails/')
        expect(true).toBe(true)
      }
    }
  })
})

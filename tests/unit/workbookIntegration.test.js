// tests/unit/workbookIntegration.test.js
import { describe, it, expect, beforeAll } from 'vitest'
import { getWorkbookItems } from '../../docs/.vitepress/utils/services/content/workbook.js'
import fs from 'fs'
import path from 'path'

/**
 * Workbook Integration Tests
 * 
 * This test suite validates the complete workbook system including:
 * - Item discovery and processing
 * - Thumbnail integration with catalog.json
 * - URL/path generation for routing
 * - Slug matching strategies
 * 
 * Based on the debug-workbook.js diagnostic script.
 */
describe('Workbook Integration', () => {
  let workbookItems = []
  let catalog = {}
  
  beforeAll(async () => {
    // Load workbook items
    workbookItems = getWorkbookItems()
    
    // Load catalog.json
    try {
      const catalogPath = path.resolve(process.cwd(), 'catalog.json')
      if (fs.existsSync(catalogPath)) {
        catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
      }
    } catch (error) {
      console.warn('Could not load catalog.json:', error.message)
    }
  })

  describe('Workbook Item Discovery', () => {
    it('should discover and process workbook files correctly', () => {
      expect(workbookItems).toBeDefined()
      expect(Array.isArray(workbookItems)).toBe(true)
      expect(workbookItems.length).toBeGreaterThan(0)
      
      console.log(`📚 Discovered ${workbookItems.length} workbook items`)
      
      // Group by type
      const byType = workbookItems.reduce((acc, item) => {
        const type = item.subDir || 'root'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      
      console.log('📊 Items by type:')
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} items`)
      })
    })

    it('should have proper slug and path generation', () => {
      const itemsWithPaths = workbookItems.filter(item => item.path && item.slug)
      
      expect(itemsWithPaths.length).toBe(workbookItems.length)
      
      // Check that all items have required properties
      workbookItems.forEach(item => {
        expect(item).toHaveProperty('title')
        expect(item).toHaveProperty('slug')
        expect(item).toHaveProperty('path')
        expect(item).toHaveProperty('relativePath')
        
        // Validate path structure
        if (item.subDir) {
          expect(item.path).toBe(`/workbook/${item.subDir}/${item.slug}`)
        } else {
          expect(item.path).toBe(`/workbook/${item.slug}`)
        }
      })
    })

    it('should handle subdirectory structure correctly', () => {
      const subdirItems = workbookItems.filter(item => item.subDir)
      const rootItems = workbookItems.filter(item => !item.subDir)
      
      console.log(`📁 Subdirectory items: ${subdirItems.length}`)
      console.log(`📄 Root items: ${rootItems.length}`)
      
      // Verify subdirectory items have correct paths
      subdirItems.forEach(item => {
        expect(item.path).toMatch(/^\/workbook\/[^\/]+\/[^\/]+$/)
        expect(item.relativePath).toMatch(/^[^\/]+\/[^\/]+\.md$/)
      })
    })
  })

  describe('Thumbnail Integration', () => {
    it('should have catalog.json loaded with video thumbnails', () => {
      expect(catalog).toBeDefined()
      expect(catalog.videoThumbnails).toBeDefined()
      
      const videoThumbnailCount = Object.keys(catalog.videoThumbnails).length
      console.log(`📷 Catalog contains ${videoThumbnailCount} video thumbnails`)
      
      expect(videoThumbnailCount).toBeGreaterThan(0)
    })

    it('should calculate thumbnail success rate', () => {
      const videoItems = workbookItems.filter(item => 
        item.media?.provider === 'vimeo' || item.media?.provider === 'youtube'
      )
      
      const itemsWithThumbnails = workbookItems.filter(item => 
        item.thumbnailUrl && typeof item.thumbnailUrl === 'string'
      )
      
      const successRate = workbookItems.length > 0 
        ? Math.round((itemsWithThumbnails.length / workbookItems.length) * 100)
        : 0
      
      console.log(`📊 Thumbnail statistics:`)
      console.log(`   Total items: ${workbookItems.length}`)
      console.log(`   Video items: ${videoItems.length}`)
      console.log(`   With thumbnails: ${itemsWithThumbnails.length}`)
      console.log(`   Success rate: ${successRate}%`)
      
      // Expect reasonable success rate (>80% for video items)
      const videoSuccessRate = videoItems.length > 0 
        ? Math.round((itemsWithThumbnails.length / videoItems.length) * 100)
        : 100
      
      expect(videoSuccessRate).toBeGreaterThanOrEqual(80)
    })

    it('should validate thumbnail sources', () => {
      const thumbnailSources = {
        cloudflare: 0,
        local: 0,
        other: 0,
        missing: 0
      }
      
      workbookItems.forEach(item => {
        if (item.thumbnailUrl && typeof item.thumbnailUrl === 'string') {
          if (item.thumbnailUrl.includes('imagedelivery.net')) {
            thumbnailSources.cloudflare++
          } else if (item.thumbnailUrl.startsWith('/media/thumbnails/')) {
            thumbnailSources.local++
          } else {
            thumbnailSources.other++
          }
        } else {
          thumbnailSources.missing++
        }
      })
      
      console.log(`📷 Thumbnail sources:`)
      console.log(`   Cloudflare Images: ${thumbnailSources.cloudflare}`)
      console.log(`   Local files: ${thumbnailSources.local}`)
      console.log(`   Other sources: ${thumbnailSources.other}`)
      console.log(`   Missing: ${thumbnailSources.missing}`)
      
      // Expect majority to use Cloudflare Images (preferred)
      const totalWithThumbnails = thumbnailSources.cloudflare + thumbnailSources.local + thumbnailSources.other
      if (totalWithThumbnails > 0) {
        const cloudflarePercentage = Math.round((thumbnailSources.cloudflare / totalWithThumbnails) * 100)
        console.log(`   Cloudflare usage: ${cloudflarePercentage}%`)
        
        // Prefer Cloudflare Images for better performance
        expect(cloudflarePercentage).toBeGreaterThanOrEqual(50)
      }
    })

    it('should validate catalog integration for video items', () => {
      const videoItems = workbookItems.filter(item => item.media?.provider === 'vimeo')
      const catalogVimeoIds = Object.keys(catalog.videoThumbnails || {})
        .filter(key => key.startsWith('vimeo-'))
        .map(key => key.replace('vimeo-', ''))
      
      let catalogMatches = 0
      const missingFromCatalog = []
      
      videoItems.forEach(item => {
        const vimeoId = item._debug?.videoIds?.vimeoId
        if (vimeoId && catalogVimeoIds.includes(vimeoId)) {
          catalogMatches++
        } else if (vimeoId) {
          missingFromCatalog.push({
            title: item.title,
            vimeoId: vimeoId
          })
        }
      })
      
      console.log(`🔗 Catalog integration:`)
      console.log(`   Video items: ${videoItems.length}`)
      console.log(`   Catalog entries: ${catalogVimeoIds.length}`)
      console.log(`   Matches: ${catalogMatches}`)
      console.log(`   Missing from catalog: ${missingFromCatalog.length}`)
      
      if (missingFromCatalog.length > 0 && missingFromCatalog.length <= 5) {
        console.log(`   Missing items:`)
        missingFromCatalog.forEach(item => {
          console.log(`     • ${item.title} (${item.vimeoId})`)
        })
      }
      
      // Expect good catalog coverage (>80% of video items)
      const catalogCoverage = videoItems.length > 0 
        ? Math.round((catalogMatches / videoItems.length) * 100)
        : 100
      
      console.log(`   Catalog coverage: ${catalogCoverage}%`)
      expect(catalogCoverage).toBeGreaterThanOrEqual(80)
    })
  })

  describe('URL Generation and Routing', () => {
    it('should generate correct URLs for all path scenarios', () => {
      // Only test scenarios that actually exist in the workbook
      const testCases = [
        {
          name: 'Subdirectory video file',
          relativePath: 'workbook/videos/obsidian-heart.md',
          expectedSlug: 'videos/obsidian-heart'
        }
        // Note: No root workbook files exist in current system
      ]
      
      testCases.forEach(testCase => {
        console.log(`\n🎯 Testing: ${testCase.name}`)
        console.log(`   VitePress relativePath: "${testCase.relativePath}"`)
        
        // Simulate WorkbookViewer slug extraction
        const extractedSlug = testCase.relativePath.replace(/^workbook\/|\.md$/g, '')
        console.log(`   Extracted slug: "${extractedSlug}"`)
        
        // Test matching strategies
        const strategies = [
          {
            name: 'Full slug match',
            match: workbookItems.find(item => item.slug === extractedSlug)
          },
          {
            name: 'Filename match',
            match: workbookItems.find(item => {
              const filename = testCase.relativePath.split('/').pop().replace(/\.md$/, '')
              return item.slug === filename
            })
          },
          {
            name: 'Path match',
            match: workbookItems.find(item => {
              const expectedPath = `/${testCase.relativePath.replace(/\.md$/, '')}`
              return item.path === expectedPath
            })
          }
        ]
        
        let foundMatch = false
        strategies.forEach(strategy => {
          const hasMatch = !!strategy.match
          console.log(`     ${strategy.name}: ${hasMatch ? '✅' : '❌'}${hasMatch ? ' ' + strategy.match.title : ''}`)
          if (hasMatch) foundMatch = true
        })
        
        // At least one strategy should work
        expect(foundMatch).toBe(true)
      })
    })

    it('should validate that all items have accessible URLs', () => {
      // Check that all workbook items have valid paths
      workbookItems.forEach(item => {
        expect(item.path).toBeDefined()
        expect(item.path).toMatch(/^\/workbook\//)
        
        // Path should be URL-safe
        expect(item.path).toMatch(/^[a-zA-Z0-9\-_\/]+$/)
      })
      
      // Check for duplicate paths
      const pathCounts = {}
      workbookItems.forEach(item => {
        pathCounts[item.path] = (pathCounts[item.path] || 0) + 1
      })
      
      const duplicates = Object.entries(pathCounts)
        .filter(([path, count]) => count > 1)
      
      if (duplicates.length > 0) {
        console.log('⚠️ Duplicate paths found:')
        duplicates.forEach(([path, count]) => {
          console.log(`   ${path}: ${count} items`)
        })
      }
      
      expect(duplicates.length).toBe(0)
    })
  })

  describe('Data Quality', () => {
    it('should validate workbook item data integrity', () => {
      workbookItems.forEach(item => {
        // Required fields
        expect(item.title).toBeDefined()
        expect(item.slug).toBeDefined()
        expect(item.path).toBeDefined()
        
        // Type validation
        expect(typeof item.title).toBe('string')
        expect(typeof item.slug).toBe('string')
        expect(typeof item.path).toBe('string')
        
        // Media validation for video items
        if (item.media?.type === 'video') {
          expect(item.media.provider).toBeDefined()
          expect(item.media.url).toBeDefined()
          expect(['vimeo', 'youtube']).toContain(item.media.provider)
        }
        
        // Debug info validation
        if (item._debug) {
          expect(item._debug.filename).toBeDefined()
          expect(item._debug.videoIds).toBeDefined()
          expect(item._debug.thumbnailResolution).toBeDefined()
        }
      })
    })

    it('should report system health metrics', () => {
      console.log('\n📊 System Health Report:')
      console.log('='*50)
      
      // Overall stats
      const videoItems = workbookItems.filter(item => item.media?.provider === 'vimeo')
      const itemsWithThumbnails = workbookItems.filter(item => item.thumbnailUrl)
      
      console.log(`📚 Content:`)
      console.log(`   Total workbook items: ${workbookItems.length}`)
      console.log(`   Video items: ${videoItems.length}`)
      console.log(`   Items with thumbnails: ${itemsWithThumbnails.length}`)
      
      // Thumbnail health
      const thumbnailSuccessRate = workbookItems.length > 0 
        ? Math.round((itemsWithThumbnails.length / workbookItems.length) * 100)
        : 0
      
      console.log(`\n📷 Thumbnails:`)
      console.log(`   Success rate: ${thumbnailSuccessRate}%`)
      console.log(`   Catalog entries: ${Object.keys(catalog.videoThumbnails || {}).length}`)
      
      // URL health
      const itemsWithPaths = workbookItems.filter(item => item.path)
      const urlHealth = workbookItems.length > 0 
        ? Math.round((itemsWithPaths.length / workbookItems.length) * 100)
        : 0
      
      console.log(`\n🔗 URLs:`)
      console.log(`   Items with valid paths: ${itemsWithPaths.length}/${workbookItems.length} (${urlHealth}%)`)
      
      // Overall health score
      const healthScore = Math.round((thumbnailSuccessRate + urlHealth) / 2)
      console.log(`\n🏥 Overall Health Score: ${healthScore}%`)
      
      // Health thresholds
      if (healthScore >= 90) {
        console.log('   Status: 🟢 Excellent')
      } else if (healthScore >= 80) {
        console.log('   Status: 🟡 Good')
      } else if (healthScore >= 70) {
        console.log('   Status: 🟠 Needs Attention')
      } else {
        console.log('   Status: 🔴 Critical')
      }
      
      console.log('='*50)
      
      // Health should be good
      expect(healthScore).toBeGreaterThanOrEqual(80)
    })
  })
})

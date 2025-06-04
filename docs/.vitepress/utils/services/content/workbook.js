// services/content/workbook.js
// Enhanced workbook content processing utilities

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { parseTags } from './metadata.js'
import { extractVimeoId, extractYouTubeId } from '../../shared/media.js'

/**
 * Enhanced function to gather workbook items data at build time
 * Includes improved slug handling and thumbnail resolution
 */
export function getWorkbookItems() {
  const workbookDir = path.resolve(process.cwd(), 'docs/workbook')
  
  // Recursively find all markdown files in workbook directory and subdirectories
  function findMarkdownFiles(dir, relativePath = '') {
    const files = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subDirPath = path.join(dir, entry.name)
        const subRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name
        files.push(...findMarkdownFiles(subDirPath, subRelativePath))
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
        // Add markdown files with their relative path
        files.push({
          file: entry.name,
          fullPath: path.join(dir, entry.name),
          relativePath: relativePath ? `${relativePath}/${entry.name}` : entry.name,
          subDir: relativePath
        })
      }
    }
    
    return files
  }
  
  const allFiles = findMarkdownFiles(workbookDir)
  console.log(`📚 Found ${allFiles.length} workbook files`)
  
  // Load catalog.json for thumbnail resolution
  let catalog = {}
  try {
    const catalogPath = path.resolve(process.cwd(), 'catalog.json')
    if (fs.existsSync(catalogPath)) {
      catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
    }
  } catch (error) {
    console.warn('Could not load catalog.json:', error.message)
  }
  
  const workbookItems = allFiles.map(fileInfo => {
    const content = fs.readFileSync(fileInfo.fullPath, 'utf-8')
    const { data: frontmatter } = matter(content)
    const filename = fileInfo.file.replace(/\.md$/, '')
    
    // Enhanced slug generation with multiple strategies
    const slugs = {
      filename: filename,                                    // Just filename: "obsidian-heart"
      fullPath: fileInfo.relativePath.replace(/\.md$/, ''), // With subdirs: "videos/obsidian-heart"
      kebabCase: filename.toLowerCase().replace(/[^a-z0-9]+/g, '-') // Normalized
    }
    
    // Use filename as primary slug for backward compatibility
    const slug = slugs.filename
    
    // Get last modified time from file stats  
    const stats = fs.statSync(fileInfo.fullPath)
    const lastModified = stats.mtime.getTime()
    
    // Extract video IDs for thumbnail processing
    const vimeoId = frontmatter.media?.provider === 'vimeo' && frontmatter.media?.url ? 
      extractVimeoId(frontmatter.media.url) : null
    
    const youtubeId = frontmatter.media?.provider === 'youtube' && frontmatter.media?.url ? 
      extractYouTubeId(frontmatter.media.url) : null

    // Enhanced thumbnail resolution with priority system
    function resolveThumbnailUrl() {
      // Priority 1: Cloudflare Images URL from frontmatter (highest priority)
      if (frontmatter.media?.thumbnail) {
        return frontmatter.media.thumbnail
      }
      
      // Priority 2: Cloudflare Images from catalog (for videos)
      if (vimeoId && catalog.videoThumbnails?.[`vimeo-${vimeoId}`]) {
        return catalog.videoThumbnails[`vimeo-${vimeoId}`].cloudflareUrl
      }
      
      if (youtubeId && catalog.videoThumbnails?.[`youtube-${youtubeId}`]) {
        return catalog.videoThumbnails[`youtube-${youtubeId}`].cloudflareUrl
      }
      
      // Priority 3: Local thumbnail files (fallback)
      if (vimeoId) {
        const localPath = `/media/thumbnails/vimeo-${vimeoId}.jpg`
        const fullLocalPath = path.resolve(process.cwd(), `docs/public${localPath}`)
        if (fs.existsSync(fullLocalPath)) {
          return localPath
        }
      }
      
      if (youtubeId) {
        const localPath = `/media/thumbnails/youtube-${youtubeId}.jpg`
        const fullLocalPath = path.resolve(process.cwd(), `docs/public${localPath}`)
        if (fs.existsSync(fullLocalPath)) {
          return localPath
        }
      }
      
      // Priority 4: Default/placeholder
      return null
    }
    
    const thumbnailUrl = resolveThumbnailUrl()
    
    // Parse structured tags
    const parsedTags = parseTags(frontmatter.tags || [])
    
    // Create multiple path variations for flexible matching
    const paths = {
      relative: fileInfo.subDir ? `workbook/${fileInfo.subDir}/${filename}` : `workbook/${filename}`,
      absolute: fileInfo.subDir ? `/workbook/${fileInfo.subDir}/${filename}` : `/workbook/${filename}`,
      vitepress: fileInfo.subDir ? `workbook/${fileInfo.subDir}/${filename}.html` : `workbook/${filename}.html`
    }
    
    const workbookItem = {
      // Identity
      title: frontmatter.title || filename,
      slug: slug,
      slugs: slugs, // Include all slug variations for debugging/matching
      
      // Content
      description: frontmatter.description || '',
      date: frontmatter.date || null,
      year: frontmatter.year || null,
      tags: frontmatter.tags || [],
      parsedTags,
      
      // Media
      media: frontmatter.media || null,
      thumbnailUrl,
      
      // Paths (multiple variations for flexible matching)
      path: paths.absolute,           // Primary path for links
      paths: paths,                   // All path variations
      relativePath: fileInfo.relativePath, // Original file path
      
      // Metadata
      lastUpdated: lastModified,
      type: frontmatter.type || 'unknown',
      subDir: fileInfo.subDir || null,
      
      // Debug info (can be removed in production)
      _debug: {
        filename: fileInfo.file,
        fullPath: fileInfo.fullPath,
        videoIds: { vimeoId, youtubeId },
        thumbnailResolution: {
          frontmatter: !!frontmatter.media?.thumbnail,
          catalog: !!(vimeoId && catalog.videoThumbnails?.[`vimeo-${vimeoId}`]?.cloudflareUrl) || 
                   !!(youtubeId && catalog.videoThumbnails?.[`youtube-${youtubeId}`]?.cloudflareUrl),
          local: !!thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.startsWith('/media/thumbnails/'),
          final: thumbnailUrl
        }
      }
    }
    
    return workbookItem
  })
  
  // Sort items by date (newest first), then by title
  const sortedItems = workbookItems.sort((a, b) => {
    // First sort by date
    const dateA = a.date ? new Date(a.date) : new Date(0)
    const dateB = b.date ? new Date(b.date) : new Date(0)
    if (dateB.getTime() !== dateA.getTime()) {
      return dateB - dateA
    }
    
    // Then by title if dates are equal
    return (a.title || '').localeCompare(b.title || '')
  })
  
  // Log processing summary
  console.log(`📚 Processed ${sortedItems.length} workbook items:`)
  
  // Group by subdirectory for summary
  const bySubdir = sortedItems.reduce((acc, item) => {
    const key = item.subDir || 'root'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  
  Object.entries(bySubdir).forEach(([subdir, count]) => {
    console.log(`   ${subdir}: ${count} items`)
  })
  
  // Thumbnail summary
  const thumbnailStats = sortedItems.reduce((acc, item) => {
    if (item.thumbnailUrl && typeof item.thumbnailUrl === 'string') {
      if (item.thumbnailUrl.includes('imagedelivery.net')) {
        acc.cloudflare++
      } else if (item.thumbnailUrl.startsWith('/media/thumbnails/')) {
        acc.local++
      } else {
        acc.other++
      }
    } else {
      acc.missing++
    }
    return acc
  }, { cloudflare: 0, local: 0, other: 0, missing: 0 })
  
  const totalItems = sortedItems.length
  const withThumbnails = totalItems - thumbnailStats.missing
  const successRate = totalItems > 0 ? Math.round((withThumbnails / totalItems) * 100) : 0
  
  console.log(`📷 Thumbnail Summary: ${successRate}% success rate (${withThumbnails}/${totalItems})`)
  console.log(`   Cloudflare: ${thumbnailStats.cloudflare}, Local: ${thumbnailStats.local}, Other: ${thumbnailStats.other}, Missing: ${thumbnailStats.missing}`)
  
  return sortedItems
}
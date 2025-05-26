// services/content/workbook.js
// Workbook content processing utilities

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { parseTags } from './metadata.js'
import { extractVimeoId, extractYouTubeId } from '../../shared/media.js'

/**
 * Function to gather workbook items data at build time
 */
export function getWorkbookItems() {
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
    
    // Parse structured tags
    const parsedTags = parseTags(frontmatter.tags || []);
    
    return {
      title: frontmatter.title || slug,
      slug,
      description: frontmatter.description || '',
      date: frontmatter.date || null,
      year: frontmatter.year || null, // Include year from frontmatter
      tags: frontmatter.tags || [],
      parsedTags, // Add parsed tags
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

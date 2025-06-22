#!/usr/bin/env node

/**
 * POSSE-style annotation utility
 * Adds indieweb-style annotations to the log for content updates
 * 
 * Usage:
 *   node add-annotation.js workbook "Added 'Doughness' video" /workbook/doughness
 *   node add-annotation.js notes "Published 'Semantic Design Systems'" /notes/semantic-design
 *   node add-annotation.js pins "Bookmarked interesting article"
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the content updates file
const CONTENT_UPDATES_PATH = path.join(__dirname, '../docs/log/content-updates.md')

function addAnnotation(category, content, link = null) {
  const timestamp = new Date().toISOString()
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  // Generate a unique ID
  const id = `annotation-${Date.now()}`
  
  // Create syndication-friendly content
  const syndicationContent = createSyndicationContent(category, content, link)
  
  // Create the annotation entry
  const annotation = `---

# ${date}: ${content}

**Type:** annotation
**Category:** ${category}
**Timestamp:** ${timestamp}
**ID:** ${id}
${link ? `**Link:** ${link}` : ''}
**Syndication:** ${syndicationContent}

${content}`

  // Read current content
  let currentContent = ''
  if (fs.existsSync(CONTENT_UPDATES_PATH)) {
    currentContent = fs.readFileSync(CONTENT_UPDATES_PATH, 'utf8')
  }
  
  // Find the position after the header and first ---
  const lines = currentContent.split('\n')
  const firstSeparatorIndex = lines.findIndex((line, index) => 
    index > 0 && line.trim() === '---'
  )
  
  if (firstSeparatorIndex > -1) {
    // Insert after the first separator
    lines.splice(firstSeparatorIndex + 1, 0, '', annotation)
  } else {
    // If no separator exists, add at the end
    lines.push('', annotation)
  }
  
  // Write back to file
  const newContent = lines.join('\n')
  fs.writeFileSync(CONTENT_UPDATES_PATH, newContent, 'utf8')
  
  console.log(`✅ Added ${category} annotation: "${content}"`)
  console.log(`📱 Syndication text: "${syndicationContent}"`)
  if (link) {
    console.log(`🔗 Link: ${link}`)
  }
}

function createSyndicationContent(category, content, link) {
  // Transform internal site language to social media friendly language
  switch (category) {
    case 'workbook':
      // "Added 'Doughness' video" → "New video: Doughness"
      if (content.toLowerCase().includes('added')) {
        return content.replace(/^added\s*/i, 'New video: ').replace(/\s*video$/i, '')
      }
      return `New video: ${content}`
    
    case 'notes':
      // "Published 'Design Systems' note" → "New post: Design Systems"
      if (content.toLowerCase().includes('published')) {
        return content.replace(/^published\s*/i, 'New post: ').replace(/\s*note$/i, '')
      }
      return `New post: ${content}`
    
    case 'pins':
      // "Bookmarked interesting article" → "Interesting article worth sharing"
      if (content.toLowerCase().includes('bookmarked')) {
        return content.replace(/^bookmarked\s*/i, '').replace(/^interesting\s*/i, 'Interesting ') + ' worth sharing'
      }
      return `Found something interesting: ${content}`
    
    case 'general':
      // Keep general updates as-is but make them more personal
      return content
    
    default:
      return content
  }
}

// Parse command line arguments
const [,, category, content, link] = process.argv

if (!category || !content) {
  console.log(`
Usage: node add-annotation.js <category> <content> [link]

Categories: workbook, notes, pins, general
Examples:
  node add-annotation.js workbook "Added 'Doughness' video" /workbook/doughness
  node add-annotation.js notes "Published 'Semantic Design Systems'" /notes/semantic-design
  node add-annotation.js pins "Bookmarked interesting article"
  `)
  process.exit(1)
}

// Validate category
const validCategories = ['workbook', 'notes', 'pins', 'general']
if (!validCategories.includes(category)) {
  console.error(`❌ Invalid category. Must be one of: ${validCategories.join(', ')}`)
  process.exit(1)
}

// Add the annotation
addAnnotation(category, content, link)

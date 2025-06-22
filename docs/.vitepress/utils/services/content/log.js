// services/content/log.js
// Log content processing utilities

import fs from 'fs'
import path from 'path'
import { extractHashtags, extractImages } from './metadata.js'

/**
 * Process log entries from the consolidated files
 */
export async function getLogEntries() {
  const entries = [];
  
  // Process regular updates
  const entriesPath = path.resolve(process.cwd(), 'docs/log/entries.md')
  
  if (fs.existsSync(entriesPath)) {
    const content = fs.readFileSync(entriesPath, 'utf8')
    // Split the file by horizontal rule
    const entryTexts = content.split(/\n---\n/)
    
    for (const entryText of entryTexts) {
      try {
        // Parse the entry
        const lines = entryText.trim().split('\n')
        
        // Skip if empty
        if (!lines.length || !lines[0]) {
          continue;
        }
        
        // First line is expected to be a header with date and title
        const headerLine = lines[0]
        
        if (!headerLine || !headerLine.startsWith('# ')) {
          continue
        }
        
        // Extract date and title from header
        // Format: # YYYY-MM-DD: Title or # YYYY-MM-DD: [Title](URL)
        const headerMatch = headerLine.match(/# (\d{4}-\d{2}-\d{2}): (?:\[(.*?)\]\((.*?)\)|(.*))?/)
        
        if (!headerMatch) {
          continue
        }
        
        const date = headerMatch[1]
        const linkTitle = headerMatch[2]
        const url = headerMatch[3]
        const plainTitle = headerMatch[4] || ''
        
        // Extract the content (everything after the header)
        const bodyLines = lines.slice(1)
        let bodyContent = bodyLines.join('\n').trim()
        
        // Check for annotation metadata
        let isAnnotation = false
        let category = null
        let link = null
        let customTimestamp = null
        let customId = null
        
        // Look for metadata lines (Type:, Category:, etc.)
        const metadataLines = []
        const contentLines = []
        let inMetadata = true
        
        for (const line of bodyLines) {
          if (inMetadata && line.match(/^\*\*(Type|Category|Timestamp|ID|Link):\*\*/)) {
            metadataLines.push(line)
            
            // Parse metadata
            if (line.startsWith('**Type:**')) {
              const type = line.replace('**Type:**', '').trim()
              isAnnotation = type === 'annotation'
            }
            if (line.startsWith('**Category:**')) {
              category = line.replace('**Category:**', '').trim()
            }
            if (line.startsWith('**Link:**')) {
              link = line.replace('**Link:**', '').trim()
            }
            if (line.startsWith('**Timestamp:**')) {
              customTimestamp = line.replace('**Timestamp:**', '').trim()
            }
            if (line.startsWith('**ID:**')) {
              customId = line.replace('**ID:**', '').trim()
            }
          } else if (line.trim() === '') {
            // Empty line continues metadata section
            if (inMetadata) metadataLines.push(line)
            else contentLines.push(line)
          } else {
            // First non-metadata line starts content
            inMetadata = false
            contentLines.push(line)
          }
        }
        
        // Use content without metadata for display
        bodyContent = contentLines.join('\n').trim()
        
        // Use custom timestamp if available, otherwise default
        const timestamp = customTimestamp || `${date}T12:00:00Z`
        
        // Extract tags and images
        const tags = extractHashtags(bodyContent)
        const images = extractImages(bodyContent)
        
        // Determine if this is a pin or update
        const isPin = !!url
        
        if (isPin) {
          // Skip pins as they are handled separately now
          continue;
        } else {
          // Regular update (no more annotations in entries.md)
          entries.push({
            id: `update-${date}-${Math.random().toString(36).substring(2, 10)}`,
            type: 'update',
            title: plainTitle,
            content: bodyContent,
            timestamp,
            tags,
            images,
            isClaudeSession: false
          })
        }
      } catch (error) {
        console.error('Error processing log entry:', error)
      }
    }
  } else {
    console.warn('Log entries file not found:', entriesPath)
  }

  // Process content update annotations from separate file
  const contentUpdatesPath = path.resolve(process.cwd(), 'docs/log/content-updates.md')
  
  if (fs.existsSync(contentUpdatesPath)) {
    const content = fs.readFileSync(contentUpdatesPath, 'utf8')
    // Split the file by horizontal rule
    const annotationTexts = content.split(/\n---\n/)
    
    for (const annotationText of annotationTexts) {
      try {
        // Parse the annotation
        const lines = annotationText.trim().split('\n')
        
        // Skip if empty or header
        if (!lines.length || !lines[0] || lines[0].startsWith('#') && !lines[0].match(/# \d{4}-\d{2}-\d{2}:/)) {
          continue;
        }
        
        // First line is expected to be a header with date and title
        const headerLine = lines[0]
        
        if (!headerLine || !headerLine.startsWith('# ')) {
          continue
        }
        
        // Extract date and title from header
        const headerMatch = headerLine.match(/# (\d{4}-\d{2}-\d{2}): (.*)$/)
        
        if (!headerMatch) {
          continue
        }
        
        const date = headerMatch[1]
        const title = headerMatch[2]
        
        // Extract the content and metadata
        const bodyLines = lines.slice(1)
        let category = null
        let link = null
        let customTimestamp = null
        let customId = null
        let syndication = null
        
        const contentLines = []
        let inMetadata = true
        
        for (const line of bodyLines) {
          if (inMetadata && line.match(/^\*\*(Type|Category|Timestamp|ID|Link|Syndication):\*\*/)) {
            // Parse metadata
            if (line.startsWith('**Category:**')) {
              category = line.replace('**Category:**', '').trim()
            }
            if (line.startsWith('**Link:**')) {
              link = line.replace('**Link:**', '').trim()
            }
            if (line.startsWith('**Timestamp:**')) {
              customTimestamp = line.replace('**Timestamp:**', '').trim()
            }
            if (line.startsWith('**ID:**')) {
              customId = line.replace('**ID:**', '').trim()
            }
            if (line.startsWith('**Syndication:**')) {
              syndication = line.replace('**Syndication:**', '').trim()
            }
          } else if (line.trim() === '') {
            // Empty line continues metadata section
            if (!inMetadata) contentLines.push(line)
          } else {
            // First non-metadata line starts content
            inMetadata = false
            contentLines.push(line)
          }
        }
        
        // Use content without metadata for display
        const bodyContent = contentLines.join('\n').trim()
        
        // Use custom timestamp if available, otherwise default
        const timestamp = customTimestamp || `${date}T12:00:00Z`
        
        // Extract tags and images
        const tags = extractHashtags(bodyContent)
        const images = extractImages(bodyContent)
        
        // Content update annotation
        entries.push({
          id: customId || `annotation-${date}-${Math.random().toString(36).substring(2, 10)}`,
          type: 'annotation',
          title: title,
          content: bodyContent,
          timestamp,
          tags,
          images,
          isClaudeSession: false,
          category: category,
          link: link,
          syndication: syndication
        })
      } catch (error) {
        console.error('Error processing content update annotation:', error)
      }
    }
  } else {
    console.log('Content updates file not found:', contentUpdatesPath)
  }
  
  // Process session notes written by Claude
  const sessionsPath = path.resolve(process.cwd(), 'docs/log/sessions.md')
  
  if (fs.existsSync(sessionsPath)) {
    const content = fs.readFileSync(sessionsPath, 'utf8')
    // Split the file by horizontal rule
    const sessionTexts = content.split(/\n---\n/)
    
    for (const sessionText of sessionTexts) {
      try {
        // Parse the session
        const lines = sessionText.trim().split('\n')
        
        // Skip if empty
        if (!lines.length || !lines[0]) {
          continue;
        }
        
        // First line is expected to be a header with date and title
        const headerLine = lines[0]
        
        if (!headerLine || !headerLine.startsWith('# ')) {
          continue
        }
        
        // Extract date and title from header
        // Format: # YYYY-MM-DD: Development Session XX
        const headerMatch = headerLine.match(/# (\d{4}-\d{2}-\d{2}): (.*)$/)
        
        if (!headerMatch) {
          continue
        }
        
        const date = headerMatch[1]
        const title = headerMatch[2]
        const timestamp = `${date}T12:00:00Z`
        
        // Extract the content (everything after the header)
        const bodyContent = lines.slice(1).join('\n').trim()
        
        // Extract tags and images
        const tags = extractHashtags(bodyContent)
        const images = extractImages(bodyContent)
        
        // Development session
        entries.push({
          id: `session-${date}-${Math.random().toString(36).substring(2, 10)}`,
          type: 'update', // Keep type as 'update' for compatibility
          title: title,
          content: bodyContent,
          timestamp,
          tags,
          images,
          isClaudeSession: true
        })
      } catch (error) {
        console.error('Error processing session entry:', error)
      }
    }
  } else {
    // Sessions file not found - no warning needed since sessions are now in individual files
  }
  
  // Sort by date (newest first)
  entries.sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
    return dateB - dateA
  })
  
  return entries
}

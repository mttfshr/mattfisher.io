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
          console.warn('Skipping entry: Invalid header format')
          continue
        }
        
        // Extract date and title from header
        // Format: # YYYY-MM-DD: Title or # YYYY-MM-DD: [Title](URL)
        const headerMatch = headerLine.match(/# (\d{4}-\d{2}-\d{2}): (?:\[(.*?)\]\((.*?)\)|(.*))?/)
        
        if (!headerMatch) {
          console.warn('Skipping entry: Could not parse header')
          continue
        }
        
        const date = headerMatch[1]
        const linkTitle = headerMatch[2]
        const url = headerMatch[3]
        const plainTitle = headerMatch[4] || ''
        
        // Determine if this is a pin or update
        const isPin = !!url
        const timestamp = `${date}T12:00:00Z`
        
        // Extract the content (everything after the header)
        const bodyContent = lines.slice(1).join('\n').trim()
        
        // Extract tags and images
        const tags = extractHashtags(bodyContent)
        const images = extractImages(bodyContent)
        
        if (isPin) {
          // Skip pins as they are handled separately now
          continue;
        } else {
          // Regular update
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
          console.warn('Skipping session: Invalid header format')
          continue
        }
        
        // Extract date and title from header
        // Format: # YYYY-MM-DD: Development Session XX
        const headerMatch = headerLine.match(/# (\d{4}-\d{2}-\d{2}): (.*)$/)
        
        if (!headerMatch) {
          console.warn('Skipping session: Could not parse header')
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
    console.warn('Sessions file not found:', sessionsPath)
  }
  
  // Sort by date (newest first)
  entries.sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
    return dateB - dateA
  })
  
  return entries
}

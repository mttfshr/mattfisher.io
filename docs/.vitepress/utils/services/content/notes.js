// services/content/notes.js
// Notes content processing utilities

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * Function to gather notes data at build time
 */
export function getNotes() {
  const notesDir = path.resolve(process.cwd(), 'docs/notes')
  const files = fs.readdirSync(notesDir).filter(file => 
    file.endsWith('.md') && file !== 'index.md'
  )
  
  return files.map(file => {
    const filePath = path.join(notesDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter } = matter(content)
    const slug = file.replace(/\.md$/, '')
    
    // Get last modified time from file stats
    const stats = fs.statSync(filePath)
    const lastModified = stats.mtime.getTime()
    
    return {
      title: frontmatter.title || slug,
      slug,
      description: frontmatter.description || '',
      tags: frontmatter.tags || [],
      image: frontmatter.image || '',
      path: `/notes/${slug}`,
      lastUpdated: lastModified // Use file's modified time as lastUpdated
    }
  })
}

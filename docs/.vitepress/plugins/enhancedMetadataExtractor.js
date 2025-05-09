import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * Plugin that extracts rich metadata from markdown files with enhanced frontmatter
 * and generates data files for workbook and notes sections.
 */
export function enhancedMetadataExtractorPlugin() {
  return {
    name: 'vitepress-enhanced-metadata-extractor',
    
    // Hook into the page build process
    async buildEnd() {
      console.log('Processing enhanced frontmatter from markdown files...')
      
      const docsDir = path.resolve(__dirname, '../../')
      const sections = ['workbook', 'notes']
      
      for (const section of sections) {
        const sectionDir = path.join(docsDir, section)
        if (!fs.existsSync(sectionDir)) continue
        
        const files = fs.readdirSync(sectionDir)
          .filter(file => file.endsWith('.md') && file !== 'index.md')
        
        const itemsData = []
        
        for (const file of files) {
          const filePath = path.join(sectionDir, file)
          const fileContent = fs.readFileSync(filePath, 'utf8')
          
          // Parse frontmatter
          const { data: frontmatter, content } = matter(fileContent)
          
          // Create slug from filename (no need to change existing files)
          const slug = file.replace(/\.md$/, '')
          
          // Extract standardized item data
          const item = {
            title: frontmatter.title || slug.replace(/-/g, ' '),
            slug,
            description: frontmatter.description || '',
            date: frontmatter.date || null,
            image: frontmatter.image || '',
            tags: frontmatter.tags || [],
          }
          
          // Add thumbnail if provided
          if (frontmatter.thumbnail) {
            item.thumbnailUrl = frontmatter.thumbnail
          }
          
          // Add media information if available
          if (frontmatter.media) {
            item.mediaType = frontmatter.media.type || 'other'
            item.mediaUrl = frontmatter.media.url || ''
            item.videoProvider = frontmatter.media.provider || ''
          }
          
          // Add tech specs if available
          if (frontmatter.tech || frontmatter.specs) {
            item.techSpecs = {
              tech: frontmatter.tech || [],
              specs: frontmatter.specs || {}
            }
          }
          
          itemsData.push(item)
        }
        
        // Sort items by date (newest first)
        itemsData.sort((a, b) => {
          if (!a.date) return 1
          if (!b.date) return -1
          return new Date(b.date) - new Date(a.date)
        })
        
        // Write the items data to a JSON file
        const dataDir = path.join(docsDir, '.vitepress/data')
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true })
        }
        
        const outputPath = path.join(dataDir, `${section}Items.js`)
        const outputContent = `// Auto-generated ${section} items from markdown files with enhanced frontmatter
export const ${section}Items = ${JSON.stringify(itemsData, null, 2)};`
        
        fs.writeFileSync(outputPath, outputContent, 'utf8')
        console.log(`Generated ${section}Items.js with ${itemsData.length} items`)
      }
    }
  }
}
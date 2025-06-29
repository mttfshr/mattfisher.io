// Development-only API routes for content management
import fs from 'fs/promises'
import path from 'path'

/**
 * Setup development API routes for content management
 * @param {Object} server - Vite dev server instance
 */
export function setupDevAPI(server) {
  console.log('🛠️  Setting up development content management API...')
  
  // Middleware to parse JSON bodies
  server.middlewares.use('/api/admin', (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          req.body = JSON.parse(body)
        } catch (error) {
          req.body = {}
        }
        next()
      })
    } else {
      next()
    }
  })
  
  // Get pins data
  server.middlewares.use('/api/admin/pins', async (req, res, next) => {
    if (req.method === 'GET') {
      try {
        const pinsData = await getPinsData()
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(pinsData))
        return
      } catch (error) {
        console.error('Error getting pins data:', error)
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Failed to get pins data' }))
        return
      }
    }
    next()
  })
  
  // Update pins data
  server.middlewares.use('/api/admin/pins/update', async (req, res, next) => {
    if (req.method === 'POST') {
      try {
        const { pins, collections } = req.body
        await updatePinsData(pins, collections)
        
        // Trigger VitePress reload
        server.ws.send({
          type: 'full-reload'
        })
        
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true, message: 'Pins updated successfully' }))
        return
      } catch (error) {
        console.error('Error updating pins:', error)
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Failed to update pins' }))
        return
      }
    }
    next()
  })
  
  // Get collections data
  server.middlewares.use('/api/admin/collections', async (req, res, next) => {
    if (req.method === 'GET') {
      try {
        const collectionsData = await getCollectionsData()
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(collectionsData))
        return
      } catch (error) {
        console.error('Error getting collections data:', error)
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Failed to get collections data' }))
        return
      }
    }
    next()
  })
  
  // Update collection membership
  server.middlewares.use('/api/admin/collections/update', async (req, res, next) => {
    if (req.method === 'POST') {
      try {
        const { pinId, collections } = req.body
        await updatePinCollections(pinId, collections)
        
        // Trigger VitePress reload
        server.ws.send({
          type: 'full-reload'
        })
        
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true, message: 'Collections updated successfully' }))
        return
      } catch (error) {
        console.error('Error updating collections:', error)
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Failed to update collections' }))
        return
      }
    }
    next()
  })
  
  console.log('✅ Development content management API ready')
}

/**
 * Get current pins data by reading from the filesystem
 */
async function getPinsData() {
  try {
    // Use the existing pins system that already has thumbnails
    const { getPins } = await import('../utils/services/content/pins.js')
    const existingPinsData = getPins()
    
    // Transform the data structure for the admin interface
    const adminPinsData = {
      files: [],
      pins: [],
      collections: existingPinsData.collections || []
    }
    
    // Group pins by source file (approximation)
    const pinsByFile = {
      'pins.md': [],
      'spotify.md': [],
      'vimeo.md': [],
      'youtube.md': [],
      'pinterest-pins.md': [],
      'pinterest-boards.md': []
    }
    
    // Distribute pins to files based on URL patterns
    existingPinsData.pins.forEach(pin => {
      // Determine source file based on URL
      let sourceFile = 'pins.md' // default
      
      if (pin.url.includes('spotify.com')) {
        sourceFile = 'spotify.md'
      } else if (pin.url.includes('vimeo.com')) {
        sourceFile = 'vimeo.md'
      } else if (pin.url.includes('youtube.com') || pin.url.includes('youtu.be')) {
        sourceFile = 'youtube.md'
      } else if (pin.url.includes('pinterest.com')) {
        sourceFile = pin.url.includes('/board/') ? 'pinterest-boards.md' : 'pinterest-pins.md'
      }
      
      // Transform pin data for admin interface
      const adminPin = {
        url: pin.url,
        title: pin.title,
        tags: pin.tags || [],
        collections: pin.collections || [],
        notes: pin.notes || '',
        section: pin.section || 'General',
        lineNumber: 0,
        // Include existing thumbnail data
        imageUrl: pin.imageUrl || '',
        favicon: pin.favicon || '',
        siteName: pin.siteName || '',
        contentType: pin.contentType || 'link'
      }
      
      pinsByFile[sourceFile].push(adminPin)
    })
    
    // Create file structure for admin interface
    Object.entries(pinsByFile).forEach(([filename, pins]) => {
      if (pins.length > 0) {
        adminPinsData.pins.push({
          file: filename,
          content: '', // Not needed for admin interface
          pins: pins
        })
        adminPinsData.files.push(filename)
      }
    })
    
    return adminPinsData
    
  } catch (error) {
    console.error('Error getting pins data:', error)
    // Fallback to simple file reading
    return await getSimplePinsData()
  }
}

/**
 * Fallback method for getting pins data
 */
async function getSimplePinsData() {
  const pinsDir = path.resolve(process.cwd(), 'docs/pins')
  const files = await fs.readdir(pinsDir)
  const mdFiles = files.filter(file => file.endsWith('.md') && file !== 'index.md')
  
  const pinsData = {
    files: mdFiles,
    pins: [],
    collections: new Set()
  }
  
  // Read each markdown file
  for (const file of mdFiles) {
    const filePath = path.join(pinsDir, file)
    const content = await fs.readFile(filePath, 'utf8')
    
    const filePins = await parsePinsFromContent(content)
    pinsData.pins.push({
      file,
      content,
      pins: filePins
    })
    
    // Collect collections
    filePins.forEach(pin => {
      pin.collections?.forEach(collection => pinsData.collections.add(collection))
    })
  }
  
  return {
    ...pinsData,
    collections: Array.from(pinsData.collections).sort()
  }
}

/**
 * Parse pins from markdown content
 */
async function parsePinsFromContent(content) {
  const lines = content.split('\n')
  const pins = []
  let currentSection = 'General'
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) continue
    
    // Track sections
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim()
      continue
    }
    
    // Skip other headings
    if (line.startsWith('#')) continue
    
    // Look for list items with links
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const urlMatch = line.match(/https?:\/\/[^\s)]+/)
      if (!urlMatch) continue
      
      const url = urlMatch[0]
      
      // Extract title from markdown link
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
      const title = linkMatch ? linkMatch[1] : null
      
      // Extract tags
      const tagMatches = line.match(/#([a-zA-Z0-9_:]+)/g) || []
      const tags = tagMatches.map(tag => tag.substring(1))
      
      // Extract collections
      const collections = tags
        .filter(tag => tag.startsWith('collection:'))
        .map(tag => tag.substring('collection:'.length))
      
      // Check for notes on next line
      let notes = ''
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        if (nextLine && !nextLine.startsWith('- ') && !nextLine.startsWith('* ') && !nextLine.startsWith('#')) {
          notes = nextLine.replace(/#\w+/g, '').trim()
        }
      }
      
      pins.push({
        url,
        title,
        tags: tags.filter(tag => !tag.startsWith('collection:')),
        collections,
        notes,
        section: currentSection,
        lineNumber: i,
        // Add thumbnail support using existing system
        imageUrl: '', // Will be populated by existing thumbnail system
        favicon: '',
        siteName: ''
      })
    }
  }
  
  return pins
}

/**
 * Update pins data by writing back to filesystem
 */
async function updatePinsData(pins, collections) {
  // Group pins by file
  const pinsByFile = {}
  
  pins.forEach(fileData => {
    if (fileData.pins) {
      pinsByFile[fileData.file] = fileData.pins
    }
  })
  
  // Update each file
  for (const [file, filePins] of Object.entries(pinsByFile)) {
    await updatePinsFile(file, filePins)
  }
}

/**
 * Update a single pins file
 */
async function updatePinsFile(filename, pins) {
  const filePath = path.resolve(process.cwd(), 'docs/pins', filename)
  
  // Group pins by section
  const pinsBySection = {}
  pins.forEach(pin => {
    if (!pinsBySection[pin.section]) {
      pinsBySection[pin.section] = []
    }
    pinsBySection[pin.section].push(pin)
  })
  
  // Build the markdown content
  let content = `# ${filename.replace('.md', '').charAt(0).toUpperCase() + filename.replace('.md', '').slice(1)}\n\n`
  
  for (const [section, sectionPins] of Object.entries(pinsBySection)) {
    content += `## ${section}\n\n`
    
    sectionPins.forEach(pin => {
      // Build the pin line
      let line = '- '
      
      if (pin.title) {
        line += `[${pin.title}](${pin.url})`
      } else {
        line += pin.url
      }
      
      // Add tags
      if (pin.tags && pin.tags.length > 0) {
        line += ' ' + pin.tags.map(tag => `#${tag}`).join(' ')
      }
      
      // Add collection tags
      if (pin.collections && pin.collections.length > 0) {
        line += ' ' + pin.collections.map(collection => `#collection:${collection}`).join(' ')
      }
      
      content += line + '\n'
      
      // Add notes if present
      if (pin.notes && pin.notes.trim()) {
        content += `  ${pin.notes}\n`
      }
      
      content += '\n'
    })
  }
  
  // Write the file
  await fs.writeFile(filePath, content, 'utf8')
  console.log(`📝  Updated ${filename} with ${pins.length} pins`)
}

/**
 * Get collections data
 */
async function getCollectionsData() {
  // This would integrate with your existing collections system
  // For now, return a simple structure
  return {
    collections: [
      { name: 'Favorites', description: 'Favorite pins' },
      { name: 'Music', description: 'Music-related pins' },
      { name: 'Video', description: 'Video content' },
      { name: 'Design', description: 'Design inspiration' },
      { name: 'Development', description: 'Development tools and resources' }
    ]
  }
}

/**
 * Update pin collections
 */
async function updatePinCollections(pinId, collections) {
  // This would update the collection membership for a specific pin
  console.log(`Updating collections for pin ${pinId}:`, collections)
  // Implementation would modify the tags in the markdown files
}

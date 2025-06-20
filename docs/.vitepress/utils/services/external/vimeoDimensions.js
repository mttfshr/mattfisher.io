// docs/.vitepress/utils/services/external/vimeoDimensions.js
// Utility for fetching and caching Vimeo video dimensions

/**
 * Cache for video dimensions to avoid repeated API calls
 * Structure: { videoId: { width, height, aspectRatio, type } }
 */
const dimensionsCache = new Map()

/**
 * Extract Vimeo ID from various URL formats
 * @param {string} url - Vimeo URL
 * @returns {string|null} - Vimeo video ID
 */
export function extractVimeoId(url) {
  if (!url) return null
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Determine aspect ratio type based on dimensions
 * @param {number} width - Video width
 * @param {number} height - Video height
 * @returns {string} - Aspect ratio type for CSS classes
 */
export function getAspectRatioType(width, height) {
  if (!width || !height) return 'wide' // Default fallback
  
  const ratio = width / height
  
  // Square videos (1:1 ± 5% tolerance)
  if (ratio >= 0.95 && ratio <= 1.05) {
    return 'square'
  }
  
  // Portrait videos (taller than wide)
  if (ratio < 0.95) {
    return 'tall'
  }
  
  // Landscape videos (wider than tall)
  // Most common: 16:9 = 1.78, 4:3 = 1.33, etc.
  return 'wide'
}

/**
 * Fetch video dimensions from Vimeo oEmbed API
 * @param {string} videoId - Vimeo video ID
 * @returns {Promise<Object>} - Dimensions object with width, height, aspectRatio, type
 */
export async function fetchVimeoDimensions(videoId) {
  if (!videoId) {
    throw new Error('Video ID is required')
  }
  
  // Check cache first
  if (dimensionsCache.has(videoId)) {
    return dimensionsCache.get(videoId)
  }
  
  try {
    const response = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
    )
    
    if (!response.ok) {
      throw new Error(`Vimeo API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.width || !data.height) {
      throw new Error('Invalid dimensions received from Vimeo API')
    }
    
    // Calculate aspect ratio and determine type
    const width = parseInt(data.width)
    const height = parseInt(data.height)
    const aspectRatio = width / height
    const type = getAspectRatioType(width, height)
    
    const dimensions = {
      width,
      height,
      aspectRatio,
      type,
      title: data.title || ''
    }
    
    // Cache the result
    dimensionsCache.set(videoId, dimensions)
    
    return dimensions
  } catch (error) {
    console.warn(`Could not fetch dimensions for video ${videoId}:`, error.message)
    
    // Return default dimensions for graceful fallback
    const fallback = {
      width: 1920,
      height: 1080,
      aspectRatio: 16/9,
      type: 'wide',
      title: ''
    }
    
    // Cache the fallback to avoid repeated failed requests
    dimensionsCache.set(videoId, fallback)
    
    return fallback
  }
}

/**
 * Get dimensions for multiple videos in parallel
 * @param {Array<string>} videoIds - Array of Vimeo video IDs
 * @returns {Promise<Map>} - Map of videoId -> dimensions
 */
export async function fetchMultipleVimeoDimensions(videoIds) {
  const promises = videoIds.map(async (videoId) => {
    try {
      const dimensions = await fetchVimeoDimensions(videoId)
      return [videoId, dimensions]
    } catch (error) {
      console.warn(`Failed to fetch dimensions for ${videoId}`)
      return [videoId, null]
    }
  })
  
  const results = await Promise.all(promises)
  return new Map(results.filter(([_, dimensions]) => dimensions !== null))
}

/**
 * Clear the dimensions cache
 */
export function clearDimensionsCache() {
  dimensionsCache.clear()
}

/**
 * Get cache size for debugging
 */
export function getCacheSize() {
  return dimensionsCache.size
}

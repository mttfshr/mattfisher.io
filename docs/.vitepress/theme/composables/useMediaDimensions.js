// useMediaDimensions.js - Shared composable for media aspect ratio detection
import { ref, computed } from 'vue'

// In-memory cache to prevent repeated API calls for same content
const dimensionsCache = new Map()

export function useMediaDimensions() {
  const aspectRatio = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Fetch media dimensions from various sources
   * @param {string} url - URL to analyze
   * @param {Object} options - Options for fetching
   * @returns {Promise<Object>} - Dimensions object with width, height, aspectRatio
   */
  const fetchDimensions = async (url, options = {}) => {
    if (!url) return null

    try {
      isLoading.value = true
      error.value = null

      // Check cache first
      const cacheKey = url
      if (dimensionsCache.has(cacheKey)) {
        const cached = dimensionsCache.get(cacheKey)
        aspectRatio.value = cached.aspectRatio
        return cached
      }

      let dimensions = null

      // Vimeo video detection
      const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
      if (vimeoMatch) {
        dimensions = await fetchVimeoDimensions(vimeoMatch[1])
      }

      // YouTube video detection
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
      if (youtubeMatch && !dimensions) {
        dimensions = await fetchYouTubeDimensions(youtubeMatch[1])
      }

      // Fallback to image dimensions if available
      if (!dimensions && options.imageUrl) {
        dimensions = await fetchImageDimensions(options.imageUrl)
      }

      if (dimensions) {
        // Cache the result
        dimensionsCache.set(cacheKey, dimensions)
        aspectRatio.value = dimensions.aspectRatio
        return dimensions
      }

      return null
    } catch (err) {
      error.value = err
      console.warn('Failed to fetch media dimensions:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch Vimeo video dimensions using oEmbed API
   */
  const fetchVimeoDimensions = async (videoId) => {
    const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`)
    const data = await response.json()
    
    if (data.width && data.height) {
      return {
        width: data.width,
        height: data.height,
        aspectRatio: data.height / data.width,
        aspectRatioPercent: (data.height / data.width) * 100,
        platform: 'vimeo'
      }
    }
    return null
  }

  /**
   * Fetch YouTube video dimensions (placeholder - would need YouTube API)
   */
  const fetchYouTubeDimensions = async (videoId) => {
    // For now, assume standard 16:9 for YouTube
    // Could be enhanced with YouTube API integration
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 1080 / 1920,
      aspectRatioPercent: 56.25,
      platform: 'youtube'
    }
  }

  /**
   * Fetch image dimensions from image URL
   */
  const fetchImageDimensions = async (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalHeight / img.naturalWidth,
          aspectRatioPercent: (img.naturalHeight / img.naturalWidth) * 100,
          platform: 'image'
        })
      }
      img.onerror = () => resolve(null)
      img.src = imageUrl
    })
  }

  /**
   * Classify aspect ratio into categories
   */
  const aspectRatioType = computed(() => {
    if (!aspectRatio.value) return 'unknown'
    
    if (aspectRatio.value >= 0.98 && aspectRatio.value <= 1.02) {
      return 'square' // 1:1 videos/images
    } else if (aspectRatio.value > 1.02) {
      return 'portrait' // Tall content
    } else {
      return 'landscape' // Wide content (16:9, etc.)
    }
  })

  /**
   * Get CSS aspect ratio string for modern browsers
   */
  const cssAspectRatio = computed(() => {
    if (!aspectRatio.value) return null
    return `${1 / aspectRatio.value}`
  })

  /**
   * Get padding-bottom percentage for aspect ratio boxes
   */
  const paddingBottomPercent = computed(() => {
    if (!aspectRatio.value) return 56.25 // Default 16:9
    return (aspectRatio.value * 100)
  })

  /**
   * Clear cache (useful for testing or memory management)
   */
  const clearCache = () => {
    dimensionsCache.clear()
  }

  return {
    // State
    aspectRatio,
    isLoading,
    error,
    
    // Computed
    aspectRatioType,
    cssAspectRatio,
    paddingBottomPercent,
    
    // Methods
    fetchDimensions,
    clearCache
  }
}

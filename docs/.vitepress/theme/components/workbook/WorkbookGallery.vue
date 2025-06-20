<!-- WorkbookGallery.vue - Enhanced with dynamic aspect ratios -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import MediaThumbnail from '../common/MediaThumbnail.vue'
import { useThemeData } from '../../composables/useThemeData'
import { useMediaDimensions } from '../../composables/useMediaDimensions'

// Emit events for parent component
const emit = defineEmits(['item-click'])

// Use composables for shared functionality
const { workbookItems } = useThemeData()
const { fetchDimensions } = useMediaDimensions()

// Utility functions
function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/)
  return match ? match[1] : null
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/|youtube\.com\/shorts\/)([^/?&#]+)/)
  return match ? match[1] : null
}

// Enhanced function to fetch multiple Vimeo video dimensions
async function fetchMultipleVimeoDimensions(vimeoIds) {
  const dimensionsMap = new Map()
  
  // Process videos in parallel with rate limiting
  const batchSize = 3 // Limit concurrent requests
  const batches = []
  
  for (let i = 0; i < vimeoIds.length; i += batchSize) {
    batches.push(vimeoIds.slice(i, i + batchSize))
  }
  
  for (const batch of batches) {
    const promises = batch.map(async (vimeoId) => {
      try {
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`)
        const data = await response.json()
        
        if (data.width && data.height) {
          const aspectRatio = data.width / data.height
          let type = 'wide' // default
          
          // Classify aspect ratio
          if (aspectRatio >= 0.98 && aspectRatio <= 1.02) {
            type = 'square' // 1:1 videos
          } else if (aspectRatio < 0.98) {
            type = 'tall' // Taller than square
          } else {
            type = 'wide' // Wider than square (16:9, etc.)
          }
          
          dimensionsMap.set(vimeoId, {
            width: data.width,
            height: data.height,
            aspectRatio,
            type
          })
        }
      } catch (error) {
        console.warn(`Failed to fetch dimensions for Vimeo ${vimeoId}:`, error)
      }
    })
    
    await Promise.all(promises)
    
    // Small delay between batches to be respectful to API
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return dimensionsMap
}

// Local state for dimension management
const videoDimensions = ref(new Map())
const isLoadingDimensions = ref(false)

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

// Fetch dimensions for all Vimeo videos when component mounts
onMounted(async () => {
  const vimeoIds = []
  
  // Collect all Vimeo video IDs from items
  props.items.forEach(item => {
    if (item.media?.provider === 'vimeo' && item.media?.url) {
      const vimeoId = extractVimeoId(item.media.url)
      if (vimeoId) {
        vimeoIds.push(vimeoId)
      }
    }
  })
  
  // Fetch dimensions for all Vimeo videos
  if (vimeoIds.length > 0) {
    isLoadingDimensions.value = true
    try {
      const dimensions = await fetchMultipleVimeoDimensions(vimeoIds)
      videoDimensions.value = dimensions
    } catch (error) {
      console.warn('Failed to fetch video dimensions:', error)
    } finally {
      isLoadingDimensions.value = false
    }
  }
})

// Generate a thumbnail URL for items based on media type
function getThumbnail(item) {
  // Check if the item has a thumbnailUrl property set in the config
  if (item.thumbnailUrl) {
    return item.thumbnailUrl;
  }

  // Check if the item has a Cloudflare thumbnail URL in media object
  if (item.media?.thumbnail) {
    return item.media.thumbnail;
  }

  // If the item doesn't have media, return null for placeholder
  if (!item.media) {
    return null;
  }
  
  // Process based on media type - fallback to static thumbnails
  if (item.media.type === 'video') {
    // Handle Vimeo videos
    if (item.media.provider === 'vimeo') {
      const vimeoId = extractVimeoId(item.media.url);
      if (vimeoId) {
        return `/media/thumbnails/vimeo-${vimeoId}.jpg`;
      }
    }
    
    // Handle YouTube videos
    if (item.media.provider === 'youtube') {
      const youtubeId = extractYouTubeId(item.media.url);
      if (youtubeId) {
        return `/media/thumbnails/youtube-${youtubeId}.jpg`;
      }
    }
  }
  
  // If it's an image, use the URL
  if (item.media.type === 'image' && item.media.url) {
    return item.media.url;
  }
  
  // Return null for MediaThumbnail to handle fallback
  return null;
}

// Generate fallback text for media type
function getMediaFallbackText(item) {
  if (!item.media) return 'Project'
  const type = item.media.type || 'media'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Get appropriate aspect ratio based on actual video dimensions
function getAspectRatio(item) {
  // For non-video content, use standard aspect ratio
  if (item.media?.type !== 'video') {
    return 'standard'
  }
  
  // For Vimeo videos, use fetched dimensions
  if (item.media?.provider === 'vimeo' && item.media?.url) {
    const vimeoId = extractVimeoId(item.media.url)
    if (vimeoId && videoDimensions.value.has(vimeoId)) {
      const dimensions = videoDimensions.value.get(vimeoId)
      return dimensions.type // 'square', 'wide', or 'tall'
    }
  }
  
  // For YouTube videos, assume wide aspect ratio
  if (item.media?.provider === 'youtube') {
    return 'wide'
  }
  
  // Default fallback for videos
  return 'wide'
}

// Computed property to get gallery layout class based on content
const galleryLayoutClass = computed(() => {
  if (!props.items || props.items.length === 0) return 'gallery-grid-large'
  
  // Check if we have any square videos
  const hasSquareVideos = props.items.some(item => {
    return getAspectRatio(item) === 'square'
  })
  
  // Use different grid for square videos
  if (hasSquareVideos) {
    return 'gallery-grid-large' // Better for mixed aspect ratios
  }
  
  return 'gallery-grid-xlarge' // Best for wide videos
})
</script>

<template>
  <div class="workbook-gallery">
    <!-- Loading indicator while fetching dimensions -->
    <div v-if="isLoadingDimensions" class="loading-dimensions">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading video information...</span>
    </div>
    
    <!-- Enhanced gallery grid with dynamic aspect ratios -->
    <div :class="[galleryLayoutClass, 'spacing-scaled']">
      <div 
        v-for="item in props.items" 
        :key="item.slug"
        class="card-interactive"
        @click="emit('item-click', item)"
      >
        <!-- Dynamic media thumbnail with intelligent aspect ratio -->
        <MediaThumbnail
          :thumbnail-url="getThumbnail(item)"
          :type="item.media?.type"
          :alt="item.title"
          :fallback-text="getMediaFallbackText(item)"
          :aspect-ratio="getAspectRatio(item)"
        />
        
        <!-- Card content -->
        <div class="card-content">
          <h3 class="item-title">{{ item.title }}</h3>
          
          <div v-if="item.description" class="item-description">
            {{ item.description }}
          </div>
          
          <div v-if="item.year" class="item-date">
            {{ item.year }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal component-specific styles only */
.workbook-gallery {
  width: 100%;
}

/* Loading state for dimensions */
.loading-dimensions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-secondary);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-primary);
  border-radius: 50%;
  border-top-color: var(--accent-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: 0.02em;
}

.card-content {
  padding: var(--space-4);
}

.item-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

.item-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-date {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-2);
}
</style>

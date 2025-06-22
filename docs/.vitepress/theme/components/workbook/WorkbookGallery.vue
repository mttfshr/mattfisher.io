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
  <div class="workbook-technical-board">
    <!-- Loading indicator while fetching dimensions -->
    <div v-if="isLoadingDimensions" class="loading-dimensions">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading video information...</span>
    </div>
    
    <!-- Clean gallery grid - visuals first -->
    <div :class="[galleryLayoutClass, 'workbook-grid']">
      <div 
        v-for="item in props.items" 
        :key="item.slug"
        class="workbook-card"
        @click="emit('item-click', item)"
        @keydown.enter="emit('item-click', item)"
        @keydown.space.prevent="emit('item-click', item)"
        tabindex="0"
        role="button"
        :aria-label="`View ${item.title}`"
      >
        <!-- Subtle year indicator -->
        <div v-if="item.year" class="year-indicator">{{ item.year }}</div>
        
        <!-- Media container with normalized height -->
        <div 
          class="media-container"
          :class="getAspectRatio(item) === 'square' ? 'media-container-square' : 'media-container-wide'"
        >
          <img 
            :src="getThumbnail(item)"
            :alt="item.title"
            class="media-thumbnail"
            loading="lazy"
          />
          
          <!-- Progressive disclosure overlay -->
          <div class="metadata-overlay">
            <div class="metadata-content">
              <h3 class="blueprint-primary">{{ item.title }}</h3>
              
              <div v-if="item.collaboration" class="blueprint-secondary">
                {{ item.collaboration }}
              </div>
              
              <div v-if="item.album" class="blueprint-annotation-human">
                From {{ item.album }}
              </div>
              
              <div v-if="item.series" class="blueprint-annotation-human">
                {{ item.series }}
              </div>
              
              <div v-if="item.description" class="blueprint-tertiary">
                {{ item.description }}
              </div>
              
              <div v-if="item.technique" class="blueprint-technique">
                {{ item.technique }}
              </div>
              
              <div class="metadata-footer">
                <div v-if="item.tools && item.tools.length" class="blueprint-tags">
                  <span 
                    v-for="(tool, index) in item.tools.slice(0, 2)" 
                    :key="index" 
                    class="blueprint-tag"
                  >
                    {{ tool }}
                  </span>
                </div>
                
                <div v-if="item.duration" class="duration-indicator">
                  {{ item.duration }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Workbook Technical Board - True full-width layout */
.workbook-technical-board {
  padding: 0; /* Remove all padding */
  background: #1a1a1a;
  min-height: 100vh;
  font-family: 'Authentic Sans', system-ui, sans-serif;
  width: 100vw; /* Force full viewport width */
  margin-left: calc(50% - 50vw); /* Break out of any container constraints */
  margin-right: calc(50% - 50vw);
}

/* True full-width 3-Column Gallery Grid with center alignment */
.workbook-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
  padding: 2rem;
  width: 100%;
  box-sizing: border-box;
  align-items: center; /* Center items vertically in each row */
  justify-items: center; /* Center items horizontally in each column */
}

/* Workbook Cards - Clean, no background with bottom spacing */
.workbook-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: transparent; /* Remove card background */
  transition: all 0.4s ease;
  cursor: pointer;
  outline: none;
  width: 100%; /* Full width within grid cell */
  max-width: 100%; /* Ensure it doesn't exceed grid bounds */
  padding-bottom: 4rem; /* Add breathing room below each card */
}

.workbook-card:hover,
.workbook-card:focus {
  transform: translateY(-6px);
  box-shadow: 0 15px 40px rgba(58, 0, 136, 0.25);
}

.workbook-card:focus-visible {
  outline: 2px solid #3a0088;
  outline-offset: 2px;
}

/* Subtle year indicator */
.year-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #3a0088;
  opacity: 0.4;
  z-index: 2;
  letter-spacing: 0.1em;
  transition: opacity 0.3s ease;
}

.workbook-card:hover .year-indicator,
.workbook-card:focus .year-indicator {
  opacity: 0.8;
}

/* Media Containers - Clean presentation with authentic aspect ratios */
.media-container {
  position: relative;
  overflow: hidden;
  background: transparent; /* Remove background for cleaner look */
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border-radius: 8px; /* Keep subtle rounding */
}

/* Wide videos maintain their 16:9 aspect ratio */
.media-container-wide {
  aspect-ratio: 16/9;
  width: 100%;
}

/* Square videos maintain their 1:1 aspect ratio, centered */
.media-container-square {
  aspect-ratio: 1/1;
  width: 70%; /* Limit square videos so they don't dominate */
  margin: 0 auto;
}

.media-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Back to cover for clean presentation */
  transition: none; /* Remove zoom effect on hover */
}

/* Keep the thumbnail static on hover - no zoom distraction */
.workbook-card:hover .media-thumbnail,
.workbook-card:focus .media-thumbnail {
  transform: none; /* No scaling on hover */
}

/* Progressive Disclosure Overlay - Keep the beautiful blur and gradient */
.metadata-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg, 
    rgba(0,0,0,0.3) 0%, 
    rgba(0,0,0,0.7) 50%,
    rgba(0,0,0,0.95) 100%
  );
  display: flex;
  align-items: flex-end;
  padding: 2rem;
  opacity: 0;
  transition: opacity 0.4s ease;
  backdrop-filter: blur(2px);
}

.workbook-card:hover .metadata-overlay,
.workbook-card:focus .metadata-overlay {
  opacity: 1;
}

.metadata-content {
  width: 100%;
  transform: translateY(10px);
  transition: transform 0.4s ease;
}

.workbook-card:hover .metadata-content,
.workbook-card:focus .metadata-content {
  transform: translateY(0);
}

/* Typography Hierarchy - Progressive Disclosure */
.metadata-overlay .blueprint-primary {
  font-size: 1.5rem;
  font-weight: 400;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.metadata-overlay .blueprint-secondary {
  font-size: 1rem;
  color: #ccc;
  margin: 0 0 1rem 0;
  font-weight: 400;
  opacity: 0.9;
}

.metadata-overlay .blueprint-tertiary {
  font-size: 0.875rem;
  color: #aaa;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
}

.metadata-overlay .blueprint-annotation-human {
  font-family: 'IBM Plex Serif', serif;
  font-style: italic;
  font-size: 0.875rem;
  color: #e0e0e0;
  margin: 0.5rem 0;
  line-height: 1.4;
  opacity: 0.95;
}

.blueprint-technique {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #3a0088;
  margin: 0.75rem 0;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

/* Metadata Footer */
.metadata-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 1rem;
}

.blueprint-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.blueprint-tag {
  background: rgba(58, 0, 136, 0.2);
  border: 1px solid rgba(58, 0, 136, 0.4);
  color: #3a0088;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.blueprint-tag:hover {
  background: rgba(58, 0, 136, 0.3);
  border-color: #3a0088;
}

.duration-indicator {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #aaa;
  opacity: 0.7;
  letter-spacing: 0.05em;
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

/* Responsive Design - True full-width at all breakpoints */
@media (max-width: 1200px) {
  .workbook-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .workbook-technical-board {
    padding: 0;
  }
  
  .workbook-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 1rem;
  }
  
  .media-container-square {
    max-width: 85%; /* Allow square videos to be larger on mobile */
  }
  
  .metadata-overlay {
    padding: 1.5rem;
  }
  
  .metadata-overlay .blueprint-primary {
    font-size: 1.25rem;
  }
}

/* Touch devices - show overlay on tap, but no zoom */
@media (hover: none) and (pointer: coarse) {
  .workbook-card:active .metadata-overlay {
    opacity: 1;
  }
  
  .workbook-card:active .metadata-content {
    transform: translateY(0);
  }
  
  /* No thumbnail scaling on touch devices either */
  .workbook-card:active .media-thumbnail {
    transform: none;
  }
}

/* Accessibility - Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .workbook-card,
  .media-thumbnail,
  .metadata-overlay,
  .metadata-content,
  .year-indicator {
    transition: none;
  }
}
</style>

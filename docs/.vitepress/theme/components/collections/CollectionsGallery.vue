<!-- CollectionsGallery.vue - Horizontal sections with aspect-ratio thumbnails -->
<script setup>
import { computed, ref, onMounted } from 'vue'
import { useThemeData } from '../../composables/useThemeData.js'
import { useMediaDimensions } from '../../composables/useMediaDimensions.js'

const props = defineProps({
  collections: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['navigate-to-folio', 'navigate-to-gallery'])

// Use composables
const { collections: themeCollections } = useThemeData()
const { fetchDimensions } = useMediaDimensions()

// Fallback to theme collections if not provided via props
const allCollections = computed(() => {
  if (props.collections && props.collections.length > 0) {
    return props.collections
  }
  return themeCollections.value
})

// Video dimensions for aspect ratio calculation
const videoDimensions = ref(new Map())
const isLoadingDimensions = ref(false)

// Extract video ID from URL
function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/)
  return match ? match[1] : null
}

// Fetch dimensions for all videos in collections
async function fetchAllVideoDimensions() {
  const vimeoIds = new Set()
  
  // Collect all Vimeo video IDs from all collections
  allCollections.value.forEach(collection => {
    if (collection.items) {
      collection.items.forEach(item => {
        if (item.media?.provider === 'vimeo' && item.media?.url) {
          const vimeoId = extractVimeoId(item.media.url)
          if (vimeoId) {
            vimeoIds.add(vimeoId)
          }
        }
      })
    }
  })
  
  // Fetch dimensions for all unique videos
  if (vimeoIds.size > 0) {
    isLoadingDimensions.value = true
    try {
      const dimensions = await fetchVideoDimensions(Array.from(vimeoIds))
      videoDimensions.value = dimensions
    } catch (error) {
      console.warn('Failed to fetch video dimensions:', error)
    } finally {
      isLoadingDimensions.value = false
    }
  }
}

// Fetch multiple Vimeo video dimensions with rate limiting
async function fetchVideoDimensions(vimeoIds) {
  const dimensionsMap = new Map()
  
  // Process in batches to respect API limits
  const batchSize = 3
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
          dimensionsMap.set(vimeoId, {
            width: data.width,
            height: data.height,
            aspectRatio
          })
        }
      } catch (error) {
        console.warn(`Failed to fetch dimensions for Vimeo ${vimeoId}:`, error)
      }
    })
    
    await Promise.all(promises)
    
    // Small delay between batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return dimensionsMap
}

// Get thumbnail URL for an item
function getThumbnail(item) {
  if (item.thumbnailUrl) return item.thumbnailUrl
  if (item.media?.thumbnail) return item.media.thumbnail
  
  // Fallback for Vimeo videos
  if (item.media?.provider === 'vimeo') {
    const vimeoId = extractVimeoId(item.media.url)
    if (vimeoId) {
      return `/media/thumbnails/vimeo-${vimeoId}.jpg`
    }
  }
  
  return null
}

// Get aspect ratio for thumbnail display
function getAspectRatio(item) {
  if (item.media?.provider === 'vimeo' && item.media?.url) {
    const vimeoId = extractVimeoId(item.media.url)
    if (vimeoId && videoDimensions.value.has(vimeoId)) {
      const dimensions = videoDimensions.value.get(vimeoId)
      return dimensions.aspectRatio
    }
  }
  
  // Default to 16:9 for unknown videos
  return 16/9
}

// Navigate to folio view for a collection
function navigateToCollectionFolio(collection, startingItem = null) {
  // Use simple URL with view and collection parameters
  let newPath = `/workbook?view=folio&collection=${collection.slug}`
  if (startingItem) {
    newPath += `&item=${startingItem.slug}`
  }
  
  if (typeof window !== 'undefined') {
    window.location.href = newPath
  }
}

// Navigate to filtered gallery view for a collection
function navigateToCollectionGallery(collection) {
  console.log('navigateToCollectionGallery - collection:', collection)
  
  // Use simple URL with view and collection parameters
  const newPath = `/workbook?view=gallery&collection=${collection.slug}`
  if (typeof window !== 'undefined') {
    window.location.href = newPath
  }
}

// Sort collections by order, then by featured status
const sortedCollections = computed(() => {
  return [...allCollections.value].sort((a, b) => {
    // Featured collections first
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    
    // Then by order
    return (a.order || 999) - (b.order || 999)
  })
})

onMounted(() => {
  console.log('Collections Gallery - collections:', allCollections.value)
  fetchAllVideoDimensions()
})
</script>

<template>
  <div class="collections-gallery">
    <!-- Loading state -->
    <div v-if="isLoadingDimensions" class="loading-state">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading collection previews...</span>
    </div>
    
    <!-- Collection sections -->
    <div v-for="collection in sortedCollections" :key="collection.slug" class="collection-section">
      <!-- Collection header -->
      <div class="collection-header">
        <div class="collection-title-group">
          <h2 class="collection-title">{{ collection.title }}</h2>
          <div class="collection-meta">
            <span class="item-count">{{ collection.totalItems || 0 }} items</span>
            <span v-if="collection.featured" class="featured-badge">Featured</span>
          </div>
        </div>
        
        <p v-if="collection.description" class="collection-description">
          {{ collection.description }}
        </p>
      </div>
      
      <!-- Collection items in horizontal scrolling layout -->
      <div class="collection-items-container">
        <div class="collection-items-scroll">
          <div 
            v-for="item in collection.items" 
            :key="item.slug"
            class="collection-item-thumbnail"
            @click="navigateToCollectionFolio(collection, item)"
            @keydown.enter="navigateToCollectionFolio(collection, item)"
            @keydown.space.prevent="navigateToCollectionFolio(collection, item)"
            tabindex="0"
            role="button"
            :aria-label="`View ${item.title} in collection folio`"
          >
            <!-- Thumbnail with original aspect ratio -->
            <div 
              class="thumbnail-container"
              :style="{ 
                aspectRatio: getAspectRatio(item),
                width: `${Math.min(240, 160 * getAspectRatio(item))}px`
              }"
            >
              <img 
                :src="getThumbnail(item)" 
                :alt="item.title"
                class="thumbnail-image"
                loading="lazy"
              />
              
              <!-- Hover overlay with title -->
              <div class="thumbnail-overlay">
                <div class="thumbnail-info">
                  <h4 class="thumbnail-title">{{ item.title }}</h4>
                  <div v-if="item.year" class="thumbnail-year">{{ item.year }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- View all button -->
        <button 
          class="view-all-button"
          @click="navigateToCollectionGallery(collection)"
          :aria-label="`View all items in ${collection.title} collection`"
        >
          <span class="view-all-text">View All</span>
          <span class="view-all-icon">→</span>
        </button>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="sortedCollections.length === 0" class="empty-state">
      <div class="empty-state-icon">📁</div>
      <h3 class="empty-state-title">No Collections Found</h3>
      <p class="empty-state-description">
        Collections will appear here once they're configured.
      </p>
    </div>
  </div>
</template>

<style scoped>
.collections-gallery {
  padding: var(--space-8) 0;
  max-width: 100%;
}

/* Loading state */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12);
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
}

/* Collection sections */
.collection-section {
  margin-bottom: var(--space-16);
}

.collection-section:last-child {
  margin-bottom: 0;
}

/* Collection headers */
.collection-header {
  margin-bottom: var(--space-6);
}

.collection-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-2);
}

.collection-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.collection-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.item-count {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: var(--surface-secondary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.featured-badge {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--accent-primary);
  background: rgba(var(--accent-primary-rgb), 0.1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
}

.collection-description {
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: 1.6;
  margin: 0;
  max-width: 60ch;
}

/* Collection items layout */
.collection-items-container {
  position: relative;
}

.collection-items-scroll {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  padding: var(--space-2) 0 var(--space-4);
  scroll-behavior: smooth;
  
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.collection-items-scroll::-webkit-scrollbar {
  display: none;
}

/* Thumbnail items */
.collection-item-thumbnail {
  flex-shrink: 0;
  cursor: pointer;
  transition: var(--transition-fast);
  border-radius: var(--radius-md);
  overflow: hidden;
  outline: none;
}

.collection-item-thumbnail:hover,
.collection-item-thumbnail:focus {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.collection-item-thumbnail:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.thumbnail-container {
  position: relative;
  background: var(--surface-tertiary);
  height: 160px; /* Fixed height, width varies by aspect ratio */
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-fast);
}

.collection-item-thumbnail:hover .thumbnail-image,
.collection-item-thumbnail:focus .thumbnail-image {
  transform: scale(1.05);
}

/* Thumbnail overlay */
.thumbnail-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: var(--space-3);
  opacity: 0;
  transition: var(--transition-fast);
}

.collection-item-thumbnail:hover .thumbnail-overlay,
.collection-item-thumbnail:focus .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-info {
  color: white;
}

.thumbnail-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  margin: 0 0 var(--space-1) 0;
  line-height: 1.3;
}

.thumbnail-year {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  opacity: 0.8;
}

/* View all button */
.view-all-button {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: var(--surface-primary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.view-all-button:hover {
  background: var(--surface-secondary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.view-all-icon {
  transition: var(--transition-fast);
}

.view-all-button:hover .view-all-icon {
  transform: translateX(2px);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-8);
  color: var(--text-secondary);
}

.empty-state-icon {
  font-size: var(--text-6xl);
  margin-bottom: var(--space-4);
}

.empty-state-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Responsive design */
@media (max-width: 768px) {
  .collection-title-group {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .collection-items-scroll {
    gap: var(--space-3);
  }
  
  .thumbnail-container {
    height: 120px;
  }
  
  .view-all-button {
    position: static;
    transform: none;
    margin-top: var(--space-4);
    align-self: flex-start;
  }
}

/* Accessibility - Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .collection-item-thumbnail,
  .thumbnail-image,
  .thumbnail-overlay,
  .view-all-icon {
    transition: none;
  }
}
</style>

<!-- WorkbookFolio.vue - Clean rewrite with improved layout and dynamic aspect ratios -->
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import MediaThumbnail from '../common/MediaThumbnail.vue'
import TagDisplay from '../common/TagDisplay.vue'
import VimeoEmbed from '../common/VimeoEmbed.vue'
import { useMediaDimensions } from '../../composables/useMediaDimensions.js'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  initialIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['openPresentation', 'navigateToItem'])

const currentIndex = ref(props.initialIndex)
const showRelated = ref(false)

// Use media dimensions composable for dynamic aspect ratios
const { fetchDimensions, aspectRatio, paddingBottomPercent, aspectRatioType, isLoading: isDimensionsLoading } = useMediaDimensions()

// Computed
const currentItem = computed(() => props.items[currentIndex.value])

// Fetch dimensions when item changes
watch(currentItem, async (newItem) => {
  if (newItem && isVideoItem(newItem)) {
    const vimeoId = getVimeoId(newItem)
    if (vimeoId) {
      await fetchDimensions(`https://vimeo.com/${vimeoId}`)
    }
  }
}, { immediate: true })

// Also fetch dimensions on mount for initial item
onMounted(async () => {
  if (currentItem.value && isVideoItem(currentItem.value)) {
    const vimeoId = getVimeoId(currentItem.value)
    if (vimeoId) {
      await fetchDimensions(`https://vimeo.com/${vimeoId}`)
    }
  }
})

// Get dynamic container classes based on aspect ratio
const videoContainerClass = computed(() => {
  const baseClass = 'video-container'
  if (!aspectRatioType.value || isDimensionsLoading.value) {
    return `${baseClass} video-container-default`
  }
  
  switch (aspectRatioType.value) {
    case 'square':
      return `${baseClass} video-container-square`
    case 'portrait':
      return `${baseClass} video-container-portrait`
    case 'landscape':
    default:
      return `${baseClass} video-container-wide`
  }
})

// Get dynamic styles for the video container
const videoContainerStyle = computed(() => {
  if (paddingBottomPercent.value && !isDimensionsLoading.value) {
    return {
      paddingBottom: `${paddingBottomPercent.value}%`
    }
  }
  return {
    aspectRatio: '16/9' // Fallback
  }
})

// Navigation
function navigateTo(index) {
  if (index >= 0 && index < props.items.length) {
    currentIndex.value = index
  }
}

function openPresentation() {
  emit('openPresentation', currentItem.value)
}

function navigateToItem(item) {
  emit('navigateToItem', item)
}

// Extract Vimeo ID from various URL formats
function getVimeoId(item) {
  // Try different possible sources for Vimeo ID
  if (item.sourceType === 'vimeo' && item.sourceId) {
    return item.sourceId;
  }
  
  if (item.media?.url) {
    const match = item.media.url.match(/vimeo\.com\/(\d+)/);
    if (match) return match[1];
  }
  
  if (item.media?.provider === 'vimeo' && item.media?.embed) {
    const match = item.media.embed.match(/vimeo\.com\/video\/(\d+)/);
    if (match) return match[1];
  }
  
  return null;
}

// Utilities
function isVideoItem(item) {
  // Check multiple possible video indicators
  return (item.media?.type === 'video' && item.media?.embed) || 
         item.sourceType === 'vimeo' || 
         item.sourceType === 'youtube' ||
         item.media?.provider === 'vimeo' ||
         item.media?.provider === 'youtube'
}

function getEmbedUrl(item) {
  // Handle different data structures
  if (item.media?.embed && item.media?.provider) {
    if (item.media.provider === 'vimeo') {
      const vimeoId = extractVimeoId(item.media.url)
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&title=0&byline=0&portrait=0` : ''
    } else if (item.media.provider === 'youtube') {
      const youtubeId = extractYouTubeId(item.media.url)
      return youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1` : ''
    }
  }
  
  // Fallback to original logic
  if (item.sourceType === 'vimeo') {
    return `https://player.vimeo.com/video/${item.sourceId}?autoplay=1&loop=1&title=0&byline=0&portrait=0`
  } else if (item.sourceType === 'youtube') {
    return `https://www.youtube.com/embed/${item.sourceId}?autoplay=1&loop=1`
  }
  
  return ''
}

function extractVimeoId(url) {
  if (!url) return null
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}

function extractYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

function getThumbnail(item) {
  return item.thumbnail || item.image || ''
}

function getMediaType(item) {
  if (item.sourceType) return item.sourceType
  if (item.medium) return item.medium
  return 'media'
}

// Watch for prop changes
watch(() => props.initialIndex, (newIndex) => {
  currentIndex.value = newIndex
})
</script>

<template>
  <div class="folio-page">
    <div v-if="currentItem" class="folio-content">
      <!-- Main video presentation area -->
      <div class="video-presentation">
        <div v-if="isVideoItem(currentItem) && getVimeoId(currentItem)" 
             :class="videoContainerClass">
          <!-- Loading indicator while fetching dimensions -->
          <div v-if="isDimensionsLoading" class="dimensions-loading">
            <div class="loading-spinner"></div>
            <span>Loading video...</span>
          </div>
          
          <!-- Video embed with proper aspect ratio container -->
          <div v-else class="video-embed-wrapper" :style="videoContainerStyle">
            <VimeoEmbed
              :video-id="getVimeoId(currentItem)"
              :title="currentItem.title"
              :show-presentation-button="true"
              :autoplay="false"
              :loop="false"
              :disable-internal-dimensions="true"
            />
          </div>
        </div>
        
        <!-- Image preview for non-video items -->
        <div v-else class="image-container">
          <img 
            :src="getThumbnail(currentItem)" 
            :alt="currentItem.title"
            class="preview-image"
          />
        </div>
      </div>
      
      <!-- Metadata and navigation -->
      <div class="work-info">
        <!-- Work title and basic info -->
        <div class="work-header">
          <h1 class="work-title">{{ currentItem.title }}</h1>
          
          <div class="work-meta">
            <span v-if="currentItem.year" class="meta-item year">{{ currentItem.year }}</span>
            <span v-if="currentItem.collaboration" class="meta-item collaboration">{{ currentItem.collaboration }}</span>
            <span v-if="currentItem.duration" class="meta-item duration">{{ currentItem.duration }}</span>
          </div>
        </div>

        <!-- Description and context -->
        <div v-if="currentItem.description || currentItem.album || currentItem.series" class="work-context">
          <div v-if="currentItem.description" class="description">
            {{ currentItem.description }}
          </div>
          
          <div v-if="currentItem.album" class="context-info">
            <span class="context-label">Album:</span> {{ currentItem.album }}
          </div>
          
          <div v-if="currentItem.series" class="context-info">
            <span class="context-label">Series:</span> {{ currentItem.series }}
          </div>
          
          <div v-if="currentItem.technique" class="context-info technique">
            <span class="context-label">Technique:</span> {{ currentItem.technique }}
          </div>
        </div>

        <!-- Tools and tags -->
        <div v-if="currentItem.tools && currentItem.tools.length" class="work-tools">
          <span class="tools-label">Tools:</span>
          <div class="tools-list">
            <span 
              v-for="(tool, index) in currentItem.tools" 
              :key="index" 
              class="tool-tag"
            >
              {{ tool }}
            </span>
          </div>
        </div>

        <!-- Navigation controls -->
        <div class="navigation-controls">
          <button 
            class="nav-button prev"
            :disabled="currentIndex === 0"
            @click="navigateTo(currentIndex - 1)"
          >
            ← Previous
          </button>
          
          <div class="nav-info">
            <span class="current">{{ currentIndex + 1 }}</span>
            <span class="separator">of</span>
            <span class="total">{{ items.length }}</span>
          </div>
          
          <button 
            class="nav-button next"
            :disabled="currentIndex === items.length - 1"
            @click="navigateTo(currentIndex + 1)"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Focused folio page layout */
.folio-page {
  min-height: 100vh;
  background: #1a1a1a;
  padding: 3rem 0;
}

.folio-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Video presentation area - full width */
.video-presentation {
  width: 100%;
}

.video-container {
  width: 100%;
  margin: 0 auto;
  background: #252525;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

/* Default fallback - 16:9 aspect ratio */
.video-container-default {
  max-width: 1000px;
  aspect-ratio: 16/9;
}

/* Wide videos (16:9, 21:9, etc.) - full width */
.video-container-wide {
  max-width: 1000px;
}

/* Square videos (1:1) - constrained width for better layout */
.video-container-square {
  max-width: 600px; /* Constrained width for square videos */
}

/* Portrait videos (taller than wide) - constrained for readability */
.video-container-portrait {
  max-width: 500px; /* Even smaller for portrait videos */
}

/* Video embed wrapper that respects exact aspect ratios */
.video-embed-wrapper {
  position: relative;
  width: 100%;
  height: 0; /* Height will be set by padding-bottom percentage */
}

.video-embed-wrapper :deep(.vimeo-embed-container) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  border-radius: 0; /* Remove border-radius since parent handles it */
}

.video-embed-wrapper :deep(.vimeo-wrapper) {
  position: static;
  width: 100%;
  height: 100%;
  padding-bottom: 0 !important; /* Override VimeoEmbed's aspect ratio */
}

/* Loading state for dimensions */
.dimensions-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #888;
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #444;
  border-radius: 50%;
  border-top-color: #3a0088;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.image-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  background: #252525;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.preview-image {
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* Work information below video */
.work-info {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.work-header {
  border-bottom: 1px solid #333;
  padding-bottom: 1.5rem;
}

.work-title {
  font-family: 'Authentic Sans', system-ui, sans-serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: #ffffff;
  margin: 0 0 1rem 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.work-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
}

.meta-item.year {
  color: #3a0088;
  font-weight: 500;
}

.meta-item.collaboration {
  color: #ccc;
}

.meta-item.duration {
  color: #888;
}

/* Work context */
.work-context {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.description {
  font-family: 'IBM Plex Serif', serif;
  font-style: italic;
  font-size: 1.125rem;
  color: #e0e0e0;
  line-height: 1.6;
}

.context-info {
  font-size: 0.875rem;
  color: #ccc;
  line-height: 1.5;
}

.context-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-right: 0.5rem;
}

.context-info.technique .context-label {
  color: #3a0088;
}

/* Tools section */
.work-tools {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tools-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.tools-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tool-tag {
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

.tool-tag:hover {
  background: rgba(58, 0, 136, 0.3);
  border-color: #3a0088;
}

/* Navigation controls */
.navigation-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
  margin-top: auto;
}

.nav-button {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-button:hover:not(:disabled) {
  border-color: #3a0088;
  color: #3a0088;
  background: rgba(58, 0, 136, 0.1);
}

.nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-info {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-info .current {
  color: #3a0088;
  font-weight: 500;
}

.nav-info .separator {
  color: #666;
}

/* Responsive design */
@media (max-width: 1024px) {
  .folio-content {
    gap: 2.5rem;
    max-width: 900px;
  }
  
  .work-title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .folio-page {
    padding: 2rem 0;
  }
  
  .folio-content {
    padding: 0 1rem;
    gap: 2rem;
  }
  
  .video-container,
  .image-container {
    max-width: 100%;
  }
  
  .work-info {
    max-width: 100%;
  }
  
  .work-title {
    font-size: 1.75rem;
  }
  
  .navigation-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-button {
    width: 100%;
  }
}

/* Keyboard navigation */
.nav-button:focus-visible {
  outline: 2px solid #3a0088;
  outline-offset: 2px;
}

/* Smooth transitions */
.folio-content {
  transition: opacity 0.3s ease;
}
</style>

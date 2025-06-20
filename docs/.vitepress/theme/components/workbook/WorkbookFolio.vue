<!-- WorkbookFolio.vue - Clean rewrite with improved layout -->
<script setup>
import { ref, computed, watch } from 'vue'
import MediaThumbnail from '../common/MediaThumbnail.vue'
import TagDisplay from '../common/TagDisplay.vue'
import VimeoEmbed from '../common/VimeoEmbed.vue'

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

// Computed
const currentItem = computed(() => props.items[currentIndex.value])

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
  <div class="folio-fullscreen">
    <div v-if="currentItem">
      <!-- Full screen media -->
      <div class="media-fullscreen">
        <!-- Video embed with proper aspect ratios -->
        <div v-if="isVideoItem(currentItem) && getVimeoId(currentItem)" class="video-fullscreen">
          <VimeoEmbed
            :video-id="getVimeoId(currentItem)"
            :title="currentItem.title"
            :show-presentation-button="false"
            :autoplay="true"
            :loop="true"
          />
        </div>
        
        <!-- Image showcase for non-video items -->
        <div v-else class="image-fullscreen" @click="openPresentation">
          <img 
            :src="getThumbnail(currentItem)" 
            :alt="currentItem.title"
            class="image-fill"
          />
          <div class="media-overlay">
            <div class="media-play-indicator">⚏</div>
          </div>
        </div>
      </div>
      
      <!-- Simple pagination controls below media -->
      <div class="pagination-controls">
        <button 
          class="btn btn-ghost"
          :disabled="currentIndex === 0"
          @click="navigateTo(currentIndex - 1)"
        >
          ← Previous
        </button>
        
        <div class="nav-position">
          <span class="font-semibold">{{ currentIndex + 1 }}</span>
          <span class="text-tertiary">/</span>
          <span class="text-secondary">{{ items.length }}</span>
        </div>
        
        <button 
          class="btn btn-ghost"
          :disabled="currentIndex === items.length - 1"
          @click="navigateTo(currentIndex + 1)"
        >
          Next →
        </button>
      </div>

      <!-- Compact expandable details section -->
      <div class="details-section">
        <details class="work-details">
          <summary class="details-toggle">
            <span class="details-label">{{ currentItem.title }}</span>
            <span class="details-chevron">▼</span>
          </summary>
          
          <div class="details-content">
            <!-- Title and metadata -->
            <div class="title-section">
              <h1 class="work-title">{{ currentItem.title }}</h1>
              <div class="work-meta">
                <span v-if="currentItem.year" class="badge badge-secondary">{{ currentItem.year }}</span>
                <span v-if="getMediaType(currentItem)" class="badge badge-primary">{{ getMediaType(currentItem) }}</span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="currentItem.description" class="work-description">
              <p>{{ currentItem.description }}</p>
            </div>

            <!-- Tags -->
            <div v-if="currentItem.tags && currentItem.tags.length" class="work-tags">
              <TagDisplay 
                v-for="tag in currentItem.tags" 
                :key="tag"
                :tag="tag"
                size="sm"
              />
            </div>

            <!-- Technical details -->
            <div v-if="currentItem.medium" class="work-medium">
              <span class="label">Medium:</span> {{ currentItem.medium }}
            </div>
            
            <!-- View options -->
            <div class="work-actions">
              <button 
                v-if="!isVideoItem(currentItem)"
                @click="openPresentation" 
                class="btn btn-primary"
              >
                View Full Screen
              </button>
              <button 
                v-if="currentItem.sourceUrl"
                @click="() => window.open(currentItem.sourceUrl, '_blank')" 
                class="btn btn-secondary"
              >
                View Source
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Full screen folio layout */
.folio-fullscreen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.media-fullscreen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-primary);
}

.video-fullscreen {
  width: 90%;
  max-width: 1400px;
  aspect-ratio: 16/9;
}

.video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.image-fullscreen {
  position: relative;
  width: 90%;
  max-width: 1400px;
  cursor: pointer;
  transition: var(--transition-base);
}

.image-fullscreen:hover {
  transform: scale(1.02);
}

.image-fill {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-base);
}

.image-fullscreen:hover .media-overlay {
  opacity: 1;
}

.media-play-indicator {
  font-size: var(--text-5xl);
  color: white;
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--border-radius-full);
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: var(--transition-base);
}

.image-fullscreen:hover .media-play-indicator {
  transform: scale(1.1);
}

/* Pagination controls - clean and minimal */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-subtle);
}

.nav-position {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Compact details section */
.details-section {
  background: var(--surface-secondary);
  border-top: 1px solid var(--border-subtle);
}

.work-details {
  margin: 0;
}

.details-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-6);
  cursor: pointer;
  background: var(--surface-secondary);
  border: none;
  list-style: none;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.details-toggle:hover {
  background: var(--surface-tertiary);
  color: var(--text-primary);
}

.details-toggle::-webkit-details-marker {
  display: none;
}

.details-label {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.details-chevron {
  font-size: var(--text-xs);
  transition: transform var(--transition-fast);
}

.work-details[open] .details-chevron {
  transform: rotate(180deg);
}

.details-content {
  padding: var(--space-6);
  background: var(--surface-secondary);
  border-top: 1px solid var(--border-subtle);
}

.title-section {
  text-align: center;
  margin-bottom: var(--space-6);
}

.work-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-3);
}

.work-meta {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  align-items: center;
}

.work-description {
  margin-bottom: var(--space-4);
}

.work-description p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.work-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.work-medium {
  margin-bottom: var(--space-4);
  color: var(--text-secondary);
}

.label {
  font-weight: 500;
  color: var(--text-primary);
}

.work-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .pagination-controls {
    padding: var(--space-3) var(--space-4);
  }
  
  .details-toggle {
    padding: var(--space-3) var(--space-4);
  }
  
  .details-content {
    padding: var(--space-4);
  }
  
  .work-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>

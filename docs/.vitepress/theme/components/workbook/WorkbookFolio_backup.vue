<!-- WorkbookFolio.vue - Transformed using semantic atomic design system -->
<script setup>
import { ref, computed, watch } from 'vue'
import MediaThumbnail from '../common/MediaThumbnail.vue'
import TagDisplay from '../common/TagDisplay.vue'

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
const detailsCollapsed = ref(true) // Start collapsed for minimal distraction

// Computed
const currentItem = computed(() => props.items[currentIndex.value])

// Navigation
function navigateTo(index) {
  if (index >= 0 && index < props.items.length) {
    currentIndex.value = index
    showRelated.value = false
  }
}

function navigateToItem(item) {
  const index = props.items.findIndex(i => i.slug === item.slug)
  if (index !== -1) {
    navigateTo(index)
    emit('navigateToItem', item)
  }
}

function openPresentation() {
  emit('openPresentation', currentItem.value)
}

// Utility functions
function isVideoItem(item) {
  return item.media?.type === 'video' && item.media?.embed
}

function getEmbedUrl(item) {
  if (!isVideoItem(item)) return ''
  
  const url = item.media.url
  if (item.media.provider === 'vimeo') {
    const vimeoId = extractVimeoId(url)
    return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : ''
  }
  
  if (item.media.provider === 'youtube') {
    const youtubeId = extractYouTubeId(url)
    return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : ''
  }
  
  return ''
}

function getThumbnail(item) {
  if (item.media?.thumbnail) return item.media.thumbnail
  if (item.media?.url && item.media?.type === 'image') return item.media.url
  
  // Use fallback thumbnail logic from MediaThumbnail component
  if (item.media?.type === 'video') {
    if (item.media.provider === 'vimeo') {
      const vimeoId = extractVimeoId(item.media.url)
      return vimeoId ? `/media/thumbnails/vimeo-${vimeoId}.jpg` : null
    }
    if (item.media.provider === 'youtube') {
      const youtubeId = extractYouTubeId(item.media.url)
      return youtubeId ? `/media/thumbnails/youtube-${youtubeId}.jpg` : null
    }
  }
  
  return null
}

function getMediaType(item) {
  if (!item.media) return ''
  const type = item.media.type || 'media'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getStructuredTags(item) {
  if (!item.tags) return []
  
  const grouped = {}
  item.tags.forEach(tag => {
    if (tag.includes(':')) {
      const [category, value] = tag.split(':', 2)
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(value)
    }
  })
  
  return Object.entries(grouped).map(([category, values]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    values
  }))
}

function formatTagValue(value) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Extract IDs for different video providers
function extractVimeoId(url) {
  if (!url) return null
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

function extractYouTubeId(url) {
  if (!url) return null
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Get related items based on shared tags
function getRelatedItems(item) {
  if (!item.tags || !props.items) return []
  
  return props.items
    .filter(i => i.slug !== item.slug)
    .filter(i => {
      if (!i.tags) return false
      return item.tags.some(tag => i.tags.includes(tag))
    })
    .slice(0, 8)
}

// Watch for changes to initialIndex prop
watch(() => props.initialIndex, (newIndex) => {
  if (newIndex !== currentIndex.value && newIndex >= 0 && newIndex < props.items.length) {
    currentIndex.value = newIndex
  }
}, { immediate: true })
</script>

<template>
  <div class="folio-fullscreen">
    <div v-if="currentItem">
      <!-- Full screen media -->
      <div class="media-fullscreen">
        <!-- Direct video embed for playable videos -->
        <div v-if="isVideoItem(currentItem)" class="video-fullscreen">
          <iframe 
            :src="getEmbedUrl(currentItem)"
            :title="currentItem.title"
            class="video-iframe"
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen
          ></iframe>
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
          
          <div class="details-content">
            <div v-if="currentItem.description" class="work-description">
              {{ currentItem.description }}
            </div>
            
            <!-- Tags -->
            <div v-if="getStructuredTags(currentItem).length" class="tags-section">
              <div 
                v-for="tagGroup in getStructuredTags(currentItem)" 
                :key="tagGroup.category"
                class="tag-group-row"
              >
                <span class="tag-category">{{ tagGroup.category }}</span>
                <div class="tag-items">
                  <TagDisplay
                    v-for="value in tagGroup.values" 
                    :key="value"
                    :tag="formatTagValue(value)"
                    variant="secondary"
                  />
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="actions-row">
              <a 
                :href="currentItem.path ? `${currentItem.path}.html` : `/workbook/${currentItem.slug}.html`" 
                class="btn btn-primary"
              >
                View Details
              </a>
              <button 
                v-if="getRelatedItems(currentItem).length"
                class="btn btn-secondary"
                @click="showRelated = !showRelated"
              >
                Related ({{ getRelatedItems(currentItem).length }})
              </button>
            </div>
            
            <!-- Related items -->
            <div v-if="showRelated" class="related-section">
              <h3 class="related-title">Related Works</h3>
              <div class="gallery-grid">
                <div 
                  v-for="related in getRelatedItems(currentItem).slice(0, 4)" 
                  :key="related.slug"
                  class="card card-interactive"
                  @click="navigateToItem(related)"
                >
                  <MediaThumbnail 
                    :item="related"
                    :size="'sm'"
                  />
                  <div class="card-body">
                    <span class="card-title">{{ related.title }}</span>
                  </div>
                </div>
              </div>
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
  /* This will take all available space above the content */
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
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
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
  border-radius: var(--radius-full);
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
  font-weight: var(--font-normal);
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
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: var(--border-width) solid var(--border-primary);
}

.nav-position {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
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
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.work-details {
  width: 100%;
}

.details-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: var(--transition-base);
  list-style: none;
  border-bottom: var(--border-width) solid var(--border-primary);
}

.details-toggle::-webkit-details-marker {
  display: none;
}

.details-label {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.details-icon {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.details-content {
  padding-top: var(--space-6);
}

.work-description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
  text-align: center;
  max-width: 65ch;
  margin-left: auto;
  margin-right: auto;
}

.tags-section {
  margin-bottom: var(--space-6);
}

.tag-group-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: var(--border-width) solid var(--border-tertiary);
}

.tag-group-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.tag-category {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  min-width: 80px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  flex: 1;
}

.actions-row {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  margin-bottom: var(--space-6);
}

.related-section {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: var(--border-width) solid var(--border-secondary);
}

.related-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-4);
  text-align: center;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .content-below {
    padding: var(--space-4);
  }
  
  .nav-controls {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .work-title {
    font-size: var(--text-2xl);
  }
  
  .tag-group-row {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .tag-category {
    min-width: auto;
  }
  
  .actions-row {
    flex-direction: column;
    align-items: center;
  }
}
</style>

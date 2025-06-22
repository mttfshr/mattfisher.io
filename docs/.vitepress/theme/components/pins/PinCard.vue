<!-- PinCard.vue - Transformed using semantic atomic design system -->
<script setup>
import { h, computed, ref } from 'vue'
import MediaThumbnail from '../common/MediaThumbnail.vue'
import TagDisplay from '../common/TagDisplay.vue'
import Icon from '../common/Icon.vue'
import { getCollectionById, getMetadataConfig, getMetadataValueIcon as getValueIcon, getHighlightedMetadataKeys } from '../../../utils/services/content/metadata'

const props = defineProps({
  pin: {
    type: Object,
    required: true
  },
  layout: {
    type: String,
    default: 'compact', // 'compact' or 'detailed' - match system default
    validator: (val) => ['compact', 'detailed'].includes(val)
  }
})

const emit = defineEmits(['tag-click']) // REMOVED: 'click' - direct navigation now

// Local state for tag expansion
const tagsExpanded = ref(false)

const toggleTags = () => {
  tagsExpanded.value = !tagsExpanded.value
}

// Check if pin has structured metadata
const hasMetadata = computed(() => {
  return props.pin.metadata && Object.keys(props.pin.metadata).length > 0
})

// Check if pin is in any collections  
const hasCollections = computed(() => {
  return props.pin.collections && props.pin.collections.length > 0
})

// Get highlighted metadata keys to display
const highlightedKeys = computed(() => {
  return getHighlightedMetadataKeys()
})

// Extract domain name from URL
const getDomainName = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch (error) {
    return url
  }
}

// Smart link icon detection
const getLinkIcon = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'Youtube'
    } else if (hostname.includes('vimeo.com')) {
      return 'Video'
    } else if (hostname.includes('spotify.com')) {
      return 'Music'
    } else if (hostname.includes('github.com')) {
      return 'Github'
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'Twitter'
    } else if (hostname.includes('instagram.com')) {
      return 'Instagram'
    } else {
      return 'ExternalLink'
    }
  } catch (error) {
    return 'ExternalLink'
  }
}

// Check if this is a compact layout
const isCompactLayout = computed(() => props.layout === 'compact')

// Get thumbnail URL for MediaThumbnail component
const getThumbnailUrl = (pin) => {
  if (pin.imageUrl) return pin.imageUrl
  if (isVimeoPin(pin.url)) return getVimeoThumbnailUrl(pin.url)
  return null
}

// Get media type for MediaThumbnail component  
const getMediaType = (pin) => {
  if (pin.contentType === 'video') return 'video'
  if (pin.contentType === 'music') return 'audio'
  if (pin.imageUrl) return 'image'
  return pin.contentType || 'link'
}

// Get fallback text for MediaThumbnail component
const getFallbackText = (pin) => {
  const type = pin.contentType || 'link'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Enhanced Vimeo ID extraction from various URL formats
const extractVimeoId = (url) => {
  const numericMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (numericMatch) return numericMatch[1]
  
  const userSlugMatch = url.match(/vimeo\.com\/([^\/]+)\/([^\/\?#]+)/)
  if (userSlugMatch) {
    console.log(`🔍 PinCard: Vimeo username/slug URL needs mapping: ${url}`)
    return null
  }
  
  const embedMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/)
  if (embedMatch) return embedMatch[1]
  
  const channelMatch = url.match(/vimeo\.com\/(?:channels|groups)\/[^\/]+\/(\d+)/)
  if (channelMatch) return channelMatch[1]
  
  return null
}

// Check if pin is from Vimeo
const isVimeoPin = (url) => {
  try {
    const hostname = new URL(url).hostname
    return hostname.includes('vimeo.com')
  } catch (error) {
    return false
  }
}

// Get Vimeo thumbnail URL
const getVimeoThumbnailUrl = (url) => {
  try {
    const vimeoId = extractVimeoId(url)
    if (vimeoId) {
      const thumbnailUrl = `/media/thumbnails/vimeo-${vimeoId}.jpg`
      console.log(`✅ PinCard: Using thumbnail URL for ${url}: ${thumbnailUrl}`)
      return thumbnailUrl
    } else {
      console.log(`⚠️ PinCard: Could not extract Vimeo ID from ${url}`)
      return null
    }
  } catch (error) {
    console.error('Error getting Vimeo thumbnail:', error)
    return null
  }
}

// Get collection information
const getCollectionName = (collectionId) => {
  const collection = getCollectionById(collectionId)
  return collection ? collection.name : collectionId
}

const getCollectionIcon = (collectionId) => {
  const collection = getCollectionById(collectionId)
  return collection ? collection.icon : 'Folder'
}

// Get metadata value icon
const getMetadataValueIcon = (key, value) => {
  return getValueIcon(key, value)
}

// Prepare tags for TagDisplay component
const allTags = computed(() => {
  const tags = [...(props.pin.tags || [])]
  
  // Add metadata as structured tags
  if (hasMetadata.value) {
    highlightedKeys.value.forEach(key => {
      if (props.pin.metadata[key]) {
        props.pin.metadata[key].slice(0, 3).forEach(value => {
          tags.push(`${key}:${value}`)
        })
      }
    })
  }
  
  // Add collections as structured tags
  if (hasCollections.value) {
    props.pin.collections.slice(0, 2).forEach(collectionId => {
      tags.push(`collection:${collectionId}`)
    })
  }
  
  return tags
})

// Add date formatting for technical annotations
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toISOString().split('T')[0] // YYYY-MM-DD format for technical spec look
}
</script>

<template>
  <div class="blueprint-card pin-card" :class="[`type-${pin.contentType}`, `layout-${layout}`]">
    <!-- Make the card clickable to go to external URL -->
    <a :href="pin.url" target="_blank" rel="noopener noreferrer" class="pin-card-link">
    <!-- Blueprint grid reference -->
    <div class="blueprint-grid-ref">{{ pin.contentType?.toUpperCase() || 'PIN' }}</div>
    
    <!-- Reusable media thumbnail component -->
    <MediaThumbnail
      :thumbnail-url="getThumbnailUrl(pin)"
      :type="getMediaType(pin)"
      :alt="pin.title || 'Untitled'"
      :fallback-text="getFallbackText(pin)"
      :aspect-ratio="isCompactLayout ? 'square' : 'wide'"
    />
    
    <!-- Card content with blueprint hierarchy - only show in detailed layout -->
    <div v-if="!isCompactLayout" class="blueprint-content">
      <!-- PRIMARY LEVEL: Pin Title -->
      <h3 class="blueprint-primary">{{ pin.title || 'Untitled' }}</h3>
      
      <!-- SECONDARY LEVEL: Technical Classification -->
      <div class="blueprint-secondary pin-source">
        <Icon :name="getLinkIcon(pin.url)" :size="16" class="link-icon" />
        <img v-if="pin.favicon" :src="pin.favicon" class="site-favicon" alt="Site icon" />
        <span>{{ getDomainName(pin.url) }}</span>
        <span class="content-type">{{ pin.contentType?.toUpperCase() || 'LINK' }}</span>
      </div>
      
      <!-- TERTIARY LEVEL: Supporting Context -->
      <p v-if="pin.description" class="blueprint-tertiary">{{ pin.description }}</p>
      
      <!-- Personal notes with human annotation styling -->
      <div v-if="pin.notes" class="blueprint-annotation-human">
        "{{ pin.notes }}"
      </div>
      
      <!-- QUATERNARY LEVEL: Technical Annotations -->
      <div class="blueprint-annotations">
        <div class="blueprint-annotation">
          <Icon name="Calendar" :size="12" />
          <span>{{ formatDate(pin.dateAdded) }}</span>
        </div>
        
        <div v-if="hasCollections" class="blueprint-annotation">
          <Icon name="Folder" :size="12" />
          <span>{{ pin.collections.length }} COLL</span>
        </div>
        
        <div v-if="allTags.length > 0" class="blueprint-annotation">
          <Icon name="Tag" :size="12" />
          <span>{{ allTags.length }} TAGS</span>
        </div>
      </div>
      
      <!-- Blueprint tags as technical specifications -->
      <div v-if="allTags.length > 0" class="blueprint-tags">
        <div 
          v-for="tag in allTags.slice(0, tagsExpanded ? allTags.length : 3)" 
          :key="tag"
          class="blueprint-tag"
          @click.stop="emit('tag-click', tag)"
        >
          {{ tag.toUpperCase() }}
        </div>
        
        <!-- Expand/collapse for more tags -->
        <button 
          v-if="allTags.length > 3"
          @click.stop="tagsExpanded = !tagsExpanded"
          class="blueprint-tag blueprint-tag-expand"
        >
          {{ tagsExpanded ? '−' : `+${allTags.length - 3}` }}
        </button>
      </div>
    </div>
    
    <!-- Compact layout - blueprint overlay on hover -->
    <div v-if="isCompactLayout" class="blueprint-compact-overlay">
      <div class="compact-content">
        <h3 class="blueprint-primary compact-title">{{ pin.title || 'Untitled' }}</h3>
        <div class="blueprint-secondary compact-source">
          <Icon :name="getLinkIcon(pin.url)" :size="12" class="link-icon" />
          <span class="content-type">{{ pin.contentType?.toUpperCase() || 'LINK' }}</span>
        </div>
      </div>
    </div>
    </a> <!-- Close the link tag -->
  </div>
</template>

<style scoped>
/* Card link styling */
.pin-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  width: 100%;
  height: 100%;
}

.pin-card-link:hover {
  color: inherit;
}

/* Pin card specific styling - extends blueprint-card pattern */
.pin-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Ensure compact layout cards are square */
.pin-card.layout-compact {
  aspect-ratio: 1; /* Force square aspect ratio */
}

/* Center thumbnails in compact layout */
.pin-card.layout-compact .media-container,
.pin-card.layout-compact .media-container-square {
  margin: 0 auto;
}

/* Blueprint content container */
.blueprint-content {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

/* Technical classification styling */
.pin-source {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.link-icon {
  color: var(--accent-primary);
  opacity: 0.8;
}

.site-favicon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  opacity: 0.8;
}

.content-type {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  background: var(--surface-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
  margin-left: auto; /* Push to right side */
}

/* Blueprint compact overlay */
.blueprint-compact-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.9) 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
  display: flex;
  align-items: flex-end;
  padding: var(--space-3);
  pointer-events: none;
}

.pin-card.layout-compact:hover .blueprint-compact-overlay {
  opacity: 1;
}

.compact-title {
  font-size: 16px !important; /* Override blueprint-primary for compact */
  color: white;
  margin-bottom: var(--space-1) !important;
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-source {
  font-size: 12px !important; /* Override blueprint-secondary for compact */
  color: rgba(255, 255, 255, 0.8) !important;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Custom blueprint tag hover states */
.blueprint-tag:hover {
  background-color: var(--surface-secondary);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.blueprint-tag-expand {
  background-color: var(--accent-primary);
  color: var(--surface-primary);
  border-color: var(--accent-primary);
}

.blueprint-tag-expand:hover {
  background-color: var(--surface-primary);
  color: var(--accent-primary);
}

/* Enhanced blueprint connector for personal notes */
.blueprint-connector {
  padding-left: var(--space-4);
  border-left: 2px solid var(--accent-primary);
  margin-left: var(--space-2);
  font-style: italic;
}

/* Custom annotation icons */
.blueprint-annotation .link-icon {
  color: var(--accent-primary);
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .blueprint-content {
    padding: var(--space-4);
  }
}
</style>

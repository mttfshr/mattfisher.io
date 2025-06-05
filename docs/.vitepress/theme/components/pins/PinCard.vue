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

const emit = defineEmits(['click', 'tag-click'])

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
</script>

<template>
  <div class="pin-card card-interactive" :class="[`type-${pin.contentType}`, `layout-${layout}`]" @click="emit('click', pin)">
    <!-- Reusable media thumbnail component -->
    <MediaThumbnail
      :thumbnail-url="getThumbnailUrl(pin)"
      :type="getMediaType(pin)"
      :alt="pin.title || 'Untitled'"
      :fallback-text="getFallbackText(pin)"
      :aspect-ratio="isCompactLayout ? 'square' : 'wide'"
    />
    
    <!-- Card content - only show in detailed layout -->
    <div v-if="!isCompactLayout" class="card-content">
      <div class="pin-header">
        <h3 class="pin-title">{{ pin.title || 'Untitled' }}</h3>
        <div class="pin-source">
          <Icon :name="getLinkIcon(pin.url)" :size="14" class="link-icon" />
          <img v-if="pin.favicon" :src="pin.favicon" class="site-favicon" alt="Site icon" />
          {{ getDomainName(pin.url) }}
        </div>
      </div>
      
      <p v-if="pin.description" class="pin-description">{{ pin.description }}</p>
      
      <div v-if="pin.notes" class="pin-notes">
        "{{ pin.notes }}"
      </div>
      
      <!-- Collapsible tag display -->
      <div class="pin-tags">
        <div class="tags-trigger" @click.stop="toggleTags" v-if="allTags.length > 0">
          <Icon name="Tag" :size="14" />
          <span class="tags-count">{{ allTags.length }}</span>
          <div v-if="tagsExpanded" class="tags-expanded">
            <TagDisplay 
              :tags="allTags" 
              :collapsible="false"
              :initially-expanded="true"
              @tag-click="(tag) => emit('tag-click', tag)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Compact layout overlay (only show title on hover) -->
    <div v-if="isCompactLayout" class="compact-overlay">
      <div class="compact-content">
        <h3 class="compact-title">{{ pin.title || 'Untitled' }}</h3>
        <div class="compact-source">
          <Icon :name="getLinkIcon(pin.url)" :size="12" class="link-icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base pin card styles */
.pin-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Detailed layout card content */
.pin-card.layout-detailed .card-content {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

/* Compact layout - no content padding, overlay on hover */
.pin-card.layout-compact {
  position: relative;
}

.compact-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
  display: flex;
  align-items: flex-end;
  padding: var(--space-3);
  pointer-events: none;
}

.pin-card.layout-compact:hover .compact-overlay {
  opacity: 1;
}

.compact-content {
  width: 100%;
}

.compact-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: white;
  margin: 0 0 var(--space-1);
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-source {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Detailed layout content styles */
.pin-header {
  margin-bottom: var(--space-2);
}

.pin-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-1);
  line-height: var(--leading-tight);
}

.pin-source {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.link-icon {
  color: var(--text-tertiary);
}

.site-favicon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.pin-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  line-height: var(--leading-normal);
}

.pin-notes {
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--text-primary);
  margin: var(--space-2) 0;
  padding: var(--space-2);
  background-color: var(--surface-tertiary);
  border-left: 3px solid var(--vp-c-brand);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* Collapsible tags */
.pin-tags {
  margin-top: auto;
  position: relative;
}

.tags-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background-color: var(--surface-tertiary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  transition: all var(--transition-base);
  user-select: none;
}

.tags-trigger:hover {
  background-color: var(--surface-secondary);
  color: var(--text-primary);
}

.tags-count {
  font-weight: var(--font-medium);
}

.tags-expanded {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background-color: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  padding: var(--space-3);
  margin-bottom: var(--space-1);
  box-shadow: var(--shadow-lg);
  z-index: 10;
  animation: slideUp var(--transition-base) ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

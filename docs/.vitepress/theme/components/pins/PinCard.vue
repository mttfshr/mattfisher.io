<!-- PinCard.vue - Transformed using semantic atomic design system -->
<script setup>
import { h, computed } from 'vue'
import MediaThumbnail from '../common/MediaThumbnail.vue'
import TagDisplay from '../common/TagDisplay.vue'
import { getCollectionById, getMetadataConfig, getMetadataValueIcon as getValueIcon, getHighlightedMetadataKeys } from '../../../utils/services/content/metadata'

const props = defineProps({
  pin: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'tag-click'])

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
  return collection ? collection.icon : '📁'
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
  <div class="pin-card card-interactive" :class="[`type-${pin.contentType}`]" @click="emit('click', pin)">
    <!-- Reusable media thumbnail component -->
    <MediaThumbnail
      :thumbnail-url="getThumbnailUrl(pin)"
      :type="getMediaType(pin)"
      :alt="pin.title || 'Untitled'"
      :fallback-text="getFallbackText(pin)"
      aspect-ratio="wide"
    />
    
    <!-- Card content -->
    <div class="card-content">
      <div class="pin-header">
        <h3 class="pin-title">{{ pin.title || 'Untitled' }}</h3>
        <div class="pin-source">
          <img v-if="pin.favicon" :src="pin.favicon" class="site-favicon" alt="Site icon" />
          {{ getDomainName(pin.url) }}
        </div>
      </div>
      
      <p v-if="pin.description" class="pin-description">{{ pin.description }}</p>
      
      <div v-if="pin.notes" class="pin-notes">
        "{{ pin.notes }}"
      </div>
      
      <!-- Reusable tag display component -->
      <TagDisplay 
        :tags="allTags" 
        :collapsible="true"
        :initially-expanded="false"
        :max-visible="5"
        @tag-click="(tag) => emit('tag-click', tag)"
      />
    </div>
  </div>
</template>

<style scoped>
/* Minimal component-specific styles only */
.pin-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-content {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

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
}

.site-favicon {
  width: 14px;
  height: 14px;
  margin-right: var(--space-1);
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

/* Type-specific styling for content types */
.pin-card.type-music {
  /* Music-specific styling handled by MediaThumbnail fallback */
}

.pin-card.type-video {
  /* Video-specific styling handled by MediaThumbnail */  
}

.pin-card.type-article {
  /* Article-specific styling handled by MediaThumbnail */
}

.pin-card.type-code {
  /* Code-specific styling handled by MediaThumbnail */
}

.pin-card.type-design {
  /* Design-specific styling handled by MediaThumbnail */
}
</style>

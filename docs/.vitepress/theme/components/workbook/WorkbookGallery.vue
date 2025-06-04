<!-- WorkbookGallery.vue - Transformed using semantic atomic design system -->
<script setup>
import { ref } from 'vue'
import { useData } from 'vitepress'
import MediaThumbnail from '../common/MediaThumbnail.vue'

// Emit events for parent component
const emit = defineEmits(['item-click'])

// Function to extract Vimeo ID
function extractVimeoId(url) {
  if (!url) return null;
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to extract YouTube ID
function extractYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

const { theme } = useData()

const props = defineProps({
  items: {
    type: Array,
    required: true
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

// Get appropriate aspect ratio based on media type
function getAspectRatio(item) {
  if (item.media?.type === 'video') {
    return 'wide' // 16:9 aspect ratio for videos
  }
  return 'standard' // Default aspect ratio for other content
}
</script>

<template>
  <div class="workbook-gallery">
    <!-- Semantic gallery grid with 3-column layout to match pins spacing -->
    <div class="gallery-grid-large spacing-scaled">
      <div 
        v-for="item in props.items" 
        :key="item.slug"
        class="card-interactive"
        @click="emit('item-click', item)"
      >
        <!-- Reusable media thumbnail component -->
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

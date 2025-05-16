<!-- docs/.vitepress/theme/components/workbook/WorkbookGallery.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import { getVideoThumbnail } from '../../utils/mediaUtils'

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

onMounted(() => {
  console.log('Workbook Items:', theme.value.workbookItems)
})

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

// Active tag filter
const activeTag = ref('')

// Filtered items based on tag selection
const filteredItems = computed(() => {
  if (!activeTag.value) return props.items
  
  return props.items.filter(item => 
    item.tags && item.tags.includes(activeTag.value)
  )
})

// Collect all unique tags
const allTags = computed(() => {
  const tags = new Set()
  
  props.items.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => tags.add(tag))
    }
  })
  
  return Array.from(tags).sort()
})

// Set active tag
function setTag(tag) {
  activeTag.value = tag === activeTag.value ? '' : tag
}

// Generate a thumbnail URL for items based on media type
function getThumbnail(item) {
  // Check if the item has a thumbnailUrl property set in the config
  if (item.thumbnailUrl) {
    console.log('Using item.thumbnailUrl:', item.thumbnailUrl);
    return item.thumbnailUrl;
  }

  // If the item doesn't have media, use a placeholder
  if (!item.media) {
    return '/media/video-placeholder.svg';
  }
  
  // Process based on media type
  if (item.media.type === 'video') {
    // Handle Vimeo videos
    if (item.media.provider === 'vimeo') {
      const vimeoId = extractVimeoId(item.media.url);
      console.log('Vimeo ID:', vimeoId, 'URL:', item.media.url);
      if (vimeoId) {
        // Use path that matches VitePress public directory structure
        const thumbnailUrl = `/media/thumbnails/vimeo-${vimeoId}.jpg`;
        console.log('Using thumbnail URL:', thumbnailUrl);
        // Diagnostic: Log the full thumbnail URL to check what's happening
        console.log('TESTING thumbnail full URL:', location.origin + thumbnailUrl);
        return thumbnailUrl;
      }
    }
    
    // Handle YouTube videos
    if (item.media.provider === 'youtube') {
      const youtubeId = extractYouTubeId(item.media.url);
      if (youtubeId) {
        // Use path that matches VitePress public directory structure
        return `/media/thumbnails/youtube-${youtubeId}.jpg`;
      }
    }
  }
  
  // If it's an image, use the URL
  if (item.media.type === 'image' && item.media.url) {
    return item.media.url;
  }
  
  // Fallback to a placeholder
  return '/media/video-placeholder.svg';
}

// Generate a display title for the media type
function getMediaTypeDisplay(item) {
  if (!item.media) return 'Project'
  
  const type = item.media.type || 'media'
  return type.charAt(0).toUpperCase() + type.slice(1)
}
</script>

<template>
  <div class="workbook-gallery">
    <!-- Tag filters -->
    <div v-if="allTags.length" class="tag-filters">
      <button 
        class="tag-filter" 
        :class="{ active: !activeTag }"
        @click="activeTag = ''"
      >
        All
      </button>
      <button 
        v-for="tag in allTags" 
        :key="tag"
        class="tag-filter"
        :class="{ active: activeTag === tag }"
        @click="setTag(tag)"
      >
        {{ tag }}
      </button>
    </div>
    
    <!-- Gallery grid -->
    <div class="gallery-grid">
      <a 
        v-for="item in filteredItems" 
        :key="item.slug"
        :href="`/workbook/${item.slug}.html`"
        class="gallery-item"
      >
        <!-- Item thumbnail or preview -->
        <div class="item-media">
          <div v-if="item.media?.type === 'video'" class="media-badge video">
            <span class="material-icons">videocam</span>
          </div>
          
          <div v-if="!item.media" class="placeholder-media">
            {{ getMediaTypeDisplay(item) }}
          </div>
          <img 
            v-else 
            :src="getThumbnail(item)" 
            :alt="item.title"
          />
        </div>
        
        <!-- Item details -->
        <div class="item-details">
          <h3 class="item-title">{{ item.title }}</h3>
          
          <div v-if="item.description" class="item-description">
            {{ item.description }}
          </div>
          
          <div v-if="item.date" class="item-date">
            {{ new Date(item.date).toLocaleDateString() }}
          </div>
          
          <div v-if="item.tags && item.tags.length" class="item-tags">
            <span v-for="tag in item.tags" :key="tag" class="item-tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.workbook-gallery {
  width: 100%;
}

.tag-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tag-filter {
  background: var(--vp-c-bg-soft);
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.tag-filter:hover {
  background: var(--vp-c-brand-soft);
}

.tag-filter.active {
  background: var(--vp-c-brand);
  color: white;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.gallery-item {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.item-media {
  height: 200px;
  background-color: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.item-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.media-badge.video span {
  font-size: 18px;
}

.placeholder-media {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  font-size: 1.2rem;
}

.item-details {
  padding: 1rem;
}

.item-title {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}

.item-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-bottom: 0.5rem;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.item-tag {
  font-size: 0.7rem;
  background-color: var(--vp-c-bg-soft);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }
}
</style>
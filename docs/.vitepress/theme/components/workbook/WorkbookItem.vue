<!-- WorkbookItem.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Individual props
  title: String,
  slug: String,
  description: String,
  date: [String, Date],
  mediaType: String,
  mediaUrl: String,
  videoProvider: String,
  thumbnailUrl: String,
  tags: Array,
  // Full item object
  item: Object
})

// Extract data from props or item object
const effectiveTitle = computed(() => props.title || props.item?.title || 'Untitled')
const effectiveSlug = computed(() => props.slug || props.item?.slug || '')
const effectiveDescription = computed(() => props.description || props.item?.description || '')

const effectiveDate = computed(() => {
  const date = props.date || props.item?.date
  if (!date) return null
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const effectiveMediaType = computed(() => {
  // Check for new media object format first
  if (props.item?.media?.type) return props.item.media.type
  // Then check for direct mediaType prop
  if (props.mediaType) return props.mediaType
  // Then check for item's mediaType
  return props.item?.mediaType || 'image'
})

const effectiveMediaUrl = computed(() => {
  // Check for new media object format first
  if (props.item?.media?.url) return props.item.media.url
  // Then check for direct mediaUrl prop
  if (props.mediaUrl) return props.mediaUrl
  // Then check for item's mediaUrl
  return props.item?.mediaUrl || ''
})

const effectiveProvider = computed(() => {
  // Check for new media object format first
  if (props.item?.media?.provider) return props.item.media.provider
  // Then check for direct videoProvider prop
  if (props.videoProvider) return props.videoProvider
  // Then check for item's videoProvider
  return props.item?.videoProvider || ''
})

const effectiveThumbnail = computed(() => {
  // Use explicit thumbnail if provided
  if (props.thumbnailUrl) return props.thumbnailUrl
  if (props.item?.thumbnailUrl) return props.item.thumbnailUrl
  
  // Use media type to determine placeholder
  if (effectiveMediaType.value === 'video') {
    return '/_media/video-placeholder.svg'
  } else if (effectiveMediaType.value === 'audio') {
    return '/_media/audio-placeholder.svg'
  }
  
  // Default
  return '/_media/generic-placeholder.svg'
})

const effectiveTags = computed(() => {
  return props.tags || props.item?.tags || []
})

// Computed for the URL
const itemUrl = computed(() => {
  // Use the full path if available (includes subdirectories)
  if (props.item?.path) {
    return `${props.item.path}.html`
  }
  
  // Fallback to slug-based URL for backward compatibility
  if (!effectiveSlug.value) return '#'
  return `/workbook/${effectiveSlug.value}.html`
})

// Type icon and badge
const mediaTypeIcon = computed(() => {
  if (effectiveMediaType.value === 'video') {
    return {
      class: 'media-icon-video',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
    }
  } else if (effectiveMediaType.value === 'audio') {
    return {
      class: 'media-icon-audio',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`
    }
  }
  return null
})
</script>

<template>
  <a :href="itemUrl" class="blueprint-card workbook-item">
    <!-- Blueprint grid reference -->
    <div class="blueprint-grid-ref">{{ effectiveMediaType.toUpperCase() }}</div>
    
    <div class="media-thumbnail">
      <img :src="effectiveThumbnail" :alt="effectiveTitle" loading="lazy" />
      
      <div v-if="effectiveProvider === 'vimeo'" class="provider-badge vimeo-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#00ADEF">
          <path d="M23.9765 6.4168c-.1044-2.2841-1.6856-4.0032-3.969-3.8968-5.3211.1056-6.9648 4.0092-7.1772 7.4348 1.5048-.0636 2.3004-.1056 3.6168-.3492.7752-.1272 1.6812.5124 1.8288 1.7964.12 1.0644-.3492 2.1624-1.26 3.012-.9108.8484-2.4756 1.3668-3.5508.8124-.8748-.4548-1.5552-2.256-1.2072-5.0892.4644-3.7692 1.3248-7.6032 1.224-8.172-.1044-.7116-.6924-1.7532-3.416-1.29-1.7316.2952-3.9444 3.0492-4.9776 5.436-.1368.324-.4044.4812-.6312.1056-.6708-1.0872-1.9104-2.7-1.3428-5.2836.12-.5268-.3492-.7116-1.0644-.4764-.7488.2436-1.6248.5376-2.256.7812-2.1216.8268-3.096 2.304-2.6064 4.8372C.1581 8.9956.7929 14.58 1.7953 17.5068c.66 1.9104 2.3964 4.0284 4.8888 3.1152 1.8288-.6696 3.9804-2.3616 5.1216-7.5168.12-.5268.1824-.612.5316-.6756.324-.0516.612-.0768.9432-.0768.324 0 .648.0252.96.0768.3492.0636.4116.1488.516.6756 1.14 5.1552 3.2928 6.8472 5.1228 7.5168 2.4912.9132 4.2288-1.2048 4.8888-3.1152 1.0032-2.928 1.6368-8.5116 1.68-11.0" />
        </svg>
      </div>
      
      <div v-else-if="effectiveProvider === 'youtube'" class="provider-badge youtube-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      </div>
      
      <div v-else-if="mediaTypeIcon" class="media-type-icon" :class="mediaTypeIcon.class" v-html="mediaTypeIcon.svg">
      </div>
    </div>
    
    <div class="blueprint-content item-details">
      <!-- PRIMARY LEVEL: Item Title -->
      <h3 class="blueprint-primary">{{ effectiveTitle }}</h3>
      
      <!-- SECONDARY LEVEL: Technical Classification -->
      <div class="blueprint-secondary media-classification">
        <span class="media-type">{{ effectiveMediaType.toUpperCase() }}</span>
        <span v-if="effectiveProvider" class="provider">{{ effectiveProvider.toUpperCase() }}</span>
      </div>
      
      <!-- TERTIARY LEVEL: Supporting Context -->
      <p v-if="effectiveDescription" class="blueprint-tertiary">{{ effectiveDescription }}</p>
      
      <!-- QUATERNARY LEVEL: Technical Annotations -->
      <div class="blueprint-annotations">
        <div v-if="effectiveDate" class="blueprint-annotation">
          <span>{{ effectiveDate }}</span>
        </div>
        
        <div v-if="effectiveTags && effectiveTags.length > 0" class="blueprint-annotation">
          <span>{{ effectiveTags.length }} TAGS</span>
        </div>
      </div>
      
      <!-- Blueprint tags -->
      <div v-if="effectiveTags && effectiveTags.length > 0" class="blueprint-tags">
        <div 
          v-for="tag in effectiveTags.slice(0, 3)" 
          :key="tag"
          class="blueprint-tag"
        >
          {{ tag.toUpperCase() }}
        </div>
        
        <div 
          v-if="effectiveTags.length > 3"
          class="blueprint-tag"
        >
          +{{ effectiveTags.length - 3 }}
        </div>
      </div>
    </div>
  </a>
</template>

<style scoped>
/* WorkbookItem specific styling - extends blueprint-card pattern */
.workbook-item {
  display: block;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.media-thumbnail {
  position: relative;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: var(--surface-tertiary);
  overflow: hidden;
}

.media-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.workbook-item:hover .media-thumbnail img {
  transform: scale(1.05);
}

.provider-badge,
.media-type-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.media-type-icon {
  color: var(--accent-primary);
}

/* Blueprint content container */
.blueprint-content.item-details {
  padding: var(--space-6);
  flex-grow: 1;
}

/* Technical classification styling */
.media-classification {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.media-type,
.provider {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  background: var(--surface-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.provider {
  background: var(--accent-primary);
  color: var(--surface-primary);
  border-color: var(--accent-primary);
  opacity: 0.8;
}

/* Custom blueprint tag hover states for workbook items */
.blueprint-tag:hover {
  background-color: var(--surface-secondary);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .blueprint-content.item-details {
    padding: var(--space-4);
  }
}
</style>
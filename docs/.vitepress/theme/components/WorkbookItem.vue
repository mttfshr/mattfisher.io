<!-- WorkbookItem.vue -->
<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: [String, Date],
    default: null
  },
  mediaType: {
    type: String,
    default: 'image', // 'image', 'video', 'audio', 'other'
    validator: (value) => ['image', 'video', 'audio', 'other'].includes(value)
  },
  mediaUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  videoProvider: {
    type: String,
    default: '',
    validator: (value) => ['', 'youtube', 'vimeo'].includes(value)
  },
  tags: {
    type: Array,
    default: () => []
  }
})

// Map slugs to known video IDs for Vimeo
const vimeoIdMap = {
  'obsidian-heart': '684505621',
  'smoking-frog': '684505690',
  'spearthrowerowl': '684505733',
  'the-place-where-gods-are-born': '684505790',
  'maybe-later-maybe-next-time': '553619218',
  'this-is-where-we-say-goodbye': '553177184',
  'penrose-tiling': '552620356',
  'sabines-search-for-quantum-gravity': '553179389'
}

const formattedDate = computed(() => {
  if (!props.date) return null
  
  const date = props.date instanceof Date 
    ? props.date 
    : new Date(props.date)
    
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const effectiveImageUrl = computed(() => {
  // Use explicitly provided thumbnail if available
  if (props.thumbnailUrl) return props.thumbnailUrl
  
  // Get the Vimeo ID from the map based on slug
  const vimeoId = vimeoIdMap[props.slug]
  if (vimeoId) {
    return `/_media/thumbnails/vimeo-${vimeoId}.jpg`
  }
  
  // Special case for known slugs with custom thumbnails
  if (props.slug === 'motion-studies') {
    return '/_media/thumbnails/motion-studies.svg'
  }
  if (props.slug === 'sound-viz') {
    return '/_media/thumbnails/sound-viz.svg'
  }
  
  // For other videos, use a placeholder
  if (props.mediaType === 'video') {
    return '/_media/video-placeholder.svg'
  }
  
  // For images, use the mediaUrl directly
  if (props.mediaType === 'image') return props.mediaUrl
  
  // For audio, use an audio placeholder
  if (props.mediaType === 'audio') return '/_media/audio-placeholder.svg'
  
  // Default placeholder
  return '/_media/generic-placeholder.svg'
})

const mediaTypeIcon = computed(() => {
  // If we have a Vimeo ID for this slug, treat it as a video
  if (vimeoIdMap[props.slug]) {
    return {
      class: 'media-icon-video',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
    }
  }
  
  switch (props.mediaType) {
    case 'video':
      return {
        class: 'media-icon-video',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
      }
    case 'audio':
      return {
        class: 'media-icon-audio',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`
      }
    default:
      return null
  }
})

const isExternalMedia = computed(() => {
  // If we have a Vimeo ID for this slug, treat it as a video
  if (vimeoIdMap[props.slug]) return true
  
  return props.mediaType === 'video' || props.mediaType === 'audio'
})

const providerLabel = computed(() => {
  // If we have a Vimeo ID for this slug, it's a Vimeo video
  if (vimeoIdMap[props.slug]) return 'Vimeo'
  
  if (props.videoProvider === 'vimeo') return 'Vimeo'
  if (props.videoProvider === 'youtube') return 'YouTube'
  if (props.mediaType === 'video') return 'Video'
  if (props.mediaType === 'audio') return 'Audio'
  return 'External Media'
})

// Update to use flat file structure
const itemUrl = computed(() => {
  return `/workbook/${props.slug}`
})
</script>

<template>
  <a :href="itemUrl" class="workbook-item">
    <div class="media-thumbnail">
      <img :src="effectiveImageUrl" :alt="title" loading="lazy" />
      
      <div v-if="providerLabel === 'Vimeo'" class="provider-badge vimeo-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#00ADEF">
          <path d="M23.9765 6.4168c-.1044-2.2841-1.6856-4.0032-3.969-3.8968-5.3211.1056-6.9648 4.0092-7.1772 7.4348 1.5048-.0636 2.3004-.1056 3.6168-.3492.7752-.1272 1.6812.5124 1.8288 1.7964.12 1.0644-.3492 2.1624-1.26 3.012-.9108.8484-2.4756 1.3668-3.5508.8124-.8748-.4548-1.5552-2.256-1.2072-5.0892.4644-3.7692 1.3248-7.6032 1.224-8.172-.1044-.7116-.6924-1.7532-3.416-1.29-1.7316.2952-3.9444 3.0492-4.9776 5.436-.1368.324-.4044.4812-.6312.1056-.6708-1.0872-1.9104-2.7-1.3428-5.2836.12-.5268-.3492-.7116-1.0644-.4764-.7488.2436-1.6248.5376-2.256.7812-2.1216.8268-3.096 2.304-2.6064 4.8372C.1581 8.9956.7929 14.58 1.7953 17.5068c.66 1.9104 2.3964 4.0284 4.8888 3.1152 1.8288-.6696 3.9804-2.3616 5.1216-7.5168.12-.5268.1824-.612.5316-.6756.324-.0516.612-.0768.9432-.0768.324 0 .648.0252.96.0768.3492.0636.4116.1488.516.6756 1.14 5.1552 3.2928 6.8472 5.1228 7.5168 2.4912.9132 4.2288-1.2048 4.8888-3.1152 1.0032-2.928 1.6368-8.5116 1.68-11.0" />
        </svg>
      </div>
      
      <div v-else-if="providerLabel === 'YouTube'" class="provider-badge youtube-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      </div>
      
      <div v-else-if="mediaTypeIcon" class="media-type-icon" :class="mediaTypeIcon.class" v-html="mediaTypeIcon.svg">
      </div>
    </div>
    
    <div class="item-details">
      <h3 class="item-title">{{ title }}</h3>
      
      <div v-if="formattedDate" class="item-date">{{ formattedDate }}</div>
      
      <p v-if="description" class="item-description">{{ description }}</p>
      
      <div v-if="tags.length > 0" class="item-tags">
        <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
  </a>
</template>

<style scoped>
.workbook-item {
  display: block;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.workbook-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.media-thumbnail {
  position: relative;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: var(--vp-c-bg-alt);
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
  color: var(--vp-c-brand);
}

.item-details {
  padding: 16px;
}

.item-title {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
}

.item-date {
  font-size: 0.85rem;
  margin-bottom: 8px;
  color: var(--vp-c-text-2);
}

.item-description {
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 12px;
  color: var(--vp-c-text-2);
  
  /* Limit to 3 lines with ellipsis */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  background-color: var(--vp-c-bg-alt);
  border-radius: 12px;
  color: var(--vp-c-text-2);
}
</style>

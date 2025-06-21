<template>
  <div class="media-embed" :class="mediaClass">
    <!-- Video embeds -->
    <div v-if="type === 'video'" class="video-container">
      <!-- Vimeo -->
      <div v-if="provider === 'vimeo'" class="video-responsive">
        <iframe 
          :src="`https://player.vimeo.com/video/${extractVimeoId(url)}?title=0&byline=0&portrait=0&badge=0`"
          frameborder="0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
      
      <!-- YouTube -->
      <div v-else-if="provider === 'youtube'" class="video-responsive">
        <iframe 
          :src="`https://www.youtube.com/embed/${extractYouTubeId(url)}`"
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
      
      <!-- Direct video file -->
      <div v-else class="video-responsive direct-video">
        <video controls :src="url">
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
    
    <!-- Audio embeds -->
    <div v-else-if="type === 'audio'" class="audio-container">
      <audio controls :src="url">
        Your browser does not support the audio tag.
      </audio>
    </div>
    
    <!-- Image Gallery -->
    <div v-else-if="type === 'gallery'" class="gallery-container">
      <!-- Simple gallery implementation; could be enhanced with a carousel -->
      <div class="gallery-grid">
        <div v-for="(image, index) in galleryImages" :key="index" class="gallery-item">
          <img :src="image.url" :alt="image.alt || `Image ${index + 1}`" loading="lazy" />
        </div>
      </div>
    </div>
    
    <!-- Custom embed (e.g., CodePen, JSFiddle, etc.) -->
    <div v-else-if="type === 'custom'" class="custom-embed" v-html="safeEmbedCode"></div>
    
    <!-- Fallback for unknown or unhandled types -->
    <div v-else class="media-link">
      <a :href="url" target="_blank" rel="noopener noreferrer">
        View Media: {{ url }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: value => ['video', 'audio', 'image', 'gallery', 'custom'].includes(value)
  },
  provider: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true
  },
  galleryImages: {
    type: Array,
    default: () => []
  },
  embedCode: {
    type: String,
    default: ''
  }
})

// CSS class based on media type
const mediaClass = computed(() => `media-type-${props.type}`)

// Extract Vimeo video ID from URL
function extractVimeoId(url) {
  if (!url) return ''
  
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/)
  return match ? match[1] : ''
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return ''
  
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : ''
}

// Sanitized embed code (for custom embeds)
// In a real app, you'd want to use a proper sanitizer library
const safeEmbedCode = computed(() => {
  // Very basic sanitization for demo purposes
  if (!props.embedCode) return ''
  
  return props.embedCode
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
})
</script>

<style scoped>
.media-embed {
  margin-bottom: 2rem;
}

.video-container,
.audio-container,
.gallery-container,
.custom-embed,
.media-link {
  border-radius: 8px;
  overflow: hidden;
}

.video-responsive {
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  background-color: #000;
}

.video-responsive iframe,
.video-responsive video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.audio-container {
  background-color: var(--vp-c-bg-soft);
  padding: 1rem;
}

.audio-container audio {
  width: 100%;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.gallery-item {
  border-radius: 4px;
  overflow: hidden;
}

.gallery-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover img {
  transform: scale(1.05);
}

.media-link {
  background-color: var(--vp-c-bg-soft);
  padding: 1rem;
  text-align: center;
}

.media-link a {
  color: var(--vp-c-brand);
  font-weight: var(--font-normal);
  text-decoration: none;
}

.media-link a:hover {
  text-decoration: underline;
}
</style>
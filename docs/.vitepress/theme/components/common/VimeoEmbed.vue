<!-- VimeoEmbed.vue - Clean Vimeo integration with dynamic aspect ratios -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Icon from '../common/Icon.vue'
import { useMediaDimensions } from '../../composables/useMediaDimensions'

const props = defineProps({
  videoId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  showPresentationButton: {
    type: Boolean,
    default: true
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  loop: {
    type: Boolean,
    default: false
  },
  muted: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-presentation'])

// Use the media dimensions composable
const { 
  aspectRatio, 
  isLoading: isLoadingDimensions, 
  aspectRatioType, 
  paddingBottomPercent,
  fetchDimensions 
} = useMediaDimensions()

// Local loading and error states for the iframe
const isLoading = ref(true)
const hasError = ref(false)

// Fetch video dimensions when component mounts
onMounted(() => {
  fetchDimensions(`https://vimeo.com/${props.videoId}`)
})

// Also fetch video info when videoId changes (for navigation between videos)
watch(() => props.videoId, () => {
  // Reset loading states
  isLoading.value = true
  hasError.value = false
  
  // Fetch new video dimensions
  fetchDimensions(`https://vimeo.com/${props.videoId}`)
}, { immediate: false })

// Build Vimeo embed URL with parameters for responsive embedding
const embedUrl = computed(() => {
  const baseUrl = `https://player.vimeo.com/video/${props.videoId}`
  const params = new URLSearchParams({
    title: '0',
    byline: '0',
    portrait: '0',
    dnt: '1' // Do not track
    // Removed 'responsive: 1' - this might be causing Vimeo to add its own letterboxing
  })
  
  if (props.autoplay) params.set('autoplay', '1')
  if (props.loop) params.set('loop', '1')
  if (props.muted) params.set('muted', '1')
  
  return `${baseUrl}?${params.toString()}`
})

function handleVideoLoaded() {
  isLoading.value = false
}

function handleVideoError() {
  isLoading.value = false
  hasError.value = true
}

function togglePresentationMode() {
  emit('toggle-presentation')
}

// Get Vimeo direct URL for fallback
const vimeoUrl = computed(() => `https://vimeo.com/${props.videoId}`)

// Map composable's aspect ratio type to our CSS classes
const videoType = computed(() => {
  const type = aspectRatioType.value
  switch (type) {
    case 'square': return 'square'
    case 'portrait': return 'portrait' 
    case 'landscape': return 'landscape'
    default: return 'landscape' // Default to landscape
  }
})
</script>

<template>
  <div class="vimeo-embed-container" :class="`video-${videoType}`">
    <!-- Presentation mode toggle button -->
    <button 
      v-if="showPresentationButton"
      class="presentation-toggle btn-icon-overlay"
      @click="togglePresentationMode"
      aria-label="Enter presentation mode"
    >
      <Icon name="Maximize2" :size="18" />
      <span class="btn-text">Present</span>
    </button>
    
    <!-- Loading indicator -->
    <div v-if="isLoading || isLoadingDimensions" class="embed-loading">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- Error state -->
    <div v-if="hasError" class="embed-error">
      <Icon name="AlertCircle" :size="24" />
      <p class="error-message">Failed to load video</p>
      <a :href="vimeoUrl" target="_blank" rel="noopener noreferrer" class="error-link">
        Open on Vimeo
      </a>
    </div>
    
    <!-- Vimeo embed - responsive with dynamic aspect ratio -->
    <div 
      v-if="!hasError" 
      class="vimeo-wrapper"
      :class="{ 'loaded': !isLoading && !isLoadingDimensions }"
      :style="{ paddingBottom: `${paddingBottomPercent}%` }"
    >
      <iframe
        :src="embedUrl"
        :title="title || `Vimeo video ${videoId}`"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
        allowfullscreen
        @load="handleVideoLoaded"
        @error="handleVideoError"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.vimeo-embed-container {
  position: relative;
  width: 100%;
  margin-bottom: var(--space-6);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  background: var(--surface-secondary);
  transition: var(--transition-base);
  margin-left: auto;
  margin-right: auto;
}

/* Square videos (1:1) - constrain by viewport height */
.vimeo-embed-container.video-square {
  max-width: 100vh;
}

/* Portrait videos - also constrain by viewport height */
.vimeo-embed-container.video-portrait {
  max-width: 100vh;
}

/* Landscape videos (16:9, etc.) - allow full width */
.vimeo-embed-container.video-landscape {
  max-width: 100vw;
}

.vimeo-embed-container:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Presentation toggle button */
.presentation-toggle {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  z-index: 10;
  transition: var(--transition-fast);
  backdrop-filter: blur(4px);
}

.presentation-toggle:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translateY(-1px);
}

.btn-text {
  font-size: var(--text-xs);
  letter-spacing: 0.05em;
}

/* Responsive video wrapper - Dynamic aspect ratio */
.vimeo-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  opacity: 0;
  transition: opacity var(--transition-slow);
  /* padding-bottom set dynamically via :style based on actual video dimensions */
}

.vimeo-wrapper.loaded {
  opacity: 1;
}

.vimeo-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Loading state */
.embed-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: var(--surface-tertiary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-primary);
  border-radius: 50%;
  border-top-color: var(--accent-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error state */
.embed-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: var(--space-6);
  text-align: center;
  color: var(--text-secondary);
}

.error-message {
  margin: var(--space-2) 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.error-link {
  margin-top: var(--space-2);
  color: var(--accent-primary);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  letter-spacing: 0.02em;
}

.error-link:hover {
  text-decoration: underline;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .vimeo-embed-container {
    margin-bottom: var(--space-4);
  }
  
  .presentation-toggle {
    top: var(--space-2);
    right: var(--space-2);
    padding: var(--space-1) var(--space-2);
  }
  
  .btn-text {
    display: none; /* Show only icon on mobile */
  }
}

/* Touch-friendly button sizing */
@media (hover: none) and (pointer: coarse) {
  .presentation-toggle {
    min-width: 44px;
    min-height: 44px;
    padding: var(--space-2);
  }
}
</style>
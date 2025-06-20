<!-- VimeoEmbed.vue - Clean Vimeo integration with dynamic aspect ratios and mobile rotation support -->
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  },
  enableMobileRotationHints: {
    type: Boolean,
    default: true
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

// Mobile rotation state
const isMobile = ref(false)
const isPortrait = ref(true)
const showRotationHint = ref(false)
const isFullscreen = ref(false)

// Detect mobile device
const detectMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Check device orientation
const checkOrientation = () => {
  isPortrait.value = window.innerHeight > window.innerWidth
  
  // Show rotation hint for wide videos on mobile portrait
  if (isMobile.value && props.enableMobileRotationHints && aspectRatioType.value === 'landscape') {
    const hintDismissed = localStorage.getItem('vimeo-rotation-hint-dismissed')
    showRotationHint.value = isPortrait.value && !hintDismissed && !isFullscreen.value
  }
}

// Handle orientation change
const handleOrientationChange = () => {
  setTimeout(() => {
    checkOrientation()
  }, 100)
}

// Handle fullscreen change
const handleFullscreenChange = () => {
  isFullscreen.value = !!(document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement)
  
  // Hide rotation hint when in fullscreen
  if (isFullscreen.value) {
    showRotationHint.value = false
  }
}

// Fetch video dimensions when component mounts
onMounted(() => {
  fetchDimensions(`https://vimeo.com/${props.videoId}`)
  detectMobile()
  checkOrientation()
  
  // Add event listeners
  window.addEventListener('orientationchange', handleOrientationChange)
  window.addEventListener('resize', handleOrientationChange)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
})

onUnmounted(() => {
  // Remove event listeners
  window.removeEventListener('orientationchange', handleOrientationChange)
  window.removeEventListener('resize', handleOrientationChange)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})

// Also fetch video info when videoId changes (for navigation between videos)
watch(() => props.videoId, () => {
  // Reset loading states
  isLoading.value = true
  hasError.value = false
  
  // Fetch new video dimensions
  fetchDimensions(`https://vimeo.com/${props.videoId}`)
}, { immediate: false })

// Watch for aspect ratio changes to update rotation hint
watch(aspectRatioType, () => {
  if (isMobile.value && props.enableMobileRotationHints) {
    checkOrientation()
  }
})

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
  // Show rotation hint after video loads if needed
  if (isMobile.value && props.enableMobileRotationHints) {
    setTimeout(checkOrientation, 500)
  }
}

function handleVideoError() {
  isLoading.value = false
  hasError.value = true
}

function togglePresentationMode() {
  emit('toggle-presentation')
}

// Mobile rotation actions
function dismissRotationHint() {
  showRotationHint.value = false
  localStorage.setItem('vimeo-rotation-hint-dismissed', 'true')
}

async function requestFullscreen() {
  try {
    const container = document.querySelector('.vimeo-embed-container')
    if (!container) return
    
    if (!document.fullscreenElement) {
      await container.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.warn('Fullscreen request failed:', error)
  }
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

// Dynamic container classes
const containerClasses = computed(() => [
  'vimeo-embed-container',
  `video-${videoType.value}`,
  {
    'mobile-device': isMobile.value,
    'mobile-portrait': isMobile.value && isPortrait.value,
    'mobile-landscape': isMobile.value && !isPortrait.value,
    'show-hint': showRotationHint.value
  }
])
</script>

<template>
  <div :class="containerClasses">
    <!-- Mobile rotation hint overlay -->
    <div 
      v-if="showRotationHint" 
      class="rotation-hint-overlay"
      @click="dismissRotationHint"
    >
      <div class="rotation-hint-content">
        <div class="rotate-icon">📱➡️📺</div>
        <p class="hint-text">
          Rotate your device for a better<br>
          video viewing experience
        </p>
        <div class="hint-actions">
          <button 
            class="hint-btn primary" 
            @click.stop="requestFullscreen"
          >
            <Icon name="Maximize2" :size="16" />
            Fullscreen
          </button>
          <button 
            class="hint-btn secondary" 
            @click.stop="dismissRotationHint"
          >
            Continue
          </button>
        </div>
      </div>
    </div>

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

    <!-- Mobile fullscreen button -->
    <button 
      v-if="isMobile && !showRotationHint"
      class="mobile-fullscreen-btn"
      @click="requestFullscreen"
      aria-label="Enter fullscreen"
    >
      <Icon name="Maximize" :size="20" />
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

/* Mobile landscape optimizations */
.vimeo-embed-container.mobile-landscape.video-landscape {
  border-radius: 0;
  margin-bottom: 0;
}

/* Fullscreen styles */
.vimeo-embed-container:fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.vimeo-embed-container:fullscreen .vimeo-wrapper {
  width: 100%;
  height: 100%;
  padding-bottom: 0 !important;
}

.vimeo-embed-container:fullscreen .vimeo-wrapper iframe {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Rotation hint overlay */
.rotation-hint-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.rotation-hint-content {
  text-align: center;
  color: white;
  padding: var(--space-8);
  max-width: 280px;
}

.rotate-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  animation: rotateHint 2s ease-in-out infinite;
}

@keyframes rotateHint {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(90deg); }
}

.hint-text {
  font-size: var(--text-base);
  margin-bottom: var(--space-6);
  line-height: 1.4;
  opacity: 0.9;
}

.hint-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.hint-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.hint-btn.primary {
  background: var(--accent-primary);
  color: white;
}

.hint-btn.primary:hover {
  background: var(--accent-primary-hover);
  transform: translateY(-1px);
}

.hint-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hint-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Mobile fullscreen button */
.mobile-fullscreen-btn {
  position: absolute;
  bottom: var(--space-3);
  right: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  z-index: 10;
  transition: var(--transition-fast);
  backdrop-filter: blur(4px);
}

.mobile-fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translateY(-1px);
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

/* Hide mobile controls on desktop */
@media (min-width: 769px) {
  .mobile-fullscreen-btn {
    display: none;
  }
  
  .rotation-hint-overlay {
    display: none;
  }
}

/* Mobile landscape specific styles */
@media screen and (max-width: 768px) and (orientation: landscape) {
  .vimeo-embed-container.video-landscape {
    width: 100vw;
    height: 80vh;
    max-width: 100vw;
    max-height: 80vh;
    border-radius: 0;
  }
  
  .vimeo-wrapper {
    height: 100% !important;
    padding-bottom: 0 !important;
  }
  
  .rotation-hint-overlay {
    display: none;
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

/* iOS Safari specific fixes */
@supports (-webkit-appearance: none) {
  .vimeo-embed-container:fullscreen {
    width: 100vw;
    height: 100vh;
  }
}
</style>
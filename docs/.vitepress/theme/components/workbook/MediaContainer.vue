<!-- MediaContainer.vue -->
<script setup>
import { ref, computed } from 'vue'
import { getEmbedUrl, isEmbeddable } from '../../utils/mediaUtils'

const props = defineProps({
  media: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['toggle-presentation'])

const isLoading = ref(true)
const hasError = ref(false)

// Media computations
const embedUrl = computed(() => getEmbedUrl(props.media))
const isMediaEmbeddable = computed(() => isEmbeddable(props.media))

function handleMediaLoaded() {
  isLoading.value = false
}

function handleMediaError() {
  isLoading.value = false
  hasError.value = true
}

function togglePresentationMode() {
  emit('toggle-presentation')
}
</script>

<template>
  <div class="media-container rounded-md overflow-hidden bg-surface-soft transition-base" :class="{ 'is-loading': isLoading, 'has-error': hasError }">
    <!-- Presentation mode toggle button -->
    <button 
      v-if="media.type === 'video' || media.type === 'image'"
      class="presentation-mode-toggle btn btn-primary"
      @click="togglePresentationMode"
      aria-label="Enter presentation mode"
    >
      <span class="toggle-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Custom "presentation" icon that's distinct from fullscreen -->
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <rect x="6" y="14" width="12" height="5" rx="1" ry="1"></rect>
        </svg>
      </span>
      <span class="toggle-text text-sm">Presentation Mode</span>
    </button>
    
    <!-- Loading indicator -->
    <div v-if="isLoading" class="media-loading flex items-center justify-center bg-surface-soft">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- Error state -->
    <div v-if="hasError" class="media-error p-8 flex flex-col items-center justify-center text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p class="text-danger">Failed to load media content</p>
      <a :href="media.url" target="_blank" rel="noopener noreferrer" class="text-brand">Open in new window</a>
    </div>
    
    <!-- Video media -->
    <div 
      v-if="media.type === 'video' && isMediaEmbeddable && !hasError" 
      class="video-embed"
      :class="{ 'visible': !isLoading }"
    >
      <iframe
        :src="embedUrl"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        @load="handleMediaLoaded"
        @error="handleMediaError"
      ></iframe>
    </div>
    
    <!-- Image media -->
    <div 
      v-else-if="media.type === 'image' && !hasError" 
      class="image-embed"
      :class="{ 'visible': !isLoading }"
    >
      <img 
        :src="media.url" 
        :alt="title" 
        @load="handleMediaLoaded"
        @error="handleMediaError"
      />
    </div>
    
    <!-- Link to media if not embedding -->
    <div v-else-if="!hasError" class="media-link">
      <a :href="media.url" target="_blank" rel="noopener noreferrer">
        View {{ media.type || 'media' }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.media-container {
  position: relative;
  margin-bottom: 2.5rem;
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  transition: all 0.2s ease;
}

.media-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.presentation-mode-toggle {
  position: absolute;
  top: 15px;
  left: 15px; /* Positioned in top-left corner */
  background-color: var(--vp-c-brand); /* Use brand color */
  color: white;
  border: none;
  border-radius: 6px; /* Slightly more rounded */
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* Add slight shadow for depth */
}

.presentation-mode-toggle:hover {
  background-color: var(--vp-c-brand-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-text {
  font-size: 0.85rem;
  letter-spacing: 0.01em; /* Slight letter spacing for emphasis */
}

.video-embed {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  max-width: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-embed.visible {
  opacity: 1;
}

.video-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-embed {
  width: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-embed.visible {
  opacity: 1;
}

.image-embed img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

/* Loading state */
.media-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--vp-c-bg-soft);
  z-index: 5;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--vp-c-brand);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error state */
.media-error {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-danger);
  text-align: center;
  min-height: 200px;
}

.media-error svg {
  margin-bottom: 0.5rem;
}

.media-error a {
  margin-top: 0.5rem;
  color: var(--vp-c-brand);
  text-decoration: none;
}

.media-error a:hover {
  text-decoration: underline;
}

/* Media queries */
@media (max-width: 768px) {
  .presentation-mode-toggle {
    top: 10px;
    left: 10px;
    padding: 6px 10px;
  }
  
  .toggle-text {
    display: none; /* Hide text on mobile, show only icon */
  }
  
  .media-container {
    margin-bottom: 1.5rem;
  }
}

/* Dark mode */
html.dark .media-loading {
  background-color: var(--vp-c-bg-soft);
}

html.dark .loading-spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--vp-c-brand);
}
</style>
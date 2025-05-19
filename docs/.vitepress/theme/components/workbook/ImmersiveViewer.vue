<!-- ImmersiveViewer.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useData } from 'vitepress';

// Props for the component
const props = defineProps({
  // Media properties
  mediaType: {
    type: String,
    default: 'video'
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaProvider: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  
  // Content metadata
  title: {
    type: String,
    default: ''
  },
  
  // Presentation options
  presentation: {
    type: Object,
    default: () => ({
      immersive: true,
      autoplay: false,
      loop: true,
      showControls: true,
      startTime: 0,
      endTime: null,
      backgroundMode: 'blurred',
      accentColor: null
    })
  },
  
  // Technical details
  technicalDetails: {
    type: Object,
    default: () => ({
      tools: [],
      format: '',
      duration: ''
    })
  }
});

// Emits
const emit = defineEmits(['close']);

// Get VitePress data
const { page } = useData();

// State
const isActive = ref(true);
const isFullscreen = ref(false);
const isPlaying = ref(props.presentation.autoplay || false);
const showControls = ref(true);
const controlsTimer = ref(null);
const isMuted = ref(false);
const volume = ref(1);
const playerRef = ref(null);
const containerRef = ref(null);

// Computed values
const backgroundStyle = computed(() => {
  if (props.presentation.backgroundMode === 'blurred') {
    return {
      backgroundImage: `url(${props.thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'blur(20px) brightness(0.3)',
      opacity: 0.8
    };
  } else if (props.presentation.backgroundMode === 'color') {
    const color = props.presentation.accentColor || '#000000';
    return {
      backgroundColor: color,
      opacity: 0.9
    };
  } else {
    return {
      backgroundColor: '#000000'
    };
  }
});

const accentColor = computed(() => {
  return props.presentation.accentColor || '#ffffff';
});

// Methods
function close() {
  isActive.value = false;
  
  // Update URL to remove immersive parameter
  const url = new URL(window.location.href);
  url.searchParams.delete('immersive');
  window.history.replaceState({}, '', url.toString());
  
  // Emit close event
  emit('close');
}

function togglePlay() {
  if (playerRef.value) {
    if (isPlaying.value) {
      playerRef.value.pause();
    } else {
      playerRef.value.play();
    }
    isPlaying.value = !isPlaying.value;
  }
}

function toggleMute() {
  if (playerRef.value) {
    isMuted.value = !isMuted.value;
    playerRef.value.muted = isMuted.value;
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (containerRef.value.requestFullscreen) {
      containerRef.value.requestFullscreen();
    } else if (containerRef.value.webkitRequestFullscreen) {
      containerRef.value.webkitRequestFullscreen();
    } else if (containerRef.value.msRequestFullscreen) {
      containerRef.value.msRequestFullscreen();
    }
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    isFullscreen.value = false;
  }
}

function setVolume(event) {
  if (playerRef.value) {
    volume.value = event.target.value;
    playerRef.value.volume = volume.value;
    isMuted.value = volume.value === 0;
  }
}

function handleMouseMove() {
  showControls.value = true;
  
  // Clear existing timer
  if (controlsTimer.value) {
    clearTimeout(controlsTimer.value);
  }
  
  // Start new timer to hide controls
  controlsTimer.value = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false;
    }
  }, 3000);
}

function handleKeyDown(event) {
  // Handle keyboard shortcuts
  if (event.key === 'Escape') {
    close();
  } else if (event.key === ' ' || event.key === 'k') {
    togglePlay();
    event.preventDefault();
  } else if (event.key === 'f') {
    toggleFullscreen();
    event.preventDefault();
  } else if (event.key === 'm') {
    toggleMute();
    event.preventDefault();
  }
}

// Extract video ID functions
function extractVimeoId(url) {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  return match ? match[1] : null;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Watching for document fullscreen changes
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

// Lifecycle hooks
onMounted(() => {
  // Check if URL should have immersive parameter
  if (!window.location.search.includes('immersive=true')) {
    // Add immersive parameter to URL
    const url = new URL(window.location.href);
    url.searchParams.set('immersive', 'true');
    window.history.replaceState({}, '', url.toString());
  }
  
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown);
  
  // Add fullscreen change listener
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // Initialize player if it exists
  if (playerRef.value) {
    playerRef.value.volume = volume.value;
    playerRef.value.muted = isMuted.value;
    
    if (props.presentation.autoplay) {
      playerRef.value.play().catch(() => {
        // Autoplay was prevented
        isPlaying.value = false;
      });
    }
  }
  
  // Start controls timer
  handleMouseMove();
});

onBeforeUnmount(() => {
  // Remove event listeners
  window.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // Clear timers
  if (controlsTimer.value) {
    clearTimeout(controlsTimer.value);
  }
});

// Watch for changes to playing state from embedded players
watch(isPlaying, (newValue) => {
  if (newValue) {
    // If playing, start hiding controls timer
    handleMouseMove();
  } else {
    // If paused, always show controls
    showControls.value = true;
    if (controlsTimer.value) {
      clearTimeout(controlsTimer.value);
    }
  }
});
</script>

<template>
  <div 
    v-if="isActive" 
    ref="containerRef"
    class="immersive-viewer" 
    @mousemove="handleMouseMove"
    :class="{ 'controls-hidden': !showControls }"
  >
    <!-- Background layer -->
    <div class="background-layer" :style="backgroundStyle"></div>
    
    <!-- Content layer -->
    <div class="content-layer">
      <!-- Video content -->
      <div v-if="mediaType === 'video'" class="video-container">
        <!-- Vimeo embed -->
        <iframe 
          v-if="mediaProvider === 'vimeo'"
          ref="playerRef"
          :src="`https://player.vimeo.com/video/${extractVimeoId(mediaUrl)}?autoplay=${presentation.autoplay ? 1 : 0}&loop=${presentation.loop ? 1 : 0}&title=0&byline=0&portrait=0&background=1`"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
        
        <!-- YouTube embed -->
        <iframe 
          v-else-if="mediaProvider === 'youtube'"
          ref="playerRef"
          :src="`https://www.youtube.com/embed/${extractYouTubeId(mediaUrl)}?autoplay=${presentation.autoplay ? 1 : 0}&loop=${presentation.loop ? 1 : 0}&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3`"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
        
        <!-- Native video player -->
        <video 
          v-else
          ref="playerRef"
          :src="mediaUrl"
          :poster="thumbnailUrl"
          :autoplay="presentation.autoplay"
          :loop="presentation.loop"
          :controls="false"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @ended="isPlaying = false"
        ></video>
      </div>
      
      <!-- Image content -->
      <div v-else-if="mediaType === 'image'" class="image-container">
        <img :src="mediaUrl" :alt="title" />
      </div>
      
      <!-- Audio content -->
      <div v-else-if="mediaType === 'audio'" class="audio-container">
        <audio 
          ref="playerRef"
          :src="mediaUrl"
          :autoplay="presentation.autoplay"
          :loop="presentation.loop"
          :controls="false"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @ended="isPlaying = false"
        ></audio>
        
        <!-- Audio visualization placeholder -->
        <div class="audio-visualization">
          <div class="audio-wave"></div>
        </div>
      </div>
    </div>
    
    <!-- Controls layer -->
    <div class="controls-layer" :class="{ 'visible': showControls }">
      <!-- Top bar with title and close button -->
      <div class="top-controls">
        <h2 class="media-title">{{ title }}</h2>
        <button class="close-button" @click="close" aria-label="Close immersive view">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <!-- Bottom controls for playback -->
      <div v-if="mediaType === 'video' || mediaType === 'audio'" class="bottom-controls">
        <div class="playback-controls">
          <!-- Play/Pause button -->
          <button class="play-button" @click="togglePlay" :aria-label="isPlaying ? 'Pause' : 'Play'">
            <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
          
          <!-- Volume control -->
          <div class="volume-control">
            <button class="mute-button" @click="toggleMute" :aria-label="isMuted ? 'Unmute' : 'Mute'">
              <svg v-if="isMuted || volume === 0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
              <svg v-else-if="volume < 0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              :value="volume" 
              @input="setVolume" 
              class="volume-slider"
              aria-label="Volume"
            />
          </div>
        </div>
        
        <div class="secondary-controls">
          <!-- Fullscreen toggle -->
          <button class="fullscreen-button" @click="toggleFullscreen" :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
            <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Technical details button (to be expanded in Phase 2) -->
      <button v-if="technicalDetails.tools.length || technicalDetails.format || technicalDetails.duration" class="technical-details-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.immersive-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.content-layer {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container, .audio-container, .image-container {
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video-container {
  aspect-ratio: 16 / 9;
  width: 90%;
  max-width: 1600px;
}

.video-container iframe,
.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
}

.image-container img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}

.audio-container {
  width: 80%;
  max-width: 800px;
  height: 200px;
  background-color: rgba(20, 20, 20, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.audio-visualization {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.audio-wave {
  width: 80%;
  height: 80px;
  background: linear-gradient(90deg, var(--vp-c-brand) 0%, var(--vp-c-brand-light) 100%);
  border-radius: 2px;
  opacity: 0.5;
}

/* Controls styling */
.controls-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.controls-layer.visible {
  opacity: 1;
}

.top-controls, .bottom-controls {
  pointer-events: auto;
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
}

.bottom-controls {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
  justify-content: space-between;
}

.top-controls {
  justify-content: space-between;
}

.media-title {
  color: white;
  font-size: 1.2rem;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  margin: 0;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.close-button, .fullscreen-button, .play-button, .mute-button {
  width: 40px;
  height: 40px;
}

.playback-controls, .volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}

.technical-details-button {
  position: absolute;
  top: 20px;
  right: 70px;
  color: white;
}

/* Media queries for responsive layout */
@media (max-width: 768px) {
  .video-container {
    width: 100%;
  }
  
  .media-title {
    font-size: 1rem;
    max-width: 70%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .top-controls, .bottom-controls {
    padding: 10px;
  }
  
  .close-button, .fullscreen-button, .play-button, .mute-button {
    width: 36px;
    height: 36px;
  }
  
  .volume-slider {
    width: 60px;
  }
  
  .technical-details-button {
    right: 60px;
  }
}
</style>
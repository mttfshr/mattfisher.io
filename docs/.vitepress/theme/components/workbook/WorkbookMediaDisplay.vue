<!-- WorkbookMediaDisplay.vue - Enhanced media display for folio view -->
<template>
  <div 
    class="media-display" 
    :class="{ 
      'presentation-mode': presentationMode,
      'video-media': item.media?.type === 'video',
      'image-media': item.media?.type === 'image'
    }"
    @click="$emit('click')"
  >
    <!-- Video Media -->
    <div v-if="item.media?.type === 'video'" class="video-container">
      <div class="video-thumbnail" :class="{ 'clickable': !showPlayer }">
        <img 
          :src="getThumbnail()" 
          :alt="item.title"
          class="thumbnail-image"
        />
        
        <!-- Play overlay -->
        <div v-if="!showPlayer" class="play-overlay">
          <div class="play-button" @click.stop="togglePlayer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        <!-- Video info overlay -->
        <div class="video-info">
          <div class="video-meta">
            <span class="video-provider">{{ item.media.provider?.toUpperCase() }}</span>
            <span v-if="item.media.technicalDetails?.duration" class="video-duration">
              {{ item.media.technicalDetails.duration }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Embedded player (shown when playing) -->
      <div v-if="showPlayer" class="video-player">
        <iframe
          v-if="item.media.provider === 'vimeo'"
          :src="`https://player.vimeo.com/video/${getVimeoId()}?autoplay=1&title=0&byline=0&portrait=0`"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          class="video-iframe"
        ></iframe>
        
        <iframe
          v-else-if="item.media.provider === 'youtube'"
          :src="`https://www.youtube.com/embed/${getYouTubeId()}?autoplay=1`"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="video-iframe"
        ></iframe>
        
        <!-- Close player button -->
        <button class="close-player" @click="showPlayer = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Image Media -->
    <div v-else-if="item.media?.type === 'image'" class="image-container">
      <img 
        :src="getImageUrl()" 
        :alt="item.title"
        class="media-image"
        loading="lazy"
      />
      
      <!-- Image info overlay -->
      <div class="image-info">
        <div class="image-meta">
          <span class="image-type">IMAGE</span>
          <span v-if="item.media.technicalDetails?.format" class="image-format">
            {{ item.media.technicalDetails.format }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Fallback for other media types -->
    <div v-else class="placeholder-media">
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        <span class="placeholder-text">{{ getMediaType() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  presentationMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const showPlayer = ref(false);

// Computed properties
const getMediaType = () => {
  if (!props.item.media) return 'Project';
  const type = props.item.media.type || 'media';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Media URL functions
function getThumbnail() {
  // Priority: Cloudflare > thumbnailUrl > generated
  if (props.item.media?.thumbnail) {
    return props.item.media.thumbnail;
  }
  
  if (props.item.thumbnailUrl) {
    return props.item.thumbnailUrl;
  }
  
  // Generate from video ID
  if (props.item.media?.type === 'video') {
    if (props.item.media.provider === 'vimeo') {
      const vimeoId = getVimeoId();
      return vimeoId ? `/media/thumbnails/vimeo-${vimeoId}.jpg` : '/media/video-placeholder.svg';
    }
    
    if (props.item.media.provider === 'youtube') {
      const youtubeId = getYouTubeId();
      return youtubeId ? `/media/thumbnails/youtube-${youtubeId}.jpg` : '/media/video-placeholder.svg';
    }
  }
  
  return '/media/placeholder.svg';
}

function getImageUrl() {
  return props.item.media?.url || '/media/placeholder.svg';
}

function getVimeoId() {
  if (!props.item.media?.url) return null;
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = props.item.media.url.match(regex);
  return match ? match[1] : null;
}

function getYouTubeId() {
  if (!props.item.media?.url) return null;
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
  const match = props.item.media.url.match(regex);
  return match ? match[1] : null;
}

// Actions
function togglePlayer() {
  if (props.item.media?.embed) {
    showPlayer.value = !showPlayer.value;
  } else {
    // Open in new tab if embedding not enabled
    window.open(props.item.media?.url, '_blank');
  }
}
</script>

<style scoped>
.media-display {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.3s ease;
}

.media-display:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.media-display.presentation-mode {
  cursor: default;
  transform: none;
}

.media-display.presentation-mode:hover {
  transform: none;
}

/* Video Display */
.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.video-thumbnail.clickable {
  cursor: pointer;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-thumbnail:hover .thumbnail-image {
  transform: scale(1.02);
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-thumbnail:hover .play-overlay {
  opacity: 1;
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  color: var(--vp-c-brand);
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-button:hover {
  background: white;
  transform: scale(1.1);
}

.video-info {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.video-meta {
  display: flex;
  gap: 0.5rem;
}

.video-provider,
.video-duration {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Video Player */
.video-player {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
}

.video-iframe {
  width: 100%;
  height: 100%;
}

.close-player {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.close-player:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* Image Display */
.image-container {
  position: relative;
  width: 100%;
}

.media-image {
  width: 100%;
  height: auto;
  display: block;
}

.image-info {
  position: absolute;
  top: 12px;
  left: 12px;
}

.image-meta {
  display: flex;
  gap: 0.5rem;
}

.image-type,
.image-format {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Placeholder */
.placeholder-media {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: var(--vp-c-bg-alt);
}

.placeholder-content {
  text-align: center;
  color: var(--vp-c-text-3);
}

.placeholder-icon {
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 1.1rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .play-button {
    width: 48px;
    height: 48px;
  }
}
</style>

<!-- WorkbookMediaDisplay.vue - Enhanced media display for folio view -->
<template>
  <div 
    class="media-display rounded-xl overflow-hidden bg-surface-soft cursor-pointer transition-base" 
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
        <div v-if="!showPlayer" class="play-overlay overlay">
          <div class="play-button btn-primary rounded-full flex items-center justify-center interactive" @click.stop="togglePlayer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        <!-- Video info overlay -->
        <div class="video-info">
          <div class="video-meta flex gap-2">
            <span class="video-provider badge">{{ item.media.provider?.toUpperCase() }}</span>
            <span v-if="item.media.technicalDetails?.duration" class="video-duration badge">
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
        <button class="close-player btn btn-ghost rounded-full" @click="showPlayer = false">
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
        <div class="image-meta flex gap-2">
          <span class="image-type badge">IMAGE</span>
          <span v-if="item.media.technicalDetails?.format" class="image-format badge">
            {{ item.media.technicalDetails.format }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Fallback for other media types -->
    <div v-else class="placeholder-media flex items-center justify-center bg-surface-alt">
      <div class="placeholder-content text-center text-tertiary">
        <div class="placeholder-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        <span class="placeholder-text text-lg font-medium">{{ getMediaType() }}</span>
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

.close-player:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* Image display */
.image-container {
  position: relative;
  width: 100%;
}

.media-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Image info positioning */
.image-info {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
}

/* Placeholder styling */
.placeholder-media {
  height: 300px;
}

.placeholder-icon {
  margin-bottom: var(--space-4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .play-button {
    width: 48px;
    height: 48px;
  }
}
</style>

<!-- docs/.vitepress/theme/components/pins/PinDetail.vue -->
<template>
  <div class="pin-detail">
    <div class="pin-detail-container">
      <!-- Type-specific content display -->
      <div class="pin-content" :class="[`type-${pin.contentType}`]">
        <!-- Music content -->
        <div v-if="pin.contentType === 'music'" class="music-content">
          <div class="album-cover">
            <img v-if="pin.imageUrl" :src="pin.imageUrl" :alt="pin.title" />
            <div v-else class="fallback-cover">
              <div class="music-icon">🎵</div>
            </div>
          </div>
          
          <div class="music-info">
            <h2>{{ pin.title }}</h2>
            <p v-if="pin.artist" class="artist">{{ pin.artist }}</p>
            <a :href="pin.url" target="_blank" rel="noopener" class="action-button">
              Listen on {{ getMusicService(pin.url) }}
            </a>
          </div>
        </div>
        
        <!-- Video content -->
        <div v-else-if="pin.contentType === 'video'" class="video-content">
          <div class="video-embed" v-html="getEmbedCode(pin.url)"></div>
          <h2>{{ pin.title }}</h2>
          <p v-if="pin.description" class="description">{{ pin.description }}</p>
        </div>
        
        <!-- Default content display -->
        <div v-else class="default-content">
          <div class="content-header">
            <img v-if="pin.imageUrl" :src="pin.imageUrl" :alt="pin.title" class="content-image" />
            <h2>{{ pin.title }}</h2>
          </div>
          
          <p v-if="pin.description" class="description">{{ pin.description }}</p>
          <a :href="pin.url" target="_blank" rel="noopener" class="action-button">
            Visit {{ formatDomain(pin.url) }}
          </a>
        </div>
      </div>
      
      <!-- User notes -->
      <div v-if="pin.notes" class="pin-notes">
        <h3>Notes:</h3>
        <div class="notes-content">{{ pin.notes }}</div>
      </div>
      
      <!-- Metadata -->
      <div class="pin-metadata">
        <div class="metadata-item">
          <span class="metadata-label">Added:</span>
          <span>{{ formatDate(pin.pinDate) }}</span>
        </div>
        
        <div class="metadata-item">
          <span class="metadata-label">Type:</span>
          <span>{{ formatContentType(pin.contentType) }}</span>
        </div>
        
        <div class="metadata-item">
          <span class="metadata-label">Source:</span>
          <span>{{ formatDomain(pin.url) }}</span>
        </div>
      </div>
      
      <!-- Tags -->
      <div class="pin-tags">
        <h3>Tags:</h3>
        <div class="tags-list">
          <span
            v-for="tag in pin.tags"
            :key="tag"
            class="tag"
            @click="emit('tag-click', tag)"
          >
            #{{ tag }}
          </span>
        </div>
      </div>
      
      <!-- Related pins -->
      <div v-if="relatedPins.length > 0" class="related-pins">
        <h3>Related Pins:</h3>
        <div class="related-pins-list">
          <div
            v-for="related in relatedPins"
            :key="related.id"
            class="related-pin"
            @click="emit('pin-click', related)"
          >
            <div class="related-pin-thumbnail">
              <img 
                v-if="related.imageUrl" 
                :src="related.imageUrl" 
                :alt="related.title"
                loading="lazy"
              />
              <div v-else class="related-fallback" :class="[`type-${related.contentType}`]"></div>
            </div>
            <div class="related-pin-info">
              <div class="related-pin-title">{{ related.title }}</div>
              <div class="related-pin-type">{{ formatContentType(related.contentType) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pin: {
    type: Object,
    required: true
  },
  relatedPins: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'tag-click', 'pin-click']);

// Format the domain name
const formatDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (error) {
    return url;
  }
};

// Format content type
const formatContentType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get music service name
const getMusicService = (url) => {
  if (url.includes('spotify.com')) return 'Spotify';
  if (url.includes('apple.com/music')) return 'Apple Music';
  if (url.includes('bandcamp.com')) return 'Bandcamp';
  if (url.includes('soundcloud.com')) return 'SoundCloud';
  if (url.includes('tidal.com')) return 'Tidal';
  return 'the music service';
};

// Generate embed code for video
const getEmbedCode = (url) => {
  // YouTube embed
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be') 
      ? url.split('/').pop().split('?')[0]
      : url.match(/v=([^&]+)/) ? url.match(/v=([^&]+)/)[1] : '';
      
    if (videoId) {
      return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
  }
  
  // Vimeo embed
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop().split('?')[0];
    if (videoId) {
      return `<iframe src="https://player.vimeo.com/video/${videoId}" width="100%" height="400" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
  }
  
  // Fallback
  return `<a href="${url}" target="_blank" rel="noopener" class="video-link">Watch on original site</a>`;
};
</script>

<style scoped>
.pin-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.pin-detail-container {
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  overflow: hidden;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pin-content {
  margin-bottom: 2rem;
}

/* Music content */
.music-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  align-items: center;
}

.album-cover {
  width: 200px;
  height: 200px;
  overflow: hidden;
  border-radius: 8px;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #8e44ad, #3498db);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
}

.music-info {
  flex: 1;
  min-width: 250px;
}

.music-info h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.artist {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--vp-c-text-2);
}

/* Video content */
.video-content {
  width: 100%;
}

.video-embed {
  margin-bottom: 1rem;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
}

.video-embed iframe {
  display: block;
}

.video-content h2 {
  margin: 1rem 0 0.5rem;
}

/* Default content */
.default-content {
  width: 100%;
}

.content-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.content-image {
  width: 180px;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
}

.description {
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

/* Action button */
.action-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-brand);
  color: var(--vp-c-brand-contrast);
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.action-button:hover {
  background-color: var(--vp-c-brand-dark);
}

/* Notes */
.pin-notes {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-left: 4px solid var(--vp-c-brand);
  border-radius: 0 4px 4px 0;
}

.pin-notes h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.notes-content {
  font-style: italic;
  line-height: 1.6;
}

/* Metadata */
.pin-metadata {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: var(--vp-c-bg-alt);
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.metadata-item {
  margin-right: 1.5rem;
}

.metadata-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

/* Tags */
.pin-tags {
  margin: 1.5rem 0;
}

.pin-tags h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background-color: var(--vp-c-bg-alt);
  border-radius: 16px;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.tag:hover {
  background-color: var(--vp-c-brand-light);
  color: var(--vp-c-brand-contrast);
}

/* Related pins */
.related-pins {
  margin-top: 2rem;
}

.related-pins h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.related-pins-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.related-pin {
  background-color: var(--vp-c-bg-alt);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.related-pin:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.related-pin-thumbnail {
  height: 120px;
  overflow: hidden;
}

.related-pin-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-fallback {
  width: 100%;
  height: 100%;
}

.related-fallback.type-music {
  background: linear-gradient(135deg, #8e44ad, #3498db);
}

.related-fallback.type-video {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
}

.related-fallback.type-article {
  background: linear-gradient(135deg, #2ecc71, #1abc9c);
}

.related-fallback.type-code {
  background: linear-gradient(135deg, #34495e, #2c3e50);
}

.related-pin-info {
  padding: 0.75rem;
}

.related-pin-title {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-pin-type {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

/* Responsive design */
@media (max-width: 768px) {
  .music-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .album-cover {
    margin: 0 auto 1rem;
  }
  
  .content-header {
    flex-direction: column;
  }
  
  .content-image {
    width: 100%;
    max-width: 300px;
    margin: 0 auto 1rem;
  }
  
  .related-pins-list {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>

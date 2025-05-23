<!-- docs/.vitepress/theme/components/pins/PinCard.vue -->
<template>
  <div class="pin-card" :class="[`type-${pin.contentType}`]" @click="emit('click', pin)">
    <div class="pin-thumbnail">
      <img 
        v-if="pin.imageUrl" 
        :src="pin.imageUrl" 
        :alt="pin.title" 
        loading="lazy"
      />
      <div v-else class="fallback-thumbnail" :class="[`type-${pin.contentType}`]">
        <div class="content-type-icon">
          <component :is="getContentTypeIcon(pin.contentType)" />
        </div>
      </div>
    </div>
    
    <div class="pin-info">
      <div class="pin-header">
        <h3 class="pin-title">{{ pin.title || 'Untitled' }}</h3>
        <div class="pin-source">
          <img v-if="pin.favicon" :src="pin.favicon" class="site-favicon" alt="Site icon" />
          {{ getDomainName(pin.url) }}
        </div>
      </div>
      
      <p v-if="pin.description" class="pin-description">{{ pin.description }}</p>
      
      <div v-if="pin.notes" class="pin-notes">
        "{{ pin.notes }}"
      </div>
      
      <!-- Structured metadata display -->
      <div v-if="hasMetadata" class="structured-metadata">
        <div
          v-for="key in highlightedKeys"
          :key="`metadata-${key}`"
          v-if="pin.metadata && pin.metadata[key] && pin.metadata[key].length > 0"
          class="metadata-group"
        >
          <div 
            v-for="value in pin.metadata[key].slice(0, 3)" 
            :key="`${key}-${value}`"
            class="metadata-tag"
            :class="`meta-${key}`"
            @click.stop="emit('tag-click', `${key}:${value}`)"
          >
            <span class="metadata-icon">{{ getMetadataValueIcon(key, value) }}</span>
            <span class="metadata-value">{{ value }}</span>
          </div>
          
          <div v-if="pin.metadata[key].length > 3" class="more-metadata">
            +{{ pin.metadata[key].length - 3 }} more
          </div>
        </div>
      </div>
      
      <!-- Collections display -->
      <div v-if="hasCollections" class="pin-collections">
        <div 
          v-for="collectionId in pin.collections.slice(0, 2)" 
          :key="`collection-${collectionId}`"
          class="collection-tag"
          @click.stop="emit('tag-click', `collection:${collectionId}`)"
        >
          <span class="collection-icon">{{ getCollectionIcon(collectionId) }}</span>
          <span class="collection-name">{{ getCollectionName(collectionId) }}</span>
        </div>
        
        <div v-if="pin.collections.length > 2" class="more-collections">
          +{{ pin.collections.length - 2 }} more
        </div>
      </div>
      
      <!-- Traditional tags display -->
      <div v-if="pin.tags && pin.tags.length > 0" class="pin-tags">
        <span
          v-for="tag in pin.tags.slice(0, 3)"
          :key="tag"
          class="pin-tag"
          @click.stop="emit('tag-click', tag)"
        >
          #{{ tag }}
        </span>
        
        <span v-if="pin.tags.length > 3" class="more-tags">
          +{{ pin.tags.length - 3 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { h, computed } from 'vue';
import { getCollectionById, getMetadataConfig, getMetadataValueIcon as getValueIcon, getHighlightedMetadataKeys } from '../../../utils/tagConfig';

const props = defineProps({
  pin: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click', 'tag-click']);

// Check if pin has structured metadata
const hasMetadata = computed(() => {
  return props.pin.metadata && Object.keys(props.pin.metadata).length > 0;
});

// Check if pin is in any collections
const hasCollections = computed(() => {
  return props.pin.collections && props.pin.collections.length > 0;
});

// Get highlighted metadata keys to display
const highlightedKeys = computed(() => {
  return getHighlightedMetadataKeys();
});

// Extract domain name from URL
const getDomainName = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (error) {
    return url;
  }
};

// Get collection information
const getCollectionName = (collectionId) => {
  const collection = getCollectionById(collectionId);
  return collection ? collection.name : collectionId;
};

const getCollectionIcon = (collectionId) => {
  const collection = getCollectionById(collectionId);
  return collection ? collection.icon : '📁';
};

// Get metadata value icon
const getMetadataValueIcon = (key, value) => {
  return getValueIcon(key, value);
};

// Icons for different content types
const getContentTypeIcon = (type) => {
  switch (type) {
    case 'music':
      return () => h('svg', { 
        xmlns: 'http://www.w3.org/2000/svg', 
        width: '24', 
        height: '24', 
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        h('path', { d: 'M9 18V5l12-2v13' }),
        h('circle', { cx: '6', cy: '18', r: '3' }),
        h('circle', { cx: '18', cy: '16', r: '3' })
      ]);
      
    case 'video':
      return () => h('svg', { 
        xmlns: 'http://www.w3.org/2000/svg', 
        width: '24', 
        height: '24', 
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        h('polygon', { points: '5 3 19 12 5 21 5 3' })
      ]);
      
    case 'article':
      return () => h('svg', { 
        xmlns: 'http://www.w3.org/2000/svg',

        width: '24', 
        height: '24', 
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        h('path', { d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20' })
      ]);
      
    case 'code':
      return () => h('svg', { 
        xmlns: 'http://www.w3.org/2000/svg', 
        width: '24', 
        height: '24', 
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        h('polyline', { points: '16 18 22 12 16 6' }),
        h('polyline', { points: '8 6 2 12 8 18' })
      ]);
      
    case 'design':
      return () => h('svg', { 
        xmlns: 'http://www.w3.org/2000/svg', 
        width: '24', 
        height: '24', 
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        h('circle', { cx: '12', cy: '12', r: '2' }),
        h('path', { d: 'M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14' })
      ]);
      
    default:
      return () => h('svg', { 
        xmlns: 'http://www.w3.org/2000/svg', 
        width: '24', 
        height: '24', 
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        h('circle', { cx: '12', cy: '12', r: '10' }),
        h('line', { x1: '12', y1: '8', x2: '12', y2: '16' }),
        h('line', { x1: '8', y1: '12', x2: '16', y2: '12' })
      ]);
  }
};
</script>

<style scoped>
.pin-card {
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.pin-thumbnail {
  position: relative;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: var(--vp-c-bg-alt);
  overflow: hidden;
}

.pin-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.fallback-thumbnail.type-music {
  background: linear-gradient(135deg, #8e44ad, #3498db);
}

.fallback-thumbnail.type-video {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
}

.fallback-thumbnail.type-article {
  background: linear-gradient(135deg, #2ecc71, #1abc9c);
}

.fallback-thumbnail.type-code {
  background: linear-gradient(135deg, #34495e, #2c3e50);
}

.fallback-thumbnail.type-design {
  background: linear-gradient(135deg, #e67e22, #d35400);
}

.fallback-thumbnail.type-link {
  background: linear-gradient(135deg, #7f8c8d, #95a5a6);
}

.content-type-icon {
  font-size: 2rem;
}

.pin-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.pin-header {
  margin-bottom: 0.5rem;
}

.pin-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  line-height: 1.4;
}

.pin-source {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.site-favicon {
  width: 14px;
  height: 14px;
  margin-right: 5px;
  object-fit: contain;
}

.pin-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  line-height: 1.5;
}

.pin-notes {
  font-size: 0.9rem;
  font-style: italic;
  color: var(--vp-c-text-1);
  margin: 0.5rem 0;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-left: 3px solid var(--vp-c-brand);
  border-radius: 0 4px 4px 0;
}

/* Structured metadata styles */
.structured-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 0;
}

.metadata-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.metadata-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.metadata-tag:hover {
  background-color: var(--vp-c-brand-light);
  color: var(--vp-c-white);
}

.metadata-icon {
  margin-right: 0.25rem;
}

.metadata-value {
  max-width: 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.more-metadata {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  padding: 0.2rem 0.4rem;
}

/* Type-specific styling */
.meta-type {
  background-color: var(--vp-c-gray-soft);
}

.meta-source {
  background-color: var(--vp-c-gray-dark-soft);
  color: var(--vp-c-gray-light-5);
}

.meta-artist, .meta-creator {
  background-color: var(--vp-c-purple-soft);
  color: var(--vp-c-purple-dark);
}

.meta-year {
  background-color: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-dark);
}

.meta-genre {
  background-color: var(--vp-c-green-soft);
  color: var(--vp-c-green-dark);
}

.meta-mood {
  background-color: var(--vp-c-pink-soft);
  color: var(--vp-c-pink-dark);
}

/* Collections styling */
.pin-collections {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.collection-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.collection-tag:hover {
  background-color: var(--vp-c-brand);
  color: var(--vp-c-white);
}

.collection-icon {
  margin-right: 0.3rem;
}

.collection-name {
  max-width: 120px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.more-collections {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  padding: 0.25rem 0.5rem;
}

/* Traditional tags */
.pin-tags {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pin-tag {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background-color: var(--vp-c-bg-alt);
  border-radius: 12px;
  color: var(--vp-c-text-2);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.pin-tag:hover {
  background-color: var(--vp-c-brand-light);
  color: var(--vp-c-brand-contrast);
}

.more-tags {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  padding: 0.2rem 0.4rem;
}
</style>

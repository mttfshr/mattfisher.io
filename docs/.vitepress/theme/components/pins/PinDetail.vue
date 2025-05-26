<!-- docs/.vitepress/theme/components/pins/PinDetail.vue -->
<template>
  <div class="pin-detail">
    <!-- Header with image, title, description -->
    <div class="pin-header">
      <div class="pin-image-container" v-if="pin.imageUrl">
        <img :src="pin.imageUrl" :alt="pin.title" class="pin-image" />
      </div>
      
      <div class="header-content">
        <h2 class="pin-title">{{ pin.title }}</h2>
        
        <div class="pin-source">
          <a :href="pin.url" target="_blank" rel="noopener noreferrer" class="source-link">
            <img v-if="pin.favicon" :src="pin.favicon" class="site-favicon" alt="Site icon" />
            <span>{{ getDomainName(pin.url) }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="external-link-icon">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
        
        <p v-if="pin.description" class="pin-description">
          {{ pin.description }}
        </p>
      </div>
    </div>
    
    <!-- Notes if available -->
    <div v-if="pin.notes" class="pin-notes">
      <h3>Notes</h3>
      <blockquote>{{ pin.notes }}</blockquote>
    </div>
    
    <!-- Metadata display -->
    <div class="pin-metadata">
      <div class="metadata-section">
        <h3>Metadata</h3>
        
        <div class="metadata-layout">
          <!-- Collections -->
          <div class="metadata-group collections-group" v-if="hasCollections">
            <h4>Collections</h4>
            <div class="collections-list">
              <div 
                v-for="collectionId in pin.collections" 
                :key="`collection-${collectionId}`"
                class="collection-tag"
                @click="emit('tag-click', `collection:${collectionId}`)"
              >
                <span class="collection-icon">{{ getCollectionIcon(collectionId) }}</span>
                {{ getCollectionName(collectionId) }}
              </div>
            </div>
          </div>
          
          <!-- Structured metadata -->
          <div class="metadata-groups" v-if="hasMetadata">
            <!-- Inferred metadata -->
            <div class="metadata-category inferred-metadata" v-if="hasInferredMetadata">
              <h4>
                <span class="category-icon">🤖</span>
                Auto-Detected
              </h4>
              
              <div 
                v-for="key in Object.keys(inferredMetadata)"
                :key="`inferred-${key}`"
                class="metadata-group"
              >
                <div class="metadata-key">
                  <span class="key-icon">{{ getMetadataIcon(key) }}</span>
                  {{ getMetadataLabel(key) }}:
                </div>
                
                <div class="metadata-values">
                  <div 
                    v-for="value in inferredMetadata[key]"
                    :key="`inferred-${key}-${value}`"
                    class="metadata-tag"
                    :class="`meta-${key}`"
                    @click="emit('tag-click', `${key}:${value}`)"
                  >
                    <span class="metadata-icon">{{ getMetadataValueIcon(key, value) }}</span>
                    {{ value }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Manual metadata -->
            <div class="metadata-category manual-metadata" v-if="hasManualMetadata">
              <h4>
                <span class="category-icon">✏️</span>
                Manually Added
              </h4>
              
              <div 
                v-for="key in Object.keys(manualMetadata)"
                :key="`manual-${key}`"
                class="metadata-group"
              >
                <div class="metadata-key">
                  <span class="key-icon">{{ getMetadataIcon(key) }}</span>
                  {{ getMetadataLabel(key) }}:
                </div>
                
                <div class="metadata-values">
                  <div 
                    v-for="value in manualMetadata[key]"
                    :key="`manual-${key}-${value}`"
                    class="metadata-tag"
                    :class="`meta-${key}`"
                    @click="emit('tag-click', `${key}:${value}`)"
                  >
                    <span class="metadata-icon">{{ getMetadataValueIcon(key, value) }}</span>
                    {{ value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Standard tags -->
          <div class="metadata-group tags-group" v-if="pin.tags && pin.tags.length > 0">
            <h4>Tags</h4>
            <div class="tags-list">
              <div 
                v-for="tag in pin.tags" 
                :key="`tag-${tag}`"
                class="pin-tag"
                @click="emit('tag-click', tag)"
              >
                #{{ tag }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Related pins -->
    <div class="related-pins" v-if="relatedPins && relatedPins.length > 0">
      <h3>Related Pins</h3>
      <div class="related-pins-grid">
        <div 
          v-for="relatedPin in relatedPins" 
          :key="`related-${relatedPin.id}`"
          class="related-pin-card"
          @click="emit('pin-click', relatedPin)"
        >
          <div class="related-pin-thumbnail">
            <img 
              v-if="relatedPin.imageUrl" 
              :src="relatedPin.imageUrl" 
              :alt="relatedPin.title" 
              loading="lazy"
            />
            <div 
              v-else 
              class="fallback-thumbnail" 
              :class="`type-${relatedPin.contentType}`"
            >
              <span class="related-type-icon">{{ getTypeIcon(relatedPin.contentType) }}</span>
            </div>
          </div>
          
          <div class="related-pin-info">
            <h4 class="related-pin-title">{{ relatedPin.title }}</h4>
            <div class="related-pin-source">{{ getDomainName(relatedPin.url) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getCollectionById, getMetadataConfig, getMetadataValueIcon as getValueIcon } from '../../../utils/services/content/metadata';

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

const emit = defineEmits(['tag-click', 'pin-click']);

// Check if pin has collections
const hasCollections = computed(() => {
  return props.pin.collections && props.pin.collections.length > 0;
});

// Check if pin has metadata
const hasMetadata = computed(() => {
  return props.pin.metadata && Object.keys(props.pin.metadata).length > 0;
});

// Separate inferred and manual metadata
const inferredMetadata = computed(() => {
  if (!props.pin.metadata || !props.pin.metadataSource) return {};
  
  const result = {};
  
  Object.entries(props.pin.metadata).forEach(([key, values]) => {
    if (props.pin.metadataSource[key] === 'inferred') {
      result[key] = values;
    }
  });
  
  return result;
});

const manualMetadata = computed(() => {
  if (!props.pin.metadata || !props.pin.metadataSource) return {};
  
  const result = {};
  
  Object.entries(props.pin.metadata).forEach(([key, values]) => {
    if (props.pin.metadataSource[key] === 'manual') {
      result[key] = values;
    }
  });
  
  return result;
});

const hasInferredMetadata = computed(() => {
  return Object.keys(inferredMetadata.value).length > 0;
});

const hasManualMetadata = computed(() => {
  return Object.keys(manualMetadata.value).length > 0;
});

// Helper functions
const getDomainName = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (error) {
    return url;
  }
};

const getCollectionName = (collectionId) => {
  const collection = getCollectionById(collectionId);
  return collection ? collection.name : collectionId;
};

const getCollectionIcon = (collectionId) => {
  const collection = getCollectionById(collectionId);
  return collection ? collection.icon : '📁';
};

const getMetadataLabel = (key) => {
  const config = getMetadataConfig(key);
  return config.label;
};

const getMetadataIcon = (key) => {
  const config = getMetadataConfig(key);
  return config.icon;
};

const getMetadataValueIcon = (key, value) => {
  return getValueIcon(key, value);
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'music': return '🎵';
    case 'video': return '🎬';
    case 'article': return '📝';
    case 'code': return '💻';
    case 'design': return '🎨';
    case 'image': return '🖼️';
    case 'document': return '📑';
    case 'social': return '💬';
    default: return '🔗';
  }
};
</script>

<style scoped>
.pin-detail {
  padding: var(--space-6);
  max-width: 100%;
}

.pin-header {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.pin-image-container {
  flex: 0 0 40%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--vp-c-bg-alt);
}

.pin-image {
  width: 100%;
  height: auto;
  display: block;
}

.header-content {
  flex: 1;
}

.pin-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);
}

.pin-source {
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--vp-c-text-2);
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: var(--transition-base);
}

.source-link:hover {
  color: var(--vp-c-brand);
}

.site-favicon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.external-link-icon {
  opacity: 0.6;
}

.pin-description {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--vp-c-text-1);
  margin: 0;
}

.pin-notes {
  margin-bottom: var(--space-6);
}

.pin-notes h3 {
  font-size: var(--text-lg);
  margin: 0 0 var(--space-2);
}

.pin-notes blockquote {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-left: 4px solid var(--vp-c-brand);
  background-color: var(--vp-c-bg-soft);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-style: italic;
}

.pin-metadata {
  margin-bottom: var(--space-8);
}

.metadata-section h3 {
  font-size: var(--text-lg);
  margin: 0 0 var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: var(--border-width) solid var(--vp-c-divider);
}

.metadata-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

.metadata-group {
  margin-bottom: var(--space-4);
}

.metadata-group h4 {
  font-size: var(--text-sm);
  margin: 0 0 var(--space-2);
  font-weight: var(--font-semibold);
  color: var(--vp-c-text-2);
}

.collections-list, .tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.collection-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-xl);
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.collection-tag:hover {
  background-color: var(--vp-c-brand);
  color: var(--vp-c-white);
}

.collection-icon {
  margin-right: var(--space-2);
}

.metadata-category {
  margin-bottom: var(--space-6);
}

.metadata-category h4 {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  color: var(--vp-c-text-1);
}

.category-icon {
  margin-right: var(--space-2);
}

.metadata-key {
  display: flex;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--vp-c-text-2);
  margin-bottom: var(--space-1);
}

.key-icon {
  margin-right: var(--space-1);
}

.metadata-values {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding-left: var(--space-2);
}

.metadata-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-lg);
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-base);
}

.metadata-tag:hover {
  background-color: var(--vp-c-brand-light);
  color: var(--vp-c-white);
}

.metadata-icon {
  margin-right: var(--space-1);
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

.pin-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-lg);
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.pin-tag:hover {
  background-color: var(--vp-c-brand-light);
  color: var(--vp-c-white);
}

/* Related pins */
.related-pins h3 {
  font-size: var(--text-lg);
  margin: 0 0 var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: var(--border-width) solid var(--vp-c-divider);
}

.related-pins-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.related-pin-card {
  display: flex;
  flex-direction: column;
  background-color: var(--vp-c-bg-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
  transition: var(--transition-base);
  cursor: pointer;
  height: 100%;
}

.related-pin-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.related-pin-thumbnail {
  position: relative;
  height: 120px;
  background-color: var(--vp-c-bg-alt);
  overflow: hidden;
}

.related-pin-thumbnail img {
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
  font-size: var(--text-3xl);
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

.related-pin-info {
  padding: var(--space-3);
}

.related-pin-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  line-height: var(--leading-tight);
}

.related-pin-source {
  font-size: var(--text-xs);
  color: var(--vp-c-text-2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .pin-header {
    flex-direction: column;
  }
  
  .pin-image-container {
    flex: none;
    width: 100%;
    max-height: 300px;
    margin-bottom: var(--space-4);
  }
  
  .pin-image {
    height: 100%;
    object-fit: contain;
    background-color: var(--vp-c-bg-alt);
  }
  
  .metadata-layout {
    grid-template-columns: 1fr;
  }
  
  .related-pins-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .related-pins-grid {
    grid-template-columns: 1fr;
  }
}
</style>

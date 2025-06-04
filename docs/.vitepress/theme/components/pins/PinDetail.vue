<!-- docs/.vitepress/theme/components/pins/PinDetail.vue -->
<template>
  <div class="container-centered">
    <!-- Header with image, title, description -->
    <div class="pin-header">
      <div class="pin-image-container" v-if="pin.imageUrl">
        <img :src="pin.imageUrl" :alt="pin.title" class="pin-image" />
      </div>
      
      <div class="header-content">
        <h2 class="content-section-title">{{ pin.title }}</h2>
        
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
        
        <p v-if="pin.description" class="content-section-subtitle">
          {{ pin.description }}
        </p>
      </div>
    </div>
    
    <!-- Notes if available -->
    <div v-if="pin.notes" class="content-section">
      <h3 class="text-lg font-semibold text-primary">Notes</h3>
      <blockquote class="card card-body">{{ pin.notes }}</blockquote>
    </div>
    
    <!-- Metadata display -->
    <div class="content-section">
      <div class="metadata-section">
        <h3 class="content-section-title">Metadata</h3>
        
        <div class="content-responsive">
          <!-- Collections -->
          <div class="metadata-group" v-if="hasCollections">
            <h4 class="text-sm font-semibold text-secondary">Collections</h4>
            <div class="stack-horizontal spacing-tight">
              <div 
                v-for="collectionId in pin.collections" 
                :key="`collection-${collectionId}`"
                class="badge badge-primary interactive"
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
            <div class="metadata-category" v-if="hasInferredMetadata">
              <h4 class="stack-horizontal text-sm text-primary">
                <span class="category-icon">🤖</span>
                Auto-Detected
              </h4>
              
              <div 
                v-for="key in Object.keys(inferredMetadata)"
                :key="`inferred-${key}`"
                class="metadata-group"
              >
                <div class="stack-horizontal text-sm text-secondary">
                  <span class="key-icon">{{ getMetadataIcon(key) }}</span>
                  {{ getMetadataLabel(key) }}:
                </div>
                
                <div class="stack-horizontal spacing-tight">
                  <div 
                    v-for="value in inferredMetadata[key]"
                    :key="`inferred-${key}-${value}`"
                    class="metadata-tag interactive"
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
            <div class="metadata-category" v-if="hasManualMetadata">
              <h4 class="stack-horizontal text-sm text-primary">
                <span class="category-icon">✏️</span>
                Manually Added
              </h4>
              
              <div 
                v-for="key in Object.keys(manualMetadata)"
                :key="`manual-${key}`"
                class="metadata-group"
              >
                <div class="stack-horizontal text-sm text-secondary">
                  <span class="key-icon">{{ getMetadataIcon(key) }}</span>
                  {{ getMetadataLabel(key) }}:
                </div>
                
                <div class="stack-horizontal spacing-tight">
                  <div 
                    v-for="value in manualMetadata[key]"
                    :key="`manual-${key}-${value}`"
                    class="metadata-tag interactive"
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
          <div class="metadata-group" v-if="pin.tags && pin.tags.length > 0">
            <h4 class="text-sm font-semibold text-secondary">Tags</h4>
            <div class="stack-horizontal spacing-tight">
              <div 
                v-for="tag in pin.tags" 
                :key="`tag-${tag}`"
                class="badge interactive"
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
    <div class="content-section" v-if="relatedPins && relatedPins.length > 0">
      <h3 class="content-section-title">Related Pins</h3>
      <div class="gallery-grid">
        <div 
          v-for="relatedPin in relatedPins" 
          :key="`related-${relatedPin.id}`"
          class="card interactive"
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
          
          <div class="card-body">
            <h4 class="text-sm font-semibold text-primary">{{ relatedPin.title }}</h4>
            <div class="text-xs text-secondary">{{ getDomainName(relatedPin.url) }}</div>
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
/* Component-specific styles only */
.pin-header {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.pin-image-container {
  flex: 0 0 40%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--surface-tertiary);
}

.pin-image {
  width: 100%;
  height: auto;
  display: block;
}

.header-content {
  flex: 1;
}

.pin-source {
  margin-bottom: var(--space-4);
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
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

.collection-icon {
  margin-right: var(--space-2);
}

.metadata-category {
  margin-bottom: var(--space-6);
}

.metadata-group {
  margin-bottom: var(--space-4);
}

.metadata-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-lg);
  background-color: var(--surface-tertiary);
  color: var(--text-primary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-base);
}

.metadata-tag:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
}

.metadata-icon, .key-icon {
  margin-right: var(--space-1);
}

/* Type-specific metadata styling */
.meta-type { background-color: var(--surface-secondary); }
.meta-source { background-color: var(--surface-secondary); }
.meta-artist, .meta-creator { background-color: rgba(147, 51, 234, 0.1); color: rgb(147, 51, 234); }
.meta-year { background-color: rgba(245, 158, 11, 0.1); color: rgb(245, 158, 11); }
.meta-genre { background-color: rgba(34, 197, 94, 0.1); color: rgb(34, 197, 94); }
.meta-mood { background-color: rgba(236, 72, 153, 0.1); color: rgb(236, 72, 153); }

.related-pin-thumbnail {
  position: relative;
  height: 120px;
  background-color: var(--surface-tertiary);
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

/* Content type specific gradients */
.fallback-thumbnail.type-music { background: linear-gradient(135deg, #8e44ad, #3498db); }
.fallback-thumbnail.type-video { background: linear-gradient(135deg, #e74c3c, #f39c12); }
.fallback-thumbnail.type-article { background: linear-gradient(135deg, #2ecc71, #1abc9c); }
.fallback-thumbnail.type-code { background: linear-gradient(135deg, #34495e, #2c3e50); }
.fallback-thumbnail.type-design { background: linear-gradient(135deg, #e67e22, #d35400); }
.fallback-thumbnail.type-link { background: linear-gradient(135deg, #7f8c8d, #95a5a6); }

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
    background-color: var(--surface-tertiary);
  }
}
</style>

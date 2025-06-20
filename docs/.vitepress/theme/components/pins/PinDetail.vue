<!-- docs/.vitepress/theme/components/pins/PinDetail.vue -->
<template>
  <div class="pin-detail-modal">
    <!-- Modern card layout -->
    <div class="pin-card">
      <!-- Hero section with image and primary info -->
      <div class="pin-hero">
        <div class="pin-image-section" v-if="pin.imageUrl" :class="`image-${imageClassification}`">
          <div class="pin-image-container" :style="cssAspectRatio ? { aspectRatio: cssAspectRatio } : {}">
            <img :src="pin.imageUrl" :alt="pin.title" class="pin-image" />
          </div>
        </div>
        
        <div class="pin-content">
          <div class="pin-header">
            <h1 class="pin-title">{{ pin.title }}</h1>
            
            <div class="pin-actions">
              <a :href="pin.url" target="_blank" rel="noopener noreferrer" class="btn btn-primary action-button">
                <Icon :name="getPlatformInfo(pin.url).icon" :size="16" />
                <span class="action-label">{{ getPlatformInfo(pin.url).label }}</span>
                <Icon name="ExternalLink" :size="14" />
              </a>
              
              <!-- Secondary domain link for reference -->
              <div class="domain-reference">
                <img v-if="pin.favicon" :src="pin.favicon" class="site-favicon" alt="Site icon" />
                <span class="domain-text">{{ getDomainName(pin.url) }}</span>
              </div>
            </div>
            
            <p v-if="pin.description" class="pin-description">
              {{ pin.description }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Notes section -->
      <div v-if="pin.notes" class="pin-section">
        <div class="section-header">
          <Icon name="FileText" :size="16" />
          <h3 class="section-title">Notes</h3>
        </div>
        <div class="notes-content">
          {{ pin.notes }}
        </div>
      </div>
      
      <!-- Metadata section -->
      <div class="pin-section">
        <div class="section-header">
          <Icon name="Tag" :size="16" />
          <h3 class="section-title">Details</h3>
        </div>
        
        <div class="metadata-grid">
          <!-- Collections -->
          <div class="metadata-row" v-if="hasCollections">
            <div class="metadata-label">Collections</div>
            <div class="metadata-values">
              <div 
                v-for="collectionId in pin.collections" 
                :key="`collection-${collectionId}`"
                class="metadata-badge collection-badge"
                @click="emit('tag-click', `collection:${collectionId}`)"
              >
                <Icon :name="getCollectionIcon(collectionId)" :size="14" />
                {{ getCollectionName(collectionId) }}
              </div>
            </div>
          </div>
          
          <!-- Auto-detected metadata -->
          <div v-if="hasInferredMetadata" class="metadata-category">
            <div class="category-header">
              <Icon name="Zap" :size="14" />
              <span class="category-name">Auto-detected</span>
            </div>
            
            <div 
              v-for="key in Object.keys(inferredMetadata)"
              :key="`inferred-${key}`"
              class="metadata-row"
            >
              <div class="metadata-label">
                <span class="metadata-icon">{{ getMetadataIcon(key) }}</span>
                {{ getMetadataLabel(key) }}
              </div>
              <div class="metadata-values">
                <div 
                  v-for="value in inferredMetadata[key]"
                  :key="`inferred-${key}-${value}`"
                  class="metadata-badge"
                  :class="`meta-${key}`"
                  @click="emit('tag-click', `${key}:${value}`)"
                >
                  <span class="value-icon">{{ getMetadataValueIcon(key, value) }}</span>
                  {{ value }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Manual metadata -->
          <div v-if="hasManualMetadata" class="metadata-category">
            <div class="category-header">
              <Icon name="Edit3" :size="14" />
              <span class="category-name">Manual tags</span>
            </div>
            
            <div 
              v-for="key in Object.keys(manualMetadata)"
              :key="`manual-${key}`"
              class="metadata-row"
            >
              <div class="metadata-label">
                <span class="metadata-icon">{{ getMetadataIcon(key) }}</span>
                {{ getMetadataLabel(key) }}
              </div>
              <div class="metadata-values">
                <div 
                  v-for="value in manualMetadata[key]"
                  :key="`manual-${key}-${value}`"
                  class="metadata-badge"
                  :class="`meta-${key}`"
                  @click="emit('tag-click', `${key}:${value}`)"
                >
                  <span class="value-icon">{{ getMetadataValueIcon(key, value) }}</span>
                  {{ value }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Standard tags -->
          <div class="metadata-row" v-if="pin.tags && pin.tags.length > 0">
            <div class="metadata-label">Tags</div>
            <div class="metadata-values">
              <div 
                v-for="tag in pin.tags" 
                :key="`tag-${tag}`"
                class="metadata-badge tag-badge"
                @click="emit('tag-click', tag)"
              >
                #{{ tag }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import Icon from '../common/Icon.vue';
import { getCollectionById, getMetadataConfig, getMetadataValueIcon as getValueIcon } from '../../../utils/services/content/metadata';
import { useMediaDimensions } from '../../composables/useMediaDimensions';

const props = defineProps({
  pin: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['tag-click']);

// Use the media dimensions composable
const { aspectRatio, isLoading: isLoadingAspectRatio, aspectRatioType, cssAspectRatio, fetchDimensions } = useMediaDimensions();

// Map composable's aspectRatioType to our CSS classes
const imageClassification = computed(() => {
  const type = aspectRatioType.value;
  switch (type) {
    case 'square': return 'square';
    case 'portrait': return 'tall';
    case 'landscape': return 'wide';
    default: return 'default';
  }
});

// Fetch dimensions on mount
onMounted(() => {
  fetchDimensions(props.pin.url, { imageUrl: props.pin.imageUrl });
});

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
  return collection ? collection.icon : 'Folder';
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

// Platform detection for action buttons
const getPlatformInfo = (url) => {
  const domain = getDomainName(url);
  
  // Platform-specific mappings
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    return { label: 'Watch on YouTube', icon: 'Youtube' };
  }
  if (domain.includes('vimeo.com')) {
    return { label: 'Watch on Vimeo', icon: 'Video' };
  }
  if (domain.includes('spotify.com')) {
    return { label: 'Listen on Spotify', icon: 'Music' };
  }
  if (domain.includes('github.com')) {
    return { label: 'View on GitHub', icon: 'Github' };
  }
  if (domain.includes('bandcamp.com')) {
    return { label: 'Listen on Bandcamp', icon: 'Music' };
  }
  if (domain.includes('soundcloud.com')) {
    return { label: 'Listen on SoundCloud', icon: 'Music' };
  }
  if (domain.includes('instagram.com')) {
    return { label: 'View on Instagram', icon: 'Instagram' };
  }
  if (domain.includes('twitter.com') || domain.includes('x.com')) {
    return { label: 'View on Twitter', icon: 'Twitter' };
  }
  if (domain.includes('medium.com')) {
    return { label: 'Read on Medium', icon: 'FileText' };
  }
  if (domain.includes('dribbble.com')) {
    return { label: 'View on Dribbble', icon: 'Dribbble' };
  }
  if (domain.includes('behance.net')) {
    return { label: 'View on Behance', icon: 'Eye' };
  }
  if (domain.includes('figma.com')) {
    return { label: 'Open in Figma', icon: 'Figma' };
  }
  if (domain.includes('codepen.io')) {
    return { label: 'View on CodePen', icon: 'Code' };
  }
  if (domain.includes('linkedin.com')) {
    return { label: 'View on LinkedIn', icon: 'Linkedin' };
  }
  
  // Generic fallbacks
  return { label: 'Open Link', icon: 'ExternalLink' };
};
</script>

<style scoped>
/* Modern Pin Detail Modal */
.pin-detail-modal {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.pin-card {
  width: 100%;
  max-width: 900px;
  background: var(--surface-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* Hero Section */
.pin-hero {
  display: flex;
  min-height: 400px;
  gap: 0;
}

.pin-image-section {
  position: relative;
  background: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Default sizing for unknown aspect ratios */
.pin-image-section.image-default {
  flex: 0 0 450px;
}

/* Square images - constrain to reasonable size */
.pin-image-section.image-square {
  flex: 0 0 400px;
  max-width: 50vw;
}

/* Wide images - allow more width */
.pin-image-section.image-wide {
  flex: 0 0 500px;
  max-width: 60vw;
}

/* Tall images - constrain width more */
.pin-image-section.image-tall {
  flex: 0 0 350px;
  max-width: 40vw;
}

.pin-image-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Changed from cover to contain to show full image */
  transition: var(--transition-base);
}

.pin-content {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pin-header {
  margin-bottom: var(--space-3);
}

.pin-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.pin-source {
  margin-bottom: var(--space-3);
}

.pin-actions {
  margin-bottom: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.action-button {
  align-self: flex-start;
  gap: var(--space-2);
}

.action-label {
  font-weight: var(--font-semibold);
}

.domain-reference {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--surface-secondary);
  border-radius: var(--border-radius-sm);
  width: fit-content;
}

.domain-text {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--surface-secondary);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

.source-link:hover {
  background: var(--surface-tertiary);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.site-favicon {
  width: 16px;
  height: 16px;
  border-radius: var(--border-radius-xs);
}

.source-domain {
  font-family: var(--font-mono);
}

.pin-description {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  margin: 0;
}

/* Sections */
.pin-section {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-secondary);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.notes-content {
  background: var(--surface-secondary);
  padding: var(--space-3);
  border-radius: var(--border-radius-md);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  font-style: italic;
}

/* Metadata Grid */
.metadata-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.metadata-category {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.category-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--border-secondary);
}

.category-name {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metadata-row {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  min-height: 32px;
}

.metadata-label {
  flex: 0 0 100px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding-top: var(--space-1);
}

.metadata-values {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.metadata-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--surface-secondary);
  border-radius: var(--border-radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid var(--border-secondary);
}

.metadata-badge:hover {
  background: var(--surface-tertiary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.collection-badge {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.collection-badge:hover {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.tag-badge {
  background: var(--surface-tertiary);
  color: var(--text-primary);
}

.metadata-icon,
.value-icon {
  font-size: var(--text-xs);
}

/* Responsive Design */
@media (max-width: 768px) {
  .pin-detail-modal {
    padding: var(--space-2);
  }
  
  .pin-card {
    margin-top: var(--space-4);
  }
  
  .pin-hero {
    flex-direction: column;
    min-height: auto;
  }
  
  .pin-image-section,
  .pin-image-section.image-default,
  .pin-image-section.image-square,
  .pin-image-section.image-wide,
  .pin-image-section.image-tall {
    flex: none;
    height: 280px;
    max-width: none;
  }
  
  .pin-content {
    padding: var(--space-3);
  }
  
  .pin-title {
    font-size: var(--text-lg);
  }
  
  .pin-section {
    padding: var(--space-2) var(--space-3);
  }
  
  .pin-actions {
    margin-bottom: var(--space-2);
  }
  
  .domain-reference {
    font-size: var(--text-xs);
  }
  
  .metadata-row {
    flex-direction: column;
    gap: var(--space-1);
    align-items: flex-start;
  }
  
  .metadata-label {
    flex: none;
    margin-bottom: var(--space-1);
  }
}

@media (max-width: 480px) {
  .pin-detail-modal {
    padding: var(--space-1);
  }
  
  .pin-content {
    padding: var(--space-2);
  }
  
  .pin-section {
    padding: var(--space-2);
  }
  
  .pin-image-section {
    height: 240px;
  }
}
</style>

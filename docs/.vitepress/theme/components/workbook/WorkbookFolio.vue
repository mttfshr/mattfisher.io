<!-- WorkbookFolio.vue - Chronological focused presentation -->
<template>
  <div class="workbook-folio">
    <!-- Folio controls -->
    <div class="folio-controls">
      <button 
        class="nav-button"
        :disabled="currentIndex === 0"
        @click="navigateTo(currentIndex - 1)"
      >
        ← Previous
      </button>
      
      <span class="position-indicator">
        {{ currentIndex + 1 }} of {{ items.length }}
      </span>
      
      <button 
        class="nav-button"
        :disabled="currentIndex === items.length - 1"
        @click="navigateTo(currentIndex + 1)"
      >
        Next →
      </button>
    </div>
    
    <!-- Current item display -->
    <div v-if="currentItem" class="folio-item">
      <!-- Full-width media -->
      <div class="folio-media">
        <div class="media-container" @click="openPresentation">
          <img 
            :src="getThumbnail(currentItem)" 
            :alt="currentItem.title"
            class="media-image"
          />
          <div class="media-overlay">
            <div class="play-icon">⚏</div>
          </div>
        </div>
      </div>
      
      <!-- Collapsible content section -->
      <div class="folio-content" :class="{ 'collapsed': contentCollapsed }">
        <button class="content-toggle" @click="contentCollapsed = !contentCollapsed">
          <span class="toggle-text">
            {{ contentCollapsed ? 'Show Details' : 'Hide Details' }}
          </span>
          <span class="toggle-icon" :class="{ 'rotated': !contentCollapsed }">▼</span>
        </button>
        
        <div v-if="!contentCollapsed" class="content-expanded">
          <header class="folio-header">
            <h2 class="folio-title">{{ currentItem.title }}</h2>
            <div class="folio-meta">
              <span v-if="currentItem.year" class="meta-year">{{ currentItem.year }}</span>
              <span class="meta-type">{{ getMediaType(currentItem) }}</span>
            </div>
          </header>
          
          <div v-if="currentItem.description" class="folio-description">
            {{ currentItem.description }}
          </div>
          
          <!-- Structured tags -->
          <div v-if="getStructuredTags(currentItem).length" class="folio-tags">
            <div 
              v-for="tagGroup in getStructuredTags(currentItem)" 
              :key="tagGroup.category"
              class="tag-group"
            >
              <span class="tag-label">{{ tagGroup.category }}:</span>
              <div class="tag-values">
                <span 
                  v-for="value in tagGroup.values" 
                  :key="value"
                  class="tag-value"
                >
                  {{ formatTagValue(value) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="folio-actions">
            <a 
              :href="`/workbook/${currentItem.slug}.html`" 
              class="action-button primary"
            >
              View Details
            </a>
            <button 
              v-if="getRelatedItems(currentItem).length"
              class="action-button secondary"
              @click="showRelated = !showRelated"
            >
              Related ({{ getRelatedItems(currentItem).length }})
            </button>
          </div>
          
          <!-- Related items -->
          <div v-if="showRelated" class="related-section">
            <h3>Related Works</h3>
            <div class="related-grid">
              <div 
                v-for="related in getRelatedItems(currentItem).slice(0, 4)" 
                :key="related.slug"
                class="related-item"
                @click="navigateToItem(related)"
              >
                <img :src="getThumbnail(related)" :alt="related.title" />
                <span class="related-title">{{ related.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom pagination -->
    <div class="folio-pagination">
      <button 
        class="nav-button"
        :disabled="currentIndex === 0"
        @click="navigateTo(currentIndex - 1)"
      >
        ← Previous
      </button>
      
      <span class="position-indicator">
        {{ currentIndex + 1 }} of {{ items.length }}
      </span>
      
      <button 
        class="nav-button"
        :disabled="currentIndex === items.length - 1"
        @click="navigateTo(currentIndex + 1)"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['openPresentation', 'navigateToItem']);

const currentIndex = ref(0);
const showRelated = ref(false);
const contentCollapsed = ref(true); // Start collapsed for minimal distraction

// Computed
const currentItem = computed(() => props.items[currentIndex.value]);

// Navigation
function navigateTo(index) {
  if (index >= 0 && index < props.items.length) {
    currentIndex.value = index;
    showRelated.value = false;
  }
}

function navigateToItem(item) {
  const index = props.items.findIndex(i => i.slug === item.slug);
  if (index !== -1) {
    navigateTo(index);
    emit('navigateToItem', item);
  }
}

function openPresentation() {
  emit('openPresentation', currentItem.value);
}

// Utility functions
function getThumbnail(item) {
  if (item.media?.thumbnail) return item.media.thumbnail;
  if (item.thumbnailUrl) return item.thumbnailUrl;
  
  if (item.media?.type === 'video' && item.media?.provider === 'vimeo') {
    const vimeoId = extractVimeoId(item.media.url);
    return vimeoId ? `/media/thumbnails/vimeo-${vimeoId}.jpg` : '/media/video-placeholder.svg';
  }
  
  return '/media/placeholder.svg';
}

function getMediaType(item) {
  if (!item.media) return 'Project';
  const type = item.media.type || 'media';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getStructuredTags(item) {
  if (!item.tags) return [];
  
  const grouped = {};
  item.tags.forEach(tag => {
    if (tag.includes(':')) {
      const [category, value] = tag.split(':', 2);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(value);
    }
  });
  
  return Object.entries(grouped).map(([category, values]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    values
  }));
}

function formatTagValue(value) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getRelatedItems(item) {
  if (!item.tags) return [];
  
  return props.items.filter(other => {
    if (other.slug === item.slug) return false;
    if (!other.tags) return false;
    
    const sharedTags = item.tags.filter(tag => other.tags.includes(tag));
    return sharedTags.length > 0;
  }).slice(0, 8);
}

function extractVimeoId(url) {
  if (!url) return null;
  const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
</script>

<style scoped>
/* CSS Custom Properties for consistency */
:root {
  --folio-spacing-xs: 0.5rem;
  --folio-spacing-sm: 1rem;
  --folio-spacing-md: 1.5rem;
  --folio-spacing-lg: 2rem;
  --folio-spacing-xl: 3rem;
  
  --folio-border-radius-sm: 6px;
  --folio-border-radius-md: 8px;
  --folio-border-radius-lg: 12px;
  
  --folio-transition-fast: 0.2s ease;
  --folio-transition-smooth: 0.3s ease;
  
  --folio-shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.08);
  --folio-shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.1);
  --folio-shadow-strong: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Utility Classes */
.btn {
  padding: var(--folio-spacing-sm) var(--folio-spacing-md);
  border-radius: var(--folio-border-radius-md);
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: var(--folio-transition-fast);
}

.btn-primary {
  background: var(--vp-c-brand);
  color: white;
}

.btn-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--folio-shadow-medium);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.card {
  background: var(--vp-c-bg-soft);
  border-radius: var(--folio-border-radius-lg);
  overflow: hidden;
  transition: var(--folio-transition-smooth);
}

.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--folio-spacing-md);
}

/* Component Styles */
.workbook-folio {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--folio-spacing-lg) 0;
}

/* Top Controls */
.folio-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--folio-spacing-lg);
  margin-bottom: var(--folio-spacing-xl);
  padding: var(--folio-spacing-sm);
  background: var(--vp-c-bg-soft);
  border-radius: var(--folio-border-radius-lg);
}

.nav-button {
  padding: var(--folio-spacing-sm) var(--folio-spacing-md);
  border-radius: var(--folio-border-radius-md);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-weight: 500;
  transition: var(--folio-transition-fast);
  padding: 0.75rem var(--folio-spacing-md);
}

.nav-button:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  transform: translateY(-1px);
  box-shadow: var(--folio-shadow-medium);
}

.nav-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.position-indicator {
  font-weight: 500;
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

/* Media Display */
.folio-item {
  margin-bottom: var(--folio-spacing-xl);
}

.folio-media {
  margin-bottom: var(--folio-spacing-lg);
}

.media-container {
  position: relative;
  border-radius: var(--folio-border-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: var(--folio-transition-smooth);
  box-shadow: var(--folio-shadow-subtle);
}

.media-container:hover {
  transform: scale(1.01);
  box-shadow: var(--folio-shadow-strong);
}

.media-image {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--folio-transition-smooth);
}

.media-container:hover .media-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 3rem;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--folio-transition-fast);
}

.media-container:hover .play-icon {
  transform: scale(1.1);
}

/* Collapsible Content */
.folio-content {
  background: var(--vp-c-bg-soft);
  border-radius: var(--folio-border-radius-lg);
  overflow: hidden;
  transition: var(--folio-transition-smooth);
}

.content-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--folio-spacing-sm) var(--folio-spacing-md);
  background: var(--vp-c-bg-alt);
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: var(--vp-c-text-1);
  transition: var(--folio-transition-fast);
}

.content-toggle:hover {
  background: var(--vp-c-bg-soft);
}

.toggle-icon {
  transition: var(--folio-transition-fast);
  font-size: 0.8rem;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.content-expanded {
  padding: var(--folio-spacing-lg);
}

/* Content Sections */
.folio-header {
  margin-bottom: var(--folio-spacing-lg);
}

.folio-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 var(--folio-spacing-xs);
  line-height: 1.2;
}

.folio-meta {
  display: flex;
  gap: var(--folio-spacing-md);
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
}

.folio-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: var(--folio-spacing-lg);
  color: var(--vp-c-text-1);
}

/* Tags */
.folio-tags {
  margin-bottom: var(--folio-spacing-lg);
}

.tag-group {
  display: flex;
  align-items: center;
  gap: var(--folio-spacing-sm);
  margin-bottom: var(--folio-spacing-sm);
}

.tag-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
  min-width: 80px;
  font-size: 0.9rem;
}

.tag-values {
  display: flex;
  flex-wrap: wrap;
  gap: var(--folio-spacing-xs);
}

.tag-value {
  background: var(--vp-c-bg-soft);
  padding: 0.3rem var(--folio-spacing-sm);
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

/* Actions */
.folio-actions {
  display: flex;
  gap: var(--folio-spacing-sm);
  margin-bottom: var(--folio-spacing-lg);
}

.action-button {
  padding: var(--folio-spacing-sm) var(--folio-spacing-md);
  border-radius: var(--folio-border-radius-md);
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: var(--folio-transition-fast);
  padding: 0.75rem var(--folio-spacing-md);
  text-decoration: none;
  font-size: 0.95rem;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--folio-shadow-medium);
}

.action-button.primary {
  background: var(--vp-c-brand);
  color: white;
}

.action-button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

/* Related Items */
.related-section {
  margin-top: var(--folio-spacing-lg);
  padding-top: var(--folio-spacing-lg);
  border-top: 1px solid var(--vp-c-divider);
}

.related-section h3 {
  margin-bottom: var(--folio-spacing-md);
  font-size: 1.2rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--folio-spacing-md);
}

.related-item {
  background: var(--vp-c-bg-soft);
  border-radius: var(--folio-border-radius-lg);
  overflow: hidden;
  transition: var(--folio-transition-smooth);
  cursor: pointer;
  transition: var(--folio-transition-fast);
}

.related-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--folio-shadow-medium);
}

.related-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.related-title {
  display: block;
  padding: var(--folio-spacing-sm);
  font-size: 0.85rem;
  font-weight: 500;
}

/* Bottom Pagination */
.folio-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--folio-spacing-lg);
  margin-top: var(--folio-spacing-xl);
  padding: var(--folio-spacing-md);
  background: var(--vp-c-bg-soft);
  border-radius: var(--folio-border-radius-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .folio-title {
    font-size: 1.5rem;
  }
  
  .folio-actions {
    flex-direction: column;
  }
  
  .tag-group {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--folio-spacing-xs);
  }
  
  .tag-label {
    min-width: auto;
  }
  
  .related-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>

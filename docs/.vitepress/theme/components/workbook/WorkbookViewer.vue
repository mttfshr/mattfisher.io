<template>
  <div class="workbook-viewer">
    <!-- Presentation mode viewer -->
    <PresentationViewer
      v-if="showPresentationMode"
      :media-type="workbookItem?.media?.type"
      :media-url="workbookItem?.media?.url"
      :media-provider="workbookItem?.media?.provider"
      :thumbnail-url="thumbnailUrl"
      :title="workbookItem?.title"
      :presentation="presentationOptions"
      :technical-details="technicalDetails"
      @close="closePresentationMode"
    />
    
    <!-- Standard view -->
    <div v-else class="standard-view">
      <!-- Media container using new component -->
      <MediaContainer
        v-if="workbookItem?.media"
        :media="workbookItem.media"
        :title="workbookItem.title"
        :thumbnail-url="thumbnailUrl"
        @toggle-presentation="togglePresentationMode"
      />
      
      <!-- Content below the media -->
      <div class="content-container">
        <h1>{{ workbookItem?.title }}</h1>
        <p class="description">{{ workbookItem?.description }}</p>
      
        <div class="metadata">
          <!-- Show year if available, otherwise extract from date -->
          <div v-if="workbookItem?.year || workbookItem?.date" class="year">
            {{ workbookItem?.year || getYearFromDate(workbookItem?.date) }}
          </div>
          
          <!-- Structured tags display -->
          <StructuredTagsDisplay 
            v-if="workbookItem?.tags"
            :tags="workbookItem.tags"
            :parsed-tags="parsedTags"
          />
          
          <div v-if="technicalDetails.tools?.length || technicalDetails.format || technicalDetails.duration" class="technical-details">
            <h3>Technical Details</h3>
            <div v-if="technicalDetails.tools?.length" class="tools">
              <strong>Tools:</strong> {{ technicalDetails.tools.join(', ') }}
            </div>
            <div v-if="technicalDetails.format" class="format">
              <strong>Format:</strong> {{ technicalDetails.format }}
            </div>
            <div v-if="technicalDetails.duration" class="duration">
              <strong>Duration:</strong> {{ technicalDetails.duration }}
            </div>
          </div>
        </div>
        
        <!-- DO NOT render page content to avoid infinite loop -->
        
        <div v-if="workbookItem?.media?.related?.length" class="related-items">
          <h3>Related Items</h3>
          <ul class="related-list">
            <li v-for="related in workbookItem.media.related" :key="related.slug" class="related-item">
              <a :href="`/workbook/${related.slug}.html`">
                <span v-if="related.relationship" class="relationship-tag">{{ related.relationship }}</span>
                {{ getRelatedTitle(related.slug) }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useData } from 'vitepress';
import PresentationViewer from './PresentationViewer.vue';
import MediaContainer from './MediaContainer.vue';
import StructuredTagsDisplay from '../collections/StructuredTagsDisplay.vue';

// Get VitePress data
const { page, theme } = useData();

// Find current workbook item
const slug = computed(() => {
  return page.value.relativePath.replace(/^workbook\/|\.md$/g, '');
});

const workbookItem = computed(() => {
  const item = theme.value.workbookItems?.find(item => item.slug === slug.value) || null;
  console.log('WorkbookViewer found item:', item ? item.title : 'None', 'for slug:', slug.value);
  if (item && item.year) {
    console.log('Item has year:', item.year);
  }
  return item;
});

// Function to get year from date (for compatibility with existing data)
function getYearFromDate(dateInput) {
  if (!dateInput) return '';
  
  try {
    // Try to parse the date and extract the year
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.getFullYear().toString();
    }
    return '';
  } catch (e) {
    return '';
  }
}

// Function to get title of related items
function getRelatedTitle(slug) {
  const item = theme.value.workbookItems?.find(item => item.slug === slug);
  return item ? item.title : slug;
}

// Parse structured tags
const parsedTags = computed(() => {
  if (!workbookItem.value?.tags || !Array.isArray(workbookItem.value.tags)) {
    return null;
  }
  
  const result = {
    type: [],
    tech: [],
    tool: [],
    status: [],
    medium: [],
    project: [],
    collab: [],
    other: []
  };
  
  workbookItem.value.tags.forEach(tag => {
    if (typeof tag !== 'string') return;
    
    const [prefix, value] = tag.includes(':') ? tag.split(':', 2) : ['other', tag];
    
    if (result[prefix]) {
      result[prefix].push(value);
    } else {
      result.other.push(tag);
    }
  });
  
  return result;
});

// Extract video ID function
function extractVimeoId(url) {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  return match ? match[1] : null;
}

// Get thumbnail URL - prioritize Cloudflare Images
const thumbnailUrl = computed(() => {
  if (!workbookItem.value?.media) return '';
  
  // First, check if there's a Cloudflare thumbnail URL in the media object
  if (workbookItem.value.media.thumbnail) {
    return workbookItem.value.media.thumbnail;
  }
  
  // Fallback to static thumbnails for backward compatibility
  const { type, provider, url } = workbookItem.value.media;
  
  if (type === 'video' && provider === 'vimeo') {
    const id = extractVimeoId(url);
    return id ? `/media/thumbnails/vimeo-${id}.jpg` : '';
  }
  
  return '';
});

// Presentation mode state
const showPresentationMode = ref(false);

// Toggle presentation mode
function togglePresentationMode() {
  showPresentationMode.value = !showPresentationMode.value;
  
  // Update URL
  const url = new URL(window.location.href);
  if (showPresentationMode.value) {
    url.searchParams.set('presentation', 'true');
  } else {
    url.searchParams.delete('presentation');
  }
  window.history.replaceState({}, '', url.toString());
}

// Close presentation mode
function closePresentationMode() {
  showPresentationMode.value = false;
  
  // Update URL to remove presentation parameter
  const url = new URL(window.location.href);
  url.searchParams.delete('presentation');
  window.history.replaceState({}, '', url.toString());
}

// Get presentation options
const presentationOptions = computed(() => {
  return workbookItem.value?.media?.presentation || {
    enabled: true,
    autoplay: false,
    loop: true,
    showControls: true,
    backgroundMode: 'blurred',
    accentColor: null
  };
});

// Get technical details
const technicalDetails = computed(() => {
  return workbookItem.value?.media?.technicalDetails || {};
});

// Keyboard shortcuts
function handleKeyDown(event) {
  if (event.key === 'Escape' && showPresentationMode.value) {
    closePresentationMode();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  
  // Check if URL has presentation parameter
  if (window.location.search.includes('presentation=true')) {
    showPresentationMode.value = true;
  }
  
  console.log('WorkbookViewer mounted, workbookItem:', workbookItem.value);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.workbook-viewer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 0;
}

.standard-view {
  position: relative;
  background-color: transparent;
}

.content-container {
  max-width: 800px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider-light);
}

.content-container h1 {
  font-size: 1.9rem;
  margin-bottom: 0.75rem;
  line-height: 1.2;
  color: var(--vp-c-text-1);
  font-weight: 500;
  background-color: transparent;
}

.content-container h2,
.content-container h3 {
  color: var(--vp-c-text-1);
  background-color: transparent;
}

.description {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1.25rem;
  line-height: 1.5;
  background-color: transparent;
}

.metadata {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background-color: transparent;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.year {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  background-color: transparent;
  font-weight: 500;
}

.tag {
  background-color: var(--vp-c-bg-soft);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.technical-details {
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}

.technical-details h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  font-weight: 500;
  background-color: transparent;
}

.technical-details .tools,
.technical-details .format,
.technical-details .duration {
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  background-color: transparent;
}

.technical-details .tools strong,
.technical-details .format strong,
.technical-details .duration strong {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.content {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}

/* Related items styling */
.related-items {
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
}

.related-items h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.related-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.related-item {
  margin-bottom: var(--space-2);
}

.related-item a {
  display: flex;
  align-items: center;
  color: var(--vp-c-brand);
  text-decoration: none;
  font-size: var(--text-sm);
}

.related-item a:hover {
  color: var(--vp-c-brand-dark);
}

.relationship-tag {
  font-size: var(--text-xs);
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  margin-right: var(--space-2);
}

/* Ensure VitePress theme integration */
:root {
  --vp-c-bg-alpha-with-backdrop: transparent;
  --vp-code-block-bg: var(--vp-c-bg-soft);
}

/* Reset for VitePress content compatibility */
.workbook-viewer :deep(.content) {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

/* Fix for specific white backgrounds */
.workbook-viewer :deep(a),
.workbook-viewer :deep(p),
.workbook-viewer :deep(li),
.workbook-viewer :deep(ul),
.workbook-viewer :deep(ol) {
  background-color: transparent;
  color: var(--vp-c-text-1);
}

/* Responsive styling */
@media (max-width: 768px) {
  .content-container h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .description {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
}
</style>

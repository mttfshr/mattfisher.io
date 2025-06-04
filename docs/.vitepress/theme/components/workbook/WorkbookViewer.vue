<template>
  <div class="container-centered">
    <!-- Debug info -->
    <div v-if="debugMode" class="card bg-surface-soft p-4 m-4">
      <p><strong>Debug Info:</strong></p>
      <p>Page relativePath: {{ page.relativePath }}</p>
      <p>Extracted slug: {{ slug }}</p>
      <p>Extracted filename: {{ filename }}</p>
      <p>Found workbook item: {{ workbookItem ? workbookItem.title : 'None' }}</p>
      <p>Available workbook items: {{ theme.workbookItems?.length || 0 }}</p>
    </div>
    
    <!-- Standard view -->
    <div class="workbook-content">
      <!-- Media container using new component -->
      <MediaContainer
        v-if="workbookItem?.media"
        :media="workbookItem.media"
        :title="workbookItem.title"
        :thumbnail-url="thumbnailUrl"
      />
      
      <!-- Content below the media -->
      <div class="content-responsive">
        <h1 class="text-4xl font-medium leading-tight text-primary m-0 mb-3">{{ workbookItem?.title || 'Item Not Found' }}</h1>
        <p v-if="workbookItem?.description" class="text-lg text-secondary leading-relaxed mb-5">{{ workbookItem.description }}</p>
        <p v-else-if="!workbookItem" class="card bg-surface-soft border-error p-4 text-secondary italic">
          Workbook item not found. Please check the URL or contact support.
        </p>
      
        <div v-if="workbookItem" class="stack-vertical spacing-comfortable">
          <!-- Show year if available, otherwise extract from date -->
          <div v-if="workbookItem?.year || workbookItem?.date" class="text-sm text-tertiary font-medium">
            {{ workbookItem?.year || getYearFromDate(workbookItem?.date) }}
          </div>
          
          <!-- Structured tags display -->
          <StructuredTagsDisplay 
            v-if="workbookItem?.tags"
            :tags="workbookItem.tags"
            :parsed-tags="parsedTags"
          />
          
          <div v-if="technicalDetails.tools?.length || technicalDetails.format || technicalDetails.duration" class="card card-body">
            <h3 class="text-lg font-medium text-primary m-0 mb-3">Technical Details</h3>
            <div v-if="technicalDetails.tools?.length" class="mb-2">
              <strong class="text-primary font-medium">Tools:</strong> <span class="text-secondary">{{ technicalDetails.tools.join(', ') }}</span>
            </div>
            <div v-if="technicalDetails.format" class="mb-2">
              <strong class="text-primary font-medium">Format:</strong> <span class="text-secondary">{{ technicalDetails.format }}</span>
            </div>
            <div v-if="technicalDetails.duration" class="mb-2">
              <strong class="text-primary font-medium">Duration:</strong> <span class="text-secondary">{{ technicalDetails.duration }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="workbookItem?.media?.related?.length" class="card card-body mt-6">
          <h3 class="text-lg font-medium text-primary m-0 mb-3">Related Items</h3>
          <ul class="stack-vertical spacing-tight list-none p-0 m-0">
            <li v-for="related in workbookItem.media.related" :key="related.slug" class="related-item">
              <a :href="related.path ? `${related.path}.html` : `/workbook/${related.slug}.html`" class="related-link">
                <span v-if="related.relationship" class="badge badge-primary mr-2">{{ related.relationship }}</span>
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
import MediaContainer from './MediaContainer.vue';
import StructuredTagsDisplay from '../collections/StructuredTagsDisplay.vue';

// Get VitePress data
const { page, theme } = useData();

// Debug mode (set to false in production)
const debugMode = ref(false);

// Improved slug and filename extraction
const slug = computed(() => {
  return page.value.relativePath.replace(/^workbook\/|\.md$/g, '');
});

const filename = computed(() => {
  // Extract just the filename without extension from the path
  const parts = page.value.relativePath.split('/');
  const lastPart = parts[parts.length - 1];
  return lastPart.replace(/\.md$/, '');
});

// Enhanced workbook item finder with multiple matching strategies
const workbookItem = computed(() => {
  if (!theme.value.workbookItems || !Array.isArray(theme.value.workbookItems)) {
    console.warn('WorkbookViewer: No workbook items found in theme data');
    return null;
  }
  
  // Strategy 1: Try to match by full slug (handles subdirectory paths)
  let item = theme.value.workbookItems.find(item => item.slug === slug.value);
  
  // Strategy 2: Try to match by filename only (for backward compatibility)
  if (!item) {
    item = theme.value.workbookItems.find(item => item.slug === filename.value);
  }
  
  // Strategy 3: Try to match by path (if workbook items have path property)
  if (!item) {
    const expectedPath = `/${page.value.relativePath.replace(/\.md$/, '')}`;
    item = theme.value.workbookItems.find(item => item.path === expectedPath);
  }
  
  // Strategy 4: Fuzzy matching - find items that end with the filename
  if (!item) {
    item = theme.value.workbookItems.find(item => 
      item.slug.endsWith(filename.value) || 
      item.title.toLowerCase().includes(filename.value.toLowerCase())
    );
  }
  
  if (debugMode.value) {
    console.log('WorkbookViewer matching strategies:');
    console.log('- Full slug match:', slug.value);
    console.log('- Filename match:', filename.value);
    console.log('- Available items:', theme.value.workbookItems.map(item => ({ slug: item.slug, title: item.title, path: item.path })));
    console.log('- Found item:', item ? { slug: item.slug, title: item.title } : 'None');
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

// Enhanced thumbnail URL with priority system
const thumbnailUrl = computed(() => {
  if (!workbookItem.value?.media) return '';
  
  // Priority 1: Cloudflare Images URL from frontmatter (highest priority)
  if (workbookItem.value.media.thumbnail) {
    return workbookItem.value.media.thumbnail;
  }
  
  // Priority 2: Workbook item thumbnail URL (from processing)
  if (workbookItem.value.thumbnailUrl) {
    return workbookItem.value.thumbnailUrl;
  }
  
  // Priority 3: Generate from media URL (fallback)
  const { type, provider, url } = workbookItem.value.media;
  
  if (type === 'video' && provider === 'vimeo') {
    const id = extractVimeoId(url);
    return id ? `/media/thumbnails/vimeo-${id}.jpg` : '';
  }
  
  // Priority 4: Default thumbnail
  return '';
});

// Get technical details
const technicalDetails = computed(() => {
  return workbookItem.value?.media?.technicalDetails || {};
});

// Keyboard shortcuts
function handleKeyDown(event) {
  // Debug mode toggle (Ctrl+Shift+D in development)
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    debugMode.value = !debugMode.value;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  
  // Debug mode can be enabled via URL parameter
  if (window.location.search.includes('debug=true')) {
    debugMode.value = true;
  }
  
  console.log('WorkbookViewer mounted, workbookItem:', workbookItem.value);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* Component-specific styles only */
.workbook-content {
  position: relative;
  background-color: transparent;
  padding-top: var(--space-8);
  border-top: var(--border-width) solid var(--border-secondary);
}

.related-link {
  display: flex;
  align-items: center;
  color: var(--vp-c-brand);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.related-link:hover {
  color: var(--vp-c-brand-dark);
}

/* Utility classes for template */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }
.text-sm { font-size: var(--text-sm); }
.text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); }
.text-4xl { font-size: var(--text-4xl); }
.font-medium { font-weight: var(--font-medium); }
.leading-tight { line-height: var(--leading-tight); }
.leading-relaxed { line-height: var(--leading-relaxed); }
.list-none { list-style: none; }
.italic { font-style: italic; }
.m-0 { margin: 0; }
.mb-2 { margin-bottom: var(--space-2); }
.mb-3 { margin-bottom: var(--space-3); }
.mb-5 { margin-bottom: var(--space-5); }
.mt-6 { margin-top: var(--space-6); }
.mr-2 { margin-right: var(--space-2); }
.p-0 { padding: 0; }
.p-4 { padding: var(--space-4); }
.border-error { border-left: 4px solid var(--color-error); }

/* Responsive styling */
@media (max-width: 768px) {
  .workbook-content {
    padding-top: var(--space-6);
  }
}
</style>

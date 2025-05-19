<!-- WorkbookItemView.vue -->
<script setup>
import { useData } from 'vitepress'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getEmbedUrl, isEmbeddable } from '../../utils/mediaUtils'
import RelatedItems from './RelatedItems.vue'
import WorkbookPagination from './WorkbookPagination.vue'
import PresentationViewer from './PresentationViewer.vue'
import MediaContainer from './MediaContainer.vue'

const { frontmatter, page, theme } = useData()

console.log('WorkbookItemView rendered with page:', page.value.relativePath)
console.log('With frontmatter:', JSON.stringify(frontmatter.value))

// Extract the current item from workbookItems using the slug
const currentItem = computed(() => {
  const slug = page.value.relativePath.replace(/^workbook\/|\.md$/g, '')
  return theme.value.workbookItems?.find(item => item.slug === slug) || null
})

// Extract video ID for thumbnail
function extractVimeoId(url) {
  if (!url) return null
  
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/)
  return match ? match[1] : null
}

// Get thumbnail URL for the video
const thumbnailUrl = computed(() => {
  if (!frontmatter.value.media) return ''
  
  const { type, provider, url } = frontmatter.value.media
  
  if (type === 'video' && provider === 'vimeo') {
    const id = extractVimeoId(url)
    return id ? `/media/thumbnails/vimeo-${id}.jpg` : ''
  }
  
  return ''
})

// Presentation mode state
const showPresentationMode = ref(false)

onMounted(() => {
  // Check if URL has presentation parameter
  if (window.location.search.includes('presentation=true')) {
    showPresentationMode.value = true
  }
})



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

// Toggle presentation mode
function togglePresentationMode() {
  showPresentationMode.value = !showPresentationMode.value
  
  // Update URL
  const url = new URL(window.location.href)
  if (showPresentationMode.value) {
    url.searchParams.set('presentation', 'true')
  } else {
    url.searchParams.delete('presentation')
  }
  window.history.replaceState({}, '', url.toString())
}

// Close presentation mode
function closePresentationMode() {
  showPresentationMode.value = false
  
  // Update URL to remove presentation parameter
  const url = new URL(window.location.href)
  url.searchParams.delete('presentation')
  window.history.replaceState({}, '', url.toString())
}

// Get default presentation options
const defaultPresentation = {
  enabled: true,
  autoplay: false,
  loop: true,
  showControls: true,
  backgroundMode: "blurred",
  accentColor: null
}

// Keyboard shortcuts
function handleKeyDown(event) {
  if (event.key === 'Escape' && showPresentationMode.value) {
    closePresentationMode()
  }
}

// Add event listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  console.log('WorkbookItemView mounted, currentItem:', currentItem.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="workbook-item">
    <!-- Debug info -->
    <div v-if="!frontmatter" class="debug-info">
      <p>No frontmatter available</p>
    </div>
    
    <!-- Presentation mode viewer -->
    <PresentationViewer
      v-if="showPresentationMode && frontmatter.media"
      :media-type="frontmatter.media?.type"
      :media-url="frontmatter.media?.url"
      :media-provider="frontmatter.media?.provider"
      :thumbnail-url="thumbnailUrl"
      :title="frontmatter.title"
      :presentation="frontmatter.media?.presentation || defaultPresentation"
      :technical-details="frontmatter.media?.technicalDetails || {}"
      @close="closePresentationMode"
    />
    
    <!-- Standard view -->
    <div v-else>
      <!-- Media section at the top using MediaContainer -->
      <MediaContainer 
        v-if="frontmatter.media"
        :media="frontmatter.media" 
        :title="frontmatter.title"
        :thumbnail-url="thumbnailUrl"
        @toggle-presentation="togglePresentationMode"
      />
      
      <!-- Content section below the media -->
      <div class="workbook-item-content">
        <h1>{{ frontmatter.title }}</h1>
        
        <div v-if="frontmatter.description" class="description">
          {{ frontmatter.description }}
        </div>
        
        <!-- Show year if available, otherwise extract from date -->
        <div v-if="frontmatter.year || frontmatter.date" class="year">
          {{ frontmatter.year || getYearFromDate(frontmatter.date) }}
        </div>
        
        <div v-if="frontmatter.tags && frontmatter.tags.length" class="tags">
          <span v-for="tag in frontmatter.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
        
        <!-- Main content from markdown -->
        <div class="content">
          <Content />
        </div>
        
        <!-- Related items and pagination -->
        <RelatedItems v-if="currentItem" :item="currentItem" />
        <WorkbookPagination v-if="currentItem" :current-item="currentItem" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.workbook-item {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  position: relative;
}

.debug-info {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.workbook-item-content {
  max-width: 800px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider-light);
}

.workbook-item-content h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.description {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
}

.year {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  margin-bottom: 1rem;
  font-weight: 500;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tag {
  background-color: var(--vp-c-bg-soft);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.content {
  margin-top: 2rem;
}

/* Media queries for responsive layout */
@media (max-width: 768px) {
  .workbook-item-content h1 {
    font-size: 1.8rem;
  }

  .description {
    font-size: 1rem;
  }
}
</style>
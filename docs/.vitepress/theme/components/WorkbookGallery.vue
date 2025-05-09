<!-- WorkbookGallery.vue -->
<script setup>
import { ref, computed } from 'vue'
import WorkbookItem from './WorkbookItem.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  showFilters: {
    type: Boolean,
    default: true
  }
})

const searchQuery = ref('')
const activeFilter = ref('all')
const activeMediaType = ref('all')

// Extract all unique tags
const uniqueTags = computed(() => {
  const tags = new Set()
  props.items.forEach(item => {
    if (item.tags && item.tags.length) {
      item.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})

// Filter items based on search query, tag filter, and media type
const filteredItems = computed(() => {
  return props.items.filter(item => {
    // Apply tag filter
    const tagMatch = activeFilter.value === 'all' || 
                    (item.tags && item.tags.includes(activeFilter.value))
    
    // Apply media type filter
    const mediaTypeMatch = activeMediaType.value === 'all' || 
                          item.mediaType === activeMediaType.value
    
    // Apply search
    const query = searchQuery.value.toLowerCase()
    const searchMatch = query === '' || 
                       item.title.toLowerCase().includes(query) || 
                       (item.description && item.description.toLowerCase().includes(query)) ||
                       (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
    
    return tagMatch && mediaTypeMatch && searchMatch
  })
})

function setFilter(filter) {
  activeFilter.value = filter
}

function setMediaType(type) {
  activeMediaType.value = type
}

const mediaTypes = [
  { value: 'all', label: 'All Media' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' }
]

const isGridView = ref(true)

function toggleView() {
  isGridView.value = !isGridView.value
}
</script>

<template>
  <div class="workbook-gallery">
    <div v-if="showFilters" class="gallery-controls">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search workbook..." 
          class="search-input"
        />
      </div>
      
      <div class="filter-controls">
        <div class="filter-section">
          <label class="filter-label">Filter by Tag:</label>
          <div class="filter-buttons">
            <button 
              class="filter-button" 
              :class="{ active: activeFilter === 'all' }"
              @click="setFilter('all')"
            >
              All
            </button>
            
            <button 
              v-for="tag in uniqueTags" 
              :key="tag"
              class="filter-button" 
              :class="{ active: activeFilter === tag }"
              @click="setFilter(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        
        <div class="filter-section">
          <label class="filter-label">Media Type:</label>
          <div class="media-type-buttons">
            <button 
              v-for="type in mediaTypes" 
              :key="type.value"
              class="media-type-button" 
              :class="{ active: activeMediaType === type.value }"
              @click="setMediaType(type.value)"
            >
              {{ type.label }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="view-controls">
        <button 
          class="view-button" 
          :class="{ active: isGridView }"
          @click="toggleView"
          title="Grid View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </button>
        
        <button 
          class="view-button" 
          :class="{ active: !isGridView }"
          @click="toggleView"
          title="List View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        </button>
      </div>
    </div>
    
    <div v-if="filteredItems.length === 0" class="no-items">
      <p>No items found matching your filter.</p>
    </div>
    
    <div v-else :class="['workbook-items', {'grid-view': isGridView, 'list-view': !isGridView}]">
      <WorkbookItem 
        v-for="item in filteredItems"
        :key="item.slug"
        :title="item.title"
        :slug="item.slug"
        :description="item.description"
        :date="item.date"
        :media-type="item.mediaType"
        :media-url="item.mediaUrl"
        :thumbnail-url="item.thumbnailUrl"
        :tags="item.tags"
      />
    </div>
  </div>
</template>

<style scoped>
.workbook-gallery {
  max-width: 1200px;
  margin: 0 auto;
}

.gallery-controls {
  margin-bottom: 2rem;
}

.search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.filter-buttons,
.media-type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-button,
.media-type-button {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-button:hover,
.media-type-button:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
}

.filter-button.active,
.media-type-button.active {
  background-color: var(--vp-c-brand);
  color: white;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.view-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-button:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
}

.view-button.active {
  background-color: var(--vp-c-brand);
  color: white;
}

.no-items {
  padding: 3rem;
  text-align: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.workbook-items {
  margin-top: 2rem;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.list-view .workbook-item {
  display: flex;
  align-items: center;
}

.list-view .media-thumbnail {
  flex: 0 0 200px;
  height: 120px;
  aspect-ratio: auto;
}

.list-view .item-content {
  flex: 1;
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .list-view .workbook-item {
    flex-direction: column;
  }
  
  .list-view .media-thumbnail {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
  }
}
</style>
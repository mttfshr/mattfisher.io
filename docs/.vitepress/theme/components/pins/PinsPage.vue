<script setup>
import { ref, computed, watch } from 'vue'
import PinGrid from './PinGrid.vue'
import PinDetail from './PinDetail.vue'
import PinsPagination from './PinsPagination.vue'
import TypeFilter from './TypeFilter.vue'
import CollectionsBrowser from './CollectionsBrowser.vue'
import ActiveFilters from './ActiveFilters.vue'
import { useData } from 'vitepress'

// Get data from VitePress
const { theme } = useData()
const pinsData = computed(() => theme.value.pins || { 
  pins: [], 
  contentTypes: [], 
  allTags: [], 
  userTags: [], 
  sections: [], 
  metadataKeys: {}, 
  collections: [] 
})

// Transform content types to the format expected by TypeFilter
const formattedContentTypes = computed(() => {
  if (!pinsData.value.pins || pinsData.value.pins.length === 0) {
    return [];
  }

  // Count pins by content type
  const typeCount = {};
  pinsData.value.pins.forEach(pin => {
    const type = pin.contentType || 'link';
    if (!typeCount[type]) {
      typeCount[type] = 0;
    }
    typeCount[type]++;
  });
  
  // Create formatted content types array
  return Object.entries(typeCount).map(([type, count]) => ({
    id: type,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    count,
    icon: getTypeIcon(type)
  }));
})

// Transform collections to the format expected by CollectionsBrowser
const formattedCollections = computed(() => {
  if (!pinsData.value.pins || pinsData.value.pins.length === 0) {
    return [];
  }
  
  const collections = {};
  
  // Default collection for pins without a collection
  collections['all'] = {
    id: 'all',
    name: 'All Pins',
    pins: [],
    typeBreakdown: {}
  };
  
  // Process each pin to create collection data
  pinsData.value.pins.forEach(pin => {
    // Add to "all" collection
    collections['all'].pins.push(pin);
    
    // Update type breakdown for "all" collection
    if (pin.contentType) {
      if (!collections['all'].typeBreakdown[pin.contentType]) {
        collections['all'].typeBreakdown[pin.contentType] = 0;
      }
      collections['all'].typeBreakdown[pin.contentType]++;
    }
    
    // Skip if pin has no collections
    if (!pin.collections || pin.collections.length === 0) return;
    
    // Add to specific collections
    pin.collections.forEach(collectionId => {
      if (!collections[collectionId]) {
        collections[collectionId] = {
          id: collectionId,
          name: formatCollectionName(collectionId),
          pins: [],
          typeBreakdown: {}
        };
      }
      
      collections[collectionId].pins.push(pin);
      
      // Update type breakdown for this collection
      if (pin.contentType) {
        if (!collections[collectionId].typeBreakdown[pin.contentType]) {
          collections[collectionId].typeBreakdown[pin.contentType] = 0;
        }
        collections[collectionId].typeBreakdown[pin.contentType]++;
      }
    });
  });
  
  return Object.values(collections);
})

// Helper function to get icon for a content type
function getTypeIcon(type) {
  const icons = {
    'music': '🎵',
    'video': '🎬',
    'article': '📄',
    'code': '💻',
    'image': '📷',
    'link': '🔗',
    'document': '📑',
    'social': '👥',
    'design': '🎨'
  };
  
  return icons[type] || '🔗';
}

// Helper to format collection name (convert from snake_case or kebab-case)
function formatCollectionName(id) {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// State
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const layout = ref('grid') // grid, masonry, list
const selectedPin = ref(null)
const selectedTypes = ref([])
const selectedCollection = ref(null)
const showMobileFilters = ref(false)

// Filter pins based on selected types, collections, and search query
const filteredPins = computed(() => {
  const pins = pinsData.value.pins || [];
  if (pins.length === 0) return [];
  
  let filtered = [...pins];
  
  // Filter by selected types
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(pin => 
      pin.contentType && selectedTypes.value.includes(pin.contentType)
    )
  }
  
  // Filter by selected collection
  if (selectedCollection.value) {
    filtered = filtered.filter(pin => 
      pin.collections && pin.collections.includes(selectedCollection.value)
    )
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(pin => 
      (pin.title && pin.title.toLowerCase().includes(query)) ||
      (pin.url && pin.url.toLowerCase().includes(query)) ||
      (pin.notes && pin.notes.toLowerCase().includes(query)) ||
      (pin.tags && pin.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }
  
  return filtered
})

// Sort pins by date (newest first)
const sortedPins = computed(() => {
  return [...filteredPins.value].sort((a, b) => {
    return new Date(b.pinDate) - new Date(a.pinDate)
  })
})

// Paginated pins
const paginatedPins = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return sortedPins.value.slice(startIndex, endIndex)
})

// Total pages
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(sortedPins.value.length / pageSize.value))
})

// Reset to first page when filters change
watch([searchQuery, selectedTypes, selectedCollection], () => {
  currentPage.value = 1
})

// Methods
const openPinDetail = (pin) => {
  selectedPin.value = pin
  document.body.style.overflow = 'hidden'
}

const closePinDetail = () => {
  selectedPin.value = null
  document.body.style.overflow = ''
}

const clearTypeFilter = (typeId) => {
  selectedTypes.value = selectedTypes.value.filter(t => t !== typeId)
}

const clearCollectionFilter = () => {
  selectedCollection.value = null
}

const clearAllFilters = () => {
  selectedTypes.value = []
  selectedCollection.value = null
  searchQuery.value = ''
}

const toggleMobileFilters = () => {
  showMobileFilters.value = !showMobileFilters.value
}

// Get related pins when a pin is selected
const relatedPins = computed(() => {
  if (!selectedPin.value) return [];
  
  // Find pins with matching collections
  const withCollections = selectedPin.value.collections && selectedPin.value.collections.length > 0
    ? pinsData.value.pins.filter(p => 
        p.id !== selectedPin.value.id && 
        p.collections && 
        p.collections.some(c => selectedPin.value.collections.includes(c))
      )
    : [];
  
  // Find pins with matching content type as a fallback
  const contentType = selectedPin.value.contentType;
  const sameType = pinsData.value.pins.filter(p => 
    p.id !== selectedPin.value.id && 
    !withCollections.includes(p) && 
    p.contentType === contentType
  );
  
  // Combine and limit to 6 related pins
  return [...withCollections, ...sameType].slice(0, 6);
});
</script>

<template>
  <div class="pins-dashboard">
    <!-- Debug output -->
    <div v-if="pinsData.pins && pinsData.pins.length === 0" class="debug-info">
      <h3>Debug Info</h3>
      <p>No pins data found. Check if theme.pins is properly configured in config.mts.</p>
      <pre>{{ JSON.stringify({
        pinsCount: pinsData.pins.length,
        contentTypeNames: pinsData.contentTypes,
        collectionNames: pinsData.collections
      }, null, 2) }}</pre>
    </div>
    
    <!-- Pins UI only shown if we have data -->
    <div v-if="pinsData.pins && pinsData.pins.length > 0">
      <!-- Mobile filter toggle button -->
      <button 
        @click="toggleMobileFilters" 
        class="mobile-filter-toggle"
        :class="{ 'active': showMobileFilters }"
      >
        <span class="toggle-icon">{{ showMobileFilters ? '✕' : '🔍' }}</span>
        <span class="toggle-text">{{ showMobileFilters ? 'Hide Filters' : 'Show Filters' }}</span>
      </button>
    
    <div class="pins-layout">
      <!-- Left sidebar with filters -->
      <div 
        class="filters-sidebar"
        :class="{ 'visible': showMobileFilters }"
      >
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search pins..." 
            class="search-input"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="clear-search"
            title="Clear search"
          >×</button>
        </div>
        
        <TypeFilter 
          :contentTypes="formattedContentTypes" 
          v-model:selectedTypes="selectedTypes"
        />
        
        <CollectionsBrowser 
          :collections="formattedCollections" 
          v-model:selectedCollection="selectedCollection"
        />
      </div>
      
      <!-- Main content area -->
      <div class="pins-content">
        <!-- Active filters display -->
        <ActiveFilters 
          :selectedTypes="selectedTypes"
          :selectedCollection="selectedCollection"
          :contentTypes="formattedContentTypes"
          :collections="formattedCollections"
          :totalFiltered="filteredPins.length"
          :totalPins="pinsData.pins.length"
          @clearType="clearTypeFilter"
          @clearCollection="clearCollectionFilter"
          @clearAllFilters="clearAllFilters"
        />
        
        <!-- View controls -->
        <div class="view-controls">
          <div class="layout-controls">
            <button 
              @click="layout = 'grid'" 
              :class="['layout-button', { active: layout === 'grid' }]"
              title="Grid view"
            >
              <span class="layout-icon">▦</span>
            </button>
            
            <button 
              @click="layout = 'masonry'" 
              :class="['layout-button', { active: layout === 'masonry' }]"
              title="Masonry view"
            >
              <span class="layout-icon">◫</span>
            </button>
            
            <button 
              @click="layout = 'list'" 
              :class="['layout-button', { active: layout === 'list' }]"
              title="List view"
            >
              <span class="layout-icon">≡</span>
            </button>
          </div>
        </div>
        
        <!-- Pagination at top -->
        <PinsPagination
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :totalPages="totalPages"
        />
        
        <!-- Pins grid -->
        <div class="pins-grid-container">
          <PinGrid
            :pins="paginatedPins"
            :layout="layout"
            @pin-click="openPinDetail"
          />
          
          <div v-if="paginatedPins.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No pins found</h3>
            <p>Try adjusting your search or filters.</p>
            <button @click="clearAllFilters" class="clear-all-button">Clear All Filters</button>
          </div>
        </div>
        
        <!-- Pagination at bottom -->
        <PinsPagination
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :totalPages="totalPages"
        />
      </div>
    </div>
    
    <!-- Pin detail modal -->
    <div v-if="selectedPin" class="pin-detail-modal">
      <div class="modal-overlay" @click="closePinDetail"></div>
      <div class="modal-container">
        <button class="modal-close" @click="closePinDetail">×</button>
        <PinDetail
          :pin="selectedPin"
          :relatedPins="relatedPins"
          @pin-click="openPinDetail"
        />
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped to this component */
/* Main layout */
.pins-dashboard {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

.pins-layout {
  display: flex;
  gap: 2rem;
}

/* Left sidebar with filters */
.filters-sidebar {
  flex: 0 0 280px;
  position: sticky;
  top: 4rem;
  height: calc(100vh - 4rem);
  padding-right: 1rem;
  overflow-y: auto;
}

/* Main content area */
.pins-content {
  flex: 1;
  min-width: 0; /* Prevents flex children from overflowing */
}

/* Search input */
.search-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--vp-c-text-3);
  cursor: pointer;
  padding: 0;
}

/* View controls */
.view-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.layout-controls {
  display: flex;
  gap: 0.25rem;
}

.layout-button {
  padding: 0.4rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layout-button:hover {
  background-color: var(--vp-c-bg-alt);
}

.layout-button.active {
  background-color: var(--vp-c-brand);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand);
}

/* Empty state */
.empty-state {
  padding: 3rem 2rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  text-align: center;
  margin: 2rem 0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
}

.empty-state p {
  color: var(--vp-c-text-2);
  margin: 0 0 1rem;
}

.clear-all-button {
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-brand);
  color: var(--vp-c-white);
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Pin detail modal */
.pin-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  background-color: var(--vp-c-bg);
  border-radius: 12px;
  overflow-y: auto;
  z-index: 101;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--vp-c-bg-soft);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 102;
  transition: background-color 0.2s ease;
}

.modal-close:hover {
  background-color: var(--vp-c-bg-alt);
}

/* Debug info */
.debug-info {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: var(--vp-c-danger-soft);
  border-radius: 8px;
  font-size: 0.9rem;
}

.debug-info pre {
  background-color: var(--vp-c-bg);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}

/* Mobile filter toggle button */
.mobile-filter-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
}

.mobile-filter-toggle.active {
  background-color: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

/* Responsive styling */
@media (max-width: 768px) {
  .pins-layout {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filters-sidebar {
    flex: none;
    position: static;
    height: auto;
    max-height: 0;
    overflow: hidden;
    padding: 0;
    transition: max-height 0.3s ease, padding 0.3s ease;
  }
  
  .filters-sidebar.visible {
    max-height: 1000px;
    padding-bottom: 1.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--vp-c-divider);
  }
  
  .mobile-filter-toggle {
    display: flex;
  }
}
</style>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import PinGrid from './PinGrid.vue'
import PinDetail from './PinDetail.vue'
import PinsPagination from './PinsPagination.vue'
import TypeFilter from './TypeFilter.vue'
import CollectionsBrowser from './CollectionsBrowser.vue'
import ActiveFilters from './ActiveFilters.vue'
import NavigationDrawer from '../common/NavigationDrawer.vue'
import { useThemeData } from '../../composables/useThemeData'
import { usePinModal } from '../../composables/useModal'
import { usePinFiltering } from '../../composables/useFiltering'

// Get theme data using composable
const { pins, pinsData, contentTypes, collections } = useThemeData()

// Modal management using composable
const { selectedItem: selectedPin, isOpen: modalOpen, openModal: openPinDetail, closeModal: closePinDetail, relatedItems: relatedPins } = usePinModal(pins)

// Filtering using composable
const { 
  searchQuery, 
  activeFilters, 
  filteredItems: filteredPins,
  hasActiveFilters,
  setFilter,
  clearAllFilters,
  addFilter,
  removeFilter
} = usePinFiltering(pins)

// Local state for UI
const currentPage = ref(1)
const pageSize = ref(50)
const layout = ref('compact') // 'compact' or 'detailed'
const showMobileFilters = ref(false)
const drawerOpen = ref(false) // Controlled by global layout

// Transform content types to the format expected by TypeFilter
const formattedContentTypes = computed(() => {
  if (!pins.value || pins.value.length === 0) {
    return [];
  }

  // Count pins by content type
  const typeCount = {};
  pins.value.forEach(pin => {
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

// Additional computed properties for backward compatibility
const selectedTypes = computed(() => activeFilters.value.contentType || [])
const selectedCollection = computed(() => activeFilters.value.collections)

// Sort pins by date (newest first) - now using filtered results from composable
const sortedPins = computed(() => {
  return [...filteredPins.value]  // filteredPins already comes sorted from composable
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
// Event handlers for filters
const handleTypeSelect = (typeIds) => {
  setFilter('contentType', typeIds)
}

const handleCollectionSelect = (collectionId) => {
  setFilter('collections', collectionId)
}

const clearTypeFilter = (typeId) => {
  removeFilter('contentType', typeId)
}

const clearCollectionFilter = () => {
  setFilter('collections', null)
}

const toggleMobileFilters = () => {
  showMobileFilters.value = !showMobileFilters.value
}

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

// Listen for global app bar actions
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('pins-layout-change', (e) => {
      layout.value = e.detail
    })
    
    window.addEventListener('pins-drawer-toggle', (e) => {
      drawerOpen.value = e.detail
    })
  }
})
</script>

<template>
  <div class="container-responsive">
    <!-- Debug output -->
    <div v-if="pins && pins.length === 0" class="card bg-surface-soft p-4 m-4">
      <h3>Debug Info</h3>
      <p>No pins data found. Check if theme.pins is properly configured in config.mts.</p>
      <pre class="text-xs">{{ JSON.stringify({
        pinsCount: pinsData.pins.length,
        contentTypeNames: pinsData.contentTypes,
        collectionNames: pinsData.collections
      }, null, 2) }}</pre>
    </div>
    
    <!-- Pins UI only shown if we have data -->
    <div v-if="pinsData.pins && pinsData.pins.length > 0">
      <!-- Page header with drawer trigger -->
      <!-- Main content (header removed, actions moved to global app bar) -->
      <main class="page-content" :class="{ 'drawer-open': drawerOpen }">
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
        
        <!-- Pagination at top -->
        <PinsPagination
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :totalPages="totalPages"
        />
        
        <!-- Pins grid -->
        <div class="gallery-container">
          <PinGrid
            :pins="paginatedPins"
            :layout="layout"
            @pin-click="openPinDetail"
          />
          
          <div v-if="paginatedPins.length === 0" class="card empty-state-pattern">
            <div class="empty-state-icon">🔍</div>
            <h3 class="empty-state-title">No pins found</h3>
            <p class="empty-state-description text-secondary">Try adjusting your search or filters.</p>
            <button @click="clearAllFilters" class="btn btn-primary">Clear All Filters</button>
          </div>
        </div>
        
        <!-- Pagination at bottom -->
        <PinsPagination
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :totalPages="totalPages"
        />
      </main>

      <!-- Navigation Drawer -->
      <NavigationDrawer
        :is-open="drawerOpen"
        title="Filter Pins"
        @close="() => {
          drawerOpen = false
          window.dispatchEvent(new CustomEvent('pins-drawer-close'))
        }"
      >
        <!-- Search -->
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search pins..." 
            class="input search-input"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="search-clear"
          >×</button>
        </div>
        
        <!-- Filter controls moved from sidebar -->
        <TypeFilter 
          :contentTypes="formattedContentTypes" 
          :selectedTypes="selectedTypes"
          @update:selectedTypes="handleTypeSelect"
        />
        
        <CollectionsBrowser 
          :collections="formattedCollections" 
          :selectedCollection="selectedCollection"
          @collection-select="handleCollectionSelect"
        />
      </NavigationDrawer>
    
      <!-- Pin detail modal -->
      <div v-if="selectedPin" class="modal-overlay" @click="closePinDetail">
        <div class="modal animate-scale-in" @click.stop>
          <button class="modal-close btn btn-ghost" @click="closePinDetail">×</button>
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
/* Component-specific styles only - Layout utilities moved to semantic system */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  position: relative;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: var(--z-modal);
}

.modal-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-popover);
}
</style>
<!-- WorkbookPage.vue - Simplified structure -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import { useThemeData } from '../../composables/useThemeData.js'
import WorkbookFolio from './WorkbookFolio.vue'
import WorkbookGallery from './WorkbookGallery.vue'
import CollectionsGallery from '../collections/CollectionsGallery.vue'
import NavigationDrawer from '../common/NavigationDrawer.vue'
import TagFilter from '../collections/TagFilter.vue'

// Data and routing
const route = useRoute()
const { workbookItems, collections } = useThemeData()

// State - simplified for URL-based routing
const activeTab = ref('collections')
const focusItemSlug = ref(null)
const drawerOpen = ref(false)

// Computed
// Computed properties for URL-based filtering
const sortedWorkbookItems = computed(() => {
  return [...workbookItems.value].sort((a, b) => {
    const yearA = parseInt(a.year) || 0
    const yearB = parseInt(b.year) || 0
    return yearB - yearA
  })
})

const urlParams = computed(() => {
  // Use VitePress route for reactivity
  const query = route.data?.params || {}
  // Also check URL search params for client-side navigation
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search)
    return {
      view: searchParams.get('view') || query.view || 'collections',
      collection: searchParams.get('collection') || query.collection,
      item: searchParams.get('item') || query.item
    }
  }
  return { ...query, view: query.view || 'collections' }
})

const currentCollection = computed(() => {
  console.log('Computing currentCollection, urlParams:', urlParams.value)
  if (!urlParams.value.collection) return null
  const collection = collections.value.find(c => c.slug === urlParams.value.collection)
  console.log('Found collection:', collection?.title, 'items:', collection?.items?.length)
  return collection
})

const displayItems = computed(() => {
  console.log('Computing displayItems')
  // If we have a collection parameter, filter by that collection
  if (currentCollection.value && currentCollection.value.items) {
    console.log('Using collection items:', currentCollection.value.items.length)
    return currentCollection.value.items
  }
  
  console.log('Using all items:', sortedWorkbookItems.value.length)
  // Otherwise show all items
  return sortedWorkbookItems.value
})

const collectionContext = computed(() => {
  if (!currentCollection.value) return null
  return {
    title: currentCollection.value.title,
    collection: currentCollection.value,
    itemCount: currentCollection.value.items?.length || 0
  }
})

const initialFolioIndex = computed(() => {
  if (!focusItemSlug.value || !sortedWorkbookItems.value.length) return 0
  
  const index = sortedWorkbookItems.value.findIndex(item => {
    if (item.slug === focusItemSlug.value) return true
    const normalizedTitle = item.title?.toLowerCase().replace(/[\s-_]+/g, '-')
    const normalizedSlug = focusItemSlug.value.toLowerCase()
    return normalizedTitle === normalizedSlug
  })
  
  return index >= 0 ? index : 0
})

// Initialize view from URL with new routing structure
const getInitialView = () => {
  const params = urlParams.value
  
  // Use URL parameters to determine view
  if (params.view === 'gallery') {
    return { view: 'items', focusItem: params.item }
  }
  
  if (params.view === 'folio') {
    return { view: 'folio', focusItem: params.item }
  }
  
  // Default to collections
  return { view: 'collections', focusItem: null }
}

// Actions - simplified for URL-based routing
function navigateToItem(item) {
  const collectionParam = urlParams.value.collection ? `?collection=${urlParams.value.collection}` : ''
  const newPath = `/workbook/folio${collectionParam}&item=${item.slug}`
  if (typeof window !== 'undefined') {
    window.location.href = newPath
  }
}

function navigateToView(view) {
  let newPath = '/workbook'
  
  switch(view) {
    case 'collections':
      newPath = '/workbook'
      break
    case 'items':
      newPath = '/workbook/gallery'
      break
    case 'folio':
      newPath = '/workbook/folio'
      break
  }
  
  if (typeof window !== 'undefined') {
    window.location.href = newPath
  }
}

// Event listeners for global drawer control
onMounted(() => {
  // Initialize view from URL
  const initialState = getInitialView()
  activeTab.value = initialState.view
  focusItemSlug.value = initialState.focusItem

  // Listen for tab changes from global app bar
  window.addEventListener('workbook-tab-change', (e) => {
    const newView = e.detail
    navigateToView(newView)
  })

  window.addEventListener('workbook-drawer-toggle', (e) => {
    drawerOpen.value = e.detail
  })
  
  // Emit current view mode to app bar
  window.dispatchEvent(new CustomEvent('workbook-view-changed', { 
    detail: activeTab.value 
  }))
})

// Watch for URL parameter changes to update reactively
watch(() => route.path + route.query, () => {
  // Force reactivity by updating a counter or similar
  // The computed properties will re-evaluate when route changes
}, { immediate: true })
</script>

<template>
  <div class="workbook-page">
    <!-- Collections view (default) -->
    <div v-if="activeTab === 'collections'" class="workbook-view">
      <div v-if="collections && collections.length === 0" class="empty-state">
        <div class="empty-state-icon">📁</div>
        <h3 class="empty-state-title">No Collections Found</h3>
        <p class="empty-state-description">
          Collections will appear here once they're configured.
        </p>
      </div>
      <CollectionsGallery 
        v-else 
        :collections="collections"
      />
    </div>
    
    <!-- Folio view -->
    <div v-if="activeTab === 'folio'" class="workbook-view">
      <!-- Collection context header for folio -->
      <div v-if="collectionContext" class="collection-context-header">
        <div class="collection-context-title">
          <h2>{{ collectionContext.title }}</h2>
          <span class="item-count">{{ collectionContext.itemCount }} items</span>
        </div>
        <button 
          class="back-to-collections"
          @click="navigateToView('collections')"
          aria-label="Back to collections"
        >
          ← Back to Collections
        </button>
      </div>
      
      <WorkbookFolio 
        :items="displayItems" 
        :initial-index="initialFolioIndex"
        :key="focusItemSlug || 'default'"
        @navigateToItem="navigateToItem"
      />
    </div>
    
    <!-- Gallery view -->
    <div v-if="activeTab === 'items'" class="workbook-view">
      <!-- Collection context header -->
      <div v-if="collectionContext" class="collection-context-header">
        <div class="collection-context-title">
          <h2>{{ collectionContext.title }}</h2>
          <span class="item-count">{{ collectionContext.itemCount }} items</span>
        </div>
        <button 
          class="back-to-collections"
          @click="navigateToView('collections')"
          aria-label="Back to collections"
        >
          ← Back to Collections
        </button>
      </div>
      
      <WorkbookGallery 
        :items="displayItems" 
        @item-click="navigateToItem"
        :key="`gallery-${displayItems.length}-${collectionContext?.title || 'all'}`"
      />
    </div>

    <!-- Filter drawer (only for gallery view) -->
    <NavigationDrawer
      v-if="activeTab === 'items'"
      :is-open="drawerOpen"
      title="Filter Items"
      @close="() => {
        drawerOpen = false
        window.dispatchEvent(new CustomEvent('workbook-drawer-close'))
      }"
    >
      <TagFilter 
        :items="workbookItems" 
        @update:filtered-items="filteredItems = $event"
        :sidebar-layout="true"
      />
    </NavigationDrawer>
  </div>
</template>

<style scoped>
.workbook-page {
  width: 100%;
}

.workbook-view {
  /* Child components handle their own spacing */
}

.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-8);
  color: var(--text-secondary);
}

.empty-state-icon {
  font-size: var(--text-6xl);
  margin-bottom: var(--space-4);
}

.empty-state-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Collection context header */
.collection-context-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
  padding: var(--space-6) 0;
  border-bottom: 1px solid var(--border-primary);
}

.collection-context-title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.collection-context-title h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.collection-context-title .item-count {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: var(--surface-secondary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.back-to-collections {
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.back-to-collections:hover {
  background: var(--surface-primary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

@media (max-width: 768px) {
  .collection-context-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }
  
  .collection-context-title {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}
</style>

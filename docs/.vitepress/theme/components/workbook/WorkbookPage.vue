<!-- WorkbookPage.vue - Simplified structure -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import WorkbookFolio from './WorkbookFolio.vue'
import WorkbookGallery from './WorkbookGallery.vue'
import CollectionsGallery from '../collections/CollectionsGallery.vue'
import NavigationDrawer from '../common/NavigationDrawer.vue'
import TagFilter from '../collections/TagFilter.vue'

// Data and routing
const { theme } = useData()
const route = useRoute()
const workbookItems = computed(() => theme.value.workbookItems || [])
const collections = computed(() => theme.value.collections || [])

// State
const activeTab = ref('items')
const focusItemSlug = ref(null)
const filteredItems = ref([])
const drawerOpen = ref(false)

// Computed
const sortedWorkbookItems = computed(() => {
  return [...workbookItems.value].sort((a, b) => {
    const yearA = parseInt(a.year) || 0
    const yearB = parseInt(b.year) || 0
    return yearB - yearA
  })
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

// Initialize view from URL
const getInitialView = () => {
  const pathParts = route.path.split('/').filter(Boolean)
  if (pathParts.length > 1 && pathParts[0] === 'workbook') {
    const itemSlug = pathParts[1]
    if (itemSlug && itemSlug !== 'index') {
      return { view: 'folio', focusItem: itemSlug }
    }
  }
  return { view: 'items', focusItem: null }
}

// Actions
function navigateToItem(item) {
  const newPath = `/workbook/${item.slug}`
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', newPath)
  }
  activeTab.value = 'folio'
  focusItemSlug.value = item.slug
}

// Event listeners for global drawer control
onMounted(() => {
  // Initialize view from URL
  const initialState = getInitialView()
  activeTab.value = initialState.view
  focusItemSlug.value = initialState.focusItem

  // Listen for tab changes from global app bar
  window.addEventListener('workbook-tab-change', (e) => {
    activeTab.value = e.detail
  })

  window.addEventListener('workbook-drawer-toggle', (e) => {
    drawerOpen.value = e.detail
  })
})

// Watch for route changes
watch(() => route.path, () => {
  const newState = getInitialView()
  activeTab.value = newState.view
  focusItemSlug.value = newState.focusItem
})
</script>

<template>
  <div class="workbook-page">
    <!-- Folio view -->
    <div v-show="activeTab === 'folio'" class="workbook-view">
      <WorkbookFolio 
        :items="sortedWorkbookItems" 
        :initial-index="initialFolioIndex"
        :key="focusItemSlug || 'default'"
        @navigateToItem="navigateToItem"
      />
    </div>
    
    <!-- Gallery view -->
    <div v-show="activeTab === 'items'" class="workbook-view">
      <WorkbookGallery 
        :items="filteredItems.length ? filteredItems : workbookItems" 
        @item-click="navigateToItem"
      />
    </div>
    
    <!-- Collections view -->
    <div v-show="activeTab === 'collections'" class="workbook-view">
      <div v-if="collections && collections.length === 0" class="empty-state">
        <div class="empty-state-icon">📁</div>
        <h3 class="empty-state-title">No Collections Found</h3>
        <p class="empty-state-description">
          Collections will appear here once they're configured.
        </p>
      </div>
      <CollectionsGallery v-else :collections="collections" />
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
</style>

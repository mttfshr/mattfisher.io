<!-- docs/.vitepress/theme/components/workbook/WorkbookPage.vue -->
<template>
  <!-- Simplified workbook page without redundant containers -->
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
          </p>
        </div>
        
        <CollectionsGallery v-if="collections && collections.length > 0" :collections="collections" />
      </section>
    </main>

    <!-- Navigation Drawer (only shown for items view) -->
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

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useData, useRoute } from 'vitepress';

// Get workbook items and collections from themeConfig
const { theme } = useData();
const route = useRoute();
const workbookItems = computed(() => theme.value.workbookItems || []);
const collections = computed(() => theme.value.collections || []);

// Filtered items state
const filteredItems = ref([]);

// Drawer state (controlled by global layout)
const drawerOpen = ref(false);

// Enhanced routing logic for simplified architecture
const getInitialView = () => {
  // Check if we're viewing a specific item (e.g., /workbook/item-slug)
  const pathParts = route.path.split('/').filter(Boolean);
  if (pathParts.length > 1 && pathParts[0] === 'workbook') {
    const itemSlug = pathParts[1];
    
    // If we have a slug that looks like an item, assume folio view
    // but only if workbook items are loaded and the item exists
    if (itemSlug && itemSlug !== 'index') {
      // Wait for items to load before deciding
      if (workbookItems.value.length > 0) {
        const item = workbookItems.value.find(i => i.slug === itemSlug);
        if (item) {
          return { view: 'folio', focusItem: itemSlug };
        } else {
          // Item doesn't exist, redirect to folio (default)
          return { view: 'folio' };
        }
      } else {
        // Items not loaded yet, default to folio until they load
        return { view: 'folio' };
      }
    }
  }
  
  // Check URL hash for view type
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (hash === '#collections') return { view: 'collections' };
  if (hash === '#items') return { view: 'items' };
  
  // Default to folio view for /workbook/ root
  return { view: 'folio' };
};

// Initialize view state
const initialState = getInitialView();
const activeTab = ref(initialState.view);
const focusItemSlug = ref(initialState.focusItem || null);

// Computed properties
const sortedWorkbookItems = computed(() => {
  const items = [...workbookItems.value];
  return items.sort((a, b) => (b.year || 0) - (a.year || 0)); // Newest first
});

// Get initial index for focused item
const initialFolioIndex = computed(() => {
  if (!focusItemSlug.value || sortedWorkbookItems.value.length === 0) return 0;
  
  // Try exact slug match first
  let index = sortedWorkbookItems.value.findIndex(item => item.slug === focusItemSlug.value);
  
  // If not found by slug, try other matching methods
  if (index === -1) {
    // Try by title with dash/space conversion
    const titleWithSpaces = focusItemSlug.value.replace(/-/g, ' ');
    index = sortedWorkbookItems.value.findIndex(item => 
      item.title?.toLowerCase() === titleWithSpaces.toLowerCase()
    );
  }
  
  // If still not found, try normalized matching
  if (index === -1) {
    index = sortedWorkbookItems.value.findIndex(item => {
      const normalizedTitle = item.title?.toLowerCase().replace(/[\s-_]+/g, '-');
      const normalizedSlug = focusItemSlug.value.toLowerCase();
      return normalizedTitle === normalizedSlug;
    });
  }
  
  console.log('InitialFolioIndex calculation:', {
    focusItemSlug: focusItemSlug.value,
    foundIndex: index,
    totalItems: sortedWorkbookItems.value.length
  });
  
  return index >= 0 ? index : 0;
});

// Actions - simplified without presentation mode
function navigateToItem(item) {
  // Update URL to direct item link
  const newPath = `/workbook/${item.slug}`;
  if (typeof window !== 'undefined') {
    window.history.pushState({}, '', newPath);
  }
  
  // Switch to folio view and focus the item
  activeTab.value = 'folio';
  focusItemSlug.value = item.slug;
}

// Watch for route changes to handle browser navigation
watch(() => route.path, () => {
  const newState = getInitialView();
  activeTab.value = newState.view;
  focusItemSlug.value = newState.focusItem || null;
});

// Watch for workbook items to load and validate the current view
watch(() => workbookItems.value, (items) => {
  console.log('Workbook items loaded, count:', items.length);
  
  // If we're expecting to show a specific item but items just loaded,
  // validate that the item exists and update view accordingly
  const pathParts = route.path.split('/').filter(Boolean);
  if (pathParts.length > 1 && pathParts[0] === 'workbook') {
    const itemSlug = pathParts[1];
    console.log('Looking for item with slug:', itemSlug);
    
    if (itemSlug && itemSlug !== 'index' && items.length > 0) {
      // Try exact slug match first
      let item = items.find(i => i.slug === itemSlug);
      
      // If not found, try alternative slug formats
      if (!item) {
        // Try replacing dashes with spaces
        const titleWithSpaces = itemSlug.replace(/-/g, ' ');
        item = items.find(i => i.title?.toLowerCase() === titleWithSpaces.toLowerCase());
        console.log('Trying title match with spaces:', titleWithSpaces, 'found:', !!item);
      }
      
      // If still not found, try slug variations
      if (!item) {
        // Try finding by title similarity
        item = items.find(i => {
          const normalizedTitle = i.title?.toLowerCase().replace(/[\s-_]+/g, '-');
          const normalizedSlug = itemSlug.toLowerCase();
          return normalizedTitle === normalizedSlug;
        });
        console.log('Trying normalized match, found:', !!item);
      }
      
      if (item) {
        console.log('Found item:', item.title, 'switching to folio view');
        // Item exists, switch to folio view if not already
        if (activeTab.value !== 'folio') {
          activeTab.value = 'folio';
          focusItemSlug.value = item.slug; // Use the actual slug from the item
        }
      } else {
        // Item doesn't exist, redirect to gallery
        console.warn(`Item '${itemSlug}' not found in ${items.length} items, redirecting to folio`);
        console.log('Available items:', items.map(i => ({ slug: i.slug, title: i.title })).slice(0, 5));
        activeTab.value = 'folio';
        focusItemSlug.value = null;
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/workbook/');
        }
      }
    }
  }
}, { immediate: true });

// Watch for tab changes and update URL
function setTab(tab) {
  activeTab.value = tab;
  focusItemSlug.value = null; // Clear focus when changing tabs
  
  if (typeof window !== 'undefined') {
    if (tab === 'collections') {
      window.history.pushState({}, '', '/workbook/#collections');
    } else if (tab === 'folio') {
      window.history.pushState({}, '', '/workbook/#folio');
    } else {
      window.history.pushState({}, '', '/workbook/#folio');
    }
  }
}

const toggleSidebar = () => {
  drawerOpen.value = !drawerOpen.value
}

// Listen for global app bar actions
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('workbook-tab-change', (e) => {
      activeTab.value = e.detail
    })
    
    window.addEventListener('workbook-drawer-toggle', (e) => {
      drawerOpen.value = e.detail
    })
  }
  
  console.log('WorkbookPage initialized with simplified architecture');
  console.log('Initial activeTab:', activeTab.value);
  console.log('Initial focusItemSlug:', focusItemSlug.value);
  console.log('Route path:', route.path);
  console.log('Collections:', collections.value.length);
  console.log('WorkbookItems:', workbookItems.value.length);
  
  // Additional debug for item URLs
  if (focusItemSlug.value) {
    console.log('Looking for item with slug:', focusItemSlug.value);
    const foundItem = workbookItems.value.find(i => i.slug === focusItemSlug.value);
    console.log('Found item:', foundItem ? foundItem.title : 'NOT FOUND');
  }
  
  // Debug URL parsing
  const pathParts = route.path.split('/').filter(Boolean);
  console.log('Path parts:', pathParts);
  if (pathParts.length > 1 && pathParts[0] === 'workbook') {
    console.log('Detected item URL with slug:', pathParts[1]);
  }
});
</script>

<style scoped>
/* Component-specific styles only - VitePress overrides handled by WorkbookLayout */

.workbook-container {
  width: 100%;
  max-width: 100%;
}

.workbook-content {
  padding: var(--space-4) 0;
}

/* Content sections use semantic spacing */
.content-section {
  margin: var(--space-4) 0;
}

/* Folio content needs full-width capability */
.content-section:has(.workbook-folio) {
  margin: 0;
}
</style>

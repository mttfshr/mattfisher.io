<!-- docs/.vitepress/theme/components/workbook/WorkbookPage.vue -->
<template>
  <div class="workbook-page">
    <h1>Workbook</h1>
    
    <div class="workbook-intro">
    Here's an experiment about presenting lots of items in a kind of studio context.    
    </div>
    
    <div class="workbook-tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'folio' }" 
        @click="setTab('folio')"
      >
        📖 Folio
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'items' }" 
        @click="setTab('items')"
      >
        ⚏ Gallery
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'collections' }" 
        @click="setTab('collections')"
      >
        🏷️ Collections
      </button>
    </div>
    
    <div v-show="activeTab === 'folio'" class="tab-content">
      <WorkbookFolio 
        :items="sortedWorkbookItems" 
        @openPresentation="openPresentationMode"
        @navigateToItem="navigateToItem"
      />
    </div>
    
    <div v-show="activeTab === 'items'" class="tab-content">
      <TagFilter 
        :items="workbookItems" 
        @update:filtered-items="filteredItems = $event"
      />
      
      <WorkbookGallery :items="filteredItems.length ? filteredItems : workbookItems" />
    </div>
    
    <div v-show="activeTab === 'collections'" class="tab-content">
      <div class="collections-intro">
        Tag-based collections of things. 
      </div>
      
      <div v-if="collections && collections.length === 0" class="no-collections">
        <p>No collections found. Please ensure your collections are located in the 'docs/workbook/collections' directory and have the proper tag queries configured.</p>
      </div>
      
      <CollectionsGallery v-if="collections && collections.length > 0" :collections="collections" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useData, useRoute } from 'vitepress';
import WorkbookGallery from './WorkbookGallery.vue';
import WorkbookFolio from './WorkbookFolio.vue';
import TagFilter from '../collections/TagFilter.vue';
import CollectionsGallery from '../collections/CollectionsGallery.vue';

// Get workbook items and collections from themeConfig
const { theme } = useData();
const route = useRoute();
const workbookItems = computed(() => theme.value.workbookItems || []);
const collections = computed(() => theme.value.collections || []);

// Filtered items state
const filteredItems = ref([]);

// Tab state - check URL for initial tab
const hash = typeof window !== 'undefined' ? window.location.hash : '';
const initialTab = hash === '#collections' ? 'collections' : 'folio';
const activeTab = ref(initialTab);

// Computed properties
const sortedWorkbookItems = computed(() => {
  const items = [...workbookItems.value];
  return items.sort((a, b) => (b.year || 0) - (a.year || 0)); // Newest first
});

// Actions
function openPresentationMode(item) {
  console.log('Opening presentation for:', item.title);
  // TODO: Implement presentation modal
}

function navigateToItem(item) {
  console.log('Navigating to item:', item.title);
  // The folio component handles this internally
}

// Watch for tab changes and update URL
function setTab(tab) {
  activeTab.value = tab;
  if (typeof window !== 'undefined') {
    if (tab === 'collections') {
      window.history.replaceState({}, '', '#collections');
    } else if (tab === 'items') {
      window.history.replaceState({}, '', '#items');
    } else {
      window.history.replaceState({}, '', '#');
    }
  }
}

onMounted(() => {
  console.log('Collections in WorkbookPage:', collections.value);
});
</script>

<style scoped>
.workbook-page {
  width: 100%;
}

.workbook-intro {
  margin: 1.5rem 0 2rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}

.collections-intro {
  margin: 1.5rem 0 2.5rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}

.workbook-tabs {
  display: flex;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 2rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: var(--vp-c-text-1);
}

.tab-button.active {
  color: var(--vp-c-brand);
  border-bottom-color: var(--vp-c-brand);
}

.tab-content {
  padding-top: 1rem;
}

.no-collections {
  padding: 2rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  text-align: center;
  margin: 2rem 0;
  color: var(--vp-c-text-2);
}
</style>

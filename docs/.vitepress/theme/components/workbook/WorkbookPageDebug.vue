<template>
  <div class="workbook-container">
    <!-- Page header -->
    <header class="page-header-adaptive">
      <div class="page-header-layout">
        <h1 class="text-2xl font-semibold">Workbook (Step by Step Debug)</h1>
        <div class="view-selector">
          <button 
            class="btn btn-ghost" 
            :class="{ 'btn-primary': activeTab === 'folio' }" 
            @click="setTab('folio')"
            title="Folio view"
          >
            <span class="view-icon">📖</span>
          </button>
          <button 
            class="btn btn-ghost" 
            :class="{ 'btn-primary': activeTab === 'items' }" 
            @click="setTab('items')"
            title="Gallery view"
          >
            <span class="view-icon">⚏</span>
          </button>
          <button 
            class="btn btn-ghost" 
            :class="{ 'btn-primary': activeTab === 'collections' }" 
            @click="setTab('collections')"
            title="Collections view"
          >
            <span class="view-icon">🏷️</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <main class="workbook-content" role="main">      
      <!-- Folio view content -->
      <section v-show="activeTab === 'folio'" class="content-section animate-fade-in">
        <p>Folio view - Workbook items: {{ workbookItems.length }}</p>
        <!-- Folio component will be added back once we isolate the issue -->
      </section>
      
      <!-- Gallery view content -->
      <section v-show="activeTab === 'items'" class="content-section animate-fade-in">
        <p>Gallery view - filtered items: {{ filteredItems.length }}</p>
        <!-- Gallery component will be tested next -->
        <WorkbookGallery 
          :items="filteredItems.length ? filteredItems : workbookItems" 
          @item-click="navigateToItem"
        />
      </section>
      
      <!-- Collections view content -->
      <section v-show="activeTab === 'collections'" class="content-section animate-fade-in">
        <div v-if="collections && collections.length === 0" class="card empty-state-pattern">
          <div class="empty-state-icon">📁</div>
          <h3 class="empty-state-title">No Collections Found</h3>
          <p class="empty-state-description">
            Collections will appear here once they're configured.
          </p>
        </div>
        
        <p v-if="collections && collections.length > 0">Collections: {{ collections.length }}</p>
        <!-- Collections gallery will be tested next -->
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useData, useRoute } from 'vitepress';
import WorkbookGallery from './WorkbookGallery.vue';
// NOTE: Temporarily commenting out other imports to isolate the issue
// import WorkbookFolio from './WorkbookFolio.vue';
// import TagFilter from '../collections/TagFilter.vue';
// import CollectionsGallery from '../collections/CollectionsGallery.vue';
// import NavigationDrawer from '../common/NavigationDrawer.vue';

// Get workbook items and collections from themeConfig
const { theme } = useData();
const route = useRoute();
const workbookItems = computed(() => theme.value.workbookItems || []);
const collections = computed(() => theme.value.collections || []);

// Filtered items state
const filteredItems = ref([]);

// Simple tab state
const activeTab = ref('folio');

// Actions - simplified 
function navigateToItem(item) {
  console.log('Navigation to item:', item.title);
  // Navigation logic will be added back once basic rendering works
}

// Watch for tab changes and update URL
function setTab(tab) {
  activeTab.value = tab;
  console.log('Tab changed to:', tab);
}

onMounted(() => {
  console.log('WorkbookPageDebug initialized');
  console.log('Initial activeTab:', activeTab.value);
  console.log('Route path:', route.path);
  console.log('Collections:', collections.value.length);
  console.log('WorkbookItems:', workbookItems.value.length);
});
</script>

<style scoped>
.workbook-container {
  width: 100%;
  max-width: 100%;
}

.workbook-content {
  padding: var(--space-4) 0;
}

.content-section {
  margin: var(--space-4) 0;
}
</style>

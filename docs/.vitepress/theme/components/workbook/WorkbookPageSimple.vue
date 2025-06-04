<template>
  <div class="workbook-container">
    <header class="page-header-adaptive">
      <div class="page-header-layout">
        <h1 class="text-2xl font-semibold">Workbook (Simplified)</h1>
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
        </div>
      </div>
    </header>

    <main class="workbook-content" role="main">
      <div v-if="activeTab === 'folio'" class="content-section">
        <h2>Folio View</h2>
        <p>Workbook items: {{ workbookItems.length }}</p>
        <p>Collections: {{ collections.length }}</p>
      </div>
      
      <div v-if="activeTab === 'items'" class="content-section">
        <h2>Gallery View</h2>
        <p>This is the gallery view (simplified).</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useData } from 'vitepress';

// Get workbook items and collections from themeConfig
const { theme } = useData();
const workbookItems = computed(() => theme.value.workbookItems || []);
const collections = computed(() => theme.value.collections || []);

// Simple tab state
const activeTab = ref('folio');

function setTab(tab) {
  activeTab.value = tab;
}
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

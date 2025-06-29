<template>
  <div v-if="isDevMode" class="dev-admin-panel">
    <div class="admin-header">
      <h1 class="admin-title">
        <Icon name="Settings" />
        Development Content Manager
      </h1>
      <div class="admin-subtitle">
        Visual content organization for development only
      </div>
    </div>
    
    <nav class="admin-nav">
      <button 
        v-for="section in adminSections" 
        :key="section.id"
        :class="['admin-nav-btn', { active: activeSection === section.id }]"
        @click="activeSection = section.id"
      >
        <Icon :name="section.icon" />
        {{ section.label }}
        <span v-if="section.count" class="admin-nav-count">{{ section.count }}</span>
      </button>
    </nav>
    
    <div class="admin-content">
      <!-- Pins Manager -->
      <div v-if="activeSection === 'pins'" class="admin-section">
        <PinOrganizer 
          v-if="pinsData"
          :pins="pinsData.pins" 
          :collections="pinsData.collections"
          @update-pins="handlePinsUpdate"
        />
        <div v-else class="loading">
          <Icon name="Loader2" class="loading-spinner" />
          Loading pins data...
        </div>
      </div>
      
      <!-- Collections Manager -->
      <div v-if="activeSection === 'collections'" class="admin-section">
        <CollectionManager 
          v-if="collectionsData"
          :collections="collectionsData.collections"
          @update-collections="handleCollectionsUpdate"
        />
        <div v-else class="loading">
          <Icon name="Loader2" class="loading-spinner" />
          Loading collections data...
        </div>
      </div>
      
      <!-- Tag Manager -->
      <div v-if="activeSection === 'tags'" class="admin-section">
        <TagManager 
          v-if="pinsData"
          :pins="pinsData.pins"
          @update-tags="handleTagsUpdate"
        />
      </div>
      
      <!-- System Info -->
      <div v-if="activeSection === 'system'" class="admin-section">
        <SystemInfo />
      </div>
    </div>
  </div>
  
  <!-- Production mode fallback -->
  <div v-else class="dev-mode-only">
    <h1>Development Tools</h1>
    <p>This page is only available in development mode.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import Icon from '../common/Icon.vue'
import PinOrganizer from './PinOrganizer.vue'
import CollectionManager from './CollectionManager.vue'
import TagManager from './TagManager.vue'
import SystemInfo from './SystemInfo.vue'

const { isDark, theme } = useData()

// Development mode detection
const isDevMode = computed(() => {
  return theme.value.devTools?.enabled || false
})

// Admin interface state
const activeSection = ref('pins')
const pinsData = ref(null)
const collectionsData = ref(null)
const loading = ref(false)

// Admin sections configuration
const adminSections = computed(() => [
  {
    id: 'pins',
    label: 'Pin Organizer',
    icon: 'Pin',
    count: pinsData.value?.pins?.length || null
  },
  {
    id: 'collections',
    label: 'Collections',
    icon: 'FolderOpen',
    count: collectionsData.value?.collections?.length || null
  },
  {
    id: 'tags',
    label: 'Tag Manager',
    icon: 'Tags',
    count: null
  },
  {
    id: 'system',
    label: 'System Info',
    icon: 'Info',
    count: null
  }
])

// Load data on mount
onMounted(async () => {
  if (isDevMode.value) {
    await loadAdminData()
  }
})

// Load admin data
async function loadAdminData() {
  loading.value = true
  
  try {
    // Load pins data
    const pinsResponse = await fetch('/api/admin/pins')
    if (pinsResponse.ok) {
      pinsData.value = await pinsResponse.json()
    }
    
    // Load collections data
    const collectionsResponse = await fetch('/api/admin/collections')
    if (collectionsResponse.ok) {
      collectionsData.value = await collectionsResponse.json()
    }
  } catch (error) {
    console.error('Error loading admin data:', error)
  } finally {
    loading.value = false
  }
}

// Event handlers
async function handlePinsUpdate(updatedPins) {
  try {
    const response = await fetch('/api/admin/pins/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pins: updatedPins })
    })
    
    if (response.ok) {
      console.log('✅ Pins updated successfully')
      // Reload data
      await loadAdminData()
    } else {
      console.error('❌ Failed to update pins')
    }
  } catch (error) {
    console.error('Error updating pins:', error)
  }
}

async function handleCollectionsUpdate(updatedCollections) {
  try {
    const response = await fetch('/api/admin/collections/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ collections: updatedCollections })
    })
    
    if (response.ok) {
      console.log('✅ Collections updated successfully')
      await loadAdminData()
    } else {
      console.error('❌ Failed to update collections')
    }
  } catch (error) {
    console.error('Error updating collections:', error)
  }
}

function handleTagsUpdate(updatedTags) {
  console.log('Tags updated:', updatedTags)
  // Handle tag updates
}
</script>

<style scoped>
.dev-admin-panel {
  min-height: 100vh;
  background: var(--surface-primary);
  color: var(--text-primary);
}

.admin-header {
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--border-primary);
  background: var(--surface-secondary);
}

.admin-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
}

.admin-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}

.admin-nav {
  display: flex;
  padding: 0 var(--space-6);
  gap: var(--space-2);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.admin-nav-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: var(--transition-fast);
}

.admin-nav-btn:hover {
  color: var(--text-primary);
  background: var(--surface-primary);
}

.admin-nav-btn.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

.admin-nav-count {
  background: var(--surface-primary);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  min-width: 20px;
  text-align: center;
}

.admin-content {
  padding: var(--space-6);
}

.admin-section {
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-secondary);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dev-mode-only {
  padding: var(--space-8);
  text-align: center;
  color: var(--text-secondary);
}

.dev-mode-only h1 {
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}
</style>

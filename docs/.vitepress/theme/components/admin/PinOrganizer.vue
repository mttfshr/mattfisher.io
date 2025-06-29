<template>
  <div class="pin-organizer">
    <div class="organizer-header">
      <h2 class="organizer-title">
        <Icon name="Pin" />
        Pin Organizer
      </h2>
      <div class="organizer-stats">
        {{ totalPins }} pins across {{ fileCount }} files
      </div>
    </div>
    
    <div class="organizer-controls">
      <div class="view-controls">
        <button 
          v-for="view in viewModes" 
          :key="view.id"
          :class="['view-btn', { active: currentView === view.id }]"
          @click="currentView = view.id"
        >
          <Icon :name="view.icon" />
          {{ view.label }}
        </button>
      </div>
      
      <div class="filter-controls">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search pins..."
          class="search-input"
        >
        
        <select v-model="selectedFile" class="file-filter">
          <option value="">All files</option>
          <option v-for="file in fileList" :key="file" :value="file">
            {{ file }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Collections Panel View -->
    <div v-if="currentView === 'collections'" class="collections-view">
      <div class="collections-grid">
        <!-- Uncategorized Collection -->
        <div class="collection-panel">
          <div class="collection-header">
            <h3>Uncategorized</h3>
            <span class="collection-count">{{ uncategorizedPins.length }}</span>
          </div>
          <div 
            class="collection-drop-zone"
            @drop="handleDrop('uncategorized', $event)"
            @dragover.prevent
            @dragenter.prevent
          >
            <div
              v-for="pin in uncategorizedPins.slice(0, 6)"
              :key="pin.url"
              :draggable="true"
              class="pin-mini-card"
              @dragstart="handleDragStart(pin, $event)"
            >
              <div class="pin-mini-thumbnail-container">
                <img 
                  v-if="pin.imageUrl" 
                  :src="pin.imageUrl" 
                  :alt="pin.title || pin.url"
                  class="pin-mini-thumbnail"
                  @error="handleImageError"
                >
                <div v-else class="pin-mini-thumbnail-placeholder">
                  <Icon name="Link" size="20" />
                </div>
              </div>
              <div class="pin-mini-title">{{ pin.title || getUrlDomain(pin.url) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Named Collections -->
        <div 
          v-for="collection in availableCollections" 
          :key="collection"
          class="collection-panel"
        >
          <div class="collection-header">
            <h3>{{ collection }}</h3>
            <span class="collection-count">{{ getCollectionPins(collection).length }}</span>
          </div>
          <div 
            class="collection-drop-zone"
            @drop="handleDrop(collection, $event)"
            @dragover.prevent
            @dragenter.prevent
          >
            <div
              v-for="pin in getCollectionPins(collection).slice(0, 6)"
              :key="pin.url"
              :draggable="true"
              class="pin-mini-card"
              @dragstart="handleDragStart(pin, $event)"
            >
              <div class="pin-mini-thumbnail-container">
                <img 
                  v-if="pin.imageUrl" 
                  :src="pin.imageUrl" 
                  :alt="pin.title || pin.url"
                  class="pin-mini-thumbnail"
                  @error="handleImageError"
                >
                <div v-else class="pin-mini-thumbnail-placeholder">
                  <Icon name="Link" size="20" />
                </div>
              </div>
              <div class="pin-mini-title">{{ pin.title || getUrlDomain(pin.url) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Add New Collection -->
        <div class="collection-panel new-collection">
          <div class="collection-header">
            <input 
              v-if="showNewCollectionInput"
              v-model="newCollectionName"
              @keyup.enter="createNewCollection"
              @blur="cancelNewCollection"
              class="new-collection-input"
              placeholder="Collection name..."
              ref="newCollectionInputRef"
            >
            <button 
              v-else
              @click="startNewCollection"
              class="new-collection-btn"
            >
              <Icon name="Plus" />
              New Collection
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- List View -->
    <div v-if="currentView === 'list'" class="list-view">
      <div class="pins-list">
        <div 
          v-for="pin in filteredPins" 
          :key="pin.url"
          class="pin-list-item"
          :draggable="true"
          @dragstart="handleDragStart(pin, $event)"
        >
          <div class="pin-info">
            <div class="pin-thumbnail-container">
              <img 
                v-if="pin.imageUrl" 
                :src="pin.imageUrl" 
                :alt="pin.title || pin.url"
                class="pin-thumbnail"
                @error="handleImageError"
              >
              <div v-else class="pin-thumbnail-placeholder">
                <Icon name="Link" size="24" />
              </div>
            </div>
            <div class="pin-details">
              <h4 class="pin-title">{{ pin.title || getUrlDomain(pin.url) }}</h4>
              <p class="pin-url">{{ pin.url }}</p>
              <div class="pin-meta">
                <span class="pin-file">{{ pin.file }}</span>
                <span class="pin-section">{{ pin.section }}</span>
              </div>
            </div>
          </div>
          
          <div class="pin-collections">
            <div class="current-collections">
              <span 
                v-for="collection in pin.collections" 
                :key="collection"
                class="collection-tag"
              >
                {{ collection }}
                <button 
                  @click="removeFromCollection(pin, collection)"
                  class="remove-collection-btn"
                >
                  <Icon name="X" size="12" />
                </button>
              </span>
            </div>
            
            <select 
              @change="addToCollection(pin, $event.target.value)"
              class="add-collection-select"
            >
              <option value="">Add to collection...</option>
              <option 
                v-for="collection in availableCollections" 
                :key="collection"
                :value="collection"
                :disabled="pin.collections.includes(collection)"
              >
                {{ collection }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Save Controls -->
    <div v-if="hasUnsavedChanges" class="save-controls">
      <div class="save-status">
        <Icon name="AlertCircle" />
        You have unsaved changes
      </div>
      <div class="save-actions">
        <button @click="discardChanges" class="btn btn-ghost">
          Discard Changes
        </button>
        <button @click="saveChanges" class="btn btn-primary">
          <Icon name="Save" />
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import Icon from '../common/Icon.vue'

const props = defineProps({
  pins: {
    type: Array,
    required: true
  },
  collections: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-pins'])

// Component state
const currentView = ref('collections')
const searchQuery = ref('')
const selectedFile = ref('')
const showNewCollectionInput = ref(false)
const newCollectionName = ref('')
const newCollectionInputRef = ref(null)
const hasUnsavedChanges = ref(false)

// Working copy of pins data
const workingPins = ref([...props.pins])

// View modes
const viewModes = [
  { id: 'collections', label: 'Collections', icon: 'FolderOpen' },
  { id: 'list', label: 'List', icon: 'List' }
]

// Computed properties
const totalPins = computed(() => {
  return workingPins.value.reduce((total, file) => total + file.pins.length, 0)
})

const fileCount = computed(() => workingPins.value.length)

const fileList = computed(() => {
  return workingPins.value.map(file => file.file)
})

const allPins = computed(() => {
  return workingPins.value.flatMap(file => 
    file.pins.map(pin => ({ ...pin, file: file.file }))
  )
})

const filteredPins = computed(() => {
  let pins = allPins.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    pins = pins.filter(pin => 
      pin.title?.toLowerCase().includes(query) ||
      pin.url.toLowerCase().includes(query) ||
      pin.notes?.toLowerCase().includes(query)
    )
  }
  
  if (selectedFile.value) {
    pins = pins.filter(pin => pin.file === selectedFile.value)
  }
  
  return pins
})

const availableCollections = computed(() => {
  const collections = new Set(props.collections)
  
  // Add collections from current pins
  allPins.value.forEach(pin => {
    pin.collections?.forEach(collection => collections.add(collection))
  })
  
  return Array.from(collections).sort()
})

const uncategorizedPins = computed(() => {
  return filteredPins.value.filter(pin => 
    !pin.collections || pin.collections.length === 0
  )
})

// Collection helpers
function getCollectionPins(collection) {
  return filteredPins.value.filter(pin => 
    pin.collections?.includes(collection)
  )
}

// Drag and drop handlers
function handleDragStart(pin, event) {
  event.dataTransfer.setData('application/json', JSON.stringify(pin))
  event.dataTransfer.effectAllowed = 'move'
}

function handleDrop(collection, event) {
  event.preventDefault()
  
  try {
    const pin = JSON.parse(event.dataTransfer.getData('application/json'))
    
    if (collection === 'uncategorized') {
      // Remove from all collections
      removeFromAllCollections(pin)
    } else {
      // Add to specific collection
      addPinToCollection(pin, collection)
    }
    
    hasUnsavedChanges.value = true
  } catch (error) {
    console.error('Error handling drop:', error)
  }
}

// Collection management
function addPinToCollection(pin, collection) {
  const targetPin = findPin(pin.url)
  if (targetPin && !targetPin.collections.includes(collection)) {
    targetPin.collections.push(collection)
  }
}

function removeFromCollection(pin, collection) {
  const targetPin = findPin(pin.url)
  if (targetPin) {
    const index = targetPin.collections.indexOf(collection)
    if (index > -1) {
      targetPin.collections.splice(index, 1)
    }
  }
  hasUnsavedChanges.value = true
}

function removeFromAllCollections(pin) {
  const targetPin = findPin(pin.url)
  if (targetPin) {
    targetPin.collections = []
  }
}

function addToCollection(pin, collection) {
  if (collection && !pin.collections.includes(collection)) {
    addPinToCollection(pin, collection)
    hasUnsavedChanges.value = true
  }
  
  // Reset select
  event.target.value = ''
}

function findPin(url) {
  for (const file of workingPins.value) {
    const pin = file.pins.find(p => p.url === url)
    if (pin) return pin
  }
  return null
}

// New collection management
async function startNewCollection() {
  showNewCollectionInput.value = true
  await nextTick()
  newCollectionInputRef.value?.focus()
}

function createNewCollection() {
  if (newCollectionName.value.trim()) {
    // Collection is created when first pin is added to it
    showNewCollectionInput.value = false
    newCollectionName.value = ''
  }
}

function cancelNewCollection() {
  showNewCollectionInput.value = false
  newCollectionName.value = ''
}

// Save/discard changes
function saveChanges() {
  emit('update-pins', workingPins.value)
  hasUnsavedChanges.value = false
}

function discardChanges() {
  workingPins.value = [...props.pins]
  hasUnsavedChanges.value = false
}

// Helper functions
function handleImageError(event) {
  // Hide broken images gracefully
  event.target.style.display = 'none'
}

function getUrlDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}
</script>

<style scoped>
.pin-organizer {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.organizer-header {
  padding: var(--space-6);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.organizer-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
}

.organizer-stats {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}

.organizer-controls {
  padding: var(--space-4) var(--space-6);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

.view-controls {
  display: flex;
  gap: var(--space-2);
}

.view-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: none;
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.view-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-secondary);
}

.view-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.filter-controls {
  display: flex;
  gap: var(--space-3);
}

.search-input,
.file-filter,
.add-collection-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-primary);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.search-input {
  min-width: 240px;
}

.file-filter {
  min-width: 150px;
}

/* Collections View */
.collections-view {
  padding: var(--space-6);
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.collection-panel {
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.collection-header {
  padding: var(--space-4);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collection-header h3 {
  font-size: var(--text-base);
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.collection-count {
  background: var(--surface-secondary);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.collection-drop-zone {
  min-height: 200px;
  padding: var(--space-4);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
  transition: var(--transition-fast);
}

.collection-drop-zone:hover {
  background: var(--surface-primary);
}

.pin-mini-card {
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  cursor: grab;
  transition: var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pin-mini-card:hover {
  border-color: var(--border-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pin-mini-card:active {
  cursor: grabbing;
}

.pin-mini-thumbnail-container {
  position: relative;
  width: 100%;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-mini-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pin-mini-thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  background: var(--surface-secondary);
  width: 100%;
  height: 100%;
}

.pin-mini-title {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-collection {
  border: 2px dashed var(--border-primary);
  background: transparent;
}

.new-collection-input {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-primary);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.new-collection-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
}

/* List View */
.list-view {
  padding: var(--space-6);
}

.pins-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pin-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  cursor: grab;
}

.pin-list-item:active {
  cursor: grabbing;
}

.pin-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
}

.pin-thumbnail-container {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pin-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pin-thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  background: var(--surface-secondary);
  width: 100%;
  height: 100%;
}

.pin-details {
  flex: 1;
}

.pin-title {
  font-size: var(--text-base);
  font-weight: 500;
  margin: 0 0 var(--space-1);
  color: var(--text-primary);
}

.pin-url {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-2);
  word-break: break-all;
}

.pin-meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.pin-collections {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-end;
}

.current-collections {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.collection-tag {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.remove-collection-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.7;
}

.remove-collection-btn:hover {
  opacity: 1;
}

.add-collection-select {
  min-width: 180px;
}

/* Save Controls */
.save-controls {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.save-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.save-actions {
  display: flex;
  gap: var(--space-2);
}

.btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid transparent;
}

.btn-ghost {
  background: none;
  color: var(--text-secondary);
  border-color: var(--border-primary);
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--surface-primary);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .organizer-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
  }
  
  .pin-list-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .pin-collections {
    align-items: stretch;
  }
  
  .save-controls {
    left: var(--space-4);
    right: var(--space-4);
    flex-direction: column;
  }
}
</style>

<template>
  <div class="tag-manager">
    <div class="manager-header">
      <h2 class="manager-title">
        <Icon name="Tags" />
        Tag Manager
      </h2>
      <div class="manager-stats">
        {{ totalTags }} unique tags across {{ totalPins }} pins
      </div>
    </div>
    
    <div class="tag-actions">
      <div class="bulk-actions">
        <button 
          @click="selectAll"
          class="action-btn"
          :class="{ active: selectedTags.size === allTags.length }"
        >
          <Icon name="CheckSquare" />
          Select All
        </button>
        <button 
          @click="clearSelection"
          class="action-btn"
          :disabled="selectedTags.size === 0"
        >
          <Icon name="Square" />
          Clear
        </button>
        <button 
          @click="bulkDelete"
          class="action-btn danger"
          :disabled="selectedTags.size === 0"
        >
          <Icon name="Trash2" />
          Delete Selected ({{ selectedTags.size }})
        </button>
      </div>
      
      <div class="view-options">
        <button 
          v-for="view in viewOptions" 
          :key="view.id"
          :class="['view-btn', { active: currentView === view.id }]"
          @click="currentView = view.id"
        >
          <Icon :name="view.icon" />
          {{ view.label }}
        </button>
      </div>
    </div>
    
    <!-- Tag List View -->
    <div v-if="currentView === 'list'" class="tags-list">
      <div class="list-header">
        <div class="search-controls">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search tags..."
            class="search-input"
          >
          <select v-model="sortBy" class="sort-select">
            <option value="name">Sort by Name</option>
            <option value="count">Sort by Usage</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>
      
      <div class="tag-items">
        <div 
          v-for="tag in filteredTags" 
          :key="tag.name"
          class="tag-item"
          :class="{ selected: selectedTags.has(tag.name) }"
          @click="toggleTag(tag.name)"
        >
          <div class="tag-info">
            <div class="tag-name">{{ tag.name }}</div>
            <div class="tag-meta">
              <span class="tag-type">{{ tag.type }}</span>
              <span class="tag-count">{{ tag.count }} pins</span>
            </div>
          </div>
          
          <div class="tag-actions">
            <button 
              @click.stop="renameTag(tag)"
              class="mini-btn"
              title="Rename tag"
            >
              <Icon name="Edit2" size="14" />
            </button>
            <button 
              @click.stop="deleteTag(tag)"
              class="mini-btn danger"
              title="Delete tag"
            >
              <Icon name="Trash2" size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tag Cloud View -->
    <div v-if="currentView === 'cloud'" class="tag-cloud">
      <div 
        v-for="tag in filteredTags" 
        :key="tag.name"
        class="cloud-tag"
        :class="{ 
          selected: selectedTags.has(tag.name),
          [`size-${getTagSize(tag.count)}`]: true
        }"
        @click="toggleTag(tag.name)"
      >
        {{ tag.name }}
        <span class="tag-count">({{ tag.count }})</span>
      </div>
    </div>
    
    <!-- Rename Modal -->
    <div v-if="showRenameModal" class="modal-overlay" @click="closeRenameModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Rename Tag</h3>
          <button @click="closeRenameModal" class="close-btn">
            <Icon name="X" />
          </button>
        </div>
        
        <form @submit.prevent="confirmRename" class="rename-form">
          <div class="form-group">
            <label>Current Name</label>
            <input 
              :value="renamingTag?.name"
              disabled
              class="form-input disabled"
            >
          </div>
          
          <div class="form-group">
            <label for="newTagName">New Name</label>
            <input 
              id="newTagName"
              v-model="newTagName"
              type="text" 
              required
              class="form-input"
              placeholder="Enter new tag name..."
            >
          </div>
          
          <div class="rename-preview">
            <p>This will affect <strong>{{ renamingTag?.count }}</strong> pins</p>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeRenameModal" class="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Rename Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from '../common/Icon.vue'

const props = defineProps({
  pins: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-tags'])

// Component state
const currentView = ref('list')
const searchQuery = ref('')
const sortBy = ref('name')
const selectedTags = ref(new Set())
const showRenameModal = ref(false)
const renamingTag = ref(null)
const newTagName = ref('')

// View options
const viewOptions = [
  { id: 'list', label: 'List', icon: 'List' },
  { id: 'cloud', label: 'Cloud', icon: 'Cloud' }
]

// Computed properties
const allPins = computed(() => {
  return props.pins.flatMap(file => 
    file.pins.map(pin => ({ ...pin, file: file.file }))
  )
})

const totalPins = computed(() => allPins.value.length)

const tagCounts = computed(() => {
  const counts = {}
  
  allPins.value.forEach(pin => {
    // Count regular tags
    pin.tags?.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1
    })
    
    // Count collection tags
    pin.collections?.forEach(collection => {
      const collectionTag = `collection:${collection}`
      counts[collectionTag] = (counts[collectionTag] || 0) + 1
    })
  })
  
  return counts
})

const allTags = computed(() => {
  return Object.entries(tagCounts.value).map(([name, count]) => ({
    name,
    count,
    type: getTagType(name)
  }))
})

const totalTags = computed(() => allTags.value.length)

const filteredTags = computed(() => {
  let tags = allTags.value
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tags = tags.filter(tag => 
      tag.name.toLowerCase().includes(query)
    )
  }
  
  // Sort tags
  tags.sort((a, b) => {
    switch (sortBy.value) {
      case 'count':
        return b.count - a.count
      case 'type':
        return a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
      default:
        return a.name.localeCompare(b.name)
    }
  })
  
  return tags
})

// Helper functions
function getTagType(tagName) {
  if (tagName.startsWith('collection:')) {
    return 'collection'
  } else if (['video', 'music', 'article', 'link', 'code'].includes(tagName)) {
    return 'content-type'
  } else if (['spotify', 'vimeo', 'youtube', 'github'].includes(tagName)) {
    return 'platform'
  } else if (tagName.match(/^\d{4}$/)) {
    return 'year'
  } else {
    return 'custom'
  }
}

function getTagSize(count) {
  if (count >= 20) return 'xl'
  if (count >= 10) return 'lg'
  if (count >= 5) return 'md'
  return 'sm'
}

// Tag management
function toggleTag(tagName) {
  if (selectedTags.value.has(tagName)) {
    selectedTags.value.delete(tagName)
  } else {
    selectedTags.value.add(tagName)
  }
}

function selectAll() {
  if (selectedTags.value.size === allTags.value.length) {
    selectedTags.value.clear()
  } else {
    selectedTags.value = new Set(allTags.value.map(tag => tag.name))
  }
}

function clearSelection() {
  selectedTags.value.clear()
}

function bulkDelete() {
  if (selectedTags.value.size > 0) {
    const tagsToDelete = Array.from(selectedTags.value)
    console.log('Bulk deleting tags:', tagsToDelete)
    // Emit update event
    emit('update-tags', { action: 'delete', tags: tagsToDelete })
    selectedTags.value.clear()
  }
}

function renameTag(tag) {
  renamingTag.value = tag
  newTagName.value = tag.name
  showRenameModal.value = true
}

function deleteTag(tag) {
  console.log('Deleting tag:', tag.name)
  emit('update-tags', { action: 'delete', tags: [tag.name] })
}

function closeRenameModal() {
  showRenameModal.value = false
  renamingTag.value = null
  newTagName.value = ''
}

function confirmRename() {
  if (renamingTag.value && newTagName.value.trim()) {
    console.log(`Renaming tag "${renamingTag.value.name}" to "${newTagName.value}"`)
    emit('update-tags', { 
      action: 'rename', 
      oldName: renamingTag.value.name, 
      newName: newTagName.value.trim() 
    })
    closeRenameModal()
  }
}
</script>

<style scoped>
.tag-manager {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.manager-header {
  padding: var(--space-6);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.manager-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
}

.manager-stats {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}

.tag-actions {
  padding: var(--space-4) var(--space-6);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

.bulk-actions {
  display: flex;
  gap: var(--space-2);
}

.action-btn {
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

.action-btn:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--border-secondary);
}

.action-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.action-btn.danger:hover:not(:disabled) {
  color: var(--error-primary);
  border-color: var(--error-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.view-options {
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

/* List View */
.tags-list {
  padding: var(--space-6);
}

.list-header {
  margin-bottom: var(--space-4);
}

.search-controls {
  display: flex;
  gap: var(--space-3);
}

.search-input,
.sort-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-secondary);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.search-input {
  flex: 1;
  min-width: 240px;
}

.sort-select {
  min-width: 160px;
}

.tag-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tag-item:hover {
  border-color: var(--border-secondary);
}

.tag-item.selected {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.tag-info {
  flex: 1;
}

.tag-name {
  font-size: var(--text-base);
  font-weight: 500;
  margin-bottom: var(--space-1);
}

.tag-meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-xs);
  opacity: 0.7;
}

.tag-actions {
  display: flex;
  gap: var(--space-1);
  margin-left: var(--space-3);
}

.mini-btn {
  padding: var(--space-1);
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mini-btn.danger:hover {
  color: var(--error-primary);
  border-color: var(--error-primary);
}

/* Tag Cloud */
.tag-cloud {
  padding: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  line-height: 1.6;
}

.cloud-tag {
  padding: var(--space-1) var(--space-2);
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-fast);
  user-select: none;
}

.cloud-tag:hover {
  border-color: var(--border-secondary);
  background: var(--surface-primary);
}

.cloud-tag.selected {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.cloud-tag.size-sm {
  font-size: var(--text-xs);
}

.cloud-tag.size-md {
  font-size: var(--text-sm);
}

.cloud-tag.size-lg {
  font-size: var(--text-base);
}

.cloud-tag.size-xl {
  font-size: var(--text-lg);
  font-weight: 600;
}

.cloud-tag .tag-count {
  opacity: 0.7;
  font-size: 0.85em;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  min-width: 400px;
  max-width: 90vw;
}

.modal-header {
  padding: var(--space-5);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  padding: var(--space-2);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--surface-secondary);
}

.rename-form {
  padding: var(--space-5);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-secondary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
}

.form-input.disabled {
  opacity: 0.6;
  background: var(--surface-primary);
}

.rename-preview {
  padding: var(--space-3);
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.rename-preview p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-primary);
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
  background: var(--surface-secondary);
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
  .tag-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-controls {
    flex-direction: column;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .modal-content {
    min-width: auto;
    margin: var(--space-4);
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>

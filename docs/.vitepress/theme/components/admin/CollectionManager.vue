<template>
  <div class="collection-manager">
    <div class="manager-header">
      <h2 class="manager-title">
        <Icon name="FolderOpen" />
        Collection Manager
      </h2>
      <div class="manager-actions">
        <button @click="createCollection" class="btn btn-primary">
          <Icon name="Plus" />
          Create Collection
        </button>
      </div>
    </div>
    
    <div class="collections-grid">
      <div 
        v-for="collection in collections" 
        :key="collection.name"
        class="collection-card"
      >
        <div class="collection-info">
          <h3 class="collection-name">{{ collection.name }}</h3>
          <p class="collection-description">{{ collection.description }}</p>
          <div class="collection-stats">
            <span class="stat">
              <Icon name="Pin" size="14" />
              {{ getCollectionPinCount(collection.name) }} pins
            </span>
          </div>
        </div>
        
        <div class="collection-actions">
          <button 
            @click="editCollection(collection)"
            class="action-btn"
            title="Edit collection"
          >
            <Icon name="Edit2" size="16" />
          </button>
          <button 
            @click="deleteCollection(collection)"
            class="action-btn danger"
            title="Delete collection"
          >
            <Icon name="Trash2" size="16" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Collection Form Modal -->
    <div v-if="showCollectionForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingCollection ? 'Edit Collection' : 'Create Collection' }}</h3>
          <button @click="closeForm" class="close-btn">
            <Icon name="X" />
          </button>
        </div>
        
        <form @submit.prevent="saveCollection" class="collection-form">
          <div class="form-group">
            <label for="collectionName">Collection Name</label>
            <input 
              id="collectionName"
              v-model="formData.name"
              type="text" 
              required
              class="form-input"
              placeholder="Enter collection name..."
            >
          </div>
          
          <div class="form-group">
            <label for="collectionDescription">Description</label>
            <textarea 
              id="collectionDescription"
              v-model="formData.description"
              class="form-textarea"
              placeholder="Enter collection description..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeForm" class="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {{ editingCollection ? 'Update' : 'Create' }} Collection
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content small" @click.stop>
        <div class="modal-header">
          <h3>Delete Collection</h3>
          <button @click="cancelDelete" class="close-btn">
            <Icon name="X" />
          </button>
        </div>
        
        <div class="delete-content">
          <p>Are you sure you want to delete the collection <strong>{{ deletingCollection?.name }}</strong>?</p>
          <p class="warning">This will remove the collection from all pins but won't delete the pins themselves.</p>
        </div>
        
        <div class="form-actions">
          <button @click="cancelDelete" class="btn btn-ghost">
            Cancel
          </button>
          <button @click="confirmDelete" class="btn btn-danger">
            <Icon name="Trash2" />
            Delete Collection
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from '../common/Icon.vue'

const props = defineProps({
  collections: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-collections'])

// Component state
const showCollectionForm = ref(false)
const showDeleteConfirm = ref(false)
const editingCollection = ref(null)
const deletingCollection = ref(null)

const formData = ref({
  name: '',
  description: ''
})

// Mock pin count data (in real implementation, this would come from pins data)
const pinCounts = ref({
  'Favorites': 15,
  'Music': 42,
  'Video': 28,
  'Design': 33,
  'Development': 67
})

// Computed properties
const collections = computed(() => props.collections)

// Collection management
function createCollection() {
  editingCollection.value = null
  formData.value = {
    name: '',
    description: ''
  }
  showCollectionForm.value = true
}

function editCollection(collection) {
  editingCollection.value = collection
  formData.value = {
    name: collection.name,
    description: collection.description
  }
  showCollectionForm.value = true
}

function deleteCollection(collection) {
  deletingCollection.value = collection
  showDeleteConfirm.value = true
}

function saveCollection() {
  const updatedCollections = [...collections.value]
  
  if (editingCollection.value) {
    // Update existing collection
    const index = updatedCollections.findIndex(c => c.name === editingCollection.value.name)
    if (index > -1) {
      updatedCollections[index] = {
        ...updatedCollections[index],
        name: formData.value.name,
        description: formData.value.description
      }
    }
  } else {
    // Create new collection
    updatedCollections.push({
      name: formData.value.name,
      description: formData.value.description
    })
  }
  
  emit('update-collections', updatedCollections)
  closeForm()
}

function confirmDelete() {
  if (deletingCollection.value) {
    const updatedCollections = collections.value.filter(
      c => c.name !== deletingCollection.value.name
    )
    emit('update-collections', updatedCollections)
  }
  cancelDelete()
}

function cancelDelete() {
  deletingCollection.value = null
  showDeleteConfirm.value = false
}

function closeForm() {
  showCollectionForm.value = false
  editingCollection.value = null
  formData.value = {
    name: '',
    description: ''
  }
}

function getCollectionPinCount(collectionName) {
  return pinCounts.value[collectionName] || 0
}
</script>

<style scoped>
.collection-manager {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.manager-header {
  padding: var(--space-6);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.manager-actions {
  display: flex;
  gap: var(--space-2);
}

.collections-grid {
  padding: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)));
  gap: var(--space-4);
}

.collection-card {
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: var(--transition-fast);
}

.collection-card:hover {
  border-color: var(--border-secondary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.collection-info {
  flex: 1;
}

.collection-name {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0 0 var(--space-2);
  color: var(--text-primary);
}

.collection-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3);
  line-height: 1.5;
}

.collection-stats {
  display: flex;
  gap: var(--space-3);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.collection-actions {
  display: flex;
  gap: var(--space-1);
  margin-left: var(--space-3);
}

.action-btn {
  padding: var(--space-2);
  background: none;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-secondary);
  background: var(--surface-primary);
}

.action-btn.danger:hover {
  color: var(--error-primary);
  border-color: var(--error-primary);
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
  max-height: 90vh;
  overflow: auto;
}

.modal-content.small {
  min-width: 320px;
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

.collection-form {
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

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-secondary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-primary);
}

.delete-content {
  padding: var(--space-5);
}

.delete-content p {
  margin: 0 0 var(--space-3);
  color: var(--text-primary);
}

.delete-content .warning {
  font-size: var(--text-sm);
  color: var(--text-secondary);
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

.btn-danger {
  background: var(--error-primary);
  color: white;
}

.btn-danger:hover {
  background: var(--error-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
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

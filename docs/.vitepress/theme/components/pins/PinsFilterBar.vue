<script setup>
import { computed } from 'vue'

const props = defineProps({
  collections: {
    type: Array,
    required: true
  },
  selectedCollection: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['collection-select'])

const selectCollection = (collectionId) => {
  const newSelection = props.selectedCollection === collectionId ? null : collectionId
  emit('collection-select', newSelection)
}

// Sort collections by pin count (most pins first)
const sortedCollections = computed(() => {
  return [...props.collections].sort((a, b) => b.pins.length - a.pins.length)
})

// Format collection name for display
const formatName = (name) => {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}
</script>

<template>
  <div class="pins-filter-bar">
    <div class="filter-section">
      <span class="filter-label">Collections:</span>
      <div class="filter-buttons">
        <button 
          v-for="collection in sortedCollections"
          :key="collection.id"
          @click="selectCollection(collection.id)"
          :class="['filter-button', { active: selectedCollection === collection.id }]"
        >
          {{ formatName(collection.id) }}
          <span class="count-badge">{{ collection.pins.length }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pins-filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
  overflow-x: auto;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  white-space: nowrap;
}

.filter-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-buttons {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--surface-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.filter-button:hover {
  background: var(--surface-primary);
  border-color: var(--accent-primary);
}

.filter-button.active {
  background: var(--accent-primary);
  color: var(--surface-primary);
  border-color: var(--accent-primary);
}

.count-badge {
  background: var(--surface-primary);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.filter-button.active .count-badge {
  background: rgba(255, 255, 255, 0.2);
  color: var(--surface-primary);
}

@media (max-width: 768px) {
  .pins-filter-bar {
    padding: var(--space-3);
    gap: var(--space-3);
  }
  
  .filter-section {
    gap: var(--space-2);
  }
  
  .filter-button {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
  }
}
</style>

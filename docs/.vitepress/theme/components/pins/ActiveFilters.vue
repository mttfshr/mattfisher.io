<script setup>
import { computed } from 'vue';

const props = defineProps({
  selectedTypes: {
    type: Array,
    default: () => []
  },
  selectedCollection: {
    type: String,
    default: null
  },
  contentTypes: {
    type: Array,
    required: true
  },
  collections: {
    type: Array,
    required: true
  },
  totalFiltered: {
    type: Number,
    required: true
  },
  totalPins: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['clearType', 'clearCollection', 'clearAllFilters']);

// Check if any filters are active
const hasActiveFilters = computed(() => 
  props.selectedTypes.length > 0 || props.selectedCollection !== null
);

// Get type name from id
const getTypeName = (typeId) => {
  const type = props.contentTypes.find(t => t.id === typeId);
  return type ? type.name : typeId;
};

// Get type icon from id
const getTypeIcon = (typeId) => {
  const type = props.contentTypes.find(t => t.id === typeId);
  return type ? type.icon : '';
};

// Get collection name from id
const getCollectionName = (collectionId) => {
  const collection = props.collections.find(c => c.id === collectionId);
  return collection ? formatName(collection.id) : collectionId;
};

// Format collection name
const formatName = (name) => {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

// Clear a type filter
const clearTypeFilter = (typeId) => {
  emit('clearType', typeId);
};

// Clear the collection filter
const clearCollectionFilter = () => {
  emit('clearCollection');
};

// Clear all filters
const clearAllFilters = () => {
  emit('clearAllFilters');
};
</script>

<template>
  <div v-if="hasActiveFilters" class="active-filters">
    <div class="filter-summary">
      <div v-if="selectedTypes.length" class="active-types">
        <span class="filter-label">Type:</span>
        <div class="active-type-tags">
          <div 
            v-for="typeId in selectedTypes" 
            :key="typeId"
            class="active-tag type-tag"
            :class="`type-${typeId}`"
          >
            <span class="tag-icon">{{ getTypeIcon(typeId) }}</span>
            <span class="tag-name">{{ getTypeName(typeId) }}</span>
            <button 
              @click="clearTypeFilter(typeId)" 
              class="remove-tag"
              title="Remove filter"
            >×</button>
          </div>
        </div>
      </div>
      
      <div v-if="selectedCollection" class="active-collection">
        <span class="filter-label">Collection:</span>
        <div class="active-tag collection-tag">
          <span class="tag-icon">🗂️</span>
          <span class="tag-name">{{ getCollectionName(selectedCollection) }}</span>
          <button 
            @click="clearCollectionFilter" 
            class="remove-tag"
            title="Remove filter"
          >×</button>
        </div>
      </div>
      
      <button 
        v-if="selectedTypes.length > 1 || (selectedTypes.length > 0 && selectedCollection)"
        @click="clearAllFilters" 
        class="clear-all-button"
      >
        Clear All
      </button>
    </div>
    
    <div class="results-count">
      Showing {{ totalFiltered }} of {{ totalPins }} pins
    </div>
  </div>
</template>

<style scoped>
.active-filters {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.filter-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.active-types,
.active-collection {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.active-type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.active-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.type-tag {
  background-color: rgba(100, 100, 100, 0.1);
  color: var(--vp-c-text);
}

.type-music {
  background-color: rgba(29, 185, 84, 0.1);
  color: #1DB954;
}

.type-video {
  background-color: rgba(255, 0, 0, 0.1);
  color: #FF0000;
}

.type-article {
  background-color: rgba(0, 114, 177, 0.1);
  color: #0072B1;
}

.type-link {
  background-color: rgba(100, 100, 100, 0.1);
  color: #646464;
}

.type-code {
  background-color: rgba(36, 41, 47, 0.1);
  color: #24292F;
}

.type-image {
  background-color: rgba(234, 76, 137, 0.1);
  color: #E4405F;
}

.collection-tag {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
}

.tag-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 0.9rem;
}

.remove-tag {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  margin-left: 0.25rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.1);
  color: inherit;
  font-size: 0.8rem;
  line-height: 1;
  cursor: pointer;
}

.clear-all-button {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  background-color: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-dark);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-all-button:hover {
  background-color: var(--vp-c-danger);
  color: white;
}

.results-count {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .active-filters {
    padding: 0.6rem 0.8rem;
  }
  
  .filter-summary {
    gap: 0.75rem;
  }
  
  .active-types,
  .active-collection {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
}
</style>
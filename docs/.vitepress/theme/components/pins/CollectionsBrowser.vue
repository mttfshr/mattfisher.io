<script setup>
import { computed } from 'vue';

const props = defineProps({
  collections: {
    type: Array,
    required: true
  },
  selectedCollection: {
    type: String,
    default: null
  },
  showTypeDistribution: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:selectedCollection', 'collectionClick']);

const selectCollection = (collectionId) => {
  const newSelection = props.selectedCollection === collectionId ? null : collectionId;
  emit('update:selectedCollection', newSelection);
  emit('collectionClick', collectionId);
};

// Sort collections by pin count (most pins first)
const sortedCollections = computed(() => {
  return [...props.collections].sort((a, b) => b.pins.length - a.pins.length);
});

// Format collection name for display (convert from kebab-case or snake_case)
const formatName = (name) => {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

// Get the top 3 types for a collection
const getCollectionTypes = (collection) => {
  if (!collection.typeBreakdown) return [];
  
  return Object.entries(collection.typeBreakdown)
    .map(([typeId, count]) => ({ id: typeId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
};
</script>

<template>
  <div class="collections-browser">
    <h3 class="filter-title">
      <span class="filter-icon">🗂️</span>
      Collections
    </h3>
    
    <div class="collections-list">
      <button 
        v-for="collection in sortedCollections"
        :key="collection.id"
        @click="selectCollection(collection.id)"
        :class="['collection-button', { active: selectedCollection === collection.id }]"
        :title="`${collection.pins.length} items`"
      >
        <div class="collection-header">
          <span class="collection-name">{{ formatName(collection.id) }}</span>
          <span class="collection-count">{{ collection.pins.length }}</span>
        </div>
        
        <!-- Type distribution within collection -->
        <div v-if="showTypeDistribution && collection.typeBreakdown" class="collection-types">
          <div 
            v-for="type in getCollectionTypes(collection)"
            :key="type.id"
            class="type-indicator"
            :class="`type-${type.id}`"
            :title="`${type.count} ${type.id} items`"
          >
            <span class="type-dot"></span>
            <span class="type-count">{{ type.count }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.collections-browser {
  margin-bottom: 2rem;
  padding: 0.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 1.1rem;
  font-weight: 600;
}

.filter-icon {
  font-size: 1.2rem;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 400px;
  overflow-y: auto;
}

.collection-button {
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 8px;
  background-color: var(--vp-c-bg);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collection-button:hover {
  background-color: var(--vp-c-bg-alt);
}

.collection-button.active {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
}

.collection-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.collection-name {
  flex: 1;
  font-size: 0.95rem;
}

.collection-count {
  padding: 0.15rem 0.4rem;
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.collection-button.active .collection-count {
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--vp-c-brand-dark);
}

.collection-types {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.type-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--vp-c-text-3);
}

/* Type indicator styling */
.type-music .type-dot {
  background-color: #1DB954; /* Spotify green */
}

.type-video .type-dot {
  background-color: #FF0000; /* YouTube red */
}

.type-article .type-dot {
  background-color: #0072B1; /* Medium blue */
}

.type-link .type-dot {
  background-color: #646464; /* Generic */
}

.type-code .type-dot {
  background-color: #24292F; /* GitHub dark */
}

.type-image .type-dot {
  background-color: #E4405F; /* Instagram pink */
}

.collection-button.active .type-indicator {
  color: var(--vp-c-brand-dark);
}

@media (max-width: 768px) {
  .collections-list {
    max-height: 300px;
  }
  
  .collection-button {
    padding: 0.5rem 0.6rem;
  }
}
</style>
<!-- docs/.vitepress/theme/components/pins/PinCollections.vue -->
<template>
  <div class="pin-collections">
    <!-- Collection navigation -->
    <div class="collections-nav">
      <button
        v-for="collection in visibleCollections"
        :key="collection.id"
        class="collection-button"
        :class="{ active: activeCollection === collection.id }"
        @click="setActiveCollection(collection.id)"
      >
        {{ collection.name }}
        <span class="collection-count">{{ getCollectionCount(collection) }}</span>
      </button>
      
      <!-- More collections dropdown if needed -->
      <div v-if="hiddenCollections.length > 0" class="more-collections-dropdown">
        <button class="more-button" @click="moreMenuOpen = !moreMenuOpen">
          More
          <span class="more-count">{{ hiddenCollections.length }}</span>
        </button>
        
        <div v-if="moreMenuOpen" class="dropdown-menu">
          <button
            v-for="collection in hiddenCollections"
            :key="collection.id"
            class="dropdown-item"
            :class="{ active: activeCollection === collection.id }"
            @click="setActiveCollection(collection.id)"
          >
            {{ collection.name }}
            <span class="collection-count">{{ getCollectionCount(collection) }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Active collection display -->
    <div v-if="currentCollection" class="active-collection">
      <div class="collection-header">
        <h2>{{ currentCollection.name }}</h2>
        
        <!-- Display options for current collection -->
        <div class="collection-options">
          <!-- Group By option (for larger collections) -->
          <div v-if="currentPins.length > 5" class="group-options">
            <span class="option-label">Group by:</span>
            <div class="option-buttons">
              <button
                v-for="group in groupOptions"
                :key="group.value"
                :class="{ active: groupBy === group.value }"
                @click="groupBy = group.value"
              >
                {{ group.label }}
              </button>
            </div>
          </div>
          
          <!-- Layout option -->
          <div class="layout-options">
            <span class="option-label">View:</span>
            <div class="option-buttons">
              <button
                v-for="layoutOpt in layoutOptions"
                :key="layoutOpt.value"
                :class="{ active: layout === layoutOpt.value }"
                @click="layout = layoutOpt.value"
              >
                {{ layoutOpt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Show pins grid -->
      <PinGrid
        :pins="currentPins"
        :layout="layout"
        :group-by="groupBy"
        @pin-click="openPinDetail"
        @tag-click="handleTagClick"
      />
    </div>
    
    <!-- Pin detail modal -->
    <div v-if="selectedPin" class="pin-detail-modal">
      <div class="modal-overlay" @click="closePinDetail"></div>
      <div class="modal-container">
        <button class="modal-close" @click="closePinDetail">×</button>
        <PinDetail
          :pin="selectedPin"
          :related-pins="getRelatedPins(selectedPin)"
          @tag-click="handleTagClick"
          @pin-click="openPinDetail"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useData } from 'vitepress'; // Use VitePress useData composable
import PinGrid from './PinGrid.vue';
import PinDetail from './PinDetail.vue';

const props = defineProps({
  defaultCollection: {
    type: String,
    default: 'all'
  },
  maxVisibleCollections: {
    type: Number,
    default: 6
  }
});

const emit = defineEmits(['update-collection']);

// Get pins data from themeConfig
const { theme } = useData();
const pinsData = computed(() => theme.value.pins || { pins: [], contentTypes: [], allTags: [], userTags: [], sections: [] });

// State
const pins = computed(() => pinsData.value.pins || []);
const contentTypes = computed(() => pinsData.value.contentTypes || []);
const allTags = computed(() => pinsData.value.allTags || []);
const userTags = computed(() => pinsData.value.userTags || []);

const activeCollection = ref(props.defaultCollection);
const selectedPin = ref(null);
const moreMenuOpen = ref(false);
const layout = ref('grid'); // grid, masonry, list
const groupBy = ref('none'); // none, contentType, domain, section

// Options
const layoutOptions = [
  { value: 'grid', label: 'Grid' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'list', label: 'List' }
];

const groupOptions = [
  { value: 'none', label: 'None' },
  { value: 'contentType', label: 'Type' },
  { value: 'domain', label: 'Source' },
  { value: 'section', label: 'Section' }
];

// Define fixed collections
const fixedCollections = computed(() => [
  { id: 'all', name: 'All Pins', filter: () => true },
  { id: 'uncategorized', name: 'Uncategorized', 
    filter: pin => {
      // Only pins that have no user-defined tags
      // (only the automatically added content type tag)
      return pin.tags.length === 1 && contentTypes.value.includes(pin.tags[0]);
    }
  }
]);

// Content type collections
const typeCollections = computed(() => {
  return contentTypes.value.map(type => ({
    id: `type-${type}`,
    name: formatContentType(type),
    filter: pin => pin.contentType === type
  }));
});

// Tag-based collections (only user-defined tags, not auto-generated ones)
const tagCollections = computed(() => {
  return userTags.value.map(tag => ({
    id: `tag-${tag}`,
    name: `#${tag}`,
    filter: pin => pin.tags.includes(tag)
  }));
});

// Combine all collections
const allCollections = computed(() => [
  ...fixedCollections.value,
  ...typeCollections.value,
  ...tagCollections.value
]);

// Split collections into visible and hidden
const visibleCollections = computed(() => {
  return allCollections.value.slice(0, props.maxVisibleCollections);
});

const hiddenCollections = computed(() => {
  return allCollections.value.slice(props.maxVisibleCollections);
});

// Get currently active collection
const currentCollection = computed(() => {
  return allCollections.value.find(c => c.id === activeCollection.value) || 
         allCollections.value[0];
});

// Get pins for current collection
const currentPins = computed(() => {
  return pins.value.filter(currentCollection.value.filter);
});

// Helper to get count of pins in a collection
const getCollectionCount = (collection) => {
  return pins.value.filter(collection.filter).length;
};

// Set active collection
const setActiveCollection = (id) => {
  activeCollection.value = id;
  moreMenuOpen.value = false;
  emit('update-collection', id);
  
  // Reset groupBy for collections with few pins
  const collectionPins = pins.value.filter(
    allCollections.value.find(c => c.id === id)?.filter || (() => true)
  );
  
  if (collectionPins.length <= 5) {
    groupBy.value = 'none';
  }
};

// Open pin detail
const openPinDetail = (pin) => {
  selectedPin.value = pin;
  // Disable scroll on body when modal is open
  document.body.style.overflow = 'hidden';
};

// Close pin detail
const closePinDetail = () => {
  selectedPin.value = null;
  // Restore scroll on body
  document.body.style.overflow = '';
};

// Handle tag click
const handleTagClick = (tag) => {
  // Find collection for this tag
  const tagCollection = tagCollections.value.find(c => c.name === `#${tag}`);
  if (tagCollection) {
    setActiveCollection(tagCollection.id);
    closePinDetail();
  } else {
    // If no exact tag collection exists, add tag filter to current view
    console.log(`Tag ${tag} clicked, but no collection exists`);
  }
};

// Get related pins
const getRelatedPins = (pin) => {
  if (!pin) return [];
  
  // First try to find pins with matching tags
  const withTags = pins.value.filter(p => 
    p.id !== pin.id && 
    p.tags.some(tag => pin.tags.includes(tag))
  );
  
  // If we don't have enough, add same content type
  if (withTags.length < 6) {
    const sameType = pins.value.filter(p => 
      p.id !== pin.id && 
      p.contentType === pin.contentType &&
      !withTags.includes(p)
    );
    
    return [...withTags, ...sameType].slice(0, 6);
  }
  
  return withTags.slice(0, 6);
};

// Format content type
const formatContentType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Close dropdown when clicking outside
const handleOutsideClick = (event) => {
  if (moreMenuOpen.value && !event.target.closest('.more-collections-dropdown')) {
    moreMenuOpen.value = false;
  }
};

// Close modal with escape key
const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    if (selectedPin.value) {
      closePinDetail();
    } else if (moreMenuOpen.value) {
      moreMenuOpen.value = false;
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('keydown', handleKeyDown);
  
  // Make sure to restore scroll if component is unmounted while modal is open
  if (selectedPin.value) {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.pin-collections {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Collection navigation */
.collections-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  position: sticky;
  top: var(--vp-nav-height);
  z-index: 10;
  background-color: var(--vp-c-bg);
  padding: 1rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.collection-button {
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.collection-button:hover {
  background-color: var(--vp-c-bg-alt);
}

.collection-button.active {
  background-color: var(--vp-c-brand);
  color: var(--vp-c-brand-contrast);
  border-color: var(--vp-c-brand);
}

.collection-count {
  display: inline-block;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.active .collection-count {
  background-color: rgba(255, 255, 255, 0.2);
}

/* More dropdown */
.more-collections-dropdown {
  position: relative;
}

.more-button {
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.more-button:hover {
  background-color: var(--vp-c-bg-alt);
}

.more-count {
  display: inline-block;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 100;
  padding: 0.5rem;
}

.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: var(--vp-c-bg-soft);
}

.dropdown-item.active {
  background-color: var(--vp-c-brand-light);
  color: var(--vp-c-brand-contrast);
}

/* Collection header */
.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  gap: 1rem;
}

.collection-header h2 {
  margin: 0;
}

/* Collection options */
.collection-options {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.option-label {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.option-buttons {
  display: flex;
  gap: 0.25rem;
}

.option-buttons button {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-buttons button:hover {
  background-color: var(--vp-c-bg-alt);
}

.option-buttons button.active {
  background-color: var(--vp-c-brand);
  color: var(--vp-c-brand-contrast);
  border-color: var(--vp-c-brand);
}

/* Modal */
.pin-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  background-color: var(--vp-c-bg);
  border-radius: 12px;
  overflow-y: auto;
  z-index: 101;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--vp-c-bg-soft);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 102;
  transition: background-color 0.2s ease;
}

.modal-close:hover {
  background-color: var(--vp-c-bg-alt);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .collection-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .collection-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    width: 100%;
  }
  
  .option-buttons {
    flex-wrap: wrap;
  }
}
</style>
<!-- docs/.vitepress/theme/components/pins/PinCollections.vue -->
<template>
  <div class="container-responsive">
    <!-- Collection navigation -->
    <div class="collections-nav flex flex-wrap gap-2">
      <button
        v-for="collection in visibleCollections"
        :key="collection.id"
        class="btn btn-ghost collection-btn"
        :class="{ 'btn-primary': activeCollection === collection.id }"
        @click="setActiveCollection(collection.id)"
      >
        {{ collection.name }}
        <span class="collection-count badge">{{ getCollectionCount(collection) }}</span>
      </button>
      
      <!-- More collections dropdown if needed -->
      <div v-if="hiddenCollections.length > 0" class="more-collections-dropdown">
        <button class="btn btn-ghost more-btn" @click="moreMenuOpen = !moreMenuOpen">
          More
          <span class="badge">{{ hiddenCollections.length }}</span>
        </button>
        
        <div v-if="moreMenuOpen" class="dropdown-menu card">
          <button
            v-for="collection in hiddenCollections"
            :key="collection.id"
            class="btn btn-ghost dropdown-item"
            :class="{ 'btn-primary': activeCollection === collection.id }"
            @click="setActiveCollection(collection.id)"
          >
            {{ collection.name }}
            <span class="collection-count badge">{{ getCollectionCount(collection) }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Active collection display -->
    <div v-if="currentCollection" class="active-collection">
      <div class="collection-header flex justify-between items-center flex-wrap gap-4">
        <h2 class="m-0">{{ currentCollection.name }}</h2>
        
        <!-- Display options for current collection -->
        <div class="collection-options flex gap-6 items-center">
          <!-- Group By option (for larger collections) -->
          <div v-if="currentPins.length > 5" class="control-group flex items-center gap-2">
            <span class="control-label text-sm text-secondary">Group by:</span>
            <div class="btn-group">
              <button
                v-for="group in groupOptions"
                :key="group.value"
                class="btn btn-ghost"
                :class="{ 'btn-primary': groupBy === group.value }"
                @click="groupBy = group.value"
              >
                {{ group.label }}
              </button>
            </div>
          </div>
          
          <!-- Layout option -->
          <div class="control-group flex items-center gap-2">
            <span class="control-label text-sm text-secondary">View:</span>
            <div class="btn-group">
              <button
                v-for="layoutOpt in layoutOptions"
                :key="layoutOpt.value"
                class="btn btn-ghost"
                :class="{ 'btn-primary': layout === layoutOpt.value }"
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
    <div v-if="selectedPin" class="modal-overlay flex items-center justify-center" @click="closePinDetail">
      <div class="modal card animate-scale-in" @click.stop>
        <button class="modal-close btn btn-ghost" @click="closePinDetail">×</button>
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
/* Component-specific styles only - Layout utilities moved to template */

/* Sticky navigation - unique positioning behavior */
.collections-nav {
  margin-bottom: var(--space-8);
  position: sticky;
  top: var(--vp-nav-height);
  z-index: var(--z-sticky);
  background-color: var(--surface-primary);
  padding: var(--space-4) 0;
  border-bottom: var(--border-width) solid var(--border-primary);
}

/* Collection button styling */
.collection-btn {
  border-radius: var(--radius-full);
  white-space: nowrap;
}

/* Badge styling enhancement */
.collection-count.badge {
  background-color: rgba(0, 0, 0, 0.1);
  margin-left: var(--space-2);
}

.btn-primary .collection-count.badge {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Dropdown positioning - unique behavior */
.more-collections-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  min-width: 180px;
  z-index: var(--z-dropdown);
  padding: var(--space-2);
}

.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: var(--space-1);
}

/* Collection content area */
.collection-header {
  margin-bottom: var(--space-8);
}

/* Modal system - unique positioning and behavior */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal);
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  position: relative;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: var(--z-modal);
}

.modal-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-popover);
}

/* Responsive overrides */
@media (max-width: 768px) {
  .collection-header {
    flex-direction: column !important;
    align-items: flex-start !important;
  }
  
  .collection-options {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: var(--space-4) !important;
    width: 100%;
  }
}
</style>
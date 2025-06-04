<template>
  <div class="content-section" :class="{ 'sidebar-mode': sidebarLayout }">
    <div class="filter-controls" :class="{ 'sidebar-controls': sidebarLayout }">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search..." 
          class="input"
          @input="filterItems"
        />
        <button 
          v-if="searchQuery" 
          class="clear-button" 
          @click="clearSearch"
        >
          ×
        </button>
      </div>
      
      <div class="tag-filters" :class="{ 'sidebar-filters': sidebarLayout }">
        <div 
          v-for="(tags, category) in groupedTags" 
          :key="category" 
          class="filter-group"
        >
          <div 
            class="filter-group-header interactive" 
            @click="toggleCategory(category)"
          >
            <span class="filter-group-title">{{ formatCategory(category) }}</span>
            <span class="icon">{{ expandedCategories[category] ? '−' : '+' }}</span>
          </div>
          
          <div 
            v-if="expandedCategories[category]" 
            class="filter-group-items" 
            :class="{ 'sidebar-items': sidebarLayout }"
          >
            <button 
              v-for="tag in tags" 
              :key="tag.value" 
              :class="['badge', 'interactive', { 'badge-primary': isTagActive(category, tag.value) }]"
              @click="toggleTag(category, tag.value)"
            >
              {{ formatTagValue(tag.value) }}
              <span class="filter-group-count">({{ tag.count }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card card-body" v-if="hasActiveFilters">
      <div class="stack-horizontal spacing-comfortable" :class="{ 'sidebar-active-filters': sidebarLayout }">
        <span class="text-sm font-medium text-secondary">Filters:</span>
        <div class="active-filters">
          <div 
            v-for="(values, category) in activeFilters" 
            :key="category" 
            class="stack-horizontal spacing-tight"
            v-if="values.length"
          >
            <span class="text-sm text-secondary">{{ formatCategory(category) }}:</span>
            <button 
              v-for="value in values" 
              :key="value" 
              class="badge badge-primary interactive"
              @click="toggleTag(category, value)"
            >
              {{ formatTagValue(value) }} ×
            </button>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="clearAllFilters">Clear all</button>
      </div>
    </div>
    
    <div class="results-info" v-if="filteredItems.length !== props.items.length">
      <span class="text-sm text-tertiary">
        Showing {{ filteredItems.length }} of {{ props.items.length }} items
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  sidebarLayout: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:filtered-items']);

// State
const searchQuery = ref('');
const filteredItems = ref([]);
const activeFilters = ref({
  type: [],
  medium: [],
  tech: [],
  tool: [],
  status: [],
  project: [],
  collab: [],
  other: []
});
const expandedCategories = ref({
  type: true,
  medium: false,
  tech: false,
  tool: false,
  status: false,
  project: false,
  collab: false,
  other: false
});

// Get all possible tags from items
const allTags = computed(() => {
  const tagMap = {
    type: new Map(),
    medium: new Map(),
    tech: new Map(),
    tool: new Map(),
    status: new Map(),
    project: new Map(),
    collab: new Map(),
    other: new Map()
  };
  
  props.items.forEach(item => {
    if (!item.tags || !Array.isArray(item.tags)) return;
    
    item.tags.forEach(tag => {
      if (typeof tag !== 'string') return;
      
      const [prefix, value] = tag.includes(':') ? tag.split(':', 2) : ['other', tag];
      
      if (tagMap[prefix]) {
        const currentCount = tagMap[prefix].get(value) || 0;
        tagMap[prefix].set(value, currentCount + 1);
      } else {
        const currentCount = tagMap.other.get(tag) || 0;
        tagMap.other.set(tag, currentCount + 1);
      }
    });
  });
  
  return tagMap;
});

// Convert tag maps to arrays for display
const groupedTags = computed(() => {
  const result = {};
  
  Object.entries(allTags.value).forEach(([category, tagMap]) => {
    // Skip empty categories
    if (tagMap.size === 0) return;
    
    result[category] = Array.from(tagMap.entries()).map(([value, count]) => ({
      value,
      count
    })).sort((a, b) => b.count - a.count); // Sort by count descending
  });
  
  return result;
});

// Format category name for display
function formatCategory(category) {
  if (!category) return '';
  
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// Format tag value for display
function formatTagValue(value) {
  if (!value) return '';
  
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Toggle expanded state of a category
function toggleCategory(category) {
  expandedCategories.value[category] = !expandedCategories.value[category];
}

// Check if a tag is currently active
function isTagActive(category, value) {
  return activeFilters.value[category] && activeFilters.value[category].includes(value);
}

// Toggle a tag filter
function toggleTag(category, value) {
  if (!activeFilters.value[category]) {
    activeFilters.value[category] = [];
  }
  
  const index = activeFilters.value[category].indexOf(value);
  
  if (index === -1) {
    // Add tag to filter
    activeFilters.value[category].push(value);
  } else {
    // Remove tag from filter
    activeFilters.value[category].splice(index, 1);
  }
  
  filterItems();
}

// Clear all filters
function clearAllFilters() {
  Object.keys(activeFilters.value).forEach(key => {
    activeFilters.value[key] = [];
  });
  searchQuery.value = '';
  filterItems();
}

// Clear search query
function clearSearch() {
  searchQuery.value = '';
  filterItems();
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return searchQuery.value || Object.values(activeFilters.value).some(values => values.length > 0);
});

// Filter items based on active filters and search query
function filterItems() {
  const filtered = props.items.filter(item => {
    // If no tags, include the item only if there are no active tag filters
    if (!item.tags || !Array.isArray(item.tags)) {
      // If there are any active tag filters, exclude this item
      return !Object.values(activeFilters.value).some(values => values.length > 0);
    }
    
    // Check search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      const matchesSearch = 
        (item.title && item.title.toLowerCase().includes(query)) || 
        (item.description && item.description.toLowerCase().includes(query));
        
      if (!matchesSearch) return false;
    }
    
    // Check tag filters
    for (const [category, values] of Object.entries(activeFilters.value)) {
      // Skip if no active filters for this category
      if (!values.length) continue;
      
      // For this category, at least one tag must match
      const hasMatchingTag = values.some(value => {
        const tagToFind = category === 'other' ? value : `${category}:${value}`;
        return item.tags.includes(tagToFind);
      });
      
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });
  
  filteredItems.value = filtered;
  emit('update:filtered-items', filtered);
}

// Initialize filtered items
onMounted(() => {
  // Initialize with all items
  filteredItems.value = [...props.items];
  // Then apply any filters
  filterItems();
});

// Watch for changes to active filters
watch(activeFilters, () => {
  filterItems();
}, { deep: true });

// Watch for changes to items prop
watch(() => props.items, (newItems) => {
  filterItems();
});
</script>

<style scoped>
/* Component-specific styles only */
.filter-controls {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.search-box {
  position: relative;
  flex: 1;
}

.clear-button {
  position: absolute;
  right: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
  width: var(--space-6);
  height: var(--space-6);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.clear-button:hover {
  color: var(--text-primary);
}

.tag-filters {
  flex: 2;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.filter-group {
  margin-bottom: var(--space-3);
  max-width: 300px;
}

.filter-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon {
  font-weight: var(--font-bold);
  font-size: var(--text-base);
}

.filter-group-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-1);
}

.filter-group-count {
  font-size: var(--text-xs);
  margin-left: var(--space-1);
  opacity: 0.7;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  flex: 1;
}

.results-info {
  margin-bottom: var(--space-4);
}

/* Sidebar layout adaptations */
.sidebar-mode .filter-controls.sidebar-controls {
  flex-direction: column;
  gap: var(--space-4);
}

.sidebar-mode .search-box {
  flex: none;
}

.sidebar-mode .tag-filters.sidebar-filters {
  flex: none;
  display: block;
}

.sidebar-mode .filter-group {
  margin-bottom: var(--space-4);
  max-width: none;
  width: 100%;
}

.sidebar-mode .filter-group-items.sidebar-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) 0;
}

.sidebar-mode .filter-group-items.sidebar-items .badge {
  justify-content: space-between;
  width: 100%;
  text-align: left;
}

.sidebar-mode .stack-horizontal.sidebar-active-filters {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.sidebar-mode .active-filters {
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
  }
  
  .tag-filters {
    width: 100%;
  }
  
  .filter-group {
    width: 100%;
    max-width: none;
  }
}
</style>

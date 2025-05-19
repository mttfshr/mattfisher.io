<template>
  <div class="tag-filter">
    <div class="filter-controls">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search..." 
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
      
      <div class="tag-filters">
        <div 
          v-for="(tags, category) in groupedTags" 
          :key="category" 
          class="tag-category"
        >
          <div 
            class="category-header" 
            @click="toggleCategory(category)"
          >
            <span class="label">{{ formatCategory(category) }}</span>
            <span class="icon">{{ expandedCategories[category] ? '−' : '+' }}</span>
          </div>
          
          <div 
            v-if="expandedCategories[category]" 
            class="category-tags"
          >
            <button 
              v-for="tag in tags" 
              :key="tag.value" 
              :class="['tag-button', { active: isTagActive(category, tag.value) }]"
              @click="toggleTag(category, tag.value)"
            >
              {{ formatTagValue(tag.value) }}
              <span class="count">({{ tag.count }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="filter-summary" v-if="hasActiveFilters">
      <span class="summary-label">Filters:</span>
      <div class="active-filters">
        <div 
          v-for="(values, category) in activeFilters" 
          :key="category" 
          class="filter-group"
          v-if="values.length"
        >
          <span class="category">{{ formatCategory(category) }}:</span>
          <button 
            v-for="value in values" 
            :key="value" 
            class="filter-tag"
            @click="toggleTag(category, value)"
          >
            {{ formatTagValue(value) }} ×
          </button>
        </div>
      </div>
      <button class="clear-all" @click="clearAllFilters">Clear all</button>
    </div>
    
    <div class="results-info" v-if="filteredItems.length !== props.items.length">
      <span>
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
.tag-filter {
  margin-bottom: 2rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
}

.search-box input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.clear-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.tag-filters {
  flex: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.tag-category {
  margin-bottom: 0.75rem;
  max-width: 300px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 0.4rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.category-header:hover {
  background-color: var(--vp-c-bg-mute);
}

.category-header .icon {
  font-weight: bold;
  font-size: 1rem;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem;
}

.tag-button {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.tag-button:hover {
  border-color: var(--vp-c-brand-soft);
  background-color: var(--vp-c-bg-mute);
}

.tag-button.active {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-color: var(--vp-c-brand-soft);
}

.tag-button .count {
  font-size: 0.75rem;
  margin-left: 0.3rem;
  opacity: 0.7;
}

.filter-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  background-color: var(--vp-c-bg-soft);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.summary-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.filter-group .category {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.filter-tag {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  font-size: 0.8rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag:hover {
  background-color: var(--vp-c-brand);
  color: white;
}

.clear-all {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.25rem 0.5rem;
}

.clear-all:hover {
  color: var(--vp-c-text-1);
}

.results-info {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  margin-bottom: 1rem;
}

/* Responsive styles */
@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
  }
  
  .tag-filters {
    width: 100%;
  }
  
  .tag-category {
    width: 100%;
    max-width: none;
  }
}
</style>

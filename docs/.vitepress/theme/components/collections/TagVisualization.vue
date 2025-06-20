<template>
  <div class="container-responsive">
    <div class="view-controls">
      <div class="btn-group flex gap-2">
        <button 
          v-for="view in viewOptions" 
          :key="view.id"
          :class="['btn btn-ghost', { 'btn-primary': activeView === view.id }]"
          @click="setActiveView(view.id)"
        >
          {{ view.label }}
        </button>
      </div>
    </div>
    
    <!-- Tag cloud view -->
    <div
      v-if="activeView === 'cloud'" 
      class="tag-cloud-view"
    >
      <div v-for="category in categoryOrder" :key="category" class="card card-body tag-category-section">
        <h3 class="text-lg font-semibold text-primary m-0 mb-4">{{ formatCategory(category) }}</h3>
        <div class="cloud-tags flex flex-wrap gap-3">
          <span 
            v-for="tag in getTagsByCategory(category)" 
            :key="tag.fullTag"
            class="cloud-tag interactive-scale"
            :style="{ 
              fontSize: `${getTagSize(tag.count)}rem`,
              opacity: getTagOpacity(tag.count)
            }"
          >
            {{ formatTagValue(tag.value) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Simple relationship view when D3 is not available -->
    <div v-else class="simple-relationship-view">
      <p class="note text-sm text-tertiary p-4 bg-surface-secondary rounded-md">For a more interactive visualization with relationships between tags, please include D3.js in your project.</p>
      
      <div class="relationships-list grid-auto gap-6">
        <div v-for="(tags, category) in tagsByCategory" :key="category" class="category-group card card-body">
          <h3 class="text-lg font-medium text-primary m-0 mb-4">{{ formatCategory(category) }}</h3>
          <div class="tag-pairs stack-vertical gap-4">
            <div
              v-for="tag in tags.slice(0, 5)" 
              :key="tag.fullTag"
              class="tag-pair-container"
            >
              <div class="tag-name font-medium text-brand-dark mb-2">{{ formatTagValue(tag.value) }}</div>
              <div class="tag-connections">
                <div class="connection-label text-xs text-tertiary mb-1">Most common connections:</div>
                <div class="connection-tags flex flex-wrap gap-2">
                  <span
                    v-for="(connection, idx) in getRelatedTags(tag.fullTag).slice(0, 3)"
                    :key="idx"
                    class="connection-tag badge text-sm bg-surface-tertiary text-secondary"
                  >
                    {{ formatTagValue(connection.tag.split(':')[1] || connection.tag) }}
                    <span class="count text-xs opacity-70">({{ connection.count }})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useThemeData } from '../../composables/useThemeData.js';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

// Use composable for theme data access
const { workbookItems } = useThemeData();

// Get data from theme config if not provided as prop
const itemsData = computed(() => {
  if (props.items && props.items.length > 0) {
    return props.items;
  }
  return workbookItems.value;
});

// Check if we have D3 available
const hasD3 = typeof window !== 'undefined' && window.d3;

// References for visualization containers
const activeView = ref('cloud');

// View options
const viewOptions = [
  { id: 'cloud', label: 'Tag Cloud' },
  { id: 'relationships', label: 'Tag Relationships' }
];

// Category order for display
const categoryOrder = ['type', 'medium', 'tech', 'tool', 'project', 'collab', 'status', 'other'];

// Set active view
function setActiveView(view) {
  activeView.value = view;
}

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

// Get tags organized by category
const tagsByCategory = computed(() => {
  const result = {};
  
  categoryOrder.forEach(category => {
    result[category] = [];
  });
  
  // Count tag occurrences
  const tagCounts = new Map();
  
  itemsData.value.forEach(item => {
    if (!item.tags || !Array.isArray(item.tags)) return;
    
    item.tags.forEach(tag => {
      if (typeof tag !== 'string') return;
      
      const currentCount = tagCounts.get(tag) || 0;
      tagCounts.set(tag, currentCount + 1);
    });
  });
  
  // Group by category
  Array.from(tagCounts.entries()).forEach(([tag, count]) => {
    const [prefix, value] = tag.includes(':') ? tag.split(':', 2) : ['other', tag];
    
    if (result[prefix]) {
      result[prefix].push({
        fullTag: tag,
        value: value,
        count: count
      });
    } else {
      result.other.push({
        fullTag: tag,
        value: tag,
        count: count
      });
    }
  });
  
  // Sort tags by count in each category
  Object.keys(result).forEach(category => {
    result[category].sort((a, b) => b.count - a.count);
  });
  
  return result;
});

// Get max tag count for sizing
const maxTagCount = computed(() => {
  let max = 0;
  
  Object.values(tagsByCategory.value).forEach(tags => {
    tags.forEach(tag => {
      if (tag.count > max) {
        max = tag.count;
      }
    });
  });
  
  return max;
});

// Get tags by category
function getTagsByCategory(category) {
  return tagsByCategory.value[category] || [];
}

// Calculate tag size for cloud view
function getTagSize(count) {
  const min = 0.8;
  const max = 1.8;
  
  if (maxTagCount.value <= 1) return min;
  
  const scale = (max - min) / Math.log(maxTagCount.value);
  return min + Math.log(count) * scale;
}

// Calculate tag opacity
function getTagOpacity(count) {
  const min = 0.6;
  const max = 1;
  
  if (maxTagCount.value <= 1) return min;
  
  return min + (count / maxTagCount.value) * (max - min);
}

// Calculate tag relationships
const tagRelationships = computed(() => {
  const relationships = new Map();
  
  // For each item, calculate all tag pairs
  itemsData.value.forEach(item => {
    if (!item.tags || !Array.isArray(item.tags) || item.tags.length < 2) return;
    
    // Generate all pairs of tags
    for (let i = 0; i < item.tags.length; i++) {
      for (let j = i + 1; j < item.tags.length; j++) {
        const tag1 = item.tags[i];
        const tag2 = item.tags[j];
        
        // Skip if not strings
        if (typeof tag1 !== 'string' || typeof tag2 !== 'string') continue;
        
        // Create relationship key (alphabetical order to avoid duplicates)
        const key = [tag1, tag2].sort().join('|');
        
        // Increment relationship count
        const currentCount = relationships.get(key) || 0;
        relationships.set(key, currentCount + 1);
      }
    }
  });
  
  return relationships;
});

// Get related tags for a specific tag
function getRelatedTags(tag) {
  const related = [];
  
  tagRelationships.value.forEach((count, key) => {
    const tags = key.split('|');
    
    if (tags.includes(tag)) {
      const otherTag = tags[0] === tag ? tags[1] : tags[0];
      related.push({
        tag: otherTag,
        count
      });
    }
  });
  
  // Sort by count
  return related.sort((a, b) => b.count - a.count);
}

// Initialize visualizations on mount
onMounted(() => {
  // If we have D3, initialize it by default
  if (hasD3) {
    activeView.value = 'relationships';
  }
});
</script>

<style scoped>
/* Component-specific styles only - Layout utilities moved to template */

/* Tag cloud layout */
.tag-cloud-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
  margin-top: var(--space-6);
}

.tag-category-section {
  margin-bottom: var(--space-4);
}

/* Cloud tag styling */
.cloud-tag {
  color: var(--vp-c-brand-dark);
  line-height: var(--leading-tight);
  cursor: default;
  transition: var(--transition-fast);
}

.cloud-tag:hover {
  color: var(--vp-c-brand);
}

/* Simple relationship view */
.simple-relationship-view {
  margin-top: var(--space-6);
}

/* Note styling enhancement */
.note {
  margin-bottom: var(--space-6);
  border-left: 4px solid var(--color-info);
}

/* Responsive grid override */
.relationships-list {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

/* Tag pair container */
.tag-pair-container {
  border-top: var(--border-width) solid var(--border-primary);
  padding-top: var(--space-3);
}

/* Responsive behavior */
@media (max-width: 768px) {
  .tag-cloud-view {
    grid-template-columns: 1fr;
  }
  
  .relationships-list {
    grid-template-columns: 1fr !important;
  }
}
</style>

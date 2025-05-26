<template>
  <div class="tag-visualization">
    <div class="visualization-controls">
      <div class="view-selector">
        <button 
          v-for="view in viewOptions" 
          :key="view.id"
          :class="['view-button', { active: activeView === view.id }]"
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
      <div v-for="category in categoryOrder" :key="category" class="tag-category-cloud">
        <h3 class="category-name">{{ formatCategory(category) }}</h3>
        <div class="cloud-tags">
          <span 
            v-for="tag in getTagsByCategory(category)" 
            :key="tag.fullTag"
            class="cloud-tag"
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
      <p class="note">For a more interactive visualization with relationships between tags, please include D3.js in your project.</p>
      
      <div class="relationships-list">
        <div v-for="(tags, category) in tagsByCategory" :key="category" class="category-group">
          <h3>{{ formatCategory(category) }}</h3>
          <div class="tag-pairs">
            <div
              v-for="tag in tags.slice(0, 5)" 
              :key="tag.fullTag"
              class="tag-pair-container"
            >
              <div class="tag-name">{{ formatTagValue(tag.value) }}</div>
              <div class="tag-connections">
                <div class="connection-label">Most common connections:</div>
                <div class="connection-tags">
                  <span
                    v-for="(connection, idx) in getRelatedTags(tag.fullTag).slice(0, 3)"
                    :key="idx"
                    class="connection-tag"
                  >
                    {{ formatTagValue(connection.tag.split(':')[1] || connection.tag) }}
                    <span class="count">({{ connection.count }})</span>
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

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
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
  
  props.items.forEach(item => {
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
  props.items.forEach(item => {
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
.tag-visualization {
  margin: var(--space-8) 0;
}

.visualization-controls {
  margin-bottom: var(--space-6);
}

.view-selector {
  display: flex;
  gap: var(--space-2);
}

.view-button {
  padding: var(--space-2) var(--space-4);
  background-color: var(--vp-c-bg-soft);
  border: var(--border-width) solid var(--vp-c-divider);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: var(--transition-fast);
}

.view-button:hover {
  background-color: var(--vp-c-bg-mute);
}

.view-button.active {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-color: var(--vp-c-brand-soft);
}

.tag-cloud-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

.tag-category-cloud {
  padding: var(--space-4);
  background-color: var(--vp-c-bg-soft);
  border-radius: var(--radius-md);
}

.category-name {
  margin-top: 0;
  margin-bottom: var(--space-4);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--vp-c-text-1);
}

.cloud-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.cloud-tag {
  color: var(--vp-c-brand-dark);
  line-height: var(--leading-tight);
  cursor: default;
  transition: var(--transition-fast);
}

.cloud-tag:hover {
  color: var(--vp-c-brand);
  transform: scale(1.1);
}

/* Simple relationship view */
.simple-relationship-view {
  margin-top: var(--space-4);
}

.note {
  font-size: var(--text-sm);
  color: var(--vp-c-text-3);
  margin-bottom: var(--space-6);
}

.relationships-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
}

.category-group {
  background-color: var(--vp-c-bg-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.category-group h3 {
  margin-top: 0;
  margin-bottom: var(--space-4);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--vp-c-text-1);
}

.tag-pairs {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.tag-pair-container {
  border-top: var(--border-width) solid var(--vp-c-divider);
  padding-top: var(--space-3);
}

.tag-name {
  font-weight: var(--font-medium);
  color: var(--vp-c-brand-dark);
  margin-bottom: var(--space-2);
}

.connection-label {
  font-size: var(--text-xs);
  color: var(--vp-c-text-3);
  margin-bottom: var(--space-1);
}

.connection-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.connection-tag {
  font-size: var(--text-sm);
  background-color: var(--vp-c-bg-mute);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--vp-c-text-2);
}

.connection-tag .count {
  font-size: var(--text-xs);
  opacity: 0.7;
}

@media (max-width: 768px) {
  .tag-cloud-view {
    grid-template-columns: 1fr;
  }
  
  .relationships-list {
    grid-template-columns: 1fr;
  }
}
</style>

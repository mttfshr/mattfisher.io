<!-- TagDisplay.vue - Reusable tag display component -->
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  collapsible: {
    type: Boolean,
    default: true
  },
  initiallyExpanded: {
    type: Boolean,
    default: false
  },
  maxVisible: {
    type: Number,
    default: null
  }
})

const expanded = ref(props.initiallyExpanded)

const displayTags = computed(() => {
  if (!props.collapsible || expanded.value || !props.maxVisible) {
    return props.tags
  }
  return props.tags.slice(0, props.maxVisible)
})

const hasHiddenTags = computed(() => {
  return props.maxVisible && props.tags.length > props.maxVisible && !expanded.value
})

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

// Format tag for display - handle structured tags
const formatTag = (tag) => {
  if (!tag) return ''
  
  // Check if it's a structured tag (contains a colon)
  if (tag.includes(':')) {
    const [category, value] = tag.split(':', 2)
    
    // Format the value part (replace hyphens with spaces, capitalize)
    const formattedValue = value
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    
    return formattedValue
  }
  
  // If not a structured tag, just return as is
  return tag
}
</script>

<template>
  <div v-if="tags?.length" class="tag-display-container">
    <!-- Collapsible toggle button -->
    <button 
      v-if="collapsible"
      class="tags-toggle"
      @click="toggleExpanded"
      :class="{ expanded: expanded }"
    >
      <span class="tags-count">{{ tags.length }} tags</span>
      <span class="toggle-icon">{{ expanded ? '−' : '+' }}</span>
    </button>
    
    <!-- Tag list -->
    <div 
      v-if="!collapsible || expanded" 
      class="tag-list"
    >
      <span 
        v-for="tag in displayTags" 
        :key="tag" 
        class="tag-item"
      >
        {{ formatTag(tag) }}
      </span>
      
      <!-- Show more indicator -->
      <button 
        v-if="hasHiddenTags"
        class="tag-item tag-more"
        @click="toggleExpanded"
      >
        +{{ tags.length - maxVisible }} more
      </button>
    </div>
  </div>
</template>

<style scoped>
.tag-display-container {
  margin-top: var(--space-2);
}

.tags-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-2);
  background: var(--surface-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.tags-toggle:hover {
  background: var(--surface-secondary);
  border-color: var(--brand-300);
}

.tags-toggle.expanded {
  border-bottom: none;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.tags-count {
  font-weight: var(--font-medium);
}

.toggle-icon {
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
  margin-top: var(--space-2);
  animation: slideDown 0.2s ease-out;
}

.tag-item {
  font-size: var(--text-xs);
  background-color: var(--surface-tertiary);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
}

.tag-more {
  background-color: var(--brand-50);
  color: var(--brand-600);
  border-color: var(--brand-200);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tag-more:hover {
  background-color: var(--brand-100);
  border-color: var(--brand-300);
}

/* Slide-down animation for tag expansion */
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    max-height: 200px;
    transform: translateY(0);
  }
}
</style>

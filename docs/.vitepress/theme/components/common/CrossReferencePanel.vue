<!-- docs/.vitepress/theme/components/common/CrossReferencePanel.vue -->
<template>
  <div v-if="suggestions.length > 0" class="cross-reference-panel content-section">
    <h3 class="panel-title">Related Content</h3>
    
    <div class="reference-list stack-vertical spacing-comfortable">
      <div 
        v-for="suggestion in suggestions" 
        :key="`${suggestion.sourceId}-${suggestion.targetId}`"
        class="reference-item card card-body"
      >
        <div class="reference-header stack-horizontal">
          <span class="reference-icon">{{ getReferenceIcon(suggestion.actionType) }}</span>
          <h4 class="reference-title">{{ suggestion.targetTitle }}</h4>
          <span class="reference-strength badge badge-outline">
            {{ Math.round(suggestion.strength * 100) }}%
          </span>
        </div>
        
        <p class="reference-description">{{ suggestion.suggestion }}</p>
        
        <!-- Reference details -->
        <div v-if="showDetails" class="reference-details">
          <div class="reference-types stack-horizontal spacing-tight">
            <span 
              v-for="refType in getUniqueReferenceTypes(suggestion.references)"
              :key="refType"
              class="reference-type badge badge-secondary"
            >
              {{ formatReferenceType(refType) }}
            </span>
          </div>
          
          <!-- Show shared concepts if available -->
          <div 
            v-if="getSharedConcepts(suggestion.references).length > 0"
            class="shared-concepts"
          >
            <span class="concepts-label">Shared concepts:</span>
            <span class="concepts-list">
              {{ getSharedConcepts(suggestion.references).slice(0, 5).join(', ') }}
            </span>
          </div>
        </div>
        
        <!-- Action buttons -->
        <div class="reference-actions stack-horizontal spacing-tight">
          <button 
            class="btn btn-ghost btn-sm"
            @click="navigateToReference(suggestion)"
          >
            View {{ suggestion.targetType }}
          </button>
          <button 
            v-if="suggestion.bidirectional"
            class="btn btn-ghost btn-sm"
            @click="createBidirectionalLink(suggestion)"
          >
            Link Both Ways
          </button>
          <button 
            class="btn btn-ghost btn-sm"
            @click="toggleDetails"
          >
            {{ showDetails ? 'Less' : 'More' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Panel controls -->
    <div class="panel-controls stack-horizontal">
      <button 
        class="btn btn-ghost btn-sm"
        @click="refreshSuggestions"
      >
        🔄 Refresh
      </button>
      <button 
        class="btn btn-ghost btn-sm"
        @click="$emit('configure')"
      >
        ⚙️ Configure
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { detectCrossReferences, generateLinkingSuggestions } from '../../utils/CrossReferenceDetector.js';

const props = defineProps({
  currentItem: {
    type: Object,
    required: true
  },
  allItems: {
    type: Array,
    default: () => []
  },
  maxSuggestions: {
    type: Number,
    default: 5
  },
  minStrength: {
    type: Number,
    default: 0.3
  },
  autoRefresh: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['navigate', 'link-created', 'configure']);

const showDetails = ref(false);
const crossReferences = ref([]);

// Generate suggestions based on cross-references
const suggestions = computed(() => {
  return generateLinkingSuggestions(crossReferences.value, {
    maxSuggestions: props.maxSuggestions,
    minStrength: props.minStrength
  });
});

// Detect cross-references when items change
const detectReferences = () => {
  if (!props.currentItem || props.allItems.length === 0) {
    crossReferences.value = [];
    return;
  }

  // Filter out the current item and detect references
  const otherItems = props.allItems.filter(item => item.id !== props.currentItem.id);
  
  crossReferences.value = detectCrossReferences(
    [props.currentItem], 
    otherItems,
    {
      threshold: 0.7,
      includePartialMatches: true,
      contentFields: ['content', 'description', 'summary', 'notes'],
      titleFields: ['title', 'name', 'slug']
    }
  );
};

// Watch for changes and auto-refresh if enabled
watch([() => props.currentItem, () => props.allItems], () => {
  if (props.autoRefresh) {
    detectReferences();
  }
}, { immediate: true, deep: true });

// Helper functions
const getReferenceIcon = (actionType) => {
  switch (actionType) {
    case 'bidirectional_link': return '🔗';
    case 'reference_link': return '➡️';
    default: return '📄';
  }
};

const getUniqueReferenceTypes = (references) => {
  return [...new Set(references.map(ref => ref.type))];
};

const formatReferenceType = (type) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getSharedConcepts = (references) => {
  const concepts = [];
  references.forEach(ref => {
    if (ref.sharedConcepts) {
      concepts.push(...ref.sharedConcepts);
    }
    if (ref.commonTags) {
      concepts.push(...ref.commonTags);
    }
  });
  return [...new Set(concepts)];
};

// Actions
const navigateToReference = (suggestion) => {
  emit('navigate', {
    type: suggestion.targetType,
    id: suggestion.targetId,
    title: suggestion.targetTitle
  });
};

const createBidirectionalLink = (suggestion) => {
  emit('link-created', {
    type: 'bidirectional',
    source: suggestion.sourceId,
    target: suggestion.targetId,
    strength: suggestion.strength
  });
};

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const refreshSuggestions = () => {
  detectReferences();
};

// Expose methods for parent components
defineExpose({
  refreshSuggestions,
  detectReferences
});
</script>

<style scoped>
.cross-reference-panel {
  background: var(--surface-secondary);
  border: var(--border-width) solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin: var(--space-6) 0;
}

.panel-title {
  margin: 0 0 var(--space-4);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.reference-list {
  margin-bottom: var(--space-4);
}

.reference-item {
  transition: var(--transition-fast);
}

.reference-item:hover {
  background: var(--surface-tertiary);
  transform: translateY(-1px);
}

.reference-header {
  align-items: center;
  margin-bottom: var(--space-2);
}

.reference-icon {
  font-size: var(--text-lg);
  margin-right: var(--space-2);
}

.reference-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  flex: 1;
}

.reference-strength {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.reference-description {
  margin: 0 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.reference-details {
  padding: var(--space-3);
  background: var(--surface-primary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
}

.reference-types {
  margin-bottom: var(--space-2);
}

.reference-type {
  font-size: var(--text-xs);
}

.shared-concepts {
  color: var(--text-tertiary);
}

.concepts-label {
  font-weight: var(--font-medium);
  margin-right: var(--space-2);
}

.concepts-list {
  font-style: italic;
}

.reference-actions {
  margin-top: var(--space-3);
}

.panel-controls {
  justify-content: flex-end;
  padding-top: var(--space-3);
  border-top: var(--border-width) solid var(--border-secondary);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .reference-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .reference-actions {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .reference-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

<!-- docs/.vitepress/theme/components/pins/PinGrid.vue -->
<template>
  <div class="pin-grid" :class="layout">
    <!-- If grouping is enabled -->
    <template v-if="groupBy !== 'none'">
      <div
        v-for="(groupPins, groupName) in groupedPins"
        :key="groupName"
        class="pin-group"
        :id="getGroupId(groupName)"
      >
        <h3 class="group-header">{{ formatGroupName(groupName) }}</h3>
        
        <div class="pins-container">
          <PinCard
            v-for="pin in groupPins"
            :key="pin.id"
            :pin="pin"
            :layout="layout"
            @click="emit('pin-click', pin)"
            @tag-click="emit('tag-click', $event)"
          />
        </div>
      </div>
    </template>
    
    <!-- If no grouping -->
    <template v-else>
      <div class="pins-container">
        <PinCard
          v-for="pin in pins"
          :key="pin.id"
          :pin="pin"
          :layout="layout"
          @click="emit('pin-click', pin)"
          @tag-click="emit('tag-click', $event)"
        />
      </div>
    </template>
    
    <!-- Empty state -->
    <div v-if="pins.length === 0" class="empty-state">
      <p>No pins found in this collection.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PinCard from './PinCard.vue';

const props = defineProps({
  pins: {
    type: Array,
    required: true
  },
  layout: {
    type: String,
    default: 'compact', // 'compact' = thumbnails only, 'detailed' = thumbnails + metadata
    validator: (val) => ['compact', 'detailed'].includes(val)
  },
  groupBy: {
    type: String,
    default: 'none', // 'none', 'contentType', 'domain', 'section'
    validator: (val) => ['none', 'contentType', 'domain', 'section'].includes(val)
  }
});

const emit = defineEmits(['pin-click', 'tag-click']);

// Group pins based on the groupBy prop
const groupedPins = computed(() => {
  if (props.groupBy === 'none') return {};
  
  const grouped = {};
  
  props.pins.forEach(pin => {
    let groupKey;
    
    if (props.groupBy === 'contentType') {
      groupKey = pin.contentType || 'other';
    } else if (props.groupBy === 'domain') {
      try {
        groupKey = new URL(pin.url).hostname.replace('www.', '');
      } catch {
        groupKey = 'other';
      }
    } else if (props.groupBy === 'section') {
      groupKey = pin.section || 'other';
    } else {
      groupKey = 'other';
    }
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    
    grouped[groupKey].push(pin);
  });
  
  return grouped;
});

// Format group names for display
const formatGroupName = (name) => {
  if (props.groupBy === 'contentType') {
    return name.charAt(0).toUpperCase() + name.slice(1);
  } else if (props.groupBy === 'domain' || props.groupBy === 'section') {
    return name;
  }
  return name;
};

// Generate ID for group
const getGroupId = (name) => {
  return `group-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
};
</script>

<style scoped>
.pin-grid {
  width: 100%;
}

.pin-group {
  margin-bottom: 2rem;
}

.group-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

/* Compact layout - thumbnails only, more columns */
.pin-grid.compact .pins-container {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
  gap: var(--space-3) !important;
  width: 100% !important;
}

/* Detailed layout - thumbnails + metadata, fewer columns */
.pin-grid.detailed .pins-container {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
  gap: var(--space-4) !important;
  width: 100% !important;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .pin-grid.compact .pins-container {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  .pin-grid.detailed .pins-container {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .pin-grid.compact .pins-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-2);
  }
  
  .pin-grid.detailed .pins-container {
    grid-template-columns: 1fr;
  }
}

.empty-state {
  padding: 2rem;
  text-align: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--vp-c-text-2);
}
</style>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  contentTypes: {
    type: Array,
    required: true
  },
  selectedTypes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:selectedTypes', 'typeClick']);

const toggleType = (typeId) => {
  const newSelection = [...props.selectedTypes];
  const index = newSelection.indexOf(typeId);
  
  if (index === -1) {
    newSelection.push(typeId);
  } else {
    newSelection.splice(index, 1);
  }
  
  emit('update:selectedTypes', newSelection);
  emit('typeClick', typeId);
};

// Sort types by count (most common first)
const sortedTypes = computed(() => {
  return [...props.contentTypes].sort((a, b) => b.count - a.count);
});
</script>

<template>
  <div class="type-filter">
    <h3 class="filter-title">
      <span class="filter-icon">📄</span>
      Content Types
    </h3>
    
    <div class="type-list">
      <button 
        v-for="type in sortedTypes"
        :key="type.id"
        @click="toggleType(type.id)"
        :class="['type-button', { active: selectedTypes.includes(type.id) }]"
        :title="`${type.count} items`"
      >
        <span class="type-icon" :class="`type-icon-${type.id}`">{{ type.icon }}</span>
        <span class="type-name">{{ type.name }}</span>
        <span class="type-count">({{ type.count }})</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.type-filter {
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

.type-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.type-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  background-color: var(--vp-c-bg);
  text-align: left;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-button:hover {
  background-color: var(--vp-c-gray-soft);
}

.type-button.active {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
}

.type-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
}

.type-name {
  flex: 1;
}

.type-count {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

/* Specific type styling */
.type-icon-music {
  background-color: rgba(29, 185, 84, 0.1); /* Spotify green */
  color: #1DB954;
}

.type-icon-video {
  background-color: rgba(255, 0, 0, 0.1); /* YouTube red */
  color: #FF0000;
}

.type-icon-article {
  background-color: rgba(0, 114, 177, 0.1); /* Medium blue */
  color: #0072B1;
}

.type-icon-link {
  background-color: rgba(100, 100, 100, 0.1); /* Generic */
  color: #646464;
}

.type-icon-code {
  background-color: rgba(36, 41, 47, 0.1); /* GitHub dark */
  color: #24292F;
}

.type-icon-image {
  background-color: rgba(234, 76, 137, 0.1); /* Instagram pink */
  color: #E4405F;
}

.type-button.active .type-icon {
  background-color: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .type-button {
    padding: 0.4rem 0.6rem;
  }
  
  .type-icon {
    width: 1.25rem;
    height: 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
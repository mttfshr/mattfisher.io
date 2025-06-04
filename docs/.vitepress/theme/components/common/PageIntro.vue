<!-- docs/.vitepress/theme/components/common/PageIntro.vue -->
<template>
  <div class="page-intro content-section">
    <p v-if="description" class="intro-description">{{ description }}</p>
    <slot v-else></slot>
    
    <!-- Optional status indicator -->
    <div v-if="status || lastUpdated" class="intro-meta stack-horizontal spacing-tight">
      <StatusIndicator v-if="status" :status="status" />
      <span v-if="lastUpdated" class="last-updated">
        Updated {{ formatDate(lastUpdated) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StatusIndicator from './StatusIndicator.vue';

const props = defineProps({
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: null // 'active', 'draft', 'complete', etc.
  },
  lastUpdated: {
    type: [String, Date],
    default: null
  }
});

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
</script>

<style scoped>
.page-intro {
  margin: var(--space-6) 0 var(--space-8);
}

.intro-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-4);
}

.intro-meta {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.last-updated {
  font-style: italic;
}
</style>

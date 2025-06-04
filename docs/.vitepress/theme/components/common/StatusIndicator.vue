<!-- docs/.vitepress/theme/components/common/StatusIndicator.vue -->
<template>
  <span class="status-indicator badge" :class="statusClass">
    <span class="status-icon">{{ statusIcon }}</span>
    <span class="status-text">{{ statusLabel }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['draft', 'active', 'complete', 'archived', 'experimental', 'featured'].includes(value)
  },
  size: {
    type: String,
    default: 'normal', // 'small', 'normal', 'large'
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  }
});

const statusConfig = {
  draft: { 
    icon: '✏️', 
    label: 'Draft', 
    class: 'badge-secondary' 
  },
  active: { 
    icon: '🟢', 
    label: 'Active', 
    class: 'badge-success' 
  },
  complete: { 
    icon: '✅', 
    label: 'Complete', 
    class: 'badge-success' 
  },
  archived: { 
    icon: '📦', 
    label: 'Archived', 
    class: 'badge-muted' 
  },
  experimental: { 
    icon: '🧪', 
    label: 'Experimental', 
    class: 'badge-warning' 
  },
  featured: { 
    icon: '⭐', 
    label: 'Featured', 
    class: 'badge-primary' 
  }
};

const statusIcon = computed(() => statusConfig[props.status]?.icon || '•');
const statusLabel = computed(() => statusConfig[props.status]?.label || props.status);
const statusClass = computed(() => [
  statusConfig[props.status]?.class || 'badge-secondary',
  `status-${props.size}`
]);
</script>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.status-indicator.status-small {
  font-size: var(--text-2xs);
  padding: var(--space-1) var(--space-2);
}

.status-indicator.status-large {
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-3);
}

.status-icon {
  font-size: 0.9em;
  line-height: 1;
}

.status-text {
  text-transform: capitalize;
}

/* Badge style variations leveraging existing design system */
.badge-success {
  background-color: var(--vp-c-green-soft);
  color: var(--vp-c-green-darker);
  border: var(--border-width) solid var(--vp-c-green-dim);
}

.badge-warning {
  background-color: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-darker);
  border: var(--border-width) solid var(--vp-c-yellow-dim);
}

.badge-muted {
  background-color: var(--surface-tertiary);
  color: var(--text-tertiary);
  border: var(--border-width) solid var(--border-secondary);
}
</style>

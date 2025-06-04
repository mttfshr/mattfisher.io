<!-- docs/.vitepress/theme/components/common/ContentSection.vue -->
<template>
  <main class="page-content" :class="contentClasses">
    <slot></slot>
  </main>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  maxWidth: {
    type: String,
    default: '1200px'
  },
  padding: {
    type: String,
    default: 'normal' // 'none', 'tight', 'normal', 'comfortable'
  },
  spacing: {
    type: String,
    default: 'comfortable' // 'tight', 'comfortable', 'generous'
  },
  layout: {
    type: String,
    default: 'stack' // 'stack', 'grid', 'flow'
  }
});

const contentClasses = computed(() => {
  return [
    `content-${props.layout}`,
    `spacing-${props.spacing}`,
    props.padding !== 'normal' ? `padding-${props.padding}` : null
  ].filter(Boolean);
});
</script>

<style scoped>
.page-content {
  max-width: v-bind(maxWidth);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* Padding variations */
.page-content.padding-none {
  padding: 0;
}

.page-content.padding-tight {
  padding: 0 var(--space-2);
}

.page-content.padding-comfortable {
  padding: 0 var(--space-6);
}

/* Layout patterns */
.page-content.content-stack {
  display: flex;
  flex-direction: column;
}

.page-content.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.page-content.content-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

/* Spacing integration with semantic utilities */
.page-content.spacing-tight {
  gap: var(--space-2);
}

.page-content.spacing-comfortable {
  gap: var(--space-6);
}

.page-content.spacing-generous {
  gap: var(--space-10);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .page-content {
    padding: 0 var(--space-3);
  }
  
  .page-content.padding-comfortable {
    padding: 0 var(--space-4);
  }
  
  .page-content.content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

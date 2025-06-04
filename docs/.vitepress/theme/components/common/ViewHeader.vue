<!-- docs/.vitepress/theme/components/common/ViewHeader.vue -->
<template>
  <header class="page-header-adaptive">
    <div class="page-header-layout">
      <h1 class="text-2xl font-semibold">{{ title }}</h1>
      <div v-if="$slots.controls" class="header-controls">
        <slot name="controls"></slot>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Support for view selector patterns */
.header-controls .view-selector {
  display: flex;
  gap: var(--space-1);
}

.header-controls .nav-drawer-trigger {
  margin-left: var(--space-2);
  border-left: var(--border-width) solid var(--border-secondary);
  padding-left: var(--space-3);
}
</style>

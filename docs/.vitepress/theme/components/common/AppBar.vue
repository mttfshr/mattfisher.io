<!-- AppBar.vue - Material Design-inspired app bar -->
<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  siteTitle: {
    type: String,
    default: 'Matt Fisher'
  },
  showMenuButton: {
    type: Boolean,
    default: false // Changed to false by default
  }
})

const emit = defineEmits(['menu-click', 'action-click'])

const handleMenuClick = () => {
  emit('menu-click')
}

const handleActionClick = (action) => {
  emit('action-click', action)
}
</script>

<template>
  <header class="app-bar">
    <!-- Menu button -->
    <button 
      v-if="showMenuButton"
      @click="handleMenuClick"
      class="app-bar-menu-btn btn-icon"
      aria-label="Toggle navigation"
    >
      <Icon name="Menu" :size="20" class="icon-primary" />
    </button>

    <!-- Title with site name -->
    <h1 class="app-bar-title">{{ siteTitle }} / {{ title }}</h1>

    <!-- Actions slot -->
    <div class="app-bar-actions">
      <slot name="actions" :handleActionClick="handleActionClick" />
    </div>
  </header>
</template>
<style scoped>
.app-bar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--space-4);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-bar-menu-btn {
  margin-right: var(--space-3);
}

.app-bar-title {
  flex: 1;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--text-primary);
}

.app-bar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-icon:hover {
  background: var(--surface-secondary);
}

.btn-icon:active {
  background: var(--surface-tertiary);
}
</style>

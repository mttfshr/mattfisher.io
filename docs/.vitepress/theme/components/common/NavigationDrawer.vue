<!-- NavigationDrawer.vue -->
<!-- Unified right-side navigation drawer component -->
<script setup>
import { onMounted, onUnmounted, watch } from 'vue'

// Props for maximum reusability
const props = defineProps({
  isOpen: Boolean,
  title: String,
  showBackdrop: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: true },
  width: { type: String, default: '320px' },
  position: { type: String, default: 'right' }
})

// Events
const emit = defineEmits(['close', 'backdrop-click'])

// Methods
const handleClose = () => emit('close')

const handleBackdropClick = () => {
  if (props.showBackdrop) {
    emit('backdrop-click')
    emit('close')
  }
}

// Keyboard support
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

// Focus management
const handleFocus = () => {
  if (props.isOpen) {
    // Focus the close button when drawer opens
    const closeButton = document.querySelector('.nav-drawer-close')
    if (closeButton) {
      closeButton.focus()
    }
  }
}

// Watch for open state changes to manage focus
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // Add keyboard listener when drawer opens
    document.addEventListener('keydown', handleKeydown)
    // Focus management
    setTimeout(handleFocus, 100) // Small delay to ensure DOM is ready
  } else {
    // Remove keyboard listener when drawer closes
    document.removeEventListener('keydown', handleKeydown)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div 
      v-if="showBackdrop && isOpen"
      class="nav-drawer-backdrop active"
      @click="handleBackdropClick"
      aria-hidden="true"
    />
    
    <!-- Drawer Container -->
    <div 
      class="nav-drawer-container"
      :class="{ open: isOpen }"
      :style="{ width }"
      role="dialog"
      :aria-modal="isOpen"
      :aria-hidden="!isOpen"
      tabindex="-1"
    >
      <!-- Header with close control -->
      <header v-if="showHeader" class="nav-drawer-header">
        <h3 v-if="title" class="nav-drawer-title">{{ title }}</h3>
        <div v-else class="nav-drawer-title">
          <slot name="title">Filters</slot>
        </div>
        
        <button 
          class="nav-drawer-close btn btn-ghost"
          @click="handleClose"
          aria-label="Close drawer"
          type="button"
        >
          ✕
        </button>
      </header>
      
      <!-- Content -->
      <div class="nav-drawer-content">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.nav-drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity var(--transition-base);
  z-index: 100;
  pointer-events: none;
}

.nav-drawer-backdrop.active {
  opacity: 1;
  pointer-events: auto;
}

/* Drawer Container */
.nav-drawer-container {
  position: fixed;
  top: 56px; /* Below app bar */
  right: 0;
  bottom: 0;
  width: 320px;
  background: var(--surface-primary);
  border-left: 1px solid var(--border-subtle);
  transform: translateX(100%);
  transition: transform var(--transition-base), border-left var(--transition-base);
  z-index: 110;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-drawer-container.open {
  transform: translateX(0);
  border-left: 0.25px solid rgba(255, 255, 255, 0.08);
}

/* Header */
.nav-drawer-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.nav-drawer-title {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  margin: 0;
}

.nav-drawer-close {
  padding: var(--space-2);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: var(--transition-fast);
  font-size: var(--text-lg);
  line-height: 1;
}

.nav-drawer-close:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.nav-drawer-close:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Content */
.nav-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .nav-drawer-container {
    width: 100%;
    max-width: 320px;
  }
}
</style>

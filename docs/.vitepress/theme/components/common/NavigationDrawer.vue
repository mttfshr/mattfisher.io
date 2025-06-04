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
/* Component uses semantic utilities from layout.css */
/* No additional styles needed - all styling handled by utility classes */
</style>

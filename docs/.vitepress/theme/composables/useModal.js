// useModal.js - Generic modal/dialog management
import { ref, computed } from 'vue'

/**
 * Composable for managing modal/dialog state
 * Handles item selection, modal open/close, and related items logic
 */
export function useModal(options = {}) {
  const selectedItem = ref(null)
  
  // Computed state
  const isOpen = computed(() => !!selectedItem.value)
  
  // Core actions
  const openModal = (item) => {
    selectedItem.value = item
    
    // Execute callback if provided
    if (options.onOpen) {
      options.onOpen(item)
    }
    
    // Add keyboard listener for escape key
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeydown)
    }
  }
  
  const closeModal = () => {
    const wasOpen = selectedItem.value
    selectedItem.value = null
    
    // Execute callback if provided
    if (options.onClose) {
      options.onClose(wasOpen)
    }
    
    // Remove keyboard listener
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', handleKeydown)
    }
  }
  
  // Handle escape key to close modal
  const handleKeydown = (event) => {
    if (event.key === 'Escape' && isOpen.value) {
      closeModal()
    }
  }
  
  // Generic related items finder
  const relatedItems = computed(() => {
    if (!selectedItem.value || !options.findRelated) {
      return []
    }
    
    return options.findRelated(selectedItem.value)
  })
  
  // Cleanup function
  const cleanup = () => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', handleKeydown)
    }
  }
  
  return {
    // State
    selectedItem,
    isOpen,
    
    // Actions
    openModal,
    closeModal,
    
    // Computed
    relatedItems,
    
    // Utilities
    cleanup
  }
}

/**
 * Specialized hook for pin modals with related pins logic
 */
export function usePinModal(pins) {
  const findRelatedPins = (selectedPin) => {
    if (!selectedPin || !pins.value) return []
    
    // Find pins with matching collections
    const withCollections = selectedPin.collections && selectedPin.collections.length > 0
      ? pins.value.filter(p => 
          p.id !== selectedPin.id && 
          p.collections && 
          p.collections.some(c => selectedPin.collections.includes(c))
        )
      : []
    
    // Find pins with matching content type as fallback
    const contentType = selectedPin.contentType
    const sameType = pins.value.filter(p => 
      p.id !== selectedPin.id && 
      !withCollections.includes(p) && 
      p.contentType === contentType
    )
    
    // Combine and limit to 6 related pins
    return [...withCollections, ...sameType].slice(0, 6)
  }
  
  return useModal({
    findRelated: findRelatedPins
  })
}

/**
 * Specialized hook for workbook item modals
 */
export function useWorkbookModal(workbookItems) {
  const findRelatedItems = (selectedItem) => {
    if (!selectedItem || !workbookItems.value) return []
    
    // Find items with matching tags or categories
    const relatedByTags = workbookItems.value.filter(item =>
      item.id !== selectedItem.id &&
      item.tags && selectedItem.tags &&
      item.tags.some(tag => selectedItem.tags.includes(tag))
    )
    
    return relatedByTags.slice(0, 6)
  }
  
  return useModal({
    findRelated: findRelatedItems
  })
}

/**
 * Simple toggle modal for basic open/close scenarios
 */
export function useToggleModal() {
  const isOpen = ref(false)
  
  const openModal = () => {
    isOpen.value = true
  }
  
  const closeModal = () => {
    isOpen.value = false
  }
  
  const toggleModal = () => {
    isOpen.value = !isOpen.value
  }
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  }
}

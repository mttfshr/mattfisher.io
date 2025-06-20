// useFiltering.js - Advanced search and filtering logic
import { ref, computed, watch } from 'vue'

/**
 * Composable for managing search and filtering functionality
 * Handles search queries, active filters, and filtered results
 */
export function useFiltering(items, options = {}) {
  // Search and filter state
  const searchQuery = ref('')
  const activeFilters = ref({})
  const sortBy = ref(options.defaultSort || 'date')
  const sortOrder = ref(options.defaultOrder || 'desc')
  
  // Configuration options with defaults
  const config = {
    searchFields: options.searchFields || ['title', 'description', 'tags'],
    caseSensitive: options.caseSensitive || false,
    fuzzySearch: options.fuzzySearch || false,
    debounceMs: options.debounceMs || 0,
    ...options
  }
  
  // Apply search filtering
  const applySearch = (itemsToFilter, query) => {
    if (!query.trim()) return itemsToFilter
    
    const searchTerm = config.caseSensitive ? query : query.toLowerCase()
    
    return itemsToFilter.filter(item => {
      return config.searchFields.some(field => {
        const value = getNestedValue(item, field)
        if (!value) return false
        
        if (Array.isArray(value)) {
          // Handle array fields like tags
          return value.some(v => {
            const stringValue = config.caseSensitive ? String(v) : String(v).toLowerCase()
            return stringValue.includes(searchTerm)
          })
        } else {
          // Handle string fields
          const stringValue = config.caseSensitive ? String(value) : String(value).toLowerCase()
          return stringValue.includes(searchTerm)
        }
      })
    })
  }
  
  // Apply filter logic
  const applyFilters = (itemsToFilter, filters) => {
    let filtered = [...itemsToFilter]
    
    Object.entries(filters).forEach(([filterKey, filterValues]) => {
      if (!filterValues || (Array.isArray(filterValues) && filterValues.length === 0)) {
        return // Skip empty filters
      }
      
      filtered = filtered.filter(item => {
        const itemValue = getNestedValue(item, filterKey)
        
        if (Array.isArray(filterValues)) {
          // Multiple values filter (OR logic)
          if (Array.isArray(itemValue)) {
            // Item has array value, check for intersection
            return itemValue.some(v => filterValues.includes(v))
          } else {
            // Item has single value, check if it's in filter values
            return filterValues.includes(itemValue)
          }
        } else {
          // Single value filter
          if (Array.isArray(itemValue)) {
            return itemValue.includes(filterValues)
          } else {
            return itemValue === filterValues
          }
        }
      })
    })
    
    return filtered
  }
  
  // Apply sorting
  const applySorting = (itemsToSort, sortField, order) => {
    if (!sortField) return itemsToSort
    
    return [...itemsToSort].sort((a, b) => {
      const aValue = getNestedValue(a, sortField)
      const bValue = getNestedValue(b, sortField)
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return order === 'asc' ? -1 : 1
      if (bValue == null) return order === 'asc' ? 1 : -1
      
      // Handle different data types
      let comparison = 0
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        // Generic comparison
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      }
      
      return order === 'asc' ? comparison : -comparison
    })
  }
  
  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  // Main filtered and sorted results
  const filteredItems = computed(() => {
    let result = items.value || []
    
    // Apply search
    result = applySearch(result, searchQuery.value)
    
    // Apply filters
    result = applyFilters(result, activeFilters.value)
    
    // Apply sorting
    result = applySorting(result, sortBy.value, sortOrder.value)
    
    return result
  })
  
  // Filter management functions
  const setFilter = (key, values) => {
    activeFilters.value = {
      ...activeFilters.value,
      [key]: values
    }
  }
  
  const addFilter = (key, value) => {
    const current = activeFilters.value[key] || []
    if (Array.isArray(current)) {
      if (!current.includes(value)) {
        setFilter(key, [...current, value])
      }
    } else {
      setFilter(key, [current, value])
    }
  }
  
  const removeFilter = (key, value) => {
    const current = activeFilters.value[key]
    if (Array.isArray(current)) {
      const filtered = current.filter(v => v !== value)
      if (filtered.length === 0) {
        const { [key]: removed, ...rest } = activeFilters.value
        activeFilters.value = rest
      } else {
        setFilter(key, filtered)
      }
    } else {
      const { [key]: removed, ...rest } = activeFilters.value
      activeFilters.value = rest
    }
  }
  
  const clearFilter = (key) => {
    const { [key]: removed, ...rest } = activeFilters.value
    activeFilters.value = rest
  }
  
  const clearAllFilters = () => {
    activeFilters.value = {}
    searchQuery.value = ''
  }
  
  const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' || Object.keys(activeFilters.value).length > 0
  })
  
  const activeFilterCount = computed(() => {
    let count = searchQuery.value.trim() ? 1 : 0
    count += Object.values(activeFilters.value).reduce((acc, values) => {
      return acc + (Array.isArray(values) ? values.length : 1)
    }, 0)
    return count
  })
  
  // Sorting functions
  const setSorting = (field, order = 'asc') => {
    sortBy.value = field
    sortOrder.value = order
  }
  
  const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }
  
  // Search debouncing
  let searchTimeout = null
  const debouncedSearch = (query) => {
    if (config.debounceMs > 0) {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        searchQuery.value = query
      }, config.debounceMs)
    } else {
      searchQuery.value = query
    }
  }
  
  return {
    // State
    searchQuery,
    activeFilters,
    sortBy,
    sortOrder,
    
    // Computed results
    filteredItems,
    hasActiveFilters,
    activeFilterCount,
    
    // Search functions
    debouncedSearch,
    
    // Filter management
    setFilter,
    addFilter,
    removeFilter,
    clearFilter,
    clearAllFilters,
    
    // Sorting functions
    setSorting,
    toggleSortOrder
  }
}

/**
 * Specialized filtering for pins with common filter patterns
 */
export function usePinFiltering(pins) {
  return useFiltering(pins, {
    searchFields: ['title', 'url', 'notes', 'tags'],
    defaultSort: 'pinDate',
    defaultOrder: 'desc'
  })
}

/**
 * Specialized filtering for log entries
 */
export function useLogFiltering(logEntries) {
  return useFiltering(logEntries, {
    searchFields: ['title', 'content', 'tags'],
    defaultSort: 'date',
    defaultOrder: 'desc'
  })
}

/**
 * Specialized filtering for notes
 */
export function useNoteFiltering(notes) {
  return useFiltering(notes, {
    searchFields: ['title', 'content', 'tags', 'category'],
    defaultSort: 'updatedAt',
    defaultOrder: 'desc'
  })
}

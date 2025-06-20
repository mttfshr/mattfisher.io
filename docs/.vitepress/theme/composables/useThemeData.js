// useThemeData.js - Centralized theme data access
import { computed } from 'vue'
import { useData } from 'vitepress'

/**
 * Composable for accessing VitePress theme data
 * Eliminates repetitive data access patterns across components
 */
export function useThemeData() {
  const { theme } = useData()

  // Core data structures with safe fallbacks
  const pinsData = computed(() => theme.value.pins || { 
    pins: [], 
    contentTypes: [], 
    allTags: [], 
    userTags: [], 
    sections: [],
    collections: []
  })

  const workbookData = computed(() => theme.value.workbook || { 
    items: [],
    categories: [],
    tags: []
  })

  const logData = computed(() => theme.value.log || { 
    entries: [], 
    sessions: [],
    stats: {}
  })

  const notesData = computed(() => theme.value.notes || { 
    notes: [],
    categories: [],
    tags: []
  })

  // Shortcut accessors for commonly used data
  const pins = computed(() => pinsData.value.pins || [])
  const contentTypes = computed(() => pinsData.value.contentTypes || [])
  const allTags = computed(() => pinsData.value.allTags || [])
  const userTags = computed(() => pinsData.value.userTags || [])
  const collections = computed(() => pinsData.value.collections || [])

  const workbookItems = computed(() => workbookData.value.items || [])
  const logEntries = computed(() => logData.value.entries || [])
  const logSessions = computed(() => logData.value.sessions || [])
  const notes = computed(() => notesData.value.notes || [])

  // Utility functions for common data operations
  const getPinById = (id) => {
    return pins.value.find(pin => pin.id === id)
  }

  const getWorkbookItemById = (id) => {
    return workbookItems.value.find(item => item.id === id)
  }

  const getPinsByContentType = (contentType) => {
    return pins.value.filter(pin => pin.contentType === contentType)
  }

  const getPinsByCollection = (collectionId) => {
    return pins.value.filter(pin => 
      pin.collections && pin.collections.includes(collectionId)
    )
  }

  const getTagCount = (tag) => {
    return pins.value.filter(pin => 
      pin.tags && pin.tags.includes(tag)
    ).length
  }

  return {
    // Raw data objects
    pinsData,
    workbookData,
    logData,
    notesData,

    // Shortcut arrays
    pins,
    contentTypes,
    allTags,
    userTags,
    collections,
    workbookItems,
    logEntries,
    logSessions,
    notes,

    // Utility functions
    getPinById,
    getWorkbookItemById,
    getPinsByContentType,
    getPinsByCollection,
    getTagCount
  }
}

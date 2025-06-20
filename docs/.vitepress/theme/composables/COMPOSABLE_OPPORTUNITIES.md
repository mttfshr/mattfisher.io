# Composable Opportunities Analysis & Planning

## High-Priority Composable Opportunities

### 1. 🎯 **useThemeData** - Data Access Pattern
**Impact**: High | **Complexity**: Low | **Components**: 10+

**Current Duplication:**
```javascript
// Repeated in 12+ components
const { theme } = useData()
const pinsData = computed(() => theme.value.pins || { pins: [], contentTypes: [], allTags: [] })
const pins = computed(() => pinsData.value.pins || [])
const contentTypes = computed(() => pinsData.value.contentTypes || [])
```

**Proposed Composable:**
```javascript
// useThemeData.js
export function useThemeData() {
  const { theme } = useData()
  
  const pinsData = computed(() => theme.value.pins || { pins: [], contentTypes: [], allTags: [], userTags: [], sections: [] })
  const workbookData = computed(() => theme.value.workbook || { items: [] })
  const logData = computed(() => theme.value.log || { entries: [], sessions: [] })
  
  return {
    pinsData,
    workbookData,
    logData,
    // Shortcut accessors
    pins: computed(() => pinsData.value.pins || []),
    contentTypes: computed(() => pinsData.value.contentTypes || []),
    allTags: computed(() => pinsData.value.allTags || []),
    userTags: computed(() => pinsData.value.userTags || [])
  }
}
```

**Components to Refactor:**
- ✅ PinsPage.vue (lines 13-14)
- ✅ PinCollections.vue (lines 125-126)
- ✅ WorkbookPage.vue (line 12)
- ✅ WorkbookGallery.vue (line 23)
- ✅ CollectionsGallery.vue (line 14)
- ✅ TagVisualization.vue (line 86)
- ✅ LogFeed.vue (line 20)
- ✅ NotesIndex.vue (line 19)
- ✅ And 6 more components

### 2. 🎯 **useModal** - Modal Management Pattern
**Impact**: Medium-High | **Complexity**: Medium | **Components**: 3+

**Current Duplication:**
```javascript
// Repeated in PinsPage.vue and PinCollections.vue
const selectedPin = ref(null)

const relatedPins = computed(() => {
  if (!selectedPin.value) return []
  // Complex logic for finding related items...
})

const openPinDetail = (pin) => { selectedPin.value = pin }
const closePinDetail = () => { selectedPin.value = null }
```

**Proposed Composable:**
```javascript
// useModal.js
export function useModal(options = {}) {
  const selectedItem = ref(null)
  const isOpen = computed(() => !!selectedItem.value)
  
  const openModal = (item) => {
    selectedItem.value = item
    if (options.onOpen) options.onOpen(item)
  }
  
  const closeModal = () => {
    const wasOpen = selectedItem.value
    selectedItem.value = null
    if (options.onClose) options.onClose(wasOpen)
  }
  
  // Generic related items finder
  const relatedItems = computed(() => {
    if (!selectedItem.value || !options.findRelated) return []
    return options.findRelated(selectedItem.value)
  })
  
  return {
    selectedItem,
    isOpen,
    openModal,
    closeModal,
    relatedItems
  }
}
```

**Components to Refactor:**
- ✅ PinsPage.vue (selectedPin management)
- ✅ PinCollections.vue (selectedPin management)
- ✅ NavigationDrawer.vue (isOpen management)

### 3. 🎯 **useFiltering** - Search & Filter Pattern
**Impact**: High | **Complexity**: Medium-High | **Components**: 5+

**Current Duplication:**
```javascript
// Repeated filtering logic across multiple components
const searchQuery = ref('')
const selectedTypes = ref([])
const selectedCollection = ref(null)

const filteredPins = computed(() => {
  let filtered = [...pins.value]
  
  // Filter by types
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(pin => selectedTypes.value.includes(pin.contentType))
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(pin => 
      pin.title?.toLowerCase().includes(query) ||
      pin.url?.toLowerCase().includes(query) ||
      pin.notes?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})
```

**Proposed Composable:**
```javascript
// useFiltering.js
export function useFiltering(items, options = {}) {
  const searchQuery = ref('')
  const activeFilters = ref({})
  
  const filteredItems = computed(() => {
    let filtered = [...(items.value || [])]
    
    // Apply search
    if (searchQuery.value.trim()) {
      filtered = applySearch(filtered, searchQuery.value, options.searchFields)
    }
    
    // Apply filters
    Object.entries(activeFilters.value).forEach(([key, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(item => values.includes(item[key]))
      }
    })
    
    return filtered
  })
  
  const setFilter = (key, values) => {
    activeFilters.value[key] = values
  }
  
  const clearFilters = () => {
    activeFilters.value = {}
    searchQuery.value = ''
  }
  
  return {
    searchQuery,
    activeFilters,
    filteredItems,
    setFilter,
    clearFilters
  }
}
```

**Components to Refactor:**
- ✅ PinsPage.vue (complex filtering logic)
- ✅ PinCollections.vue (filtering logic)
- ✅ LogFeed.vue (session filtering)
- ✅ NotesIndex.vue (note filtering)
- ✅ TagFilter.vue (tag filtering)

### 4. 🎯 **usePagination** - Pagination Pattern
**Impact**: Medium | **Complexity**: Low | **Components**: 3+

**Current Duplication:**
```javascript
// Repeated pagination logic
const currentPage = ref(1)
const pageSize = ref(50)

const paginatedPins = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedPins.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(sortedPins.value.length / pageSize.value)
})
```

**Proposed Composable:**
```javascript
// usePagination.js
export function usePagination(items, initialPageSize = 20) {
  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)
  
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return (items.value || []).slice(start, end)
  })
  
  const totalPages = computed(() => {
    return Math.ceil((items.value?.length || 0) / pageSize.value)
  })
  
  const goToPage = (page) => {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  }
  
  return {
    currentPage,
    pageSize,
    paginatedItems,
    totalPages,
    goToPage
  }
}
```

## Medium-Priority Opportunities

### 5. **useToggle** - Toggle State Pattern
**Components**: 6+ | Simple boolean state management

### 6. **useLocalStorage** - Persistent State Pattern  
**Components**: 4+ | Layout preferences, filters, etc.

### 7. **useAsyncData** - Loading State Pattern
**Components**: 8+ | Common loading/error/success patterns

## Implementation Priority

### Phase 1 (Immediate - High Impact, Low Risk)
1. ✅ **useMediaDimensions** - Already created, refactor VimeoEmbed
2. 🎯 **useThemeData** - Simple data access, huge duplication reduction

### Phase 2 (Next Sprint - Medium Impact, Medium Risk)  
3. 🎯 **useModal** - Clear pattern, manageable complexity
4. 🎯 **usePagination** - Simple logic, good ROI

### Phase 3 (Future - High Impact, High Complexity)
5. 🎯 **useFiltering** - Complex but huge impact across site

## Expected Benefits

### Code Reduction
- **Estimated Lines Eliminated**: 800-1200 lines
- **Duplication Reduction**: 60-80% in affected components
- **Bundle Size**: Smaller due to shared logic

### Maintainability  
- **Single Source of Truth**: Logic changes in one place
- **Consistency**: Unified behavior across components
- **Testability**: Composables are easily unit tested

### Developer Experience
- **Faster Development**: Reusable patterns
- **Fewer Bugs**: Tested, proven logic
- **Better Documentation**: Centralized API patterns

## Next Steps

1. **Complete useMediaDimensions refactoring** (VimeoEmbed, WorkbookGallery)
2. **Implement useThemeData** (quick wins across 10+ components)  
3. **Create useModal** (PinsPage, PinCollections)
4. **Plan useFiltering** (most complex but highest impact)

<!-- NotesIndex.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useThemeData } from '../../composables/useThemeData.js'
import { useFiltering } from '../../composables/useFiltering.js'
import NoteCard from './NoteCard.vue'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  showFilters: {
    type: Boolean,
    default: true
  }
})

// Theme data access
const { notes: themeNotes } = useThemeData()

// Notes data source (props take precedence over theme data)
const notesSource = computed(() => {
  if (props.notes && props.notes.length > 0) {
    return props.notes
  }
  return themeNotes.value
})

// Advanced filtering with composable
const {
  searchQuery,
  activeFilters,
  filteredItems: filteredNotes,
  setFilter,
  setSorting
} = useFiltering(notesSource, {
  searchFields: ['title', 'description', 'tags'],
  defaultSort: 'lastUpdated',
  defaultOrder: 'desc'
})

// Extract unique tags for filter UI
const uniqueTags = computed(() => {
  const tags = new Set()
  notesSource.value.forEach(note => {
    if (note.tags && note.tags.length) {
      note.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})

// Current tag filter state for UI
const activeFilter = computed(() => {
  const tagFilter = activeFilters.value.tags
  return Array.isArray(tagFilter) ? tagFilter[0] : tagFilter || 'all'
})

// Sort options for UI
const sortOptions = [
  { label: 'Recently Updated', value: 'lastUpdated' },
  { label: 'Alphabetical', value: 'title' }
]

const activeSortOption = ref('lastUpdated')

// Enhanced filtering and sorting
const sortedNotes = computed(() => {
  let result = [...filteredNotes.value]
  
  if (activeSortOption.value === 'lastUpdated') {
    result.sort((a, b) => {
      if (a.lastUpdated && b.lastUpdated) {
        return b.lastUpdated - a.lastUpdated
      } else if (a.lastUpdated) {
        return -1
      } else if (b.lastUpdated) {
        return 1
      }
      return a.title.localeCompare(b.title)
    })
  } else if (activeSortOption.value === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title))
  }
  
  return result
})

// UI helper functions
function setTagFilter(tag) {
  if (tag === 'all') {
    setFilter('tags', null)
  } else {
    setFilter('tags', tag)
  }
}

function setSortOption(option) {
  activeSortOption.value = option
  setSorting(option, option === 'lastUpdated' ? 'desc' : 'asc')
}
</script>

<template>
  <div class="notes-index">
    <div v-if="showFilters" class="notes-controls">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search notes..." 
          class="search-input"
        />
      </div>
      
      <div class="filter-controls">
        <div class="filter-section">
          <label class="filter-label">Filter by:</label>
          <div class="filter-buttons">
            <button 
              class="filter-button" 
              :class="{ active: activeFilter === 'all' }"
              @click="setTagFilter('all')"
            >
              All
            </button>
            
            <button 
              v-for="tag in uniqueTags" 
              :key="tag"
              class="filter-button" 
              :class="{ active: activeFilter === tag }"
              @click="setTagFilter(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        
        <div class="filter-section">
          <label class="filter-label">Sort by:</label>
          <select 
            class="sort-select"
            v-model="activeSortOption"
            @change="setSortOption($event.target.value)"
          >
            <option 
              v-for="option in sortOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <div v-if="sortedNotes.length === 0" class="no-notes">
      <p>No notes found matching your filter.</p>
    </div>
    
    <div v-else class="notes-list">
      <NoteCard 
        v-for="note in sortedNotes"
        :key="note.slug"
        :title="note.title"
        :slug="note.slug"
        :description="note.description"
        :last-updated="note.lastUpdated"
        :tags="note.tags"
        :cover-image="note.image"
      />
    </div>
  </div>
</template>

<style scoped>
.notes-index {
  max-width: 900px;
  margin: 0 auto;
}

.notes-controls {
  margin-bottom: 2rem;
}

.search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-button {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-button:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
}

.filter-button.active {
  background-color: var(--vp-c-brand);
  color: white;
}

.sort-select {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  font-size: 0.85rem;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.no-notes {
  padding: 3rem;
  text-align: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .filter-controls {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
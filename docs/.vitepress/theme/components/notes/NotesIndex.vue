<!-- NotesIndex.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useThemeData } from '../../composables/useThemeData.js'
// import { useFiltering } from '../../composables/useFiltering.js' // REMOVED: No more filtering
import NoteCard from './NoteCard.vue'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  showFilters: {
    type: Boolean,
    default: false // CHANGED: Default to false since no more filters
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

// REMOVED: All filtering logic - just show all notes

// Simple sorting by last updated (most recent first)
const sortedNotes = computed(() => {
  let result = [...notesSource.value]
  
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
  
  return result
})

// REMOVED: All filter functions
</script>

<template>
  <div class="notes-index">
    <!-- REMOVED: Filter controls - simplified notes display -->
    
    <div v-if="sortedNotes.length === 0" class="no-notes">
      <p>No notes found.</p>
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

/* REMOVED: Filter control styles - simplified design */

.no-notes {
  padding: 3rem;
  text-align: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  color: var(--text-secondary);
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
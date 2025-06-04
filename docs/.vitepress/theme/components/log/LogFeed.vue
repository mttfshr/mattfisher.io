<!-- LogFeed.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import LogUpdate from './LogUpdate.vue'
import LogSession from './LogSession.vue'

const props = defineProps({
  entries: {
    type: Array,
    default: () => []
  },
  showFilters: {
    type: Boolean,
    default: true
  }
})

// Get data from theme config if not provided as prop
const { theme } = useData()
const entriesData = computed(() => {
  if (props.entries && props.entries.length > 0) {
    return props.entries
  }
  
  // Combine log entries and sessions from theme config
  const logEntries = theme.value.logEntries || []
  const sessions = theme.value.sessions || []
  
  console.log('LogFeed - Building entries from theme:', {
    logEntries: logEntries.length,
    sessions: sessions.length
  })
  
  const entries = logEntries.map(entry => ({
    ...entry,
    type: 'entry',
    sortDate: new Date(entry.timestamp || entry.date)
  }));
  
  const sessionItems = sessions.map(session => {
    console.log('Processing session:', session.session, 'date:', session.date)
    return {
      ...session,
      type: 'session',
      sortDate: new Date(session.date),
      isClaudeSession: true,
      id: `session-${session.session}`,
      title: `Session ${session.session} Summary`
    }
  });
  
  const combined = [...entries, ...sessionItems]
    .sort((a, b) => b.sortDate - a.sortDate); // Newest first
    
  console.log('Combined entries:', combined.length)
  return combined
})

const activeFilter = ref('all')
const activeTypeFilter = ref('all')

const uniqueTags = computed(() => {
  const tags = new Set()
  entriesData.value.forEach(entry => {
    if (entry.tags && entry.tags.length) {
      entry.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})

const filteredEntries = computed(() => {
  // First filter by type (all, updates, sessions)
  let typeFiltered = entriesData.value
  
  if (activeTypeFilter.value === 'updates') {
    typeFiltered = entriesData.value.filter(entry => !entry.isClaudeSession)
  } else if (activeTypeFilter.value === 'sessions') {
    typeFiltered = entriesData.value.filter(entry => entry.isClaudeSession)
  }
  
  // Then filter by tags
  if (activeFilter.value === 'all') {
    return typeFiltered
  }
  
  // Filter by tag
  return typeFiltered.filter(entry => 
    entry.tags && entry.tags.includes(activeFilter.value)
  )
})

// Sort entries by date, newest first
const sortedEntries = computed(() => {
  return [...entriesData.value].sort((a, b) => {
    // Handle both timestamp and date fields
    const dateA = new Date(a.timestamp || a.date)
    const dateB = new Date(b.timestamp || b.date)
    return dateB - dateA
  })
})

function setFilter(filter) {
  activeFilter.value = filter
}

function setTypeFilter(filter) {
  activeTypeFilter.value = filter
}

// Group entries by month/year for timeline display
const groupedByMonth = computed(() => {
  const groups = {}
  
  filteredEntries.value.forEach(entry => {
    // Handle both timestamp and date fields
    const dateValue = entry.timestamp || entry.date
    const date = new Date(dateValue)
    
    // Skip invalid dates
    if (isNaN(date.getTime())) {
      console.warn('Invalid date found:', dateValue, 'for entry:', entry.id || entry.title)
      return
    }
    
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    
    if (!groups[key]) {
      groups[key] = {
        label,
        entries: []
      }
    }
    
    groups[key].entries.push(entry)
  })
  
  // Convert to array and sort by date (newest first)
  return Object.entries(groups)
    .map(([key, group]) => ({ 
      key, 
      ...group 
    }))
    .sort((a, b) => {
      const [yearA, monthA] = a.key.split('-').map(Number)
      const [yearB, monthB] = b.key.split('-').map(Number)
      
      return yearB !== yearA 
        ? yearB - yearA 
        : monthB - monthA
    })
})
</script>

<template>
  <div class="log-feed container-responsive">
    <div v-if="showFilters" class="log-filters stack-vertical gap-4">
      <div class="filters-section flex flex-wrap items-center gap-2">
        <div class="filter-label text-secondary font-medium">Type:</div>
        <button 
          class="filter-button btn btn-ghost type-filter" 
          :class="{ 'btn-primary': activeTypeFilter === 'all' }"
          @click="setTypeFilter('all')"
        >
          All
        </button>
        <button 
          class="filter-button btn btn-ghost type-filter" 
          :class="{ 'btn-primary': activeTypeFilter === 'updates' }"
          @click="setTypeFilter('updates')"
        >
          Updates
        </button>
        <button 
          class="filter-button btn btn-ghost type-filter" 
          :class="{ 'btn-primary': activeTypeFilter === 'sessions' }"
          @click="setTypeFilter('sessions')"
        >
          Sessions
        </button>
      </div>
      
      <div v-if="uniqueTags.length > 0" class="filters-section flex flex-wrap items-center gap-2">
        <div class="filter-label text-secondary font-medium">Tags:</div>
        <button 
          class="filter-button btn btn-ghost" 
          :class="{ 'btn-primary': activeFilter === 'all' }"
          @click="setFilter('all')"
        >
          All
        </button>
        
        <button 
          v-for="tag in uniqueTags" 
          :key="tag"
          class="filter-button btn btn-ghost tag-filter" 
          :class="{ 'btn-primary': activeFilter === tag }"
          @click="setFilter(tag)"
        >
          #{{ tag }}
        </button>
      </div>
    </div>
    
    <div v-if="filteredEntries.length === 0" class="no-entries text-center p-12">
      <p class="text-secondary">No entries found matching your filter.</p>
    </div>
    
    <div v-else class="log-timeline">
      <div v-for="group in groupedByMonth" :key="group.key" class="timeline-group mb-12">
        <h2 class="timeline-month text-xl font-semibold mb-6 text-primary">{{ group.label }}</h2>
        
        <div class="timeline-entries">
          <template v-for="entry in group.entries" :key="entry.id">
            <LogSession
              v-if="entry.isClaudeSession"
              :content="entry.content"
              :date="entry.date"
              :tags="entry.tags"
              :images="entry.images"
              :id="entry.id"
              :title="entry.title"
            />
            <LogUpdate
              v-else
              :content="entry.content"
              :timestamp="entry.timestamp"
              :tags="entry.tags"
              :images="entry.images"
              :id="entry.id"
              :title="entry.title"
              :is-claude-session="entry.isClaudeSession"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles only - Layout utilities moved to template */

/* Log filters enhancement */
.log-filters {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-4);
  border-bottom: var(--border-width) solid var(--border-primary);
}

/* Timeline month styling */
.timeline-month {
  position: relative;
  padding-left: var(--space-4);
}

.timeline-month::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: var(--vp-c-brand);
  border-radius: var(--radius-sm);
}

/* Responsive behavior */
@media (max-width: 640px) {
  .filters-section {
    flex-wrap: wrap !important;
    margin-bottom: var(--space-2);
  }
  
  .filter-label {
    width: 100%;
    margin-bottom: var(--space-1);
  }
}
</style>
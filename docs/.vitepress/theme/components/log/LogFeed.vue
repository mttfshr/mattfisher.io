<!-- LogFeed.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import LogUpdate from './LogUpdate.vue'
import LogSession from './LogSession.vue'
import { useThemeData } from '../../composables/useThemeData'
import { useLogFiltering } from '../../composables/useFiltering'

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

// Get theme data using composable
const { logEntries, logSessions } = useThemeData()

// Prepare combined entries for filtering
const allEntries = computed(() => {
  if (props.entries && props.entries.length > 0) {
    return props.entries
  }
  
  console.log('LogFeed - Building entries from theme:', {
    logEntries: logEntries.value.length,
    sessions: logSessions.value.length
  })
  
  const entries = logEntries.value.map(entry => ({
    ...entry,
    type: 'entry',
    sortDate: new Date(entry.timestamp || entry.date)
  }));
  
  const sessionItems = logSessions.value.map(session => {
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

// Use filtering composable for advanced search and filtering
const { 
  searchQuery, 
  activeFilters, 
  filteredItems: filteredEntries,
  setFilter,
  clearAllFilters,
  hasActiveFilters
} = useLogFiltering(allEntries)

// Legacy filter refs for backwards compatibility
const activeFilter = computed(() => activeFilters.value.type || 'all')
const activeTypeFilter = computed(() => activeFilters.value.type || 'all')

const uniqueTags = computed(() => {
  const tags = new Set()
  allEntries.value.forEach(entry => {
    if (entry.tags && entry.tags.length) {
      entry.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})

// Event handlers for filter UI
function setActiveFilter(filter) {
  if (filter === 'all') {
    setFilter('type', null)
  } else {
    setFilter('tags', [filter])
  }
}

function setTypeFilter(type) {
  if (type === 'all') {
    setFilter('type', null)
  } else {
    setFilter('type', type)
  }
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
    <!-- Blueprint-style filter control panel -->
    <div v-if="showFilters" class="blueprint-control-panel">
      <div class="blueprint-grid-ref">CTRL</div>
      
      <h3 class="blueprint-primary">Log Filter Controls</h3>
      
      <div class="blueprint-secondary filter-section">
        <span class="filter-label">TYPE:</span>
        <div class="blueprint-filter-group">
          <button 
            class="blueprint-filter-button" 
            :class="{ 'active': activeTypeFilter === 'all' }"
            @click="setTypeFilter('all')"
          >
            ALL
          </button>
          <button 
            class="blueprint-filter-button" 
            :class="{ 'active': activeTypeFilter === 'updates' }"
            @click="setTypeFilter('updates')"
          >
            UPDATES
          </button>
          <button 
            class="blueprint-filter-button" 
            :class="{ 'active': activeTypeFilter === 'sessions' }"
            @click="setTypeFilter('sessions')"
          >
            SESSIONS
          </button>
        </div>
      </div>
      
      <div v-if="uniqueTags.length > 0" class="blueprint-tertiary filter-section">
        <span class="filter-label">TAGS:</span>
        <div class="blueprint-filter-group">
          <button 
            class="blueprint-filter-button" 
            :class="{ 'active': activeFilter === 'all' }"
            @click="setActiveFilter('all')"
          >
            ALL
          </button>
          
          <button 
            v-for="tag in uniqueTags" 
            :key="tag"
            class="blueprint-filter-button" 
            :class="{ 'active': activeFilter === tag }"
            @click="setActiveFilter(tag)"
          >
            #{{ tag.toUpperCase() }}
          </button>
        </div>
      </div>
      
      <!-- Blueprint technical readout -->
      <div class="blueprint-annotations">
        <div class="blueprint-annotation">
          <span>{{ filteredEntries.length }} ENTRIES</span>
        </div>
        <div class="blueprint-annotation">
          <span>{{ logSessions?.length || 0 }} SESSIONS</span>
        </div>
        <div class="blueprint-annotation">
          <span>{{ uniqueTags.length }} TAGS</span>
        </div>
      </div>
    </div>
    
    <div v-if="filteredEntries.length === 0" class="blueprint-card no-entries">
      <div class="blueprint-grid-ref">NULL</div>
      <h3 class="blueprint-primary">No Data Found</h3>
      <p class="blueprint-tertiary">No entries found matching current filter parameters.</p>
    </div>
    
    <div v-else class="log-timeline">
      <div v-for="group in groupedByMonth" :key="group.key" class="timeline-group">
        <!-- Blueprint-style month header -->
        <div class="blueprint-timeline-header">
          <div class="blueprint-grid-ref">{{ group.key }}</div>
          <h2 class="blueprint-primary timeline-month">{{ group.label }}</h2>
          <div class="blueprint-annotations">
            <div class="blueprint-annotation">
              <span>{{ group.entries.length }} ENTRIES</span>
            </div>
          </div>
          <div class="blueprint-separator"></div>
        </div>
        
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
/* Blueprint Control Panel */
.blueprint-control-panel {
  background-color: var(--surface-secondary);
  border-radius: var(--radius-lg);
  border: var(--border-width) solid var(--border-primary);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  position: relative;
}

.filter-section {
  margin-bottom: var(--space-4);
}

.filter-label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  display: block;
}

.blueprint-filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.blueprint-filter-button {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.blueprint-filter-button:hover {
  background: var(--surface-secondary);
  color: var(--text-secondary);
  border-color: var(--accent-primary);
}

.blueprint-filter-button.active {
  background: var(--accent-primary);
  color: var(--surface-primary);
  border-color: var(--accent-primary);
}

/* Blueprint Timeline Headers */
.blueprint-timeline-header {
  background-color: var(--surface-secondary);
  border-radius: var(--radius-lg);
  border: var(--border-width) solid var(--border-primary);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  position: relative;
}

.timeline-month {
  margin-bottom: var(--space-3) !important;
}

.timeline-group {
  margin-bottom: var(--space-12);
}

.timeline-entries {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* No entries state */
.no-entries {
  text-align: center;
  padding: var(--space-12);
  margin-bottom: var(--space-8);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .blueprint-control-panel {
    padding: var(--space-4);
  }
  
  .blueprint-timeline-header {
    padding: var(--space-4);
  }
  
  .blueprint-filter-group {
    gap: var(--space-1);
  }
  
  .blueprint-filter-button {
    font-size: 10px;
    padding: var(--space-1) var(--space-2);
  }
}
</style>
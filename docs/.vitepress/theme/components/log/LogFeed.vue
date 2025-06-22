<!-- LogFeed.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import LogUpdate from './LogUpdate.vue'
// import LogSession from './LogSession.vue' // REMOVED: No more sessions in frontend
import { useThemeData } from '../../composables/useThemeData'
import { useLogFiltering } from '../../composables/useFiltering'

const props = defineProps({
  entries: {
    type: Array,
    default: () => []
  }
  // REMOVED: showFilters prop - no more filters
})

// Get theme data using composable
const { logEntries } = useThemeData() // SIMPLIFIED: No more sessions in frontend

// Prepare entries for filtering - just log entries now (no sessions)
const allEntries = computed(() => {
  if (props.entries && props.entries.length > 0) {
    return props.entries
  }
  
  console.log('LogFeed - Building entries from theme:', {
    logEntries: logEntries.value.length
  })
  
  const entries = logEntries.value.map(entry => ({
    ...entry,
    // Keep original type (annotation, update, etc.) - don't override!
    sortDate: new Date(entry.timestamp || entry.date)
  }));
  
  const combined = [...entries]
    .sort((a, b) => b.sortDate - a.sortDate); // Newest first
    
  console.log('Combined entries:', combined.length)
  return combined
})

// Use filtering composable for basic functionality (no UI)
const { 
  filteredItems: filteredEntries
} = useLogFiltering(allEntries)

// REMOVED: Legacy filter refs and tag extraction - no more filter UI

// Group entries by individual date for POSSE-style timeline display
const groupedByDate = computed(() => {
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
    
    // Group by individual date (YYYY-MM-DD)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
    
    if (!groups[key]) {
      groups[key] = {
        label,
        date: date,
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
    .sort((a, b) => b.date - a.date)
})
</script>

<template>
  <div class="log-feed container-responsive">
    <!-- REMOVED: Blueprint-style filter control panel -->
    
    <div v-if="filteredEntries.length === 0" class="blueprint-card no-entries">
      <div class="blueprint-grid-ref">NULL</div>
      <h3 class="blueprint-primary">No Data Found</h3>
      <p class="blueprint-tertiary">No entries found.</p>
    </div>
    
    <div v-else class="log-timeline">
      <div v-for="group in groupedByDate" :key="group.key" class="timeline-group">
        <!-- Date header for each day -->
        <div class="date-header">
          <span class="date-label">{{ group.label }}</span>
        </div>
        
        <div class="timeline-entries">
          <template v-for="entry in group.entries" :key="entry.id">
            <LogUpdate
              :content="entry.content"
              :timestamp="entry.timestamp"
              :tags="entry.tags"
              :images="entry.images"
              :id="entry.id"
              :title="entry.title"
              :is-claude-session="entry.isClaudeSession"
              :type="entry.type"
              :category="entry.category"
              :link="entry.link"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* REMOVED: Blueprint Control Panel styles */
/* REMOVED: Blueprint Timeline Header styles */

.timeline-group {
  margin-bottom: var(--space-8);
}

.date-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.date-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.timeline-entries {
  display: flex;
  flex-direction: column;
  gap: var(--space-2); /* Reduced gap for same-day entries */
}

/* No entries state */
.no-entries {
  text-align: center;
  padding: var(--space-12);
  margin-bottom: var(--space-8);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .timeline-group {
    margin-bottom: var(--space-6);
  }
  
  .timeline-entries {
    gap: var(--space-1);
  }
}
</style>
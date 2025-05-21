<!-- LogFeed.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
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

const activeFilter = ref('all')
const activeTypeFilter = ref('all')

const uniqueTags = computed(() => {
  const tags = new Set()
  props.entries.forEach(entry => {
    if (entry.tags && entry.tags.length) {
      entry.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})

const filteredEntries = computed(() => {
  // First filter by type (all, updates, sessions)
  let typeFiltered = props.entries
  
  if (activeTypeFilter.value === 'updates') {
    typeFiltered = props.entries.filter(entry => !entry.isClaudeSession)
  } else if (activeTypeFilter.value === 'sessions') {
    typeFiltered = props.entries.filter(entry => entry.isClaudeSession)
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
  return [...props.entries].sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
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
    const date = new Date(entry.timestamp)
    
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
  <div class="log-feed">
    <div v-if="showFilters" class="log-filters">
      <div class="filters-section">
        <div class="filter-label">Type:</div>
        <button 
          class="filter-button type-filter" 
          :class="{ active: activeTypeFilter === 'all' }"
          @click="setTypeFilter('all')"
        >
          All
        </button>
        <button 
          class="filter-button type-filter" 
          :class="{ active: activeTypeFilter === 'updates' }"
          @click="setTypeFilter('updates')"
        >
          Updates
        </button>
        <button 
          class="filter-button type-filter" 
          :class="{ active: activeTypeFilter === 'sessions' }"
          @click="setTypeFilter('sessions')"
        >
          Sessions
        </button>
      </div>
      
      <div v-if="uniqueTags.length > 0" class="filters-section">
        <div class="filter-label">Tags:</div>
        <button 
          class="filter-button" 
          :class="{ active: activeFilter === 'all' }"
          @click="setFilter('all')"
        >
          All
        </button>
        
        <button 
          v-for="tag in uniqueTags" 
          :key="tag"
          class="filter-button tag-filter" 
          :class="{ active: activeFilter === tag }"
          @click="setFilter(tag)"
        >
          #{{ tag }}
        </button>
      </div>
    </div>
    
    <div v-if="filteredEntries.length === 0" class="no-entries">
      <p>No entries found matching your filter.</p>
    </div>
    
    <div v-else class="log-timeline">
      <div v-for="group in groupedByMonth" :key="group.key" class="timeline-group">
        <h2 class="timeline-month">{{ group.label }}</h2>
        
        <div class="timeline-entries">
          <template v-for="entry in group.entries" :key="entry.id">
            <LogSession
              v-if="entry.isClaudeSession"
              :content="entry.content"
              :timestamp="entry.timestamp"
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
.log-feed {
  max-width: 800px;
  margin: 0 auto;
}

.log-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.filters-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-right: 0.5rem;
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

.tag-filter {
  background-color: var(--vp-c-bg-alt);
}

.type-filter {
  background-color: var(--vp-c-bg-mute);
}

.type-filter.active {
  background-color: var(--vp-c-brand);
}

.no-entries {
  text-align: center;
  padding: 3rem 0;
}

.timeline-group {
  margin-bottom: 3rem;
}

.timeline-month {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--vp-c-text-1);
  position: relative;
  padding-left: 1rem;
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
  border-radius: 2px;
}

@media (max-width: 640px) {
  .filters-section {
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  
  .filter-label {
    width: 100%;
    margin-bottom: 0.25rem;
  }
}
</style>
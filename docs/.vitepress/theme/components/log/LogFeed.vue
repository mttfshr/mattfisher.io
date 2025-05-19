<!-- LogFeed.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import LogUpdate from './LogUpdate.vue'
import LogPin from './LogPin.vue'

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
  if (activeFilter.value === 'all') {
    return sortedEntries.value
  }
  
  // Filter by tag
  return sortedEntries.value.filter(entry => 
    entry.tags && entry.tags.includes(activeFilter.value)
  )
})

// Sort entries by date, newest first
const sortedEntries = computed(() => {
  return [...props.entries].sort((a, b) => {
    const dateA = a.type === 'update' ? new Date(a.timestamp) : new Date(a.pinnedAt)
    const dateB = b.type === 'update' ? new Date(b.timestamp) : new Date(b.pinnedAt)
    return dateB - dateA
  })
})

function setFilter(filter) {
  activeFilter.value = filter
}

// Group entries by month/year for timeline display
const groupedByMonth = computed(() => {
  const groups = {}
  
  filteredEntries.value.forEach(entry => {
    const date = entry.type === 'update' 
      ? new Date(entry.timestamp) 
      : new Date(entry.pinnedAt)
    
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
    <div v-if="showFilters && uniqueTags.length > 0" class="log-filters">
      <button 
        class="filter-button" 
        :class="{ active: activeFilter === 'all' }"
        @click="setFilter('all')"
      >
        All
      </button>
      
      <div v-if="uniqueTags.length > 0" class="filter-divider"></div>
      
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
    
    <div v-if="filteredEntries.length === 0" class="no-entries">
      <p>No entries found matching your filter.</p>
    </div>
    
    <div v-else class="log-timeline">
      <div v-for="group in groupedByMonth" :key="group.key" class="timeline-group">
        <h2 class="timeline-month">{{ group.label }}</h2>
        
        <div class="timeline-entries">
          <template v-for="entry in group.entries" :key="entry.id">
            <LogUpdate 
              v-if="entry.type === 'update'" 
              :content="entry.content"
              :timestamp="entry.timestamp"
              :tags="entry.tags"
              :images="entry.images"
            />
            
            <LogPin 
              v-else-if="entry.type === 'pin'" 
              :title="entry.title"
              :url="entry.url"
              :description="entry.description"
              :image-url="entry.imageUrl"
              :favicon="entry.favicon"
              :site-name="entry.siteName"
              :pinned-at="entry.pinnedAt"
              :tags="entry.tags"
              :note="entry.note"
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
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
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

.filter-divider {
  width: 1px;
  height: 24px;
  background-color: var(--vp-c-divider);
  margin: 0 0.5rem;
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
  .filter-divider {
    display: none;
  }
}
</style>
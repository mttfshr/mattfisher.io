<!-- CollectionsGallery.vue - Transformed using semantic atomic design system -->
<script setup>
import { computed, ref, onMounted } from 'vue'
import { useThemeData } from '../../composables/useThemeData.js'
import TagDisplay from '../common/TagDisplay.vue'

const props = defineProps({
  collections: {
    type: Array,
    default: () => []
  }
})

// Use composable for theme data access
const { collections: themeCollections } = useThemeData()

// Fallback to theme collections if not provided via props
const allCollections = computed(() => {
  if (props.collections && props.collections.length > 0) {
    return props.collections
  }
  return themeCollections.value
})

onMounted(() => {
  console.log('Collections Gallery - collections:', allCollections.value)
  if (allCollections.value.length === 0) {
    console.log('WARNING: No collections available to display')
  } else {
    console.log('Collections found:', allCollections.value.map(c => c.title).join(', '))
  }
})

// Split into featured and regular collections
const featuredCollections = computed(() => 
  allCollections.value.filter(collection => collection.featured)
)

const regularCollections = computed(() => 
  allCollections.value.filter(collection => !collection.featured)
)

// Filter options
const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'type:video', label: 'Videos' },
  { key: 'medium:digital', label: 'Digital' },
  { key: 'tech:video-synth', label: 'Video Synthesis' },
]

// Active filter
const activeFilter = ref('all')

// Set active filter
function setFilter(filter) {
  activeFilter.value = filter
}

// Filtered collections
const filteredCollections = computed(() => {
  if (activeFilter.value === 'all') {
    return regularCollections.value
  }
  
  return regularCollections.value.filter(collection => {
    // If collection doesn't have tag query, exclude when filtering
    if (!collection.tagQuery || !collection.tagQuery.includes) {
      return false
    }
    
    return collection.tagQuery.includes.includes(activeFilter.value)
  })
})

// Format tag for display - handle structured tags
function formatTag(tag) {
  if (!tag) return ''
  
  // Split by colon
  const parts = tag.split(':')
  if (parts.length === 2) {
    // Format the value part only
    const value = parts[1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    
    return value
  }
  
  // If not in key:value format, just format the whole tag
  return tag
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Prepare tags for TagDisplay component
const getCollectionTags = (collection) => {
  if (!collection.tagQuery?.includes) return []
  return collection.tagQuery.includes
}
</script>

<template>
  <div class="collections-gallery">
    <div v-if="featuredCollections.length" class="featured-collections">
      <h2>Featured Collections</h2>
      <!-- Use enhanced gallery grid with larger, more prominent thumbnails -->
      <div class="gallery-grid-xlarge spacing-comfortable">
        <div 
          v-for="collection in featuredCollections" 
          :key="collection.slug" 
          class="collection-card card-interactive featured"
        >
          <a :href="collection.path">
            <div 
              class="collection-image featured-image" 
              :style="collection.image ? { backgroundImage: `url(${collection.image})` } : {}"
            >
              <div class="overlay">
                <h3>{{ collection.title }}</h3>
              </div>
            </div>
            <div class="card-content">
              <p class="collection-description">{{ collection.description }}</p>
              <div class="collection-meta">
                <div class="item-count">{{ collection.totalItems || 0 }} items</div>
                
                <!-- Use reusable TagDisplay component -->
                <TagDisplay 
                  v-if="getCollectionTags(collection).length"
                  :tags="getCollectionTags(collection)" 
                  :collapsible="false"
                  :max-visible="3"
                />
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
    
    <div class="all-collections">
      <h2 v-if="featuredCollections.length">All Collections</h2>
      
      <!-- Filter controls using semantic utilities -->
      <div class="filter-controls">
        <div class="control-group">
          <span class="filter-label">Filter by:</span>
          <button 
            v-for="filter in filterOptions" 
            :key="filter.key"
            :class="['filter-button', { active: activeFilter === filter.key }]"
            @click="setFilter(filter.key)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
      
      <!-- Use semantic gallery grid -->
      <div class="gallery-grid spacing-scaled">
        <div 
          v-for="collection in filteredCollections" 
          :key="collection.slug" 
          class="collection-card card-interactive"
        >
          <a :href="collection.path">
            <div 
              class="collection-image" 
              :style="collection.image ? { backgroundImage: `url(${collection.image})` } : {}"
            >
              <div class="overlay">
                <h3>{{ collection.title }}</h3>
              </div>
            </div>
            <div class="card-content">
              <p class="collection-description">{{ collection.description }}</p>
              <div class="collection-meta">
                <div class="item-count">{{ collection.totalItems || 0 }} items</div>
                
                <!-- Use reusable TagDisplay component -->
                <TagDisplay 
                  v-if="getCollectionTags(collection).length"
                  :tags="getCollectionTags(collection)" 
                  :collapsible="false"
                  :max-visible="3"
                />
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal component-specific styles only */
.collections-gallery {
  margin: var(--space-8) 0;
}

.featured-collections,
.all-collections {
  margin-bottom: var(--space-12);
}

h2 {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.collection-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.collection-card a {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.collection-image {
  height: 180px;
  background-color: var(--surface-tertiary);
  background-size: cover;
  background-position: center;
  position: relative;
}

.featured-image {
  height: 220px;
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: var(--space-4);
  color: white;
}

.overlay h3 {
  font-size: var(--text-xl);
  margin: 0;
  font-weight: var(--font-medium);
}

.card-content {
  padding: var(--space-4);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.collection-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: var(--space-2) 0 var(--space-4);
  flex-grow: 1;
}

.collection-meta {
  margin-top: auto;
}

.item-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-3);
}

.filter-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.filter-button {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  border-radius: var(--radius-full);
  border: var(--border-width) solid var(--border-primary);
  background-color: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.filter-button:hover {
  background-color: var(--surface-secondary);
  border-color: var(--vp-c-brand-soft);
}

.filter-button.active {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-color: var(--vp-c-brand-soft);
}
</style>

<template>
  <div class="collections-gallery">
    <div v-if="featuredCollections.length" class="featured-collections">
      <h2>Featured Collections</h2>
      <div class="collection-grid">
        <div 
          v-for="collection in featuredCollections" 
          :key="collection.slug" 
          class="collection-card featured"
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
            <div class="collection-info">
              <p class="description">{{ collection.description }}</p>
              <div class="item-count">{{ collection.totalItems || 0 }} items</div>
              
              <div v-if="collection.tagQuery?.includes?.length" class="tag-query">
                <span v-for="tag in collection.tagQuery.includes.slice(0, 3)" :key="tag" class="tag">
                  {{ formatTag(tag) }}
                </span>
                <span v-if="collection.tagQuery.includes.length > 3" class="more-tag">
                  +{{ collection.tagQuery.includes.length - 3 }} more
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
    
    <div class="all-collections">
      <h2 v-if="featuredCollections.length">All Collections</h2>
      
      <!-- Tag filter options -->
      <div class="filter-options">
        <div class="filter-group">
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
      
      <div class="collection-grid">
        <div 
          v-for="collection in filteredCollections" 
          :key="collection.slug" 
          class="collection-card"
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
            <div class="collection-info">
              <p class="description">{{ collection.description }}</p>
              <div class="item-count">{{ collection.totalItems || 0 }} items</div>
              
              <div v-if="collection.tagQuery?.includes?.length" class="tag-query">
                <span v-for="tag in collection.tagQuery.includes.slice(0, 3)" :key="tag" class="tag">
                  {{ formatTag(tag) }}
                </span>
                <span v-if="collection.tagQuery.includes.length > 3" class="more-tag">
                  +{{ collection.tagQuery.includes.length - 3 }} more
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useData } from 'vitepress';

const props = defineProps({
  collections: {
    type: Array,
    default: () => []
  }
});

const { theme } = useData();

// Fallback to theme collections if not provided via props
const allCollections = computed(() => {
  if (props.collections && props.collections.length > 0) {
    return props.collections;
  }
  return theme.value.collections || [];
});

onMounted(() => {
  console.log('Collections Gallery - collections:', allCollections.value);
  if (allCollections.value.length === 0) {
    console.log('WARNING: No collections available to display');
  } else {
    console.log('Collections found:', allCollections.value.map(c => c.title).join(', '));
  }
});

// Split into featured and regular collections
const featuredCollections = computed(() => 
  allCollections.value.filter(collection => collection.featured)
);

const regularCollections = computed(() => 
  allCollections.value.filter(collection => !collection.featured)
);

// Filter options
const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'type:video', label: 'Videos' },
  { key: 'medium:digital', label: 'Digital' },
  { key: 'tech:video-synth', label: 'Video Synthesis' },
];

// Active filter
const activeFilter = ref('all');

// Set active filter
function setFilter(filter) {
  activeFilter.value = filter;
}

// Filtered collections
const filteredCollections = computed(() => {
  if (activeFilter.value === 'all') {
    return regularCollections.value;
  }
  
  return regularCollections.value.filter(collection => {
    // If collection doesn't have tag query, exclude when filtering
    if (!collection.tagQuery || !collection.tagQuery.includes) {
      return false;
    }
    
    return collection.tagQuery.includes.includes(activeFilter.value);
  });
});

// Format tag for display
function formatTag(tag) {
  if (!tag) return '';
  
  // Split by colon
  const parts = tag.split(':');
  if (parts.length === 2) {
    // Format the value part only
    const value = parts[1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return value;
  }
  
  // If not in key:value format, just format the whole tag
  return tag
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
</script>

<style scoped>
.collections-gallery {
  margin: 2rem 0;
}

.featured-collections,
.all-collections {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.filter-options {
  margin: 1.5rem 0;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.filter-button {
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
  background-color: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-button:hover {
  background-color: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-soft);
}

.filter-button.active {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-color: var(--vp-c-brand-soft);
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.collection-card {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
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
  background-color: var(--vp-c-bg-alt);
  background-size: cover;
  background-position: center;
  position: relative;
}

.collection-card.featured .collection-image {
  height: 220px;
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 1rem;
  color: white;
}

.collection-info {
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.description {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  margin: 0.5rem 0 1rem;
  flex-grow: 1;
}

.item-count {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.tag-query {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
}

.more-tag {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

h3 {
  font-size: 1.2rem;
  margin: 0;
  font-weight: 500;
}

@media (max-width: 768px) {
  .collection-grid {
    grid-template-columns: 1fr;
  }
}
</style>

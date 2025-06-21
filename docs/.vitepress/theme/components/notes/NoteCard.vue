<!-- NotesCard.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Number,
    default: null
  },
  tags: {
    type: Array,
    default: () => []
  },
  coverImage: {
    type: String,
    default: ''
  }
})

const formattedLastUpdated = computed(() => {
  if (!props.lastUpdated) return null
  
  const date = new Date(props.lastUpdated)
    
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const isRecent = computed(() => {
  if (!props.lastUpdated) return false
  
  const lastUpdated = new Date(props.lastUpdated)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
  
  return lastUpdated > thirtyDaysAgo
})

// Update note URL to use flat structure
const noteUrl = computed(() => {
  return `/notes/${props.slug}`
})
</script>

<template>
  <a :href="noteUrl" class="notes-card">
    <div class="card-content">
      <div class="card-header">
        <h3 class="card-title">{{ title }}</h3>
        <div v-if="isRecent" class="recent-badge">Recently Updated</div>
      </div>
      
      <p v-if="description" class="card-description">{{ description }}</p>
      
      <div class="card-meta">
        <div v-if="formattedLastUpdated" class="meta-item">
          <span class="meta-label">Last updated:</span>
          <span class="meta-value">{{ formattedLastUpdated }}</span>
        </div>
        
        <div v-if="tags && tags.length" class="card-tags">
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="coverImage" class="card-image">
      <img :src="coverImage" :alt="title" loading="lazy" />
    </div>
  </a>
</template>

<style scoped>
.notes-card {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 1.5rem;
}

.notes-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 1.4rem;
  font-weight: var(--font-normal);
  margin: 0;
  line-height: 1.3;
}

.recent-badge {
  font-size: 0.7rem;
  font-weight: var(--font-normal);
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  background-color: var(--vp-c-brand);
  color: white;
  white-space: nowrap;
}

.card-description {
  margin: 0.5rem 0 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  flex-grow: 1;
}

.card-meta {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
}

.meta-label {
  font-weight: var(--font-normal);
  margin-right: 0.5rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  padding: 0.2rem 0.6rem;
  background-color: var(--vp-c-bg-alt);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: var(--font-normal);
}

.card-image {
  width: 180px;
  height: 180px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .notes-card {
    flex-direction: column;
  }
  
  .card-image {
    width: 100%;
    height: 140px;
    order: -1;
  }
  
  .card-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .recent-badge {
    align-self: flex-start;
  }
}
</style>
<!-- LogPin.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  },
  siteName: {
    type: String,
    default: ''
  },
  pinnedAt: {
    type: [String, Date],
    required: true
  },
  tags: {
    type: Array,
    default: () => []
  },
  note: {
    type: String,
    default: ''
  }
})

const formattedDate = computed(() => {
  const date = props.pinnedAt instanceof Date ? props.pinnedAt : new Date(props.pinnedAt)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const hostname = computed(() => {
  try {
    return new URL(props.url).hostname.replace(/^www\./, '')
  } catch {
    return props.url
  }
})

// Format description to truncate if too long
const formattedDescription = computed(() => {
  if (!props.description) return ''
  
  return props.description.length > 150 
    ? props.description.substring(0, 150) + '...' 
    : props.description
})
</script>

<template>
  <div class="log-pin">
    <div class="pin-header">
      <div class="pin-date">{{ formattedDate }}</div>
    </div>
    
    <div class="pin-content">
      <a :href="url" target="_blank" rel="noopener noreferrer" class="pin-card">
        <div class="pin-image" v-if="imageUrl">
          <img :src="imageUrl" :alt="title" loading="lazy" />
        </div>
        
        <div class="pin-details">
          <div class="pin-meta">
            <div class="pin-site" v-if="favicon || siteName">
              <img v-if="favicon" :src="favicon" alt="" class="site-favicon" />
              <span>{{ siteName || hostname }}</span>
            </div>
            <div class="pin-site" v-else>
              {{ hostname }}
            </div>
          </div>
          
          <h3 class="pin-title">{{ title }}</h3>
          
          <p v-if="description" class="pin-description">{{ formattedDescription }}</p>
        </div>
      </a>
      
      <div v-if="note" class="pin-note">
        <p>{{ note }}</p>
      </div>
      
      <div v-if="tags && tags.length" class="pin-tags">
        <span v-for="tag in tags" :key="tag" class="tag">#{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-pin {
  display: flex;
  gap: 1.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 2rem;
}

.pin-header {
  min-width: 100px;
}

.pin-date {
  position: sticky;
  top: 80px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}

.pin-content {
  flex: 1;
}

.pin-card {
  display: flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.pin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.pin-image {
  flex: 0 0 200px;
  max-width: 200px;
  overflow: hidden;
}

.pin-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pin-details {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.pin-meta {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.pin-site {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.site-favicon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.pin-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.pin-description {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin: 0;
}

.pin-note {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.pin-note p {
  margin: 0;
}

.pin-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  font-size: 0.85rem;
  color: var(--vp-c-brand);
}

@media (max-width: 700px) {
  .pin-card {
    flex-direction: column;
  }
  
  .pin-image {
    max-width: none;
    height: 180px;
  }
}

@media (max-width: 640px) {
  .log-pin {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .pin-header {
    min-width: unset;
  }
  
  .pin-date {
    position: static;
  }
}
</style>
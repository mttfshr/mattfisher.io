<!-- LogSession.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  date: {
    type: [String, Date],
    required: true
  },
  tags: {
    type: Array,
    default: () => []
  },
  images: {
    type: Array,
    default: () => []
  },
  id: {
    type: String,
    required: true
  }
})

const formattedDate = computed(() => {
  const date = props.date instanceof Date ? props.date : new Date(props.date)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

// Format content to convert URLs to links and preserve line breaks
const formattedContent = computed(() => {
  // Simple URL regex
  const urlRegex = /(https?:\/\/[^\s]+)/g
  
  // Replace URLs with links
  let processedContent = props.content.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  });
  
  // Preserve line breaks by replacing \n with <br>
  return processedContent.replace(/\n/g, '<br>');
})

// Format title by extracting session number
const sessionInfo = computed(() => {
  // Try to extract session number from the title
  // Expected format: "Development Session XX"
  const match = props.title.match(/Development Session (\d+)/i);
  if (match) {
    return {
      number: match[1],
      name: props.title
    };
  }
  
  return {
    number: "",
    name: props.title
  };
})
</script>

<template>
  <div :id="id" class="log-session">
    <div class="session-header">
      <div class="session-date" :id="id">
        <a :href="`#${id}`" class="date-link">{{ formattedDate }}</a>
      </div>
    </div>
    
    <div class="session-content">
      <div class="session-title">
        <span class="session-badge">Session {{ sessionInfo.number }}</span>
        <h3>{{ sessionInfo.name }}</h3>
      </div>
      
      <div class="claude-indicator">Notes by Claude</div>
      
      <div v-html="formattedContent" class="content-text"></div>
      
      <div v-if="images && images.length" class="session-images">
        <div 
          v-for="(image, index) in images" 
          :key="index" 
          class="image-wrapper"
          :class="{ 'single': images.length === 1, 'multiple': images.length > 1 }"
        >
          <img :src="image.url" :alt="image.alt || 'Session image'" loading="lazy" />
        </div>
      </div>
      
      <div v-if="tags && tags.length" class="session-tags">
        <span 
          v-for="tag in tags" 
          :key="tag" 
          class="tag"
        >
          #{{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-session {
  display: flex;
  gap: var(--space-6);
  padding-bottom: var(--space-8);
  border-bottom: var(--border-width) solid var(--vp-c-divider);
  margin-bottom: var(--space-8);
}

.session-header {
  min-width: 100px;
}

.session-date {
  position: sticky;
  top: 80px;
}

.date-link {
  font-weight: var(--font-medium);
  color: var(--vp-c-text-2);
  font-size: var(--text-sm);
  text-decoration: none;
}

.date-link:hover {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

.session-content {
  flex: 1;
}

.session-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.session-title h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
}

.session-badge {
  background-color: var(--vp-c-brand);
  color: white;
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
}

.claude-indicator {
  display: inline-block;
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--vp-c-text-2);
  padding: var(--space-1) var(--space-2);
  background-color: var(--vp-c-bg-soft);
  border-radius: var(--radius-sm);
}

.content-text {
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

.content-text :deep(a) {
  color: var(--vp-c-brand);
  text-decoration: none;
  border-bottom: var(--border-width) dotted var(--vp-c-brand);
}

.content-text :deep(a:hover) {
  color: var(--vp-c-brand-dark);
  border-bottom: var(--border-width) solid var(--vp-c-brand-dark);
}

.session-images {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-4) 0;
}

.session-images.single {
  grid-template-columns: 1fr;
}

.session-images.multiple {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.image-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image-wrapper.single img {
  max-height: 400px;
  width: auto;
  max-width: 100%;
  margin: 0 auto;
  display: block;
}

.image-wrapper.multiple img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  aspect-ratio: 16/9;
}

.session-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.tag {
  font-size: var(--text-sm);
  color: var(--vp-c-brand);
}

@media (max-width: 640px) {
  .log-session {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .session-header {
    min-width: unset;
  }
  
  .session-date {
    position: static;
  }
  
  .session-title {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}
</style>
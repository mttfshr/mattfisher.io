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
  <div :id="id" class="blueprint-card log-session">
    <!-- Blueprint grid reference -->
    <div class="blueprint-grid-ref">S{{ sessionInfo.number || 'XX' }}</div>
    
    <!-- Session header with blueprint hierarchy -->
    <div class="session-header">
      <!-- PRIMARY LEVEL: Session Title -->
      <h3 class="blueprint-primary session-title">{{ sessionInfo.name }}</h3>
      
      <!-- SECONDARY LEVEL: Technical Classification -->
      <div class="blueprint-secondary session-classification">
        <span class="session-badge">SESSION {{ sessionInfo.number }}</span>
        <span class="claude-indicator">CLAUDE NOTES</span>
        <span class="session-date">{{ formattedDate }}</span>
      </div>
      
      <!-- TERTIARY LEVEL: Supporting Context -->
      <div v-html="formattedContent" class="blueprint-tertiary content-text"></div>
      
      <!-- Human insight annotation for significant sessions -->
      <div v-if="sessionInfo.number && parseInt(sessionInfo.number) > 60" class="blueprint-insight">
        <em>Recent Development:</em> Advanced sessions in our blueprint design system evolution, 
        showcasing the sophisticated interplay between technical precision and human insight.
      </div>
      
      <!-- Session images -->
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
      
      <!-- QUATERNARY LEVEL: Technical Annotations -->
      <div class="blueprint-annotations">
        <div class="blueprint-annotation">
          <span>{{ formattedDate }}</span>
        </div>
        
        <div v-if="tags && tags.length" class="blueprint-annotation">
          <span>{{ tags.length }} TAGS</span>
        </div>
        
        <div class="blueprint-annotation">
          <span>{{ id }}</span>
        </div>
      </div>
      
      <!-- Blueprint tags -->
      <div v-if="tags && tags.length" class="blueprint-tags">
        <div 
          v-for="tag in tags" 
          :key="tag"
          class="blueprint-tag"
        >
          #{{ tag.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* LogSession specific styling - extends blueprint-card pattern */
.log-session {
  margin-bottom: var(--space-8);
}

.session-header {
  flex: 1;
}

/* Technical classification styling */
.session-classification {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.session-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  background: var(--accent-primary);
  color: var(--surface-primary);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent-primary);
}

.claude-indicator {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  background: var(--surface-tertiary);
  color: var(--text-secondary);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.session-date {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  opacity: 0.8;
}

/* Content text styling with blueprint aesthetics */
.content-text {
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

.content-text :deep(a) {
  color: var(--accent-primary);
  text-decoration: none;
  border-bottom: var(--border-width) dotted var(--accent-primary);
}

.content-text :deep(a:hover) {
  color: var(--text-primary);
  border-bottom: var(--border-width) solid var(--accent-primary);
}

/* Session images */
.session-images {
  display: grid;
  gap: var(--space-3);
  margin: var(--space-4) 0;
  border-left: 2px solid var(--accent-primary);
  padding-left: var(--space-4);
  margin-left: var(--space-2);
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
  border: 1px solid var(--border-primary);
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

/* Custom blueprint tag hover states for sessions */
.blueprint-tag:hover {
  background-color: var(--surface-secondary);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .session-classification {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .session-images {
    margin-left: 0;
    padding-left: var(--space-2);
  }
}
</style>
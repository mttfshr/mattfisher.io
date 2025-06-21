<!-- LogUpdate.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  timestamp: {
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
  },
  title: {
    type: String,
    default: ''
  },
  isClaudeSession: {
    type: Boolean,
    default: false
  }
})

const formattedDate = computed(() => {
  const date = props.timestamp instanceof Date ? props.timestamp : new Date(props.timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

// Format content to find URLs and convert them to links
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
</script>

<template>
  <div class="log-update" :id="id">
    <div class="update-header">
      <div class="update-time">
        <a :href="`#${id}`" class="update-date">{{ formattedDate }}</a>
      </div>
    </div>
    
    <div class="update-content">
      <div v-if="title" class="update-title">{{ title }}</div>
      <div v-html="formattedContent" class="content-text"></div>
      
      <div v-if="images && images.length" class="update-images">
        <div 
          v-for="(image, index) in images" 
          :key="index" 
          class="image-wrapper"
          :class="{ 'single': images.length === 1, 'multiple': images.length > 1 }"
        >
          <img :src="image.url" :alt="image.alt || 'Update image'" loading="lazy" />
        </div>
      </div>
      
      <div v-if="tags && tags.length" class="update-tags">
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
.log-update {
  display: flex;
  gap: 1.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 2rem;
}

.update-header {
  min-width: 100px;
}

.update-time {
  position: sticky;
  top: 80px;
}

.update-date {
  font-weight: var(--font-normal);
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-decoration: none;
}

.update-date:hover {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

.update-content {
  flex: 1;
}

.update-title {
  font-size: 1.2rem;
  font-weight: var(--font-normal);
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  padding-left: 0.5rem;
  border-left: 3px solid var(--vp-c-brand);
}

.content-text {
  line-height: 1.6;
  margin-bottom: 1rem;
}

.content-text :deep(a) {
  color: var(--vp-c-brand);
  text-decoration: none;
  border-bottom: 1px dotted var(--vp-c-brand);
}

.content-text :deep(a:hover) {
  color: var(--vp-c-brand-dark);
  border-bottom: 1px solid var(--vp-c-brand-dark);
}

.update-images {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0;
}

.update-images.single {
  grid-template-columns: 1fr;
}

.update-images.multiple {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.image-wrapper {
  border-radius: 8px;
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

.update-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  font-size: 0.85rem;
  color: var(--vp-c-brand);
}

@media (max-width: 640px) {
  .log-update {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .update-header {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: unset;
  }
  
  .update-time {
    position: static;
  }
}
</style>
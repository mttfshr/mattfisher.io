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

const formattedTime = computed(() => {
  const date = props.timestamp instanceof Date ? props.timestamp : new Date(props.timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
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
  <div class="log-update">
    <div class="update-header">
      <div class="update-time">
        <div class="update-date">{{ formattedDate }}</div>
        <div class="update-hour">{{ formattedTime }}</div>
      </div>
    </div>
    
    <div class="update-content">
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
  font-weight: 500;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}

.update-hour {
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
}

.update-content {
  flex: 1;
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
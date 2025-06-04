<!-- MediaThumbnail.vue - Reusable media display component -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  thumbnailUrl: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'media'
  },
  alt: {
    type: String,
    required: true
  },
  fallbackText: {
    type: String,
    default: null
  },
  aspectRatio: {
    type: String,
    default: 'standard', // 'standard', 'square', 'wide', 'tall', 'hero'
    validator: (value) => ['standard', 'square', 'wide', 'tall', 'hero'].includes(value)
  }
})

const containerClass = computed(() => {
  const baseClass = 'media-container'
  // Use hero container for enhanced visual impact
  if (props.aspectRatio === 'hero') {
    return 'media-container-hero'
  }
  const aspectClass = props.aspectRatio !== 'standard' ? `media-container-${props.aspectRatio}` : ''
  return [baseClass, aspectClass].filter(Boolean).join(' ')
})

const displayText = computed(() => {
  if (props.fallbackText) return props.fallbackText
  if (props.type === 'video') return 'Video'
  if (props.type === 'image') return 'Image'
  return 'Media'
})

// Removed showVideoIcon - no longer displaying video overlay badges
</script>

<template>
  <div :class="containerClass">
    <!-- Image display -->
    <img 
      v-if="thumbnailUrl" 
      :src="thumbnailUrl" 
      :alt="alt"
      loading="lazy"
    />
    
    <!-- Fallback display -->
    <div v-else class="placeholder-media">
      {{ displayText }}
    </div>
  </div>
</template>

<style scoped>
.placeholder-media {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--surface-tertiary);
  color: var(--text-secondary);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
}
</style>

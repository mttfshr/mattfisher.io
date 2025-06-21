<template>
  <div class="enhanced-markdown">
    <!-- Header Section -->
    <header class="content-header">
      <h1 v-if="frontmatter.title" class="title">{{ frontmatter.title }}</h1>
      
      <div class="metadata">
        <div class="date" v-if="frontmatter.date">
          {{ formatDate(frontmatter.date) }}
        </div>
        
        <div class="tags" v-if="frontmatter.tags && frontmatter.tags.length">
          <span class="tag" v-for="tag in getTagsArray(frontmatter.tags)" :key="tag">
            {{ tag }}
          </span>
        </div>
      </div>
      
      <!-- Featured Image -->
      <div v-if="frontmatter.image" class="featured-image">
        <img :src="frontmatter.image" :alt="frontmatter.title" />
      </div>
    </header>
    
    <!-- Media Embed Section -->
    <div v-if="shouldEmbedMedia" class="media-embed">
      <MediaEmbed 
        :type="frontmatter.media.type"
        :provider="frontmatter.media.provider"
        :url="frontmatter.media.url"
      />
    </div>
    
    <!-- Technical Specifications -->
    <div v-if="hasTechSpecs" class="tech-specs">
      <div class="specs-grid">
        <!-- Technologies -->
        <div v-if="frontmatter.tech && frontmatter.tech.length" class="tech-section">
          <h3>Technologies</h3>
          <ul class="tech-list">
            <li v-for="tech in frontmatter.tech" :key="tech">{{ tech }}</li>
          </ul>
        </div>
        
        <!-- Specifications -->
        <div v-if="frontmatter.specs" class="specs-section">
          <h3>Specifications</h3>
          <dl class="specs-list">
            <template v-for="(value, key) in frontmatter.specs" :key="key">
              <dt>{{ formatSpecLabel(key) }}</dt>
              <dd>{{ value }}</dd>
            </template>
          </dl>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import MediaEmbed from './MediaEmbed.vue'

const { frontmatter } = useData()

// Format date for display
function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Convert tags to array (handles both string and array formats)
function getTagsArray(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  
  // If it's a comma-separated string
  return tags.split(',').map(tag => tag.trim())
}

// Format spec labels - e.g., "frameRate" to "Frame Rate"
function formatSpecLabel(key) {
  if (!key) return ''
  
  // Convert camelCase to space-separated words
  const spacedKey = key.replace(/([A-Z])/g, ' $1')
  
  // Capitalize first letter of each word
  return spacedKey
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Determine if media should be embedded
const shouldEmbedMedia = computed(() => {
  return frontmatter.value.media && 
         frontmatter.value.media.url && 
         (frontmatter.value.media.embed !== false)
})

// Check if there are technical specifications to display
const hasTechSpecs = computed(() => {
  return (frontmatter.value.tech && frontmatter.value.tech.length > 0) || 
         (frontmatter.value.specs && Object.keys(frontmatter.value.specs).length > 0)
})
</script>

<style scoped>
.enhanced-markdown {
  max-width: 800px;
  margin: 0 auto;
}

.content-header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.metadata {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.featured-image {
  margin-bottom: 2rem;
  border-radius: 8px;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: auto;
  display: block;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.2rem 0.6rem;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: var(--font-normal);
}

.media-embed {
  margin-bottom: 2rem;
}

.tech-specs {
  background-color: var(--vp-c-bg-soft);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.tech-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tech-list li {
  margin-bottom: 0.5rem;
  padding-left: 1rem;
  position: relative;
}

.tech-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--vp-c-brand);
}

.specs-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1rem;
  margin: 0;
}

.specs-list dt {
  font-weight: var(--font-normal);
  color: var(--text-primary);
}

.specs-list dd {
  margin: 0;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .metadata {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .specs-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
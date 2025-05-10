<template>
  <div class="enhanced-note">
    <!-- Header Section -->
    <header class="content-header">
      <h1 v-if="frontmatter.title" class="title">{{ frontmatter.title }}</h1>
      
      <div class="metadata">
        <div class="date-info">
          <div v-if="frontmatter.createdAt" class="created-date">
            <strong>Created:</strong> {{ formatDate(frontmatter.createdAt) }}
          </div>
          <div v-if="frontmatter.lastModified" class="modified-date">
            <strong>Last modified:</strong> {{ formatDate(frontmatter.lastModified) }}
          </div>
        </div>
        
        <div class="tags" v-if="frontmatter.tags && frontmatter.tags.length">
          <span class="tag" v-for="tag in getTagsArray(frontmatter.tags)" :key="tag">
            {{ tag }}
          </span>
        </div>
      </div>
      
      <!-- Featured Image -->
      <div v-if="getImagePath()" class="featured-image">
        <img :src="getImagePath()" :alt="frontmatter.title" />
      </div>
    </header>
    
    <!-- Main Content -->
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

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

// Get image path from various possible frontmatter fields
function getImagePath() {
  return frontmatter.value.image || 
         frontmatter.value.coverImage || 
         frontmatter.value.featuredImage || 
         null
}
</script>

<style scoped>
.enhanced-note {
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
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.created-date,
.modified-date {
  font-size: 0.9rem;
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
  font-weight: 500;
}

@media (max-width: 768px) {
  .metadata {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
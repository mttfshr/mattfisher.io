<!-- docs/.vitepress/theme/layouts/NoteLayout.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter, theme, page } = useData()
const route = useRoute()

// Reactive variables
const relatedNotes = ref([])
const notesData = ref([])

// Get current slug from route
const currentSlug = computed(() => {
  const path = route.path
  const parts = path.split('/')
  // Remove .html extension if present
  const lastPart = parts[parts.length - 1]
  return lastPart.replace('.html', '')
})

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

// Find related notes
onMounted(() => {
  try {
    // Get all notes data from theme config
    notesData.value = theme.value.notes || [];
    
    // Find current note
    const currentNote = notesData.value.find(note => 
      note.slug === currentSlug.value || 
      note.slug.replace('.html', '') === currentSlug.value
    );
    
    // If we have tags, find related notes with similar tags
    if (currentNote && currentNote.tags && currentNote.tags.length) {
      relatedNotes.value = notesData.value
        .filter(note => 
          note.slug !== currentSlug.value && // Not the current note
          note.tags && 
          note.tags.some(tag => currentNote.tags.includes(tag)) // Has at least one matching tag
        )
        .slice(0, 3); // Limit to 3 related notes
    }
  } catch (error) {
    console.error('Error processing notes data:', error);
  }
})
</script>

<template>
  <div class="note-container">
    <!-- Header Section -->
    <header class="note-header">
      <h1>{{ frontmatter.title }}</h1>
      
      <div class="metadata">
        <div class="date-info">
          <div v-if="page.lastUpdated" class="modified-date">
            Updated: {{ formatDate(page.lastUpdated) }}
          </div>
        </div>
        
        <div v-if="frontmatter.tags && frontmatter.tags.length" class="tags">
          <span v-for="tag in frontmatter.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
      
      <div v-if="frontmatter.image" class="featured-image">
        <img :src="frontmatter.image" :alt="frontmatter.title" />
      </div>
      
      <div v-if="frontmatter.description" class="description">
        {{ frontmatter.description }}
      </div>
    </header>
    
    <!-- Main Content -->
    <div class="note-content">
      <Content />
    </div>
    
    <!-- Related Notes -->
    <div v-if="relatedNotes.length > 0" class="related-notes">
      <h3>Related Notes</h3>
      <div class="related-grid">
        <a 
          v-for="note in relatedNotes" 
          :key="note.slug"
          :href="`/notes/${note.slug}.html`"
          class="related-note"
        >
          <div class="related-title">{{ note.title }}</div>
          <div v-if="note.description" class="related-description">
            {{ note.description }}
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.note-header {
  margin-bottom: 2rem;
}

.note-header h1 {
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

.description {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: var(--vp-c-text-2);
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

.note-content {
  line-height: 1.7;
}

.note-content p {
  margin-bottom: .5rem;;
}

.note-content h2 {
  margin-top: 2rem;
  padding-top: 1rem;
}

.note-content h3 {
  margin-top: 1.5rem;
}

.related-notes {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.related-notes h3 {
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.related-note {
  display: block;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.related-note:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: var(--vp-c-bg-mute);
}

.related-title {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.related-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .metadata {
    flex-direction: column;
    gap: 1rem;
  }
  
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
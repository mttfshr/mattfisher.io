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
    <!-- Header Section - Updated to use semantic header pattern -->
    <header class="page-header-adaptive">
      <div class="page-header-layout">
        <h1 class="text-2xl font-semibold">{{ frontmatter.title }}</h1>
        <div v-if="frontmatter.tags && frontmatter.tags.length" class="tags">
          <span v-for="tag in frontmatter.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </header>
    
    <!-- Metadata section moved below header -->
    <div class="note-metadata">
      <div class="date-info">
        <div v-if="page.lastUpdated" class="modified-date">
          Updated: {{ formatDate(page.lastUpdated) }}
        </div>
      </div>
      
      <div v-if="frontmatter.image" class="featured-image">
        <img :src="frontmatter.image" :alt="frontmatter.title" />
      </div>
      
      <div v-if="frontmatter.description" class="description">
        {{ frontmatter.description }}
      </div>
    </div>
    
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
  padding: 0 var(--space-4);
}

.note-metadata {
  padding: var(--space-6) 0;
  border-bottom: var(--border-width) solid var(--border-secondary);
  margin-bottom: var(--space-6);
}

.date-info {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.featured-image {
  margin-bottom: var(--space-6);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: auto;
  display: block;
}

.description {
  font-size: var(--text-lg);
  margin-bottom: var(--space-4);
  color: var(--text-secondary);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  padding: var(--space-1) var(--space-3);
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
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
  .note-metadata {
    padding: var(--space-4) 0;
  }
  
  .related-grid {
    grid-template-columns: 1fr;
  }
  
  .tags {
    justify-content: flex-start;
  }
}
</style>
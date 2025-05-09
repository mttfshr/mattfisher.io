<template>
  <div class="note-layout">
    <EnhancedNote>
      <Content />
    </EnhancedNote>
    
    <div class="related-notes" v-if="relatedNotes.length > 0">
      <h3>Related Notes</h3>
      <ul class="related-notes-list">
        <li v-for="note in relatedNotes" :key="note.slug">
          <a :href="`/notes/${note.slug}`">{{ note.title }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData, useRoute } from 'vitepress'
import EnhancedNote from './components/EnhancedNote.vue'

const { frontmatter } = useData()
const route = useRoute()

// Reactive variables
const notesItems = ref([])
const relatedNotes = ref([])

// Get current slug from route
const currentSlug = computed(() => {
  const path = route.path
  const parts = path.split('/')
  return parts[parts.length - 1]
})

// Load notes items and find related notes
onMounted(async () => {
  try {
    // Import notes items
    const itemsModule = await import('../data/notesItems.js')
    if (itemsModule && itemsModule.notesItems) {
      notesItems.value = itemsModule.notesItems
      
      // Find current note
      const currentNote = notesItems.value.find(note => note.slug === currentSlug.value)
      
      // If we have tags, find related notes with similar tags
      if (currentNote && currentNote.tags && currentNote.tags.length) {
        relatedNotes.value = notesItems.value
          .filter(note => 
            note.slug !== currentSlug.value && // Not the current note
            note.tags && 
            note.tags.some(tag => currentNote.tags.includes(tag)) // Has at least one matching tag
          )
          .slice(0, 3) // Limit to 3 related notes
      }
    }
  } catch (error) {
    console.error('Error loading notes items:', error)
  }
})
</script>

<style scoped>
.note-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.related-notes {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.related-notes h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.related-notes-list {
  padding-left: 1.5rem;
}

.related-notes-list li {
  margin-bottom: 0.5rem;
}

.related-notes-list a {
  color: var(--vp-c-brand);
  text-decoration: none;
}

.related-notes-list a:hover {
  text-decoration: underline;
}
</style>
<template>
  <div class="workbook-item-layout">
    <EnhancedMarkdown>
      <Content />
    </EnhancedMarkdown>
    
    <div class="navigation" v-if="nextItem || prevItem">
      <div class="nav-links">
        <a v-if="prevItem" :href="`/workbook/${prevItem.slug}`" class="prev-link">
          &larr; {{ prevItem.title }}
        </a>
        <a v-if="nextItem" :href="`/workbook/${nextItem.slug}`" class="next-link">
          {{ nextItem.title }} &rarr;
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData, useRoute } from 'vitepress'
import EnhancedMarkdown from './components/EnhancedMarkdown.vue'

const { frontmatter } = useData()
const route = useRoute()

// Reactive variables
const workbookItems = ref([])
const currentIndex = ref(-1)

// Get current slug from route
const currentSlug = computed(() => {
  const path = route.path
  const parts = path.split('/')
  return parts[parts.length - 1]
})

// Navigation items
const nextItem = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= workbookItems.value.length - 1) {
    return null
  }
  return workbookItems.value[currentIndex.value + 1]
})

const prevItem = computed(() => {
  if (currentIndex.value <= 0) {
    return null
  }
  return workbookItems.value[currentIndex.value - 1]
})

// Load workbook items and find current index
onMounted(async () => {
  try {
    // Import workbook items
    const itemsModule = await import('../data/workbookItems.js')
    if (itemsModule && itemsModule.workbookItems) {
      workbookItems.value = itemsModule.workbookItems
      
      // Find current item index
      const index = workbookItems.value.findIndex(item => item.slug === currentSlug.value)
      if (index !== -1) {
        currentIndex.value = index
      }
    }
  } catch (error) {
    console.error('Error loading workbook items:', error)
  }
})
</script>

<style scoped>
.workbook-item-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.navigation {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.nav-links {
  display: flex;
  justify-content: space-between;
}

.prev-link,
.next-link {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  color: var(--vp-c-brand);
  transition: background-color 0.2s;
}

.prev-link:hover,
.next-link:hover {
  background-color: var(--vp-c-brand-soft);
}

.next-link {
  margin-left: auto;
}
</style>
<template>
  <div class="folio-layout">
    <div class="media-container" v-if="currentMedia">
      <!-- Display the media asset -->
      <img
        :src="currentMedia.frontmatter.media"
        :alt="currentMedia.frontmatter.title || 'Media'"
        class="media-image"
      />
    </div>
    <div class="caption" v-if="currentMedia">
      <h2>{{ currentMedia.frontmatter.title }}</h2>
      <p>{{ currentMedia.frontmatter.caption }}</p>
    </div>
    <div class="navigation" v-if="mediaItems.length > 1">
      <!-- Navigation: "Next" appears on the left and "Prev" on the right -->
      <a
        v-if="hasNext"
        :href="currentPath + '?page=' + nextPage"
        class="nav-button next-button"
      >
        Next &raquo;
      </a>
      <a
        v-if="hasPrev"
        :href="currentPath + '?page=' + prevPage"
        class="nav-button prev-button"
      >
        &laquo; Prev
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Reactive array to hold the loaded media items.
const mediaItems = ref([])

// Asynchronously load all Markdown files in the workbook folder (excluding index.md)
onMounted(async () => {
  // Use import.meta.glob to get a mapping of file paths to dynamic import functions.
  const mediaPages = import.meta.glob('../../workbook/!(*index).md')
  console.log('mediaPages keys:', Object.keys(mediaPages))
  
  const items = []
  for (const filePath in mediaPages) {
    const mod = await mediaPages[filePath]()
    const data = mod.data || {}
    // Convert the file path to a route path.
    const routePath = filePath
      .replace(/^(\.\.\/)+/, '/') // Remove leading "../" segments and prefix with "/"
      .replace(/\.md$/, '')       // Remove the ".md" extension
    items.push({
      route: routePath,
      frontmatter: data
    })
  }
  
  // Optionally, sort the items (here, alphabetically by route)
  items.sort((a, b) => a.route.localeCompare(b.route))
  mediaItems.value = items
})

// Compute the current path from window.location.pathname.
const currentPath = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.pathname
  }
  return ''
})

// Compute the current media index from the URL query parameter (e.g. ?page=0).
const currentIndex = computed(() => {
  let pageParam = ''
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    pageParam = params.get('page') || ''
  }
  const idx = parseInt(pageParam)
  if (isNaN(idx) || idx < 0 || idx >= mediaItems.value.length) {
    return 0
  }
  return idx
})

const currentMedia = computed(() => mediaItems.value[currentIndex.value])
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < mediaItems.value.length - 1)
const prevPage = computed(() => currentIndex.value - 1)
const nextPage = computed(() => currentIndex.value + 1)
</script>

<style scoped>
.folio-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.media-container {
  max-width: 90%;
  margin-bottom: var(--space-4);
}

.media-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.caption {
  margin-bottom: var(--space-8);
}

.navigation {
  display: flex;
  /* Using row-reverse so that "Next" appears on the left and "Prev" on the right */
  flex-direction: row-reverse;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
}

.nav-button {
  padding: var(--space-2) var(--space-4);
  background-color: var(--vp-c-brand);
  color: #fff;
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: var(--transition-base);
}

.nav-button:hover {
  background-color: var(--vp-c-brand-dark);
}
</style>
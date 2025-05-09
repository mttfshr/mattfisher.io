<!-- docs/.vitepress/theme/MicroblogLayout.vue -->
<template>
  <div class="microblog-layout">
    <!-- Debug message -->
    <p style="background: #fdd; padding: 0.5rem;">DEBUG: MicroblogLayout is active</p>
    <h1>{{ pageTitle }}</h1>
    <div class="posts-grid">
      <article v-for="item in logItems" :key="item.route" class="post-card">
        <!-- Render the entire page body markdown -->
        <component :is="item.component" />
        <footer class="post-metadata">
          <small>Last Updated: {{ formatDate(item.frontmatter.lastUpdated) }}</small>
        </footer>
      </article>
    </div>
    <slot />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
const pageTitle = computed(() => frontmatter.value.title || 'Microblog')

// Reactive array to hold the loaded log items
const logItems = ref([])

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Asynchronously load all Markdown files under docs/log/ (excluding the main index)
async function loadLogPages() {
  const logPages = import.meta.glob('../../log/**/*.md')
  const items = []

  for (const filePath in logPages) {
    // Skip the main log index page
    if (filePath.includes('index.md')) continue

    // Dynamically import the markdown file
    const mod = await logPages[filePath]()
    const data = mod.__pageData || {}

    // Convert the file path into a route path (if needed)
    const routePath = filePath
      .replace(/^(\.\.\/)+/, '/') // Remove leading ../ segments and add /
      .replace(/\.md$/, '')       // Remove .md extension

    // Save both the frontmatter and the component (the page body)
    items.push({
      route: routePath,
      frontmatter: data,
      component: shallowRef(mod.default)
    })
  }

  // Optionally, sort items (for example, by date descending)
  items.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date || 0)
    const dateB = new Date(b.frontmatter.date || 0)
    return dateB - dateA
  })

  logItems.value = items
}

// Load the pages on component mount
onMounted(loadLogPages)
</script>

<style scoped>
.microblog-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.microblog-layout h1 {
  text-align: center;
  margin-bottom: 2rem;
}

/* Responsive grid for posts */
.posts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.post-card {
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-5px);
}
</style>
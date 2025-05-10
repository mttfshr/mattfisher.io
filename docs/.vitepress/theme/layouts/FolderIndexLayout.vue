<template>
  <div class="folder-index-layout">
    <h1>{{ pageTitle }}</h1>
    <p>This page lists the pages in this folder:</p>
    <ul>
      <li v-for="item in folderItems" :key="item.path">
        <a :href="item.path">{{ item.title }}</a>
      </li>
    </ul>
    <!-- Optionally render additional content from the index.md -->
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

// Get frontmatter
const { frontmatter } = useData()

// Use window.location.pathname as a fallback for the current route path.
// Note: This assumes you're running in a browser.
const currentFolder = computed(() => {
  let path = ''
  if (typeof window !== 'undefined') {
    path = window.location.pathname
  }
  // Treat paths ending in '/' (but not the root '/') as folder index pages.
  return path !== '/' && path.endsWith('/') ? path : null
})

// Glob-import all markdown pages in your docs folder.
const allPages = import.meta.globEager('../../**/*.md')

// Helper function to convert a file path to a route path.
function filePathToRoute(filePath) {
  return (
    '/' +
    filePath
      .replace(/^(\.\.\/)+/, '') // Remove the leading relative parts
      .replace(/\.md$/, '')       // Remove the .md extension
  )
}

// Filter pages to list only immediate children of the current folder.
const folderItems = computed(() => {
  if (!currentFolder.value) return []
  const folderRoute = currentFolder.value
  const items = []

  for (const filePath in allPages) {
    const pageRoute = filePathToRoute(filePath)
    // Check if the page is in the current folder.
    if (pageRoute.startsWith(folderRoute)) {
      const remainder = pageRoute.slice(folderRoute.length)
      // Skip the index page itself and any nested pages.
      if (!remainder || remainder.includes('/')) continue

      const data = allPages[filePath].data || {}
      items.push({
        path: pageRoute,
        title: data.title || (remainder.charAt(0).toUpperCase() + remainder.slice(1)),
      })
    }
  }
  return items
})

// Compute a page title from frontmatter or use a default.
const pageTitle = computed(() => frontmatter.value.title || 'Folder Index')
</script>

<style scoped>
.folder-index-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.folder-index-layout h1 {
  margin-bottom: 0.5rem;
}
.folder-index-layout ul {
  list-style: none;
  padding: 0;
}
.folder-index-layout li {
  margin: 0.5rem 0;
}
.folder-index-layout a {
  color: #42b983;
  text-decoration: none;
}
.folder-index-layout a:hover {
  text-decoration: underline;
}
</style>
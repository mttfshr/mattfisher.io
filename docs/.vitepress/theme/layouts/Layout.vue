<template>
  <component :is="layoutComponent">
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import MicroblogLayout from './MicroblogLayout.vue'
import FolderIndexLayout from './FolderIndexLayout.vue'
import WorkbookFolioLayout from './WorkbookFolioLayout.vue'
import WorkbookItemLayout from './WorkbookItemLayout.vue'
import NoteLayout from './NoteLayout.vue'
import PinsLayout from './PinsLayout.vue'

// Get frontmatter from the current page
const { frontmatter } = useData()

// Choose the layout based on the frontmatter layout key
const layoutComponent = computed(() => {
  // Check frontmatter layout first
  if (frontmatter.value.layout) {
    switch (frontmatter.value.layout) {
      case 'microblog':
        return MicroblogLayout
      case 'folderIndex':
        return FolderIndexLayout
      case 'workbookFolio':
        return WorkbookFolioLayout
      case 'workbookItem':
        return WorkbookItemLayout
      case 'note':
        return NoteLayout
    }
  }
  
  // Check path-based layouts if no frontmatter layout specified
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/pins/')) {
    return PinsLayout;
  }
  
  // Fallback to the default layout
  return DefaultTheme.Layout
})

// Optional: For debugging, you can log the frontmatter
console.log('Current page frontmatter:', frontmatter.value)
</script>
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

// Get frontmatter from the current page
const { frontmatter } = useData()

// Choose the layout based on the frontmatter layout key
const layoutComponent = computed(() => {
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
    default:
      // Fallback to the default layout if no custom layout is specified
      return DefaultTheme.Layout
  }
})

// Optional: For debugging, you can log the frontmatter
console.log('Current page frontmatter:', frontmatter.value)
</script>
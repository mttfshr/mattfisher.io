<!-- docs/.vitepress/theme/layouts/Layout.vue -->
<script setup>
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

// Our main Layout component doesn't directly handle workbook items
// They are handled by WorkbookItemLayout which is registered in theme/index.mts
</script>

<template>
  <!-- Just use the default layout without special handling -->
  <Layout>
    <template #doc-after>
      <!-- This is where we can put extra content below the main content -->
      <!-- Nothing here by default -->
    </template>
  </Layout>
</template>


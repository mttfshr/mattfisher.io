<!-- docs/.vitepress/theme/layouts/WorkbookItemLayout.vue -->
<script setup>
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import WorkbookViewer from '../components/workbook/WorkbookViewer.vue'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()

console.log('WorkbookItemLayout rendering with page:', page.value.relativePath);
console.log('Frontmatter:', frontmatter.value);
</script>

<template>
  <Layout>
    <template #doc-before>
      <WorkbookViewer />
    </template>
    <template #doc-after>
      <!-- Nothing here by default -->
    </template>
  </Layout>
</template>




<!-- docs/.vitepress/theme/layouts/Layout.vue -->
<script setup>
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <template #doc-after>
      <!-- This is where we can put extra content below the main content -->
      <!-- Nothing here by default -->
    </template>
  </Layout>
</template>

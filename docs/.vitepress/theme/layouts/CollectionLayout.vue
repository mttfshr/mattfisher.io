<template>
  <Layout>
    <template #doc-before>
      <div class="collection-layout-wrapper">
        <CollectionLayout />
      </div>
    </template>
  </Layout>
</template>

<script setup>
import { Layout } from 'vitepress/theme'
import CollectionLayout from '../components/collections/CollectionLayout.vue'
</script>

<style scoped>
.collection-layout-wrapper {
  padding: 20px 0;
  max-width: 1200px;
  margin: 0 auto;
}
</style>

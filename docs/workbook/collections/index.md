---
title: Workbook Collections
description: Curated groups of related works
sidebar: false
---

<script setup>
import { ref, computed } from 'vue';
import { useData } from 'vitepress';
import CollectionsGallery from '../../.vitepress/theme/components/collections/CollectionsGallery.vue';
import TagVisualization from '../../.vitepress/theme/components/collections/TagVisualization.vue';
import TagFilter from '../../.vitepress/theme/components/collections/TagFilter.vue';

// Get data from themeConfig
const { theme } = useData();
const collections = computed(() => theme.value.collections || []);
const workbookItems = computed(() => theme.value.workbookItems || []);

// Filtered items state
const filteredItems = ref([]);
</script>

<div class="collections-page">
  <div class="breadcrumbs">
    <a href="/workbook/">Workbook</a> &rsaquo; 
    <span class="current">Collections</span>
  </div>

  # Workbook Collections

  <div class="collections-intro">
    Tag-based collections of related things. 
  </div>

  ## Browse Collections

  <CollectionsGallery :collections="collections" />

  ## Explore Tags

  <TagVisualization :items="workbookItems" />
</div>

<style scoped>
.collections-page {
  max-width: 100%;
  width: 100%;
}

:deep(.VPContent) {
  width: 100%;
  max-width: 100%;
}

:deep(.VPDoc.has-aside .content-container) {
  max-width: 100%;
}

:deep(.VPDoc) {
  padding: 0 24px;
}

:deep(.VPDoc .container) {
  max-width: 100%;
}

.collections-intro {
  margin: 1.5rem 0 2.5rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}

.breadcrumbs {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.breadcrumbs a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumbs a:hover {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

.breadcrumbs .current {
  font-weight: 500;
  color: var(--vp-c-text-1);
}
</style>

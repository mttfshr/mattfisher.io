---
title: Workbook
description: Visual experiments and media collection
sidebar: false
---

<script setup>
import { ref, onMounted } from 'vue';
import WorkbookGallery from '../.vitepress/theme/components/workbook/WorkbookGallery.vue';

// Initialize with empty array
const workbookItems = ref([]);

// Use onMounted to import the data client-side to avoid server-side issues
onMounted(async () => {
  try {
    // Dynamic import with fallback to empty array if file doesn't exist
    const itemsModule = await import('../.vitepress/theme/data/workbookItems.js');
    workbookItems.value = itemsModule.workbookItems || [];
  } catch (error) {
    console.error('Error loading workbook items:', error);
    // Keep using empty array if import fails
  }
});
</script>

# Workbook

<div class="workbook-intro">
</div>

<WorkbookGallery :items="workbookItems" />

<style scoped>
.workbook-intro {
  margin: 1.5rem 0 3rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}
</style>
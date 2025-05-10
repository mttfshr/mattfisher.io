---
title: Notes
description: Evolving ideas
sidebar: false
---

<script setup>
import { ref, onMounted } from 'vue';
import NotesGrid from '../.vitepress/theme/components/notes/NotesGrid.vue';

// Initialize with empty array
const notesData = ref([]);

// Use onMounted to import the data client-side to avoid server-side issues
onMounted(async () => {
  try {
    // Dynamic import with fallback to empty array if file doesn't exist
    const dataModule = await import('../.vitepress/theme/data/notesData.js');
    notesData.value = dataModule.notesData || [];
  } catch (error) {
    console.error('Error loading notes data:', error);
    // Keep using empty array if import fails
  }
});
</script>

# Notes

<div class="notes-intro">
</div>

<NotesGrid :notes="notesData" />

<style scoped>
.notes-intro {
  margin: 1.5rem 0 3rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}
</style>
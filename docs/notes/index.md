---
title: Notes
description: Evolving ideas
sidebar: false
---

<script setup>
import { computed } from 'vue';
import NotesIndex from '../.vitepress/theme/components/notes/NotesIndex.vue';
import { useData } from 'vitepress';

// Get the notes data from theme config
const { theme } = useData();
const notesData = computed(() => theme.value.notes || []);
</script>

# Notes

<div class="notes-intro">
</div>

<NotesIndex :notes="notesData" />

<style scoped>
.notes-intro {
  margin: 1.5rem 0 3rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}
</style>
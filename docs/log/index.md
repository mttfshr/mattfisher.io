---
title: Log
description: Updates and bookmarks
sidebar: false
---

<script setup>
import { ref, onMounted } from 'vue'

// Initialize with empty array
const logEntries = ref([])

// Use onMounted to import the data client-side to avoid server-side issues
onMounted(async () => {
  try {
    // Dynamic import with fallback to empty array if file doesn't exist
    const entriesModule = await import('../.vitepress/data/logEntries.js')
    logEntries.value = entriesModule.logEntries || []
  } catch (error) {
    console.error('Error loading log entries:', error)
    // Keep using empty array if import fails
  }
})
</script>

# Log

<div class="log-intro">

</div>

<LogFeed :entries="logEntries" />

<style scoped>
.log-intro {
  margin: 1.5rem 0 3rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}
</style>
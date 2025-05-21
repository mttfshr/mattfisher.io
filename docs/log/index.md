---
title: Log
description: Updates and bookmarks
sidebar: false
---

<script setup>
import { computed } from 'vue'
import LogFeed from '../.vitepress/theme/components/log/LogFeed.vue'
import { useData } from 'vitepress'

// Get the log entries data from theme config
const { theme } = useData();
const logEntries = computed(() => theme.value.logEntries || [])

// Calculate number of entries by type
const totalEntries = computed(() => logEntries.value.length);
const sessionEntries = computed(() => logEntries.value.filter(entry => entry.isClaudeSession));
const regularEntries = computed(() => logEntries.value.filter(entry => !entry.isClaudeSession));
</script>

# Log

<div class="log-intro">
  <p>This log includes personal updates and development session notes.</p>
  <div class="log-stats">
    <div class="stat-item">
      <span class="stat-value">{{ totalEntries }}</span>
      <span class="stat-label">Total Entries</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{{ regularEntries.length }}</span>
      <span class="stat-label">Updates</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{{ sessionEntries.length }}</span>
      <span class="stat-label">Development Sessions</span>
    </div>
  </div>
</div>

<LogFeed :entries="logEntries" />

<style scoped>
.log-intro {
  margin: 1.5rem 0 3rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 800px;
}

.log-stats {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
  min-width: 120px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: var(--vp-c-brand);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .log-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem 1rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stat-label {
    margin-top: 0;
    margin-left: 1rem;
  }
}
</style>
---
title: Log
description: Updates and bookmarks
sidebar: false
---

<script setup>
import { computed } from 'vue'
import LogFeed from '../.vitepress/theme/components/log/LogFeed.vue'
import { useData } from 'vitepress'

// Get the log entries and sessions data from theme config
const { theme } = useData();
const logEntries = computed(() => theme.value.logEntries || [])
const sessions = computed(() => {
  console.log('Sessions loaded:', theme.value.sessions?.length || 0)
  if (theme.value.sessions?.length > 0) {
    console.log('First session:', theme.value.sessions[0])
  }
  return theme.value.sessions || []
})

// Combine and sort all log content
const allLogContent = computed(() => {
  console.log('Building allLogContent with:', {
    logEntries: logEntries.value.length,
    sessions: sessions.value.length
  })
  
  const entries = logEntries.value.map(entry => ({
    ...entry,
    type: 'entry',
    sortDate: new Date(entry.timestamp || entry.date)
  }));
  
  const sessionItems = sessions.value.map(session => {
    console.log('Processing session:', session.session, 'date:', session.date)
    return {
      ...session,
      type: 'session',
      // Keep the natural date field, don't force timestamp
      sortDate: new Date(session.date),
      isClaudeSession: true,
      id: `session-${session.session}`,
      title: `Session ${session.session} Summary`
    }
  });
  
  const combined = [...entries, ...sessionItems]
    .sort((a, b) => b.sortDate - a.sortDate); // Newest first
    
  console.log('Combined entries:', combined.length)
  return combined
});

// Calculate number of entries by type
const totalEntries = computed(() => allLogContent.value.length);
const sessionEntries = computed(() => allLogContent.value.filter(entry => entry.type === 'session'));
const regularEntries = computed(() => allLogContent.value.filter(entry => entry.type === 'entry'));
</script>

# Log

<LogFeed :entries="allLogContent" />

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
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
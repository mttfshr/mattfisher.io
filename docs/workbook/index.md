---
title: Workbook
description: Visual experiments and media collection
sidebar: false
---

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';
import WorkbookGallery from '../.vitepress/theme/components/workbook/WorkbookGallery.vue';

// Get workbook items from themeConfig
const { theme } = useData();
const workbookItems = computed(() => theme.value.workbookItems || []);
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
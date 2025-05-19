---
title: Collections
description: Redirecting to the new collections page
sidebar: false
---

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vitepress';

const router = useRouter();

onMounted(() => {
  // Wait a moment before redirecting to ensure the page has loaded
  setTimeout(() => {
    // Get the current path
    const currentPath = window.location.pathname;
    
    // If we're on the main collections page, redirect to workbook collections
    if (currentPath.endsWith('/collections/') || currentPath.endsWith('/collections')) {
      router.go('/workbook/collections/');
    } else {
      // We're on a specific collection page - extract the slug from the path
      const slug = currentPath.split('/').pop().replace('.html', '');
      
      // Redirect to the new location
      if (slug) {
        router.go(`/workbook/collections/${slug}`);
      } else {
        // Fallback to main collections page
        router.go('/workbook/collections/');
      }
    }
  }, 100);
});
</script>

# Redirecting...

<div class="redirect-message">
  The collections have moved to the Workbook section. You'll be redirected automatically in a moment.
  
  If you're not redirected, please [click here](/workbook/collections/) to go to the new collections page.
</div>

<style scoped>
.redirect-message {
  padding: 2rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  margin: 2rem 0;
  text-align: center;
}
</style>

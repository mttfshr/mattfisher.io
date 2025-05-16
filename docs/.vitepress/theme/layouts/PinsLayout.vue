<!-- .vitepress/theme/layouts/PinsLayout.vue -->
<template>
  <div class="pins-page-container">
    <div class="pins-layout-notice">
      <p v-if="debug">Using PinsLayout component. Path: {{ route.path }}</p>
    </div>
    <Content />
  </div>
</template>

<script setup>
import { ref, computed, provide, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useData } from 'vitepress';

const route = useRoute();
const { frontmatter } = useData();
const debug = ref(false);

// Signal to child components we're using PinsLayout
provide('inPinsLayout', true);

// Add a class to the body element when on pins pages
onMounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.add('pins-page');
  }
});

// Remove the class when component is unmounted
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('pins-page');
  }
});
</script>

<style>
.pins-page-container {
  max-width: 100% !important;
  width: 100% !important;
  padding: 0 !important;
}

/* Force full-width layout */
.pins-page .VPDoc .container,
.pins-page .VPDoc .content-container,
.pins-page .VPDoc .content,
.pins-page .VPDoc .main {
  max-width: 100% !important;
  width: 100% !important;
  margin: 0 auto !important;
}

/* Hide sidebar and aside */
.pins-page .VPDoc .aside,
.pins-page .VPDoc .VPDocAside {
  display: none !important;
  width: 0 !important;
}

/* Fix the container layout */
.pins-page .VPDoc .container,
.pins-page .VPDoc .content-container {
  display: block !important;
  grid-template-columns: 1fr !important;
}

/* Debug styling */
.pins-layout-notice p {
  background-color: #ffeeee;
  color: #990000;
  padding: 0.5rem;
  margin: 0 0 1rem;
  display: none;
}
</style>
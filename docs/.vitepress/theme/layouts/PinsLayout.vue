<!-- .vitepress/theme/layouts/PinsLayout.vue -->
<template>
  <Layout>
    <template #aside>
      <!-- Override the sidebar to be empty -->
    </template>
    
    <template #doc-before>
      <div class="pins-layout-notice" v-if="hasCustomLayout">
        <!-- This div will help ensure our custom styles are applied -->
      </div>
    </template>
  </Layout>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

const { Layout } = DefaultTheme;
const route = useRoute();

// Check if we're on a pins page
const hasCustomLayout = computed(() => {
  return route.path.startsWith('/pins/');
});

// Add a class to the body element when on pins pages
onMounted(() => {
  if (hasCustomLayout.value && typeof document !== 'undefined') {
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
/* Use !important to force override any default styles */
/* Target the main container elements */
.pins-layout-notice ~ .VPDoc .container,
.pins-layout-notice ~ .VPDoc .container .content-container,
.pins-layout-notice ~ .VPDoc .container .content,
.pins-layout-notice ~ .VPDoc .main {
  max-width: 100% !important;
  width: 100% !important;
  padding-left: 32px !important;
  padding-right: 32px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

/* Explicitly remove sidebar and aside */
.pins-layout-notice ~ .VPDoc .aside,
.pins-layout-notice ~ .VPDoc .VPDocAside {
  display: none !important;
  width: 0 !important;
}

/* Remove any grid column settings */
.pins-layout-notice ~ .VPDoc .container,
.pins-layout-notice ~ .VPDoc .content-container {
  display: block !important;
  grid-template-columns: 1fr !important;
}

/* Adjust the main content area */
.pins-layout-notice ~ .VPDoc .VPContent {
  padding-top: 16px !important; 
}

/* Make sure all pin components take full width */
.pins-layout-notice ~ .VPDoc .pins-container,
.pins-layout-notice ~ .VPDoc .pin-collections,
.pins-layout-notice ~ .VPDoc .pin-grid {
  width: 100% !important;
  max-width: 100% !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* Larger screens - even more aggressive */
@media (min-width: 1280px) {
  .pins-layout-notice ~ .VPDoc .container,
  .pins-layout-notice ~ .VPDoc .container .content-container,
  .pins-layout-notice ~ .VPDoc .container .content {
    max-width: 100% !important;
    padding-left: 48px !important;
    padding-right: 48px !important;
  }
}
</style>

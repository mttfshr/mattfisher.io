<!-- docs/.vitepress/theme/layouts/DebugLayout.vue -->
<template>
  <div class="debug-layout">
    <h1>Debug Layout Working!</h1>
    <div class="content">
      <Content />
    </div>
  </div>
</template>

<style scoped>
.debug-layout {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f0f0f0;
  min-height: 100vh;
}

/* Use a more specific selector to avoid conflicts */
.debug-layout .content {
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
}
</style>

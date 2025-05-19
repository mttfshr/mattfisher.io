<!-- docs/.vitepress/theme/components/workbook/WorkbookLayout.vue -->
<template>
  <div class="workbook-layout">
    <slot />
  </div>
</template>

<style scoped>
.workbook-layout {
  width: 100%;
  max-width: 100%;
}

:deep(.VPContent) {
  width: 100%;
  max-width: 100%;
}

:deep(.VPDoc.has-aside .content-container) {
  max-width: 100%;
}

:deep(.VPDoc) {
  padding: 0 24px;
}

:deep(.VPDoc .container) {
  max-width: 100%;
}
</style>

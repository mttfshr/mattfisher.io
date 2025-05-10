<!-- docs/.vitepress/theme/components/workbook/WorkbookPagination.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps({
  currentSlug: {
    type: String,
    required: true
  }
});

// Initialize with empty array
const workbookItems = ref([]);

// Load the data client-side to avoid SSR issues
onMounted(async () => {
  try {
    const itemsModule = await import('../../data/workbookItems.js');
    workbookItems.value = itemsModule.workbookItems || [];
  } catch (error) {
    console.error('Error loading workbook items for pagination:', error);
  }
});

// Find index of current item
const currentIndex = computed(() => {
  if (!workbookItems.value.length) return -1;
  return workbookItems.value.findIndex(item => item.slug === props.currentSlug);
});

// Get previous item
const prevItem = computed(() => {
  if (currentIndex.value <= 0) return null;
  return workbookItems.value[currentIndex.value - 1];
});

// Get next item
const nextItem = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= workbookItems.value.length - 1) return null;
  return workbookItems.value[currentIndex.value + 1];
});
</script>

<template>
  <div class="workbook-pagination">
    <div class="prev-next-links">
      <div v-if="prevItem" class="prev-link">
        <a :href="`/workbook/${prevItem.slug}.html`">
          ← {{ prevItem.title }}
        </a>
      </div>
      <div class="spacer"></div>
      <div v-if="nextItem" class="next-link">
        <a :href="`/workbook/${nextItem.slug}.html`">
          {{ nextItem.title }} →
        </a>
      </div>
    </div>
    
    <div class="all-link">
      <a href="/workbook/">View All Projects</a>
    </div>
  </div>
</template>

<style scoped>
.workbook-pagination {
  margin-top: 3rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 1.5rem;
}

.prev-next-links {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.prev-link, .next-link {
  max-width: 45%;
}

.prev-link a, .next-link a {
  text-decoration: none;
  color: var(--vp-c-brand);
  font-weight: 500;
  display: inline-block;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

.prev-link a:hover, .next-link a:hover {
  color: var(--vp-c-brand-dark);
}

.spacer {
  flex-grow: 1;
}

.all-link {
  text-align: center;
  margin-top: 1rem;
}

.all-link a {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 4px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.all-link a:hover {
  background-color: var(--vp-c-bg-mute);
}
</style>
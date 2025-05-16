<!-- docs/.vitepress/theme/components/pins/PinsPagination.vue -->
<template>
  <div class="pagination-controls" v-if="totalPages > 1">
    <button 
      @click="goToPage(1)" 
      class="pagination-button first-page"
      :class="{ disabled: currentPage === 1 }"
      :disabled="currentPage === 1"
      title="First page"
    >
      «
    </button>
    
    <button 
      @click="prevPage" 
      class="pagination-button prev-page"
      :class="{ disabled: currentPage === 1 }"
      :disabled="currentPage === 1"
      title="Previous page"
    >
      ‹
    </button>
    
    <div class="page-numbers">
      <button 
        v-for="page in displayedPageNumbers" 
        :key="page"
        @click="page !== '...' && goToPage(page)"
        :class="[
          'page-number', 
          { active: page === currentPage, ellipsis: page === '...', disabled: page === '...' }
        ]"
        :disabled="page === '...'"
      >
        {{ page }}
      </button>
    </div>
    
    <button 
      @click="nextPage" 
      class="pagination-button next-page"
      :class="{ disabled: currentPage === totalPages }"
      :disabled="currentPage === totalPages"
      title="Next page"
    >
      ›
    </button>
    
    <button 
      @click="goToPage(totalPages)" 
      class="pagination-button last-page"
      :class="{ disabled: currentPage === totalPages }"
      :disabled="currentPage === totalPages"
      title="Last page"
    >
      »
    </button>
    
    <div class="page-size-selector">
      <label for="page-size">Per page:</label>
      <select 
        id="page-size" 
        v-model="selectedPageSize" 
        @change="updatePageSize"
        class="page-size-select"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 20
  },
  pageSizeOptions: {
    type: Array,
    default: () => [20, 40, 60, 100]
  }
});

const emit = defineEmits(['update:currentPage', 'update:pageSize']);

// Local state
const selectedPageSize = ref(props.pageSize);

// Calculate which page numbers to show
const displayedPageNumbers = computed(() => {
  const pages = [];
  const maxDisplayedPages = 7;
  
  if (props.totalPages <= maxDisplayedPages) {
    // Show all pages if there are few enough
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let startPage = Math.max(2, props.currentPage - 2);
    let endPage = Math.min(props.totalPages - 1, props.currentPage + 2);
    
    // Add ellipsis if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed
    if (endPage < props.totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page
    pages.push(props.totalPages);
  }
  
  return pages;
});

// Navigation methods
const prevPage = () => {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1);
  }
};

const nextPage = () => {
  if (props.currentPage < props.totalPages) {
    emit('update:currentPage', props.currentPage + 1);
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page);
  }
};

const updatePageSize = () => {
  emit('update:pageSize', selectedPageSize.value);
};

// Update local state when props change
watch(() => props.pageSize, (newSize) => {
  selectedPageSize.value = newSize;
});
</script>

<style scoped>
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pagination-button {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--vp-c-bg-alt);
}

.pagination-button:disabled,
.pagination-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  min-width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.page-number:hover:not(.active):not(.ellipsis):not(:disabled) {
  background-color: var(--vp-c-bg-alt);
}

.page-number.active {
  background-color: var(--vp-c-brand);
  color: var(--vp-c-brand-contrast);
  border-color: var(--vp-c-brand);
  font-weight: 500;
}

.page-number.ellipsis {
  cursor: default;
  background-color: transparent;
  border-color: transparent;
}

.page-size-selector {
  display: flex;
  align-items: center;
  margin-left: 1rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.page-size-selector label {
  margin-right: 0.4rem;
}

.page-size-select {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .pagination-controls {
    gap: 0.25rem;
  }
  
  .first-page, .last-page {
    display: none;
  }
  
  .page-size-selector {
    margin-left: 0.5rem;
  }
}
</style>

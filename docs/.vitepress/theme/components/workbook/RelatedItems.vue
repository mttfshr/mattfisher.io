<!-- docs/.vitepress/theme/components/workbook/RelatedItems.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { getVideoThumbnail } from '../../utils/mediaUtils';

const props = defineProps({
  currentSlug: {
    type: String,
    required: true
  },
  currentTags: {
    type: Array,
    default: () => []
  }
});

// Initialize with empty array until we load the items
const workbookItems = ref([]);

// Load the data client-side to avoid SSR issues
onMounted(async () => {
  try {
    const itemsModule = await import('../../data/workbookItems.js');
    workbookItems.value = itemsModule.workbookItems || [];
  } catch (error) {
    console.error('Error loading workbook items for related items:', error);
  }
});

// Find related items (sharing tags, excluding current)
const relatedItems = computed(() => {
  if (!workbookItems.value.length || !props.currentTags.length) return [];
  
  // Filter and score items
  const scoredItems = workbookItems.value
    // Exclude the current item
    .filter(item => item.slug !== props.currentSlug)
    // Calculate a relevance score based on tag matches
    .map(item => {
      // Count matching tags
      const matchingTags = (item.tags || [])
        .filter(tag => props.currentTags.includes(tag));
      
      return {
        ...item,
        matchScore: matchingTags.length
      };
    })
    // Only keep items with at least one matching tag
    .filter(item => item.matchScore > 0)
    // Sort by score (highest first)
    .sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top 3 related items
  return scoredItems.slice(0, 3);
});

// Get a thumbnail URL for an item
function getThumbnail(item) {
  // If it's a video, try to get a thumbnail
  if (item.media?.type === 'video') {
    const thumbnail = getVideoThumbnail(item.media);
    if (thumbnail) return thumbnail;
  }
  
  // If it's an image, use the URL
  if (item.media?.type === 'image' && item.media?.url) {
    return item.media.url;
  }
  
  // Fallback to a placeholder
  return '/_media/placeholder.jpg';
}
</script>

<template>
  <div v-if="relatedItems.length" class="related-items">
    <h3>Related Projects</h3>
    
    <div class="related-grid">
      <a 
        v-for="item in relatedItems" 
        :key="item.slug"
        :href="`/workbook/${item.slug}.html`"
        class="related-item"
      >
        <div class="related-thumbnail">
          <img :src="getThumbnail(item)" :alt="item.title">
        </div>
        <div class="related-details">
          <h4>{{ item.title }}</h4>
          <div v-if="item.description" class="related-description">
            {{ item.description }}
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.related-items {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.related-items h3 {
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.related-item {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.related-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
}

.related-thumbnail {
  height: 150px;
  overflow: hidden;
}

.related-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-details {
  padding: 0.8rem;
}

.related-details h4 {
  margin: 0 0 0.3rem;
  font-size: 1rem;
}

.related-description {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 640px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
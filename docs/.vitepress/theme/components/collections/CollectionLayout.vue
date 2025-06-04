<template>
  <div class="container-responsive">
    <div class="nav-breadcrumb">
      <a href="/workbook/">Workbook</a> › 
      <a href="/workbook/collections/">Collections</a> › 
      <span class="current">{{ collection?.title || slug }}</span>
    </div>
    
    <div v-if="collection" class="collection-header">
      <div class="collection-info">
        <h1 class="text-4xl font-bold text-primary mb-4">{{ collection.title }}</h1>
        <p class="text-lg text-secondary leading-relaxed mb-6">{{ collection.description }}</p>
        
        <div v-if="collection.tagQuery" class="tag-query card card-body">
          <div v-if="collection.tagQuery.includes?.length" class="includes mb-4">
            <span class="label text-sm font-medium text-tertiary mb-2 block">Includes tags:</span>
            <div class="stack-horizontal spacing-tight">
              <span v-for="tag in collection.tagQuery.includes" :key="tag" class="badge badge-primary">
                {{ tag }}
              </span>
            </div>
          </div>
          
          <div v-if="collection.tagQuery.excludes?.length" class="excludes">
            <span class="label text-sm font-medium text-tertiary mb-2 block">Excludes tags:</span>
            <div class="stack-horizontal spacing-tight">
              <span v-for="tag in collection.tagQuery.excludes" :key="tag" class="badge">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
        
        <p v-if="itemCount > 0" class="text-sm text-tertiary mt-4">
          {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}
        </p>
      </div>
      <div v-if="collection.image" class="collection-image media-container-wide">
        <img :src="collection.image" :alt="collection.title" />
      </div>
    </div>
    
    <div class="collection-content card card-body" v-if="collection?.content">
      <div class="content" v-html="collection.content"></div>
    </div>
    
    <!-- Display grouped items if available -->
    <div v-if="collection?.groupedItems" class="grouped-items">
      <div 
        v-for="(items, groupName) in collection.groupedItems" 
        :key="groupName"
        class="group"
      >
        <h2 class="text-2xl font-medium text-primary mb-6 pb-2 border-b border-secondary">{{ formatGroupName(groupName) }}</h2>
        <WorkbookGallery :items="items" />
      </div>
    </div>
    
    <!-- Display non-grouped items -->
    <div v-else-if="collection?.items?.length" class="collection-items">
      <WorkbookGallery :items="collection.items" />
    </div>
    
    <div v-if="itemCount === 0" class="card empty-state text-center p-12 text-tertiary">
      No items match the collection criteria.
    </div>
    
    <div v-if="relatedCollections.length" class="related-collections">
      <h2 class="text-2xl font-medium text-primary mb-6">Related Collections</h2>
      <div class="gallery-grid-large">
        <div 
          v-for="related in relatedCollections" 
          :key="related.slug" 
          class="card card-interactive"
        >
          <a :href="related.path" class="collection-link">
            <div 
              class="media-container-wide" 
              :style="related.image ? { backgroundImage: `url(${related.image})` } : {}"
            >
              <div class="media-overlay">
                <h3 class="text-lg font-medium text-white">{{ related.title }}</h3>
              </div>
            </div>
            <div class="card-body">
              <p class="text-sm text-secondary mb-2">{{ related.description }}</p>
              <div class="text-xs text-tertiary">
                {{ related.totalItems || 0 }} {{ related.totalItems === 1 ? 'item' : 'items' }}
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';
import WorkbookGallery from '../workbook/WorkbookGallery.vue';

const { page, theme } = useData();

// Get current collection slug
const slug = computed(() => {
  return page.value.relativePath.replace(/^workbook\/collections\/|\.md$/g, '');
});

// Find current collection by slug
const collection = computed(() => {
  return theme.value.collections?.find(c => c.slug === slug.value) || null;
});

// Count of items in this collection
const itemCount = computed(() => {
  if (collection.value?.totalItems !== undefined) {
    return collection.value.totalItems;
  }
  return collection.value?.items?.length || 0;
});

// Format group name for display
function formatGroupName(name) {
  if (!name) return 'Other';
  
  // Replace hyphens with spaces and capitalize
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Find related collections based on shared tags
const relatedCollections = computed(() => {
  if (!collection.value?.tagQuery?.includes || !theme.value.collections) {
    return [];
  }
  
  // Get all required tags in this collection
  const currentTags = collection.value.tagQuery.includes || [];
  
  // Filter to find collections that share tags with this one
  return theme.value.collections
    .filter(c => {
      // Skip the current collection
      if (c.slug === collection.value.slug) {
        return false;
      }
      
      // Skip collections without tag queries
      if (!c.tagQuery || !c.tagQuery.includes) {
        return false;
      }
      
      // Check if there are any shared tags
      return c.tagQuery.includes.some(tag => currentTags.includes(tag));
    })
    .slice(0, 3); // Limit to 3 related collections
});
</script>

<style scoped>
/* Component-specific styles only */
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

.collection-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.collection-info {
  flex: 1;
}

.collection-image {
  width: 300px;
  flex-shrink: 0;
}

.collection-content {
  margin: var(--space-8) 0;
}

.grouped-items {
  margin: var(--space-8) 0;
}

.grouped-items .group {
  margin-bottom: var(--space-12);
}

.collection-items {
  margin: var(--space-8) 0;
}

.related-collections {
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: var(--border-width) solid var(--border-secondary);
}

.collection-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

@media (max-width: 768px) {
  .collection-header {
    flex-direction: column;
  }
  
  .collection-image {
    width: 100%;
  }
}
</style>

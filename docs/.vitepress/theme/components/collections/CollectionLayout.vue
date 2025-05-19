<template>
  <div class="collection-layout">
    <div class="breadcrumbs">
      <a href="/workbook/">Workbook</a> &rsaquo; 
      <a href="/workbook/collections/">Collections</a> &rsaquo; 
      <span class="current">{{ collection?.title || slug }}</span>
    </div>
    
    <div v-if="collection" class="collection-header">
      <div class="collection-info">
        <h1>{{ collection.title }}</h1>
        <p class="description">{{ collection.description }}</p>
        
        <div v-if="collection.tagQuery" class="tag-query">
          <div v-if="collection.tagQuery.includes?.length" class="includes">
            <span class="label">Includes tags:</span>
            <div class="tags">
              <span v-for="tag in collection.tagQuery.includes" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
          
          <div v-if="collection.tagQuery.excludes?.length" class="excludes">
            <span class="label">Excludes tags:</span>
            <div class="tags">
              <span v-for="tag in collection.tagQuery.excludes" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
        
        <p v-if="itemCount > 0" class="item-count">
          {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}
        </p>
      </div>
      <div v-if="collection.image" class="collection-image">
        <img :src="collection.image" :alt="collection.title" />
      </div>
    </div>
    
    <div class="collection-content" v-if="collection?.content">
      <div class="content" v-html="collection.content"></div>
    </div>
    
    <!-- Display grouped items if available -->
    <div v-if="collection?.groupedItems" class="grouped-items">
      <div 
        v-for="(items, groupName) in collection.groupedItems" 
        :key="groupName"
        class="group"
      >
        <h2 class="group-name">{{ formatGroupName(groupName) }}</h2>
        <WorkbookGallery :items="items" />
      </div>
    </div>
    
    <!-- Display non-grouped items -->
    <div v-else-if="collection?.items?.length" class="collection-items">
      <WorkbookGallery :items="collection.items" />
    </div>
    
    <div v-if="itemCount === 0" class="empty-state">
      No items match the collection criteria.
    </div>
    
    <div v-if="relatedCollections.length" class="related-collections">
      <h2>Related Collections</h2>
      <div class="collection-grid">
        <div 
          v-for="related in relatedCollections" 
          :key="related.slug" 
          class="collection-card"
        >
          <a :href="related.path">
            <div 
              class="collection-image" 
              :style="related.image ? { backgroundImage: `url(${related.image})` } : {}"
            >
              <div class="overlay">
                <h3>{{ related.title }}</h3>
              </div>
            </div>
            <div class="collection-info">
              <p class="description">{{ related.description }}</p>
              <div class="item-count">
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
.collection-layout {
  max-width: 100%;
  width: 100%;
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

.breadcrumbs {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.breadcrumbs a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumbs a:hover {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

.breadcrumbs .current {
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.collection-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
}

.collection-info {
  flex: 1;
}

.collection-info h1 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  line-height: 1.2;
  color: var(--vp-c-text-1);
}

.collection-info .description {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.tag-query {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.tag-query .includes,
.tag-query .excludes {
  margin-bottom: 0.75rem;
}

.tag-query .label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-right: 0.5rem;
}

.tag-query .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag-query .tag {
  background-color: var(--vp-c-brand-soft);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--vp-c-brand-dark);
}

.collection-info .item-count {
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}

.collection-image {
  width: 300px;
  border-radius: 8px;
  overflow: hidden;
}

.collection-image img {
  width: 100%;
  height: auto;
  display: block;
}

.collection-content {
  margin: 2rem 0;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider-light);
}

.grouped-items {
  margin: 2rem 0;
}

.grouped-items .group {
  margin-bottom: 3rem;
}

.grouped-items .group-name {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider-light);
}

.collection-items {
  margin: 2rem 0;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--vp-c-text-3);
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.related-collections {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider-light);
}

.related-collections h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.collection-card {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.collection-card a {
  text-decoration: none;
  color: inherit;
  display: block;
}

.collection-card .collection-image {
  width: 100%;
  height: 160px;
  background-color: var(--vp-c-bg-alt);
  background-size: cover;
  background-position: center;
  position: relative;
}

.collection-card .overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 1rem;
  color: white;
}

.collection-card .collection-info {
  padding: 1rem;
}

.collection-card .description {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  margin: 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.collection-card .item-count {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.collection-card h3 {
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

@media (max-width: 768px) {
  .collection-header {
    flex-direction: column;
  }
  
  .collection-image {
    width: 100%;
  }
  
  .collection-grid {
    grid-template-columns: 1fr;
  }
}
</style>

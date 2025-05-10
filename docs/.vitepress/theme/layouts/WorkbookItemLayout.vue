<!-- docs/.vitepress/theme/layouts/WorkbookItemLayout.vue -->
<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'
import { getEmbedUrl, isEmbeddable } from '../utils/mediaUtils'
import RelatedItems from '../components/workbook/RelatedItems.vue'
import WorkbookPagination from '../components/workbook/WorkbookPagination.vue'

const { frontmatter } = useData()

// Get embed URL using the media utility
const embedUrl = computed(() => 
  getEmbedUrl(frontmatter.value.media)
)

// Check if media is embeddable
const isMediaEmbeddable = computed(() => 
  isEmbeddable(frontmatter.value.media)
)
</script>

<template>
  <div class="workbook-item">
    <!-- Media section -->
    <div v-if="frontmatter.media" class="workbook-item-media">
      <!-- Video media -->
      <div v-if="frontmatter.media.type === 'video' && isMediaEmbeddable" class="video-embed">
        <iframe
          :src="embedUrl"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      
      <!-- Image media -->
      <div v-else-if="frontmatter.media.type === 'image'" class="image-embed">
        <img :src="frontmatter.media.url" :alt="frontmatter.title" />
      </div>
      
      <!-- Link to media if not embedding -->
      <div v-else class="media-link">
        <a :href="frontmatter.media.url" target="_blank" rel="noopener noreferrer">
          View {{ frontmatter.media.type || 'media' }}
        </a>
      </div>
    </div>
    
    <!-- Content section -->
    <div class="workbook-item-content">
      <h1>{{ frontmatter.title }}</h1>
      
      <div v-if="frontmatter.description" class="description">
        {{ frontmatter.description }}
      </div>
      
      <div v-if="frontmatter.date" class="date">
        {{ new Date(frontmatter.date).toLocaleDateString() }}
      </div>
      
      <div v-if="frontmatter.tags && frontmatter.tags.length" class="tags">
        <span v-for="tag in frontmatter.tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
      
      <!-- Main content from markdown -->
      <div class="content">
        <Content />
      </div>
      
      <!-- Related items -->
      <RelatedItems 
        :current-slug="frontmatter.slug || ''" 
        :current-tags="frontmatter.tags || []"
      />
      
      <!-- Pagination -->
      <WorkbookPagination :current-slug="frontmatter.slug || ''" />
    </div>
  </div>
</template>

<style scoped>
.workbook-item {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.workbook-item-media {
  margin-bottom: 2rem;
}

.video-embed {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  max-width: 100%;
  border-radius: 4px;
}

.video-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-embed img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.workbook-item-content {
  max-width: 800px;
  margin: 0 auto;
}

.description {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
}

.date {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  margin-bottom: 1rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tag {
  background-color: var(--vp-c-bg-soft);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.content {
  margin-top: 2rem;
}
</style>
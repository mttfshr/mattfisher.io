<template>
  <div class="structured-tags">
    <div v-if="hasAnyTags" class="tag-sections">
      <!-- Type tags -->
      <div v-if="parsedTags.type.length" class="tag-section">
        <span class="section-label">Type:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.type" 
            :key="tag" 
            class="tag type-tag"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
      
      <!-- Medium tags -->
      <div v-if="parsedTags.medium.length" class="tag-section">
        <span class="section-label">Medium:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.medium" 
            :key="tag" 
            class="tag medium-tag"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
      
      <!-- Tech tags -->
      <div v-if="parsedTags.tech.length" class="tag-section">
        <span class="section-label">Technique:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.tech" 
            :key="tag" 
            class="tag tech-tag"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
      
      <!-- Tool tags -->
      <div v-if="parsedTags.tool.length" class="tag-section">
        <span class="section-label">Tools:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.tool" 
            :key="tag" 
            class="tag tool-tag"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
      
      <!-- Project tags -->
      <div v-if="parsedTags.project.length" class="tag-section">
        <span class="section-label">Project:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.project" 
            :key="tag" 
            class="tag project-tag"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
      
      <!-- Collaboration tags -->
      <div v-if="parsedTags.collab.length" class="tag-section">
        <span class="section-label">Collaboration:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.collab" 
            :key="tag" 
            class="tag collab-tag"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
      
      <!-- Status tags -->
      <div v-if="parsedTags.status.length" class="tag-section">
        <span class="section-label">Status:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.status" 
            :key="tag" 
            :class="['tag', 'status-tag', `status-${tag}`]"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
      
      <!-- Other tags -->
      <div v-if="parsedTags.other.length" class="tag-section">
        <span class="section-label">Tags:</span>
        <div class="tag-list">
          <span 
            v-for="tag in parsedTags.other" 
            :key="tag" 
            class="tag other-tag"
          >
            {{ formatTagValue(tag) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Display if no structured tags found -->
    <div v-else-if="tags && tags.length" class="legacy-tags">
      <span v-for="tag in tags" :key="tag" class="tag">
        {{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Raw tags array
  tags: {
    type: Array,
    default: () => []
  },
  // Pre-parsed structured tags
  parsedTags: {
    type: Object,
    default: null
  }
});

// Format tag value for display (replace hyphens with spaces, capitalize)
function formatTagValue(value) {
  if (!value) return '';
  
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Check if we have any parsed tags
const hasAnyTags = computed(() => {
  if (!props.parsedTags) return false;
  
  return Object.values(props.parsedTags).some(tagArray => tagArray.length > 0);
});
</script>

<style scoped>
.structured-tags {
  margin: 1rem 0;
}

.tag-sections {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tag-section {
  display: flex;
  align-items: flex-start;
}

.section-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  min-width: 90px;
  padding-top: 0.15rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.tag {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 400;
  white-space: nowrap;
}

/* Tag type styling */
.type-tag {
  background-color: rgba(var(--vp-c-brand-rgb), 0.1);
  color: var(--vp-c-brand-dark);
}

.medium-tag {
  background-color: rgba(var(--vp-c-brand-rgb), 0.15);
  color: var(--vp-c-brand-dark);
}

.tech-tag {
  background-color: rgba(125, 118, 205, 0.1);
  color: rgb(85, 78, 165);
}

.tool-tag {
  background-color: rgba(64, 158, 255, 0.1);
  color: rgb(24, 118, 215);
}

.project-tag {
  background-color: rgba(111, 70, 160, 0.1);
  color: rgb(111, 70, 160);
}

.collab-tag {
  background-color: rgba(230, 126, 34, 0.1);
  color: rgb(190, 86, 0);
}

.status-tag {
  background-color: rgba(100, 100, 100, 0.1);
  color: rgb(100, 100, 100);
}

/* Status-specific styling */
.status-completed {
  background-color: rgba(39, 174, 96, 0.1);
  color: rgb(39, 174, 96);
}

.status-in-progress {
  background-color: rgba(52, 152, 219, 0.1);
  color: rgb(52, 152, 219);
}

.status-concept {
  background-color: rgba(155, 89, 182, 0.1);
  color: rgb(155, 89, 182);
}

.status-abandoned {
  background-color: rgba(231, 76, 60, 0.1);
  color: rgb(231, 76, 60);
}

.status-planned {
  background-color: rgba(241, 196, 15, 0.1);
  color: rgb(182, 137, 6);
}

.other-tag {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.legacy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.legacy-tags .tag {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

/* Responsive styling */
@media (max-width: 640px) {
  .tag-section {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .section-label {
    min-width: auto;
    padding-top: 0;
  }
}
</style>

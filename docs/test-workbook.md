---
title: Obsidian Heart Viewer
sidebar: false
---

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useData } from 'vitepress';

// Get VitePress data
const { theme } = useData();

// Find the Obsidian Heart workbook item
const workbookItem = computed(() => {
  return theme.value.workbookItems?.find(item => item.slug === 'obsidian-heart') || null;
});

// Extract video ID function
function extractVimeoId(url) {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  return match ? match[1] : null;
}

// Get embed URL
function getEmbedUrl(media) {
  if (!media || !media.url) return '';
  
  const { provider, url } = media;
  
  // Process Vimeo URLs
  if (provider === 'vimeo') {
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`;
    }
  }
  
  return url;
}

// Immersive mode state
const showImmersive = ref(false);

// Toggle immersive mode
function toggleImmersiveMode() {
  showImmersive.value = !showImmersive.value;
}

// Get thumbnail URL
const thumbnailUrl = computed(() => {
  if (!workbookItem.value?.media) return '';
  
  const { type, provider, url } = workbookItem.value.media;
  
  if (type === 'video' && provider === 'vimeo') {
    const id = extractVimeoId(url);
    return id ? `/media/thumbnails/vimeo-${id}.jpg` : '';
  }
  
  return '';
});

// Keyboard shortcuts
function handleKeyDown(event) {
  if (event.key === 'Escape' && showImmersive.value) {
    showImmersive.value = false;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="workbook-viewer">
    <!-- Immersive mode -->
    <div v-if="showImmersive" class="immersive-viewer">
      <div class="background-layer" :style="{
        backgroundImage: `url(${thumbnailUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px) brightness(0.3)',
        opacity: 0.8
      }"></div>
      
      <div class="content-layer">
        <div v-if="workbookItem?.media?.type === 'video'" class="video-container">
          <iframe 
            v-if="workbookItem.media.provider === 'vimeo'"
            :src="`https://player.vimeo.com/video/${extractVimeoId(workbookItem.media.url)}?title=0&byline=0&portrait=0&background=1`"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      
      <div class="controls-layer">
        <div class="top-controls">
          <h2 class="media-title">{{ workbookItem?.title }}</h2>
          <button class="close-button" @click="toggleImmersiveMode">×</button>
        </div>
      </div>
    </div>
    
    <!-- Standard view -->
    <div v-else class="standard-view">
      <h1>{{ workbookItem?.title }}</h1>
      <p class="description">{{ workbookItem?.description }}</p>
      
      <div class="media-container">
        <button class="immersive-mode-toggle" @click="toggleImmersiveMode">
          <span class="toggle-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </span>
          <span class="toggle-text">Immersive View</span>
        </button>
        
        <div v-if="workbookItem?.media?.type === 'video'" class="video-embed">
          <iframe
            :src="getEmbedUrl(workbookItem.media)"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      
      <div class="metadata">
        <div v-if="workbookItem?.date" class="date">
          {{ new Date(workbookItem.date).toLocaleDateString() }}
        </div>
        
        <div v-if="workbookItem?.tags?.length" class="tags">
          <span v-for="tag in workbookItem.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
      
      <div class="content">
        <p>From Abstract Hymns for Teotihuacan</p>
        <p>
          <a href="https://theathmarcmanning.bandcamp.com/" target="_blank">https://theathmarcmanning.bandcamp.com/</a>
        </p>
        <p>
          <a href="https://theathmanning.bandcamp.com/album/abstract-hymns-for-teotihuacan" target="_blank">https://theathmanning.bandcamp.com/album/abstract-hymns-for-teotihuacan</a>
        </p>
        <p>Released Dec 1, 2021</p>
        <p>Video by me. Video synth performed live and recorded in one take with no edits.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workbook-viewer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.standard-view {
  position: relative;
}

h1 {
  margin-bottom: 1rem;
}

.description {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  margin-bottom: 2rem;
}

.media-container {
  position: relative;
  margin-bottom: 2rem;
}

.immersive-mode-toggle {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.immersive-mode-toggle:hover {
  background-color: rgba(0, 0, 0, 0.85);
  transform: translateY(-2px);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-text {
  font-size: 0.8rem;
  font-weight: 500;
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

.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.date {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background-color: var(--vp-c-bg-soft);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.content {
  margin-top: 2rem;
  line-height: 1.6;
}

/* Immersive viewer styles */
.immersive-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.content-layer {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container {
  aspect-ratio: 16 / 9;
  width: 90%;
  max-width: 1600px;
  position: relative;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
}

.controls-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.top-controls {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
  justify-content: space-between;
}

.media-title {
  color: white;
  font-size: 1.2rem;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .immersive-mode-toggle {
    top: 10px;
    right: 10px;
    padding: 6px 10px;
  }
  
  .toggle-text {
    display: none; /* Hide text on mobile, show only icon */
  }
}
</style>

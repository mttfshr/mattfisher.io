<!-- docs/.vitepress/theme/components/common/AssetDiagnostics.vue -->
<script setup>
import { ref, onMounted } from 'vue'

const assetStatus = ref([])
const publicRoot = ref('')

// Test assets to check
const testAssets = [
  '/public-fix-test.txt',
  '/media/thumbnails/vimeo-552620356.jpg',
  '/media/thumbnails/sample-thumbnail.jpg',
  '/media/video-placeholder.svg'
]

// Check if an asset exists by loading it
function checkAsset(path) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = path
  })
}

// Check text file using fetch
function checkTextFile(path) {
  return fetch(path)
    .then(response => {
      return response.ok
    })
    .catch(() => false)
}

onMounted(async () => {
  // Get the public root
  publicRoot.value = window.location.origin
  
  // Check each asset
  for (const asset of testAssets) {
    const isImage = asset.endsWith('.jpg') || asset.endsWith('.png') || asset.endsWith('.svg')
    const exists = isImage 
      ? await checkAsset(asset)
      : await checkTextFile(asset)
    
    assetStatus.value.push({
      path: asset,
      exists,
      fullUrl: publicRoot.value + asset
    })
  }
})
</script>

<template>
  <div class="asset-diagnostics">
    <h2>VitePress Public Assets Diagnostics</h2>
    
    <div class="status-box">
      <p>Public Root: {{ publicRoot }}</p>
      
      <div class="asset-list">
        <div 
          v-for="(asset, index) in assetStatus" 
          :key="index"
          class="asset-item"
          :class="{ 'asset-exists': asset.exists, 'asset-missing': !asset.exists }"
        >
          <div class="asset-status">
            {{ asset.exists ? '✅' : '❌' }}
          </div>
          <div class="asset-info">
            <div class="asset-path">{{ asset.path }}</div>
            <div class="asset-url">{{ asset.fullUrl }}</div>
            <a v-if="asset.exists" :href="asset.path" target="_blank" class="asset-view">View</a>
          </div>
        </div>
      </div>
    </div>
    
    <div class="diagnostics-info">
      <h3>Troubleshooting Tips</h3>
      <ul>
        <li>Make sure assets are in <code>docs/.vitepress/public/</code></li>
        <li>Check that paths in components match directory structure</li>
        <li>Ensure the build process is copying assets correctly</li>
        <li>Try clearing browser cache or using incognito mode</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.asset-diagnostics {
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.status-box {
  margin-bottom: 1.5rem;
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.asset-item {
  display: flex;
  padding: 0.75rem;
  border-radius: 4px;
  gap: 1rem;
}

.asset-exists {
  background-color: rgba(0, 200, 0, 0.1);
}

.asset-missing {
  background-color: rgba(255, 0, 0, 0.1);
}

.asset-status {
  font-size: 1.25rem;
}

.asset-info {
  flex: 1;
}

.asset-path {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.asset-url {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  word-break: break-all;
}

.asset-view {
  display: inline-block;
  margin-top: 0.5rem;
  background-color: var(--vp-c-brand);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.85rem;
}

.diagnostics-info {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.diagnostics-info ul {
  margin-left: 1.5rem;
}

.diagnostics-info li {
  margin-bottom: 0.5rem;
}

.diagnostics-info code {
  background-color: var(--vp-c-bg-alt);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}
</style>
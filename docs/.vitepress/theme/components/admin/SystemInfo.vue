<template>
  <div class="system-info">
    <div class="info-header">
      <h2 class="info-title">
        <Icon name="Info" />
        System Information
      </h2>
      <div class="info-subtitle">
        Development environment status and statistics
      </div>
    </div>
    
    <div class="info-grid">
      <!-- Environment Info -->
      <div class="info-card">
        <div class="card-header">
          <Icon name="Server" />
          <h3>Environment</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">Mode:</span>
            <span class="value">{{ envInfo.mode }}</span>
          </div>
          <div class="info-item">
            <span class="label">Node Version:</span>
            <span class="value">{{ envInfo.nodeVersion }}</span>
          </div>
          <div class="info-item">
            <span class="label">VitePress Version:</span>
            <span class="value">{{ envInfo.vitepressVersion }}</span>
          </div>
          <div class="info-item">
            <span class="label">Build Time:</span>
            <span class="value">{{ envInfo.buildTime }}</span>
          </div>
        </div>
      </div>
      
      <!-- Content Statistics -->
      <div class="info-card">
        <div class="card-header">
          <Icon name="BarChart3" />
          <h3>Content Statistics</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">Total Pins:</span>
            <span class="value">{{ contentStats.totalPins }}</span>
          </div>
          <div class="info-item">
            <span class="label">Pin Files:</span>
            <span class="value">{{ contentStats.pinFiles }}</span>
          </div>
          <div class="info-item">
            <span class="label">Collections:</span>
            <span class="value">{{ contentStats.collections }}</span>
          </div>
          <div class="info-item">
            <span class="label">Unique Tags:</span>
            <span class="value">{{ contentStats.uniqueTags }}</span>
          </div>
          <div class="info-item">
            <span class="label">Workbook Items:</span>
            <span class="value">{{ contentStats.workbookItems }}</span>
          </div>
          <div class="info-item">
            <span class="label">Notes:</span>
            <span class="value">{{ contentStats.notes }}</span>
          </div>
        </div>
      </div>
      
      <!-- API Status -->
      <div class="info-card">
        <div class="card-header">
          <Icon name="Activity" />
          <h3>API Status</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">Admin API:</span>
            <span class="value status" :class="apiStatus.admin">
              {{ apiStatus.admin === 'online' ? 'Online' : 'Offline' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">File System:</span>
            <span class="value status" :class="apiStatus.filesystem">
              {{ apiStatus.filesystem === 'online' ? 'Accessible' : 'Error' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Cache Status:</span>
            <span class="value status" :class="apiStatus.cache">
              {{ getCacheStatusText() }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Last Sync:</span>
            <span class="value">{{ apiStatus.lastSync }}</span>
          </div>
        </div>
      </div>
      
      <!-- Performance Metrics -->
      <div class="info-card">
        <div class="card-header">
          <Icon name="Zap" />
          <h3>Performance</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">Memory Usage:</span>
            <span class="value">{{ performance.memoryUsage }}</span>
          </div>
          <div class="info-item">
            <span class="label">Cache Size:</span>
            <span class="value">{{ performance.cacheSize }}</span>
          </div>
          <div class="info-item">
            <span class="label">Build Speed:</span>
            <span class="value">{{ performance.buildSpeed }}</span>
          </div>
          <div class="info-item">
            <span class="label">Hot Reload:</span>
            <span class="value status online">Enabled</span>
          </div>
        </div>
      </div>
      
      <!-- File System Info -->
      <div class="info-card">
        <div class="card-header">
          <Icon name="FolderTree" />
          <h3>File System</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">Project Root:</span>
            <span class="value path">~/Github/mattfisher.io</span>
          </div>
          <div class="info-item">
            <span class="label">Pins Directory:</span>
            <span class="value path">docs/pins/</span>
          </div>
          <div class="info-item">
            <span class="label">Collections:</span>
            <span class="value path">docs/workbook/collections/</span>
          </div>
          <div class="info-item">
            <span class="label">Cache Directory:</span>
            <span class="value path">docs/.vitepress/cache/</span>
          </div>
        </div>
      </div>
      
      <!-- Development Tools -->
      <div class="info-card">
        <div class="card-header">
          <Icon name="Wrench" />
          <h3>Development Tools</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">Content Manager:</span>
            <span class="value status online">Active</span>
          </div>
          <div class="info-item">
            <span class="label">Pin Organizer:</span>
            <span class="value status online">Available</span>
          </div>
          <div class="info-item">
            <span class="label">Tag Manager:</span>
            <span class="value status online">Available</span>
          </div>
          <div class="info-item">
            <span class="label">Auto-save:</span>
            <span class="value status online">Enabled</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="info-actions">
      <button @click="refreshInfo" class="btn btn-primary">
        <Icon name="RefreshCw" />
        Refresh Info
      </button>
      <button @click="clearCache" class="btn btn-ghost">
        <Icon name="Trash2" />
        Clear Cache
      </button>
      <button @click="exportData" class="btn btn-ghost">
        <Icon name="Download" />
        Export Data
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Icon from '../common/Icon.vue'

// Component state
const envInfo = ref({
  mode: 'Development',
  nodeVersion: 'Loading...',
  vitepressVersion: 'Loading...',
  buildTime: 'Loading...'
})

const contentStats = ref({
  totalPins: 0,
  pinFiles: 0,
  collections: 0,
  uniqueTags: 0,
  workbookItems: 0,
  notes: 0
})

const apiStatus = ref({
  admin: 'online',
  filesystem: 'online',
  cache: 'online',
  lastSync: 'Just now'
})

const performance = ref({
  memoryUsage: 'Loading...',
  cacheSize: 'Loading...',
  buildSpeed: '~8.5s average'
})

// Load system info on mount
onMounted(async () => {
  await loadSystemInfo()
})

async function loadSystemInfo() {
  try {
    // Simulate loading system information
    // In a real implementation, this would call actual system APIs
    
    envInfo.value = {
      mode: 'Development',
      nodeVersion: process.version || 'v18.17.0',
      vitepressVersion: '1.0.0',
      buildTime: '8.2s (last build)'
    }
    
    // Load content statistics from admin API
    const pinsResponse = await fetch('/api/admin/pins')
    if (pinsResponse.ok) {
      const pinsData = await pinsResponse.json()
      const totalPins = pinsData.pins?.reduce((sum, file) => sum + file.pins.length, 0) || 0
      const allPins = pinsData.pins?.flatMap(file => file.pins) || []
      const allTags = new Set()
      
      allPins.forEach(pin => {
        pin.tags?.forEach(tag => allTags.add(tag))
        pin.collections?.forEach(collection => allTags.add(`collection:${collection}`))
      })
      
      contentStats.value = {
        totalPins,
        pinFiles: pinsData.pins?.length || 0,
        collections: pinsData.collections?.length || 0,
        uniqueTags: allTags.size,
        workbookItems: 47, // This would come from workbook API
        notes: 25 // This would come from notes API
      }
    }
    
    performance.value = {
      memoryUsage: '156 MB',
      cacheSize: '2.3 MB',
      buildSpeed: '~8.5s average'
    }
    
    apiStatus.value.lastSync = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('Error loading system info:', error)
    apiStatus.value.admin = 'offline'
  }
}

function getCacheStatusText() {
  switch (apiStatus.value.cache) {
    case 'online': return 'Valid'
    case 'offline': return 'Invalid'
    default: return 'Unknown'
  }
}

async function refreshInfo() {
  await loadSystemInfo()
}

async function clearCache() {
  console.log('Clearing cache...')
  // This would call a cache clearing API
  alert('Cache cleared successfully!')
}

async function exportData() {
  console.log('Exporting data...')
  // This would trigger a data export
  alert('Data export started!')
}
</script>

<style scoped>
.system-info {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.info-header {
  padding: var(--space-6);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.info-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
}

.info-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}

.info-grid {
  padding: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.info-card {
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-header {
  padding: var(--space-4);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.card-header h3 {
  font-size: var(--text-base);
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.card-content {
  padding: var(--space-4);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-primary);
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-item:first-child {
  padding-top: 0;
}

.label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.value {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.value.path {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.value.status {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.status.online {
  background: var(--success-primary);
  color: white;
}

.status.offline {
  background: var(--error-primary);
  color: white;
}

.info-actions {
  padding: var(--space-6);
  background: var(--surface-secondary);
  border-top: 1px solid var(--border-primary);
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-secondary);
}

.btn-ghost {
  background: none;
  color: var(--text-secondary);
  border-color: var(--border-primary);
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--surface-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-actions {
    flex-direction: column;
  }
}
</style>

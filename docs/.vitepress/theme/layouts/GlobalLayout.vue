<!-- GlobalLayout.vue - PWA-inspired layout with breadcrumb + bottom navigation -->
<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import AppBar from '../components/common/AppBar.vue'
// import BottomNav from '../components/common/BottomNav.vue' // REMOVED: Breadcrumbs handle navigation
import Icon from '../components/common/Icon.vue'

const { Layout } = DefaultTheme
const route = useRoute()
const { theme, frontmatter } = useData()

// Force reactivity by creating a ref that triggers on route changes
const routeKey = ref(0)

// Watch route changes and force re-evaluation
watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    nextTick(() => {
      routeKey.value++
    })
  }
}, { immediate: true })

// Get page title from frontmatter or route (with forced reactivity)
const pageTitle = computed(() => {
  // Force reactivity trigger
  routeKey.value
  
  const currentPath = route.path
  
  // Special handling for home page
  if (currentPath === '/') {
    return frontmatter.value.title || 'Home'
  }
  
  // Use frontmatter title if available
  if (frontmatter.value.title) {
    return frontmatter.value.title
  }
  
  // Derive from route path
  const pathSegments = currentPath.split('/').filter(Boolean)
  if (pathSegments.length === 0) return 'Home'
  
  const lastSegment = pathSegments[pathSegments.length - 1]
  
  // Handle specific cases
  switch (lastSegment) {
    case 'workbook': return 'Workbook'
    case 'pins': return 'Pins'
    case 'log': return 'Log'
    case 'notes': return 'Notes'
    default: return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }
})

// Page-specific action detection (with forced reactivity)
const showWorkbookActions = computed(() => {
  routeKey.value // Force reactivity
  return route.path.includes('/workbook')
})

const showPinsActions = computed(() => {
  routeKey.value // Force reactivity
  return route.path.includes('/pins')
})

// Workbook actions state
const workbookTab = ref('items')
const workbookDrawer = ref(false)

// Pins actions state  
const pinsLayout = ref('compact') // 'compact' = thumbnails only, 'detailed' = thumbnails + metadata
const pinsDrawer = ref(false)

// Mobile state
const isMobile = ref(false)

// Action handlers
const setWorkbookTab = (tab) => {
  workbookTab.value = tab
  window.dispatchEvent(new CustomEvent('workbook-tab-change', { detail: tab }))
}

const toggleWorkbookDrawer = () => {
  workbookDrawer.value = !workbookDrawer.value
  window.dispatchEvent(new CustomEvent('workbook-drawer-toggle', { detail: workbookDrawer.value }))
}

const setPinsLayout = (layout) => {
  pinsLayout.value = layout
  window.dispatchEvent(new CustomEvent('pins-layout-change', { detail: layout }))
}

const togglePinsDrawer = () => {
  pinsDrawer.value = !pinsDrawer.value
  window.dispatchEvent(new CustomEvent('pins-drawer-toggle', { detail: pinsDrawer.value }))
}

// Mobile navigation (no longer needed with bottom nav, but keeping for transition)
const toggleMobileMenu = () => {
  // This could trigger a mobile menu overlay if needed
  console.log('Mobile menu toggle - consider implementing overlay for desktop navigation')
}

onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }
  
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Listen for drawer close events from child components
  window.addEventListener('pins-drawer-close', () => {
    pinsDrawer.value = false
  })
  
  window.addEventListener('workbook-drawer-close', () => {
    workbookDrawer.value = false
  })
  
  return () => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('pins-drawer-close', () => {
      pinsDrawer.value = false
    })
    window.removeEventListener('workbook-drawer-close', () => {
      workbookDrawer.value = false
    })
  }
})
</script>

<template>
  <div class="global-layout">
    <!-- PWA-inspired app bar with breadcrumb navigation -->
    <AppBar 
      :title="pageTitle" 
      site-title="Matt Fisher" 
      :show-menu-button="false"
      :workbook-tab="workbookTab"
      :pins-layout="pinsLayout"
      :workbook-drawer="workbookDrawer"
      :pins-drawer="pinsDrawer"
      @menu-click="toggleMobileMenu"
      @workbook-tab-change="setWorkbookTab"
      @pins-layout-change="setPinsLayout"
      @workbook-drawer-toggle="toggleWorkbookDrawer"
      @pins-drawer-toggle="togglePinsDrawer"
    >
      <template #actions>
        <!-- Actions slot now empty - view controls moved to breadcrumb -->
      </template>
    </AppBar>

    <!-- Main content area (no rail offset needed) -->
    <main class="global-content">
      <!-- Use default VitePress layout for content -->
      <Layout />
    </main>

    <!-- REMOVED: PWA bottom navigation - breadcrumbs handle navigation -->
  </div>
</template>

<style scoped>
.global-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.global-content {
  flex: 1;
  padding-top: 56px; /* App bar height */
  /* Remove rail navigation margin - we're going full-width */
  margin-left: 0;
  transition: none; /* Remove transition since no rail */
}

/* Hide VitePress default navigation completely */
:deep(.VPNav),
:deep(.VPLocalNav),
:deep(.VPSidebar) {
  display: none !important;
}

/* Override VitePress content positioning for full-width layout */
:deep(.VPDoc) {
  padding: 0 !important;
}

:deep(.VPDoc .container) {
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Hide VitePress aside/sidebar completely */
:deep(.VPDoc .aside) {
  display: none !important;
}

:deep(.VPDocAside) {
  display: none !important;
}

:deep(.VPSidebar) {
  display: none !important;
}

:deep(.VPDocAsideOutline) {
  display: none !important;
}

/* Make content take full width without aside */
:deep(.VPDoc .content-container) {
  max-width: none !important;
  margin: 0 !important;
}

/* Clean content positioning with consistent spacing */
:deep(.VPDoc .content) {
  padding: var(--space-6) var(--space-6) var(--space-8) var(--space-6) !important;
  margin: 0 !important;
}

/* Override any VitePress VPContent padding */
:deep(.VPContent) {
  padding-top: 0 !important;
}

/* Ensure main content areas have consistent spacing */
:deep(.content-section),
:deep(.gallery-grid-large),
:deep(.stack-vertical) {
  margin-left: 0;
  margin-right: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .global-content {
    /* Add bottom padding to account for bottom navigation */
    padding-bottom: calc(64px + env(safe-area-inset-bottom));
  }
  
  .global-content :deep(.VPDoc .content) {
    padding: var(--space-4) var(--space-4) var(--space-6) var(--space-4) !important;
  }
}

/* Action buttons (moved from old rail nav) */
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-icon:hover {
  background: var(--surface-secondary);
}

.btn-icon.active {
  background: var(--surface-accent-subtle);
  color: var(--accent-primary);
}
</style>
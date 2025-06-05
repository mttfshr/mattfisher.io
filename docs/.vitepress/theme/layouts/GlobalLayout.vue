<!-- GlobalLayout.vue - Complete site navigation replacement -->
<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import AppBar from '../components/common/AppBar.vue'
import RailNav from '../components/common/RailNav.vue'
import Icon from '../components/common/Icon.vue'

const { Layout } = DefaultTheme
const route = useRoute()
const { theme, frontmatter } = useData() // Move useData outside computed

// Force reactivity by creating a ref that triggers on route changes
const routeKey = ref(0)

// Watch route changes and force re-evaluation
watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    nextTick(() => {
      routeKey.value++
      // Force re-evaluation of computed properties
    })
  }
}, { immediate: true })

// Global navigation items for rail drawer
const navItems = [
  { path: '/', label: 'Home', icon: 'Home' },
  { path: '/workbook/', label: 'Workbook', icon: 'BookOpen' },
  { path: '/pins/', label: 'Pins', icon: 'Pin' },
  { path: '/log/', label: 'Log', icon: 'FileText' },
  { path: '/notes/', label: 'Notes', icon: 'StickyNote' },
  { 
    path: '#', 
    label: 'Links', 
    icon: 'ExternalLink',
    dropdown: [
      { path: 'https://mattfisherstudio.com', label: 'studio', icon: 'Palette' },
      { path: 'https://finishing-school-art.net', label: 'finishing school', icon: 'GraduationCap' },
      { path: 'https://github.com/mttfshr', label: 'github', icon: 'Github' },
      { path: 'https://bsky.app/profile/mattfisher.io', label: 'bluesky', icon: 'Cloud' },
      { path: 'https://vimeo.com/mattfisherstudio', label: 'vimeo', icon: 'Video' },
      { path: 'https://www.youtube.com/@mttfshr', label: 'youtube', icon: 'Play' },
      { path: 'https://open.spotify.com/user/gradientfade', label: 'spotify', icon: 'Music' },
      { path: 'https://bandcamp.com/mattfisher', label: 'bandcamp', icon: 'Disc' },
      { path: 'https://discordapp.com/users/476778097404805145', label: 'discord', icon: 'MessageCircle' }
    ]
  }
]

const currentPath = computed(() => {
  routeKey.value // Force reactivity
  return route.path
})

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

// Mobile rail navigation state
const mobileRailOpen = ref(false)

// Responsive state
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

// Mobile rail navigation handler
const toggleMobileRail = () => {
  mobileRailOpen.value = !mobileRailOpen.value
}

// Check if any drawer is open
const anyDrawerOpen = computed(() => workbookDrawer.value || pinsDrawer.value)
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
  <div class="global-layout" :class="{ 'custom-page': isCustomPage }">
    <!-- Global App Bar with page-specific actions -->
    <AppBar 
      :title="pageTitle" 
      site-title="Matt Fisher" 
      :show-menu-button="isMobile"
      @menu-click="toggleMobileRail"
    >
      <template #actions>
        <!-- Workbook-specific actions -->
        <template v-if="showWorkbookActions">
          <button 
            class="btn-icon" 
            :class="{ active: workbookTab === 'folio' }" 
            @click="setWorkbookTab('folio')"
            title="Folio view"
          >
            <Icon name="BookOpen" :size="20" />
          </button>
          <button 
            class="btn-icon" 
            :class="{ active: workbookTab === 'items' }" 
            @click="setWorkbookTab('items')"
            title="Gallery view"
          >
            <Icon name="Grid3x3" :size="20" />
          </button>
          <button 
            class="btn-icon" 
            :class="{ active: workbookTab === 'collections' }" 
            @click="setWorkbookTab('collections')"
            title="Collections view"
          >
            <Icon name="Tags" :size="20" />
          </button>
          <button 
            v-show="workbookTab === 'items'"
            @click="toggleWorkbookDrawer" 
            class="btn-icon"
            :class="{ active: workbookDrawer }"
            :title="workbookDrawer ? 'Hide filters' : 'Show filters'"
          >
            <Icon name="Funnel" :size="20" />
          </button>
        </template>
        
        <!-- Pins-specific actions -->
        <template v-if="showPinsActions">
          <button 
            class="btn-icon" 
            :class="{ active: pinsLayout === 'compact' }" 
            @click="setPinsLayout('compact')"
            title="Compact view - thumbnails only"
          >
            <Icon name="Grid3x3" :size="20" />
          </button>
          <button 
            class="btn-icon" 
            :class="{ active: pinsLayout === 'detailed' }" 
            @click="setPinsLayout('detailed')"
            title="Detailed view - thumbnails + metadata"
          >
            <Icon name="SquareStack" :size="20" />
          </button>
          <button 
            @click="togglePinsDrawer"
            class="btn-icon"
            :class="{ active: pinsDrawer }"
            title="Toggle filters"
          >
            <Icon name="Funnel" :size="20" />
          </button>
        </template>
      </template>
    </AppBar>

    <!-- Global Rail Navigation (always visible) -->
    <RailNav 
      :items="navItems" 
      :current-path="currentPath"
      :mobile-open="mobileRailOpen"
      @mobile-close="mobileRailOpen = false"
    />

    <!-- Main content area with rail nav offset -->
    <main class="global-content">
      <!-- Use default VitePress layout for content -->
      <Layout />
    </main>
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
  margin-left: 72px; /* Rail nav width */
  padding-top: 56px; /* App bar height */
  transition: margin-left var(--transition-base);
}

/* No content shifting - both drawers overlay content */

/* Hide VitePress default navigation on custom pages */
.custom-page :deep(.VPNav),
.custom-page :deep(.VPLocalNav),
.custom-page :deep(.VPSidebar) {
  display: none !important;
}

/* Override VitePress content positioning for rail navigation */
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
    margin-left: 0;
  }
  
  .global-content :deep(.VPDoc .content) {
    padding: var(--space-4) var(--space-4) var(--space-6) var(--space-4) !important;
  }
}
</style>

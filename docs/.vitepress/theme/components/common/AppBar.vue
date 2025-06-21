<!-- AppBar.vue - PWA-Inspired breadcrumb navigation -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vitepress'
import Icon from './Icon.vue'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  siteTitle: {
    type: String,
    default: 'Matt Fisher'
  },
  showMenuButton: {
    type: Boolean,
    default: false
  },
  // View mode props
  workbookTab: {
    type: String,
    default: 'items'
  },
  pinsLayout: {
    type: String,
    default: 'compact'
  },
  workbookDrawer: {
    type: Boolean,
    default: false
  },
  pinsDrawer: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['menu-click', 'action-click', 'workbook-tab-change', 'pins-layout-change', 'workbook-drawer-toggle', 'pins-drawer-toggle'])

// Navigation structure with view modes
const navigationStructure = {
  '/': { label: 'Home', icon: 'Home' },
  '/workbook/': { 
    label: 'Workbook', 
    icon: 'BookOpen',
    children: [
      { path: '/workbook/folios/', label: 'Folios' },
      { path: '/workbook/collections/', label: 'Collections' }
    ],
    viewModes: [
      { key: 'folio', label: 'Folio', icon: 'BookOpen' },
      { key: 'items', label: 'Items', icon: 'Grid3x3' },
      { key: 'collections', label: 'Collections', icon: 'Tags' }
    ]
  },
  '/pins/': { 
    label: 'Pins', 
    icon: 'Pin',
    children: [
      { path: '/pins/collections/', label: 'Collections' }
    ],
    viewModes: [
      { key: 'compact', label: 'Compact', icon: 'Grid3x3' },
      { key: 'detailed', label: 'Detailed', icon: 'SquareStack' }
    ]
  },
  '/log/': { 
    label: 'Log', 
    icon: 'FileText'
  },
  '/notes/': { 
    label: 'Notes', 
    icon: 'StickyNote'
  }
}

// Dropdown state
const showPageDropdown = ref(false)
const showSubpageDropdown = ref(false)
const showViewModeDropdown = ref(false)

// View mode state (received from GlobalLayout)
const currentViewMode = ref('items') // Default for workbook
const currentPinsLayout = ref('compact') // Default for pins

// Current page detection
const currentPagePath = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  if (path.startsWith('/workbook')) return '/workbook/'
  if (path.startsWith('/pins')) return '/pins/'
  if (path.startsWith('/log')) return '/log/'
  if (path.startsWith('/notes')) return '/notes/'
  return '/'
})

const currentPage = computed(() => navigationStructure[currentPagePath.value])
const hasChildren = computed(() => currentPage.value?.children?.length > 0)
const hasViewModes = computed(() => currentPage.value?.viewModes?.length > 0)

// Get current view mode based on page
const currentViewModeKey = computed(() => {
  if (currentPagePath.value === '/workbook/') {
    return props.workbookTab
  } else if (currentPagePath.value === '/pins/') {
    return props.pinsLayout
  }
  return null
})

const currentViewModeLabel = computed(() => {
  if (!hasViewModes.value || !currentViewModeKey.value) return null
  
  const viewMode = currentPage.value.viewModes.find(mode => mode.key === currentViewModeKey.value)
  return viewMode?.label || null
})

// Check if we should show view mode in breadcrumb (main section pages with view modes)
const showViewModeInBreadcrumb = computed(() => {
  return hasViewModes.value && !isSubpage.value && currentViewModeLabel.value
})

// Check if we're on a subpage (not the main section page)
const isSubpage = computed(() => {
  const path = route.path
  if (path === '/') return false
  
  // Check if we're deeper than the main section
  const sections = ['/workbook/', '/pins/', '/log/', '/notes/']
  const currentSection = sections.find(section => path.startsWith(section))
  
  return currentSection && path !== currentSection
})

// Get clean subpage title (without parent section name)
const subpageTitle = computed(() => {
  if (!isSubpage.value) return ''
  
  // If title is same as section name, we're on main page
  if (props.title === currentPage.value?.label) return ''
  
  return props.title
})

// Handle page navigation
const navigateToPage = (path) => {
  showPageDropdown.value = false
  router.go(path)
}

const navigateToSubpage = (path) => {
  showSubpageDropdown.value = false
  router.go(path) 
}

// Handle view mode changes
const changeViewMode = (modeKey) => {
  showViewModeDropdown.value = false
  
  if (currentPagePath.value === '/workbook/') {
    emit('workbook-tab-change', modeKey)
  } else if (currentPagePath.value === '/pins/') {
    emit('pins-layout-change', modeKey)
  }
}

// Handle drawer toggles (keep as action buttons)
const toggleDrawer = () => {
  if (currentPagePath.value === '/workbook/') {
    emit('workbook-drawer-toggle')
  } else if (currentPagePath.value === '/pins/') {
    emit('pins-drawer-toggle')
  }
}

// Handle menu click for mobile
const handleMenuClick = () => {
  emit('menu-click')
}

const handleActionClick = (action) => {
  emit('action-click', action)
}

// Close dropdowns when clicking outside
const closeDropdowns = () => {
  showPageDropdown.value = false
  showSubpageDropdown.value = false
  showViewModeDropdown.value = false
}

onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})
</script>

<template>
  <header class="app-bar">
    <!-- Mobile menu button -->
    <button 
      v-if="showMenuButton"
      @click="handleMenuClick"
      class="app-bar-menu-btn btn-icon"
      aria-label="Toggle navigation"
    >
      <Icon name="Menu" :size="20" />
    </button>

    <!-- Breadcrumb navigation -->
    <nav class="breadcrumb-nav" role="navigation" aria-label="Page navigation">
      <!-- Site title (always plain link, never dropdown) -->
      <a href="/" class="site-title-link">
        <span class="site-title">{{ siteTitle }}</span>
      </a>

      <!-- Home page: Show expandable > -->
      <template v-if="currentPagePath === '/'">
        <button 
          @click.stop="showPageDropdown = !showPageDropdown"
          class="expand-button"
          :class="{ active: showPageDropdown }"
          :aria-expanded="showPageDropdown"
          aria-haspopup="true"
          title="Show navigation menu"
        >
          <Icon name="ChevronRight" :size="16" />
        </button>

        <!-- Inline section dropdown (appears to the right of >) -->
        <div 
          v-if="showPageDropdown" 
          class="dropdown-container inline-dropdown"
        >
          <div class="dropdown-menu inline-dropdown-menu" role="menu">
            <button
              v-for="(page, path) in navigationStructure"
              :key="path"
              @click="navigateToPage(path)"
              class="dropdown-item"
              :class="{ active: path === currentPagePath }"
              role="menuitem"
            >
              <span>{{ page.label }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- Section navigation (only if not home) -->
      <template v-if="currentPagePath !== '/'">
        <Icon name="ChevronRight" :size="16" class="breadcrumb-separator" />
        
        <div class="dropdown-container">
          <button 
            @click.stop="showPageDropdown = !showPageDropdown"
            class="page-dropdown-trigger"
            :class="{ active: showPageDropdown }"
            :aria-expanded="showPageDropdown"
            aria-haspopup="true"
          >
            <span>{{ currentPage.label }}</span>
            <Icon name="ChevronDown" :size="14" class="dropdown-chevron" />
          </button>

          <!-- Section dropdown menu -->
          <div 
            v-if="showPageDropdown" 
            class="dropdown-menu page-dropdown"
            role="menu"
          >
            <button
              v-for="(page, path) in navigationStructure"
              :key="path"
              @click="navigateToPage(path)"
              class="dropdown-item"
              :class="{ active: path === currentPagePath }"
              role="menuitem"
            >
              <span>{{ page.label }}</span>
            </button>
          </div>
        </div>

        <!-- View mode navigation (for main section pages with view modes) -->
        <template v-if="showViewModeInBreadcrumb">
          <Icon name="ChevronRight" :size="16" class="breadcrumb-separator" />
          
          <div class="dropdown-container">
            <button 
              @click.stop="showViewModeDropdown = !showViewModeDropdown"
              class="page-dropdown-trigger view-mode-trigger"
              :class="{ active: showViewModeDropdown }"
              :aria-expanded="showViewModeDropdown"
              aria-haspopup="true"
            >
              <span>{{ currentViewModeLabel }}</span>
              <Icon name="ChevronDown" :size="14" class="dropdown-chevron" />
            </button>

            <!-- View mode dropdown menu -->
            <div 
              v-if="showViewModeDropdown" 
              class="dropdown-menu view-mode-dropdown"
              role="menu"
            >
              <button
                v-for="viewMode in currentPage.viewModes"
                :key="viewMode.key"
                @click="changeViewMode(viewMode.key)"
                class="dropdown-item"
                :class="{ active: viewMode.key === currentViewModeKey }"
                role="menuitem"
              >
                <Icon :name="viewMode.icon" :size="16" />
                <span>{{ viewMode.label }}</span>
              </button>
            </div>
          </div>
        </template>

        <!-- Subpage navigation (only if we have a different subpage title) -->
        <template v-else-if="subpageTitle">
          <Icon name="ChevronRight" :size="16" class="breadcrumb-separator" />
          
          <div class="dropdown-container">
            <button 
              v-if="hasChildren"
              @click.stop="showSubpageDropdown = !showSubpageDropdown"
              class="page-dropdown-trigger"
              :class="{ active: showSubpageDropdown }"
              :aria-expanded="showSubpageDropdown"
              aria-haspopup="true"
            >
              <span>{{ subpageTitle }}</span>
              <Icon name="ChevronDown" :size="14" class="dropdown-chevron" />
            </button>
            
            <!-- No dropdown if no children -->
            <span v-else class="subpage-title">{{ subpageTitle }}</span>

            <!-- Subpage dropdown menu -->
            <div 
              v-if="showSubpageDropdown && hasChildren" 
              class="dropdown-menu subpage-dropdown"
              role="menu"
            >
              <button
                v-for="child in currentPage.children"
                :key="child.path"
                @click="navigateToSubpage(child.path)"
                class="dropdown-item"
                role="menuitem"
              >
                <span>{{ child.label }}</span>
              </button>
            </div>
          </div>
        </template>
      </template>
    </nav>

    <!-- Actions slot - now only for filter toggles -->
    <div class="app-bar-actions">
      <!-- Filter button for workbook items view -->
      <button 
        v-if="currentPagePath === '/workbook/' && props.workbookTab === 'items'"
        @click="toggleDrawer" 
        class="btn-icon"
        :class="{ active: props.workbookDrawer }"
        :title="props.workbookDrawer ? 'Hide filters' : 'Show filters'"
      >
        <Icon name="Funnel" :size="20" />
      </button>
      
      <!-- Filter button for pins -->
      <button 
        v-if="currentPagePath === '/pins/'"
        @click="toggleDrawer"
        class="btn-icon"
        :class="{ active: props.pinsDrawer }"
        title="Toggle filters"
      >
        <Icon name="Funnel" :size="20" />
      </button>
      
      <!-- Slot for any additional actions -->
      <slot name="actions" :handleActionClick="handleActionClick" />
    </div>
  </header>
</template>

<style scoped>
.app-bar {
  display: flex;
  align-items: center;
  height: 68px; /* Increased for larger site title */
  padding: 0 var(--space-4);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: var(--space-3);
}

.app-bar-menu-btn {
  margin-right: var(--space-2);
}

/* Breadcrumb navigation */
.breadcrumb-nav {
  display: flex;
  align-items: baseline; /* Align all elements to baseline for proper font mixing */
  flex: 1;
  gap: var(--space-2);
  min-width: 0;
}

.site-title-link {
  text-decoration: none;
  color: inherit;
  transition: var(--transition-fast);
}

.site-title-link:hover {
  color: var(--accent-primary);
}

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: var(--space-1);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.expand-button:hover,
.expand-button.active {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.expand-button.active {
  background: var(--surface-accent-subtle);
  color: var(--accent-primary);
}

.site-title {
  font-size: 36px; /* Authentic Sans sweet spot - shows character */
  font-weight: var(--font-normal);
  color: var(--text-primary);
  white-space: nowrap;
  letter-spacing: -0.02em; /* Tighten for technical precision */
  line-height: 1; /* Consistent baseline alignment with other breadcrumb elements */
}

.subpage-title {
  font-family: var(--font-mono); /* IBM Plex Mono */
  font-style: italic; /* Italic style */
  font-size: 36px; /* Same size as other breadcrumb elements */
  font-weight: var(--font-normal);
  color: var(--text-tertiary); /* Most subdued level */
  opacity: 0.6; /* Additional subduing for third level */
  white-space: nowrap;
  letter-spacing: -0.02em; /* Consistent technical spacing */
  line-height: 1; /* Tight line height for baseline alignment */
  vertical-align: baseline; /* Ensure baseline alignment */
}

.breadcrumb-separator {
  color: var(--accent-primary); /* Blueprint cyan for technical path separators */
  flex-shrink: 0;
  opacity: 0.8;
  transition: var(--transition-fast);
}

/* Progressive separator fading - later separators are more subdued */
.breadcrumb-separator:nth-of-type(3),
.breadcrumb-separator:nth-of-type(4) {
  opacity: 0.5; /* More subdued for deeper levels */
}

/* Dropdown containers */
.dropdown-container {
  position: relative;
  display: flex;
  align-items: center;
}

.page-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-family: var(--font-mono); /* IBM Plex Mono */
  font-style: italic; /* Italic style */
  font-size: 36px; /* Same size as site title */
  font-weight: var(--font-normal);
  color: var(--text-secondary); /* Second level - medium emphasis */
  transition: var(--transition-fast);
  white-space: nowrap;
  min-height: 40px;
  letter-spacing: -0.02em; /* Same technical spacing as site title */
  line-height: 1; /* Tight line height for baseline alignment */
  vertical-align: baseline; /* Ensure baseline alignment */
}

.page-dropdown-trigger:hover,
.page-dropdown-trigger.active {
  background: var(--surface-secondary);
  color: var(--text-primary); /* Highlight on interaction */
}

/* View mode triggers (third level) - more subdued */
.view-mode-trigger {
  font-family: var(--font-mono); /* IBM Plex Mono */
  font-style: italic; /* Italic style */
  color: var(--text-tertiary); /* Most subdued level */
  opacity: 0.6; /* Additional subduing for third level */
  line-height: 1; /* Consistent baseline alignment */
  vertical-align: baseline; /* Ensure baseline alignment */
}

.view-mode-trigger:hover,
.view-mode-trigger.active {
  opacity: 1; /* Full opacity on interaction */
}

.page-dropdown-trigger:hover,
.page-dropdown-trigger.active {
  background: var(--surface-secondary);
}

.dropdown-chevron {
  color: var(--text-secondary);
  transition: transform var(--transition-fast);
}

.page-dropdown-trigger.active .dropdown-chevron,
.site-title-button.active .dropdown-chevron {
  transform: rotate(180deg);
}

/* Dropdown menus */
.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  min-width: 180px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 200;
  overflow: hidden;
}

/* Inline dropdown (appears next to expand button) */
.inline-dropdown {
  position: relative;
  margin-left: var(--space-2);
}

.inline-dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: var(--border-radius-lg);
  min-width: 160px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 200;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  font-family: var(--font-mono); /* IBM Plex Mono */
  font-style: italic; /* Italic style */
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
  min-height: 44px;
}

.dropdown-item:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.dropdown-item.active {
  background: var(--surface-accent-subtle);
  color: var(--accent-primary);
}

/* Actions */
.app-bar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

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

/* Mobile responsive */
@media (max-width: 768px) {
  .app-bar {
    padding: 0 var(--space-3);
    gap: var(--space-2);
  }
  
  .site-title {
    font-size: var(--text-base);
  }
  
  .dropdown-menu {
    min-width: 160px;
    right: 0;
    left: auto;
  }
  
  .page-dropdown-trigger {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
  }
  
  .expand-button {
    width: 28px;
    height: 28px;
  }
  
  .inline-dropdown-menu {
    min-width: 140px;
  }
}
</style>
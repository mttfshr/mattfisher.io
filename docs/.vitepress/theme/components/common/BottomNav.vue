<!-- BottomNav.vue - PWA-style bottom navigation -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vitepress'
import Icon from './Icon.vue'

const route = useRoute()

// Navigation items for bottom nav
const navItems = [
  { path: '/', label: 'Home', icon: 'Home' },
  { path: '/workbook/', label: 'Work', icon: 'BookOpen' },
  { path: '/pins/', label: 'Pins', icon: 'Pin' },
  { path: '/log/', label: 'Log', icon: 'FileText' },
  { path: '/notes/', label: 'Notes', icon: 'StickyNote' }
]

// More menu items (overflow)
const moreItems = [
  { path: 'https://mattfisherstudio.com', label: 'Studio', icon: 'Palette' },
  { path: 'https://finishing-school-art.net', label: 'School', icon: 'GraduationCap' },
  { path: 'https://github.com/mttfshr', label: 'GitHub', icon: 'Github' },
  { path: 'https://bsky.app/profile/mattfisher.io', label: 'Bluesky', icon: 'Cloud' },
  { path: 'https://vimeo.com/mattfisherstudio', label: 'Vimeo', icon: 'Video' },
  { path: 'https://www.youtube.com/@mttfshr', label: 'YouTube', icon: 'Play' }
]

// Current path detection
const currentPath = computed(() => route.path)

// Check if a nav item is active
const isActive = (itemPath) => {
  if (itemPath === '/') {
    return currentPath.value === '/'
  }
  return currentPath.value.startsWith(itemPath)
}

// More menu state
const showMore = ref(false)

const toggleMore = () => {
  showMore.value = !showMore.value
}

const closeMore = () => {
  showMore.value = false
}

// Close more menu when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.more-container')) {
      closeMore()
    }
  })
})
</script>

<template>
  <!-- Bottom navigation backdrop (when more menu is open) -->
  <div 
    v-if="showMore"
    class="bottom-nav-backdrop"
    @click="closeMore"
    aria-hidden="true"
  />

  <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
    <!-- Primary navigation items -->
    <a
      v-for="item in navItems"
      :key="item.path"
      :href="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
      :aria-current="isActive(item.path) ? 'page' : undefined"
    >
      <Icon :name="item.icon" :size="20" />
      <span class="nav-label">{{ item.label }}</span>
    </a>

    <!-- More menu container -->
    <div class="more-container">
      <button
        @click.stop="toggleMore"
        class="nav-item more-button"
        :class="{ active: showMore }"
        aria-haspopup="true"
        :aria-expanded="showMore"
        aria-label="More options"
      >
        <Icon name="MoreHorizontal" :size="20" />
        <span class="nav-label">More</span>
      </button>

      <!-- More menu overlay -->
      <div 
        v-if="showMore"
        class="more-menu"
        role="menu"
      >
        <div class="more-menu-header">
          <h3>Links</h3>
          <button @click="closeMore" class="close-button" aria-label="Close menu">
            <Icon name="X" :size="18" />
          </button>
        </div>
        
        <div class="more-items">
          <a
            v-for="item in moreItems"
            :key="item.path"
            :href="item.path"
            class="more-item"
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            @click="closeMore"
          >
            <Icon :name="item.icon" :size="18" />
            <span>{{ item.label }}</span>
            <Icon name="ExternalLink" :size="14" class="external-icon" />
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Bottom navigation backdrop */
.bottom-nav-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 199;
}

/* Bottom navigation bar */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--surface-primary);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 var(--space-2);
  z-index: 200;
  /* iOS safe area */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Navigation items */
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 48px; /* Touch target */
  padding: var(--space-1) var(--space-2);
  text-decoration: none;
  color: var(--text-secondary);
  transition: var(--transition-fast);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  border: none;
  background: transparent;
  font-size: var(--text-xs);
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--surface-secondary);
}

.nav-item.active {
  color: var(--accent-primary);
  background: var(--surface-accent-subtle);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--accent-primary);
  border-radius: 1px;
}

.nav-label {
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  white-space: nowrap;
  line-height: 1;
}

/* More menu container */
.more-container {
  position: relative;
  flex: 1;
}

.more-button {
  position: relative;
}

/* More menu overlay */
.more-menu {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  right: var(--space-2);
  width: 240px;
  max-height: 360px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 300;
}

.more-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.more-menu-header h3 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  color: var(--text-primary);
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.close-button:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

/* More menu items */
.more-items {
  padding: var(--space-2);
  max-height: 280px;
  overflow-y: auto;
}

.more-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-fast);
  min-height: 44px; /* Touch target */
}

.more-item:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.external-icon {
  margin-left: auto;
  color: var(--text-tertiary);
}

/* Hide on desktop - this is mobile-only */
@media (min-width: 769px) {
  .bottom-nav,
  .bottom-nav-backdrop {
    display: none;
  }
}

/* Responsive adjustments for smaller mobile screens */
@media (max-width: 380px) {
  .nav-label {
    font-size: var(--text-xs);
  }
  
  .more-menu {
    width: 200px;
  }
}
</style>
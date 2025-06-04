<!-- RailNav.vue - Material Design-inspired rail navigation -->
<script setup>
import { ref } from 'vue'
import Icon from './Icon.vue'

const isExpanded = ref(false)
const hoveredItem = ref(null)

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  currentPath: {
    type: String,
    default: ''
  },
  mobileOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['mobile-close'])

const handleMouseEnter = () => {
  isExpanded.value = true
}

const handleMouseLeave = () => {
  isExpanded.value = false
  hoveredItem.value = null
}

const handleItemMouseEnter = (index) => {
  hoveredItem.value = index
}

const handleItemMouseLeave = () => {
  hoveredItem.value = null
}

// Handle mobile backdrop click
const handleMobileBackdropClick = () => {
  emit('mobile-close')
}
</script>

<template>
  <!-- Mobile backdrop (only on mobile and when open) -->
  <div 
    v-if="mobileOpen"
    class="rail-nav-backdrop"
    @click="handleMobileBackdropClick"
    aria-hidden="true"
  />
  
  <nav 
    class="rail-nav"
    :class="{ 
      expanded: isExpanded,
      'mobile-open': mobileOpen 
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="rail-nav-items">
      <template v-for="(item, index) in items" :key="item.path">
        <!-- Regular nav item -->
        <a 
          v-if="!item.dropdown"
          :href="item.path"
          class="rail-nav-item"
          :class="{ 
            active: item.path === '/' ? 
              currentPath === '/' : 
              currentPath.startsWith(item.path) 
          }"
          :title="item.label"
        >
          <Icon :name="item.icon" :size="24" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </a>
        
        <!-- Expandable list item (mouseover) -->
        <div 
          v-else 
          class="rail-nav-expandable"
          @mouseenter="handleItemMouseEnter(index)"
          @mouseleave="handleItemMouseLeave"
        >
          <div class="rail-nav-item expandable-header">
            <Icon :name="item.icon" :size="24" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </div>
          
          <!-- Expandable list content (shows on hover) -->
          <div 
            v-if="hoveredItem === index && isExpanded"
            class="expandable-content"
          >
            <a 
              v-for="link in item.dropdown"
              :key="link.path"
              :href="link.path"
              class="rail-nav-subitem"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </template>
    </div>
  </nav>
</template>
<style scoped>
/* Mobile backdrop */
.rail-nav-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 89;
  display: none;
}

@media (max-width: 768px) {
  .rail-nav-backdrop {
    display: block;
  }
}

.rail-nav {
  position: fixed;
  left: 0;
  top: 56px; /* Below app bar */
  bottom: 0;
  width: 72px;
  background: var(--surface-primary);
  border-right: 1px solid var(--border-subtle);
  transition: width var(--transition-base), transform var(--transition-base), border-right var(--transition-base);
  overflow: hidden;
  z-index: 90;
  transform: translateX(0);
}

.rail-nav.expanded {
  width: 256px;
  transform: translateX(0);
  border-right: 0.25px solid rgba(255, 255, 255, 0.08);
}

/* Smooth hover transition */
.rail-nav:hover {
  transform: translateX(0);
}

/* Content slide animation */
.rail-nav-items {
  padding: var(--space-2) 0;
  transition: opacity var(--transition-fast);
}

.rail-nav:not(.expanded) .nav-label {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.rail-nav.expanded .nav-label,
.rail-nav:hover .nav-label {
  opacity: 1;
  transition: opacity var(--transition-fast) 0.1s; /* Slight delay for smoother effect */
}

.rail-nav-item {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--space-4);
  text-decoration: none;
  color: var(--text-secondary);
  transition: var(--transition-fast);
  position: relative;
}

.rail-nav-item:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.rail-nav-item.active {
  color: var(--accent-primary);
  background: var(--surface-accent-subtle);
}

.rail-nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--accent-primary);
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  flex-shrink: 0;
  margin-right: var(--space-3);
}

.nav-label {
  white-space: nowrap;
  font-size: var(--text-sm);
  font-weight: 500;
}

/* Expandable list styles */
.rail-nav-expandable {
  display: flex;
  flex-direction: column;
}

.expandable-header {
  cursor: default; /* No click interaction needed */
}

.expandable-content {
  padding-left: var(--space-6);
  border-left: 1px solid var(--border-subtle);
  margin-left: var(--space-6);
  margin-top: var(--space-1);
  padding-bottom: var(--space-2);
}

.rail-nav-subitem {
  display: block;
  padding: var(--space-1) var(--space-3);
  text-decoration: none;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  line-height: 1.4;
  transition: var(--transition-fast);
  border-radius: var(--border-radius-sm);
}

.rail-nav-subitem:hover {
  background: var(--surface-secondary);
  color: var(--text-secondary);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .rail-nav {
    transform: translateX(-100%);
    transition: transform var(--transition-base), width var(--transition-base), border-right var(--transition-base);
  }
  
  .rail-nav.mobile-open {
    transform: translateX(0);
    width: 280px;
    border-right: 0.25px solid rgba(255, 255, 255, 0.08);
  }
}
</style>

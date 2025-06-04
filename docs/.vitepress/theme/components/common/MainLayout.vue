<!-- MainLayout.vue - Material Design layout with app bar and rail nav -->
<script setup>
import { ref, computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import AppBar from './AppBar.vue'
import RailNav from './RailNav.vue'

const route = useRoute()
const { theme } = useData()

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showRailNav: {
    type: Boolean,
    default: true
  }
})

// Rail navigation items
const navItems = [
  { path: '/workbook/', label: 'Workbook', icon: 'BookOpen' },
  { path: '/pins/', label: 'Pins', icon: 'Pin' },
  { path: '/log/', label: 'Log', icon: 'FileText' },
  { path: '/notes/', label: 'Notes', icon: 'StickyNote' }
]

const currentPath = computed(() => route.path)

const emit = defineEmits(['menu-click'])

const handleMenuClick = () => {
  emit('menu-click')
}
</script>

<template>
  <div class="main-layout">
    <!-- App Bar -->
    <AppBar :title="title" @menu-click="handleMenuClick">
      <template #actions="{ handleActionClick }">
        <slot name="app-bar-actions" :handleActionClick="handleActionClick" />
      </template>
    </AppBar>

    <!-- Rail Navigation -->
    <RailNav 
      v-if="showRailNav"
      :items="navItems" 
      :current-path="currentPath"
    />

    <!-- Main Content -->
    <main class="main-content" :class="{ 'with-rail-nav': showRailNav }">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: var(--space-6);
  transition: margin-left var(--transition-base);
}

.main-content.with-rail-nav {
  margin-left: 72px; /* Rail nav width */
}

@media (max-width: 768px) {
  .main-content.with-rail-nav {
    margin-left: 0;
  }
}
</style>

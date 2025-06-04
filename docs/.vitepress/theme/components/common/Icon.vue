<!-- Icon.vue - Clean Lucide icon wrapper component -->
<script setup>
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 20
  },
  iconClass: {
    type: String,
    default: ''
  }
})

// Get the icon component dynamically
const IconComponent = LucideIcons[props.name]

// Warn if icon doesn't exist (dev mode)
if (!IconComponent && process.env.NODE_ENV === 'development') {
  console.warn(`Icon "${props.name}" not found in Lucide icons`)
}
</script>

<template>
  <component 
    v-if="IconComponent"
    :is="IconComponent" 
    :size="size"
    :class="['icon', iconClass]"
  />
  <!-- Fallback for missing icons -->
  <span v-else class="icon-fallback" :class="iconClass">
    {{ name }}
  </span>
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.icon-fallback {
  display: inline-block;
  font-size: 0.75em;
  opacity: 0.5;
}
</style>

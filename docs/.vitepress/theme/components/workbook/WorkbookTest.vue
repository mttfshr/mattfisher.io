<template>
  <div style="padding: 20px; border: 2px solid green; margin: 20px 0;">
    <h2>WorkbookTest Component</h2>
    <p>This is a simple test component to verify Vue component registration is working.</p>
    <p>Current time: {{ currentTime }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTime = ref('')

onMounted(() => {
  currentTime.value = new Date().toLocaleTimeString()
})
</script>

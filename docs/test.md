---
title: Test Page
---

<script setup>
import { useData } from 'vitepress'
import { ref, computed } from 'vue'

const { frontmatter, page, theme } = useData()
const data = computed(() => {
  return {
    frontmatter: frontmatter.value,
    page: page.value,
    theme: {
      workbookItems: theme.value.workbookItems
    }
  }
})

// Find the Obsidian Heart item from workbook items
const obsidianHeart = computed(() => {
  return theme.value.workbookItems?.find(item => item.slug === 'obsidian-heart') || null
})

const showInfo = ref(true)
</script>

# Test Page for Workbook Items

<div v-if="showInfo">
  <h2>Workbook Item Data:</h2>
  <pre>{{ JSON.stringify(obsidianHeart, null, 2) }}</pre>

  <h2>Embedded Video Test:</h2>
  <div v-if="obsidianHeart?.media?.type === 'video' && obsidianHeart?.media?.provider === 'vimeo'">
    <div style="padding-top: 56.25%; position: relative;">
      <iframe
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        :src="`https://player.vimeo.com/video/${obsidianHeart.media.url.match(/[0-9]+/)[0]}?title=0&byline=0&portrait=0`"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  </div>

  <h2>Raw Data:</h2>
  <pre>{{ JSON.stringify(data, null, 2) }}</pre>
</div>

<div>
  <button @click="showInfo = !showInfo">Toggle Debug Info</button>
</div>

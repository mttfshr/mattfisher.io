---
title: Debug Page
---

<script setup>
import { useData } from 'vitepress'

const { page, theme, frontmatter } = useData()
</script>

# Debug Information

## Page Data
```json
{{ JSON.stringify(page, null, 2) }}
```

## Theme Data
```json
{{ JSON.stringify(theme, null, 2) }}
```

## Frontmatter Data
```json
{{ JSON.stringify(frontmatter, null, 2) }}
```

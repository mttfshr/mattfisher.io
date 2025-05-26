# MattFisher.io - PROJECT_PATHS

This document outlines the development roadmap for MattFisher.io as a **Living Process Documentation** site with distinct sections for media works, brief updates, written reflections, and external references.

## Core Vision

This site presents:
- **Workbook**: Gallery of creative works (video, images, prints)
- **Log**: Brief updates and micro-blogging (3-4 sentences)
- **Notes**: Evolving written reflections when energy permits
- **Pins**: Curated external references and influences

Each section serves a distinct purpose with different presentation needs.

## Content-First Principles

### Portable Markdown Above All
- **Self-contained files**: Meaningful without any build system
- **Natural organization**: File structure that makes sense in any file browser
- **Future-proof writing**: Still readable in 20 years
- **No framework lock-in**: Works in Obsidian, VS Code, or plain text

### Section-Specific Needs

```yaml
# Workbook: Media-focused
---
title: Video Synth Performance
date: 2024-01-20
type: video
media:
  provider: vimeo
  url: https://vimeo.com/123456789
  thumbnail: ./thumbnails/video-synth.jpg
shop:
  available: true
  link: https://shop.mattfisher.io/...
brief: Live performance with no edits
---
Minimal text - let the work speak.

# Log: Micro-updates
---
date: 2024-01-20
---
Worked on new video synth patches today. The color interactions 
are getting more interesting when I modulate the frequency.

# Notes: Evolving thoughts
---
title: Thoughts on Video Synthesis
lastUpdated: 2024-01-20
status: evolving
---
Longer reflections that can grow over time...
```

## File Organization

```
mattfisher.io/
├── workbook/           # Media gallery
│   ├── videos/
│   │   ├── this-is-where-we-say-goodbye.md
│   │   └── obsidian-heart.md
│   ├── prints/
│   │   ├── smoking-frog.md
│   │   └── penrose-tiling.md
│   └── index.md
├── log/                # Brief updates
│   ├── entries.md      # All updates in one file
│   └── archive/        # Older entries if needed
│       └── 2023.md
├── notes/              # Written explorations
│   ├── video-synthesis-thoughts.md
│   ├── color-theory-exploration.md
│   └── index.md
└── pins/              # External references
    └── pins.md        # Single file works well
```

## Implementation Roadmap

### Phase 0: VitePress Utils Reorganization (Current Priority - 3-4 weeks)

#### 0.1 Microservices-Inspired Architecture Implementation
**IMMEDIATE PRIORITY**: Reorganize `.vitepress/utils/` for better maintainability
```
docs/.vitepress/utils/
├── services/         # Core business logic (content, media, cache, external)
├── workflows/        # Orchestration layer (pins, media, build workflows)  
├── shared/           # Pure utilities (html, media, filesystem)
└── maintenance/      # System housekeeping (archive, cleanup, migrate)
```

**Benefits Expected**:
- Eliminate 3+ duplicate thumbnail processors
- Clear service boundaries and single responsibilities
- Better developer experience and maintainability
- Foundation for faster future development

**Implementation Strategy**:
- Phase 1: Core services (media, content, cache)
- Phase 2: Workflow orchestration layer
- Phase 3: Cleanup and consolidation
- Phase 4: Testing and validation

This reorganization is **blocking workbook gallery development** and will provide a much better foundation for future features.

### Phase 1: Workbook Folio Foundation (After Utils Reorganization)

#### 1.1 Complete Workbook Gallery Experience
- **READY**: Implement chronological workbook folio view with focused presentation
- **READY**: Create curated collections system with friendly names and descriptions  
- **READY**: Add dynamic tag-based filtering with bookmarkable URLs
- **READY**: Integrate Cloudflare Images variants for optimized gallery thumbnails
- **READY**: Build collection grid view with seamless transitions to folio
- **READY**: Implement smooth navigation between folio ↔ collection views
- **READY**: Add keyboard navigation and mobile-optimized browsing experience

#### 1.2 Enhanced Gallery Views
Enhance workbook browsing:
```vue
<!-- WorkbookFolio.vue - Chronological focused presentation -->
<template>
  <div class="workbook-folio">
    <WorkbookNavigation :current="currentWork" />
    <WorkbookPresentation :work="currentWork" />
    <WorkbookTagPanel :tags="currentWork.tags" :collections="relatedCollections" />
  </div>
</template>

<!-- CollectionGrid.vue - Tag-based discovery -->
<template>
  <div class="collection-grid">
    <CollectionHeader :collection="collection" />
    <WorkbookGrid :items="filteredItems" />
    <RelatedCollections :tags="activeTags" />
  </div>
</template>
```

#### 1.3 Presentation Mode Polish
The existing presentation mode is perfect for workbook items:
- Ensure it works well with all media types
- Polish the transitions and controls
- Make it feel gallery-quality

### Phase 2: Streamline Log for Low-Friction Updates

#### 2.1 Simple Log Format
Keep it minimal for easy updates:
```markdown
---

# 2024-01-20

Discovered that modulating the color channels at different frequencies 
creates these amazing moiré patterns. Need to explore this more.

---

# 2024-01-19

First successful live performance with the new rig. Only crashed once!

---
```

#### 2.2 Chronological Display
```vue
<!-- LogFeed.vue -->
<template>
  <div class="log-feed">
    <article v-for="entry in recentEntries" :key="entry.date">
      <time>{{ formatDate(entry.date) }}</time>
      <div class="entry-content" v-html="entry.html" />
    </article>
  </div>
</template>
```

### Phase 3: Support Evolving Notes

#### 3.1 Natural Linking
Enable references between notes and to workbook items:
```markdown
<!-- notes/video-synthesis-thoughts.md -->
Thinking about the [recent performance](/workbook/videos/obsidian-heart) 
and how it relates to my [color theory exploration](./color-theory-exploration).
```

#### 3.2 Status Indicators
Simple status for notes that evolve:
- `evolving` - Still developing these thoughts
- `paused` - Not actively updating
- `stable` - Relatively complete thoughts

### Phase 4: Minimal Enhancement Plugins

Only build plugins that enhance natural patterns:

#### 4.1 Media Gallery Plugin
```typescript
// vitepress-plugin-media-gallery
// Enhances media display without changing content
export default {
  enhance({ app }) {
    app.component('MediaGallery', MediaGallery)
    app.component('MediaThumbnail', MediaThumbnail)
    app.component('ShopLink', ShopLink)
  }
}
```

#### 4.2 Natural Cross-References
```typescript
// vitepress-plugin-natural-refs
// Makes natural links between sections work
export default {
  markdown: {
    linkReferences: {
      '/workbook/': resolveWorkbookPath,
      '/notes/': resolveNotePath,
      '../': resolveRelativePath
    }
  }
}
```

## What We're NOT Building

To maintain focus and simplicity:

- ❌ Complex categorization systems
- ❌ Automated content generation
- ❌ Database-like features
- ❌ E-commerce (just links to external shop)
- ❌ Comments or social features
- ❌ Search beyond VitePress built-in
- ❌ Mobile posting workflow
- ❌ RSS/ActivityPub (unless trivial)

## Success Metrics

The site succeeds when:
- **Workbook** beautifully presents your media works
- **Log** captures thoughts with minimal friction
- **Notes** can evolve naturally over time
- **Pins** provide context without overwhelming
- Everything remains portable and future-proof

## Implementation Priority Matrix

| Feature | Section | Impact | Effort | Priority |
|---------|---------|--------|--------|----------|
| Cloudflare Images | Workbook | Critical | Low* | 🌟🌟🌟🌟🌟 |
| Gallery View | Workbook | High | Low | 🌟🌟🌟🌟🌟 |
| Presentation Polish | Workbook | High | Low | 🌟🌟🌟🌟 |
| Simple Log Format | Log | High | Low | 🌟🌟🌟🌟 |
| Shop Links | Workbook | Medium | Low | 🌟🌟🌟 |
| Natural Linking | All | Medium | Medium | 🌟🌟🌟 |
| Status for Notes | Notes | Low | Low | 🌟🌟 |

*Already mostly implemented

## Next Concrete Steps

### Week 1-4: VitePress Utils Reorganization (Current Focus)
1. **Phase 1**: Create core services (media, content, cache)
2. **Phase 2**: Implement workflow orchestration layer
3. **Phase 3**: Cleanup and consolidate duplicate files  
4. **Phase 4**: Testing and validation

### Week 5-6: Workbook Gallery Focus (After Reorganization)
1. Complete Cloudflare Images testing
2. Implement gallery grid view
3. Add type filtering (video/prints)
4. Ensure shop links work well

### Week 7-8: Log Simplification  
1. Establish simple log format
2. Create chronological display
3. Make adding entries frictionless
4. Style for readability

### Week 9-10: Polish & Integration
1. Ensure natural links work between sections
2. Polish presentation mode
3. Test everything with real content
4. Document conventions for future you

This approach prioritizes foundational architecture work before building new features, ensuring better maintainability and faster future development.
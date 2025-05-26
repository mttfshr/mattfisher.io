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

### Phase 0A: Design Token System Implementation (IMMEDIATE PRIORITY - 1 week)

#### 0A.1 Comprehensive Design Token System
**HIGHEST PRIORITY**: Implement design token system for consistency and maintainability
```
docs/.vitepress/theme/
├── tokens/           # Design token definitions
│   ├── spacing.css      # 8px grid-based spacing scale
│   ├── colors.css       # Semantic colors extending VitePress theme
│   ├── typography.css   # Minor third (1.2) ratio typography scale
│   ├── shadows.css      # Layered shadow system for depth
│   ├── transitions.css  # Consistent motion language
│   └── index.css        # Token aggregation and exports
├── components/       # Component pattern classes
│   ├── buttons.css      # .btn component patterns
│   ├── cards.css        # .card component patterns
│   ├── badges.css       # .badge component patterns
│   └── index.css        # Component class aggregation
└── utilities/        # Common layout and styling utilities
    ├── layout.css       # Flexbox/grid utilities
    ├── spacing.css      # Margin/padding utilities using tokens
    └── index.css        # Utility class aggregation
```

**Expected Impact**:
- **60% CSS reduction** through consolidation
- **80% faster development** for new components  
- **95% consistency** in spacing and typography
- **70% easier maintenance** with centralized tokens

**3-Week Implementation Plan**:
- **Week 1 - Phase 1**: High-impact components (WorkbookGallery.vue, PinCard.vue, WorkbookViewer.vue)
- **Week 2 - Phase 2**: Systematic migration (remaining workbook, pin, log components)
- **Week 3 - Phase 3**: Polish and validation (remove unused CSS, performance testing, documentation)

**Integration Benefits**:
- **Works with VitePress**: Extends existing theme variables seamlessly
- **Supports dark mode**: Semantic color tokens with CSS custom properties
- **Scales gracefully**: Add new tokens as needed without breaking changes
- **Improves accessibility**: Better focus states and contrast ratios

### Phase 0B: VitePress Utils Reorganization (After Design Tokens - 3-4 weeks)

#### 0B.1 Microservices-Inspired Architecture Implementation  
**SECONDARY PRIORITY**: Reorganize `.vitepress/utils/` for better maintainability
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

This reorganization is **secondary to design token implementation** and will provide a much better foundation for future features after CSS architecture is established.

### Phase 1: Workbook Folio Foundation (After Design Tokens & Utils Reorganization)

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

### Week 1: Design Token System Implementation (NEW HIGHEST PRIORITY)
1. **Create Design Token Foundation**: Implement spacing, color, typography, shadow, and transition token systems
2. **High-Impact Component Migration**: Update WorkbookGallery.vue (23 instances), PinCard.vue (18 instances), WorkbookViewer.vue (21 instances)
3. **Component Pattern Classes**: Implement reusable .btn, .card, .badge classes
4. **Utility Classes**: Create layout and spacing utilities using design tokens
5. **Dark Mode Integration**: Ensure semantic color tokens work with VitePress dark mode

### Week 2: Systematic Design Token Migration
1. **Remaining Workbook Components**: Migrate all workbook-related components to use design tokens
2. **Pin and Log Components**: Update pin and log components with token system
3. **Collection Components**: Migrate collection-related components
4. **CSS Consolidation**: Remove duplicate CSS and unused styles

### Week 3: Design Token Polish & Validation
1. **Performance Testing**: Measure CSS reduction and load time improvements
2. **Accessibility Audit**: Validate focus states and contrast improvements
3. **Documentation**: Create design token usage guide for future development
4. **System Validation**: Ensure 95% consistency in spacing/typography achieved

### Week 4-7: VitePress Utils Reorganization (After Design Tokens)
1. **Phase 1**: Create core services (media, content, cache)
2. **Phase 2**: Implement workflow orchestration layer
3. **Phase 3**: Cleanup and consolidate duplicate files  
4. **Phase 4**: Testing and validation

### Week 8-9: Workbook Gallery Focus (After Foundation Work)
1. Complete Cloudflare Images testing
2. Implement gallery grid view
3. Add type filtering (video/prints)
4. Ensure shop links work well

### Week 10-11: Log Simplification  
1. Establish simple log format
2. Create chronological display
3. Make adding entries frictionless
4. Style for readability

### Week 12-13: Polish & Integration
1. Ensure natural links work between sections
2. Polish presentation mode
3. Test everything with real content
4. Document conventions for future you

This approach prioritizes foundational architecture work before building new features, ensuring better maintainability and faster future development.
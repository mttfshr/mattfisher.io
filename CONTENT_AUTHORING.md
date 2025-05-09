# Content Authoring Guide for MattFisher.io

This guide explains how to create and edit content for your VitePress-powered site using the enhanced frontmatter system.

## Creating New Content

1. Create a new Markdown file in the appropriate directory (`docs/workbook/` or `docs/notes/`) with a kebab-cased filename:
   ```
   docs/workbook/my-new-project.md
   ```

2. Add frontmatter at the top of the file using one of these formats:

**For Workbook Items:**
```yaml
---
title: My Project Title
date: 2025-05-15
description: A brief description of the project.
tags: [tag1, tag2, tag3]
media:
  type: video  # can be: video, image, audio, gallery
  provider: vimeo  # for videos: vimeo or youtube
  url: https://vimeo.com/123456789
  embed: true
tech:
  - Technology 1
  - Technology 2
  - Technology 3
specs:
  resolution: 1920x1080 px
  frameRate: 60fps
  duration: 2:30
layout: workbookItem
---
```

**For Notes:**
```yaml
---
title: My Note Title
description: A brief description of the note.
createdAt: 2025-05-15  
lastModified: 2025-05-16
tags: [tag1, tag2, tag3]
image: /_media/my-note-image.jpg
layout: note
---
```

3. Write your content in pure Markdown below the frontmatter:

```markdown
# Title (will be displayed automatically)

## Section Heading

Your content here in pure Markdown...

## Another Section

More content...
```

## Editing Existing Content

When editing existing content, maintain the frontmatter structure at the top of the file. All styling and media embedding is handled automatically by the components.

## Converting Existing Content

To convert your existing HTML-heavy content to the new clean Markdown format, run:

```bash
node convert-to-enhanced-frontmatter.mjs
```

This script will:
1. Create backups of your existing files (`.bak` extension)
2. Extract metadata from both frontmatter and content
3. Move styling and HTML to the component layer
4. Create clean Markdown files with enhanced frontmatter

## Frontmatter Reference

### Workbook Item Frontmatter

| Field | Description | Type | Required |
|-------|-------------|------|----------|
| `title` | Content title | String | Yes |
| `date` | Publication date | Date (YYYY-MM-DD) | Yes |
| `description` | Brief description | String | Recommended |
| `tags` | Content tags | Array | Recommended |
| `media` | Media embedding info | Object | Optional |
| `media.type` | Type of media | String | Required if `media` is used |
| `media.provider` | For videos, the provider | String | Required for videos |
| `media.url` | URL to the media | String | Required if `media` is used |
| `media.embed` | Whether to embed it | Boolean | Optional (defaults to true) |
| `tech` | Technologies used | Array | Optional |
| `specs` | Technical specifications | Object | Optional |
| `layout` | Page layout to use | String | Must be `workbookItem` |

### Notes Frontmatter

| Field | Description | Type | Required |
|-------|-------------|------|----------|
| `title` | Note title | String | Yes |
| `description` | Brief description | String | Recommended |
| `createdAt` | Creation date | Date (YYYY-MM-DD) | Recommended |
| `lastModified` | Last update date | Date (YYYY-MM-DD) | Recommended |
| `tags` | Content tags | Array | Recommended |
| `image` | Featured image URL | String | Optional |
| `layout` | Page layout to use | String | Must be `note` |

## Building the Site

The system automatically processes your enhanced frontmatter during the build:

```bash
# Development server
npm run docs:dev

# Production build
npm run docs:build
```

## Benefits of Pure Markdown

- **Focus on content**: Just write in Markdown without worrying about HTML or styling
- **Consistency**: Styling is handled by components, not inline in content
- **Improved workflow**: Write in any Markdown editor or even directly on GitHub
- **Future-proof**: Separate content from presentation
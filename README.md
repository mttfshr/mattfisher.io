# Matt Fisher's Personal Website

This is a personal website built with [VitePress](https://vitepress.dev/), a static site generator powered by Vue.js.

## Features

### Log

A chronological feed of updates and thoughts, presented in chronological order.

### Workbook

A portfolio of creative work and projects, primarily focused on video synth projects.

### Pins

A collection of links to interesting content found across the web. Features include:

- **Simple Content Management**: Just add links with optional notes and tags in `pins/pins.md`
- **Automatic Type Detection**: Content types are inferred from URLs (music, video, code, etc.)
- **Rich Visual Display**: Each pin is presented with appropriate visuals based on its content type
- **Flexible Organization**: Browse by content type, tags, or view all pins at once
- **No Manual Metadata**: Add just a URL and get automatic thumbnails, titles, and descriptions

### Notes

Long-form content and documentation with support for rich media.

## Architecture

This site uses VitePress's native data handling capabilities and asset management:

- **Content as Data**: All content is stored in Markdown files with frontmatter metadata
- **VitePress Config Integration**: Data is processed at build time and accessible via `useData()` hook
- **Component-Based Rendering**: Vue components consume structured data for display
- **Plugin Enhancements**: Custom VitePress plugins for media handling and metadata extraction
- **Asset Management**: Media files stored in `_media` directory and symlinked to `public` for inclusion in the build

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

No additional build steps or data generation scripts are needed. Data is automatically processed from content files at build time.

### Asset Management

Media assets are stored in the `docs/media` directory and linked to the `public` directory to ensure they're included in the build:

```
docs/
├── media/         # Media files location
│   ├── thumbnails/ # Video thumbnails
│   └── ...         # Other media assets
├── public/         # Public assets directory
│   └── media -> ../media  # Symlink to media directory
```

This approach ensures that all media assets are properly included in the build output.

## Content Management

### Notes

Create Markdown files in the `docs/notes/` directory with frontmatter:

```markdown
---
title: Note Title
description: Brief description
tags: [tag1, tag2]
image: /_media/image.jpg
layout: note
---

Your note content here...
```

The last update time is automatically tracked by VitePress based on file modification time.

### Workbook Items

Create Markdown files in the `docs/workbook/` directory with frontmatter:

```markdown
---
title: Project Title
description: Description
date: YYYY-MM-DD
layout: workbookItem
tags: [tag1, tag2]
media:
  type: video|image|audio|gallery
  provider: vimeo|youtube (for videos)
  url: https://...
  embed: true|false
---

Project content here...
```

Thumbnails for video content are automatically generated during build.

### Adding New Pins

Edit the `docs/pins/pins.md` file and add new links in this format:

```markdown
## Section Name (optional)

- https://example.com/some-link
  Optional notes about the link #tag1 #tag2
```

The system will automatically:
1. Extract metadata from the URL
2. Infer the content type
3. Apply appropriate styling
4. Add to collections based on tags

### Log Entries

Edit the `docs/log/entries.md` file to add new entries:

```markdown
# YYYY-MM-DD: Update Title
Your update content here...

---

# YYYY-MM-DD: [Pin Title](https://example.com)
Your notes about this pin #tag1 #tag2
```

## License

All content is copyright © Matt Fisher unless otherwise noted.

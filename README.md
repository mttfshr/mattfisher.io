# Matt Fisher's Personal Website

This is a personal website built with [VitePress](https://vitepress.dev/), a static site generator powered by Vue.js.

## Features

### Log

A chronological feed of updates and thoughts.

### Workbook

A portfolio of creative work and projects.

### Pins

A collection of links to interesting content found across the web. Features include:

- **Simple Content Management**: Just add links with optional notes and tags in `pins/pins.md`
- **Automatic Type Detection**: Content types are inferred from URLs (music, video, code, etc.)
- **Rich Visual Display**: Each pin is presented with appropriate visuals based on its content type
- **Flexible Organization**: Browse by content type, tags, or view all pins at once
- **No Manual Metadata**: Add just a URL and get automatic thumbnails, titles, and descriptions

### Notes

Long-form content and documentation.

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

## Content Management

### Adding New Pins

Edit the `docs/pins/pins.md` file and add new links in this format:

```markdown
- https://example.com/some-link
  Optional notes about the link #tag1 #tag2
```

The system will automatically:
1. Extract metadata from the URL
2. Infer the content type
3. Apply appropriate styling
4. Add to collections based on tags

No need to manually add titles, descriptions, or thumbnails - they're all pulled automatically from the URL's Open Graph data.

## License

All content is copyright © Matt Fisher unless otherwise noted.

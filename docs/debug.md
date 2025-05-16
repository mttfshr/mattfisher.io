---
title: VitePress Public Assets Diagnostics
---

# VitePress Public Assets Diagnostics

This page helps diagnose problems with the public assets directory in VitePress.

## Asset Test Results

<AssetDiagnostics />

## Manual Tests

Try accessing these URLs directly:

- [Test file](/public-fix-test.txt)
- [Vimeo thumbnail](/media/thumbnails/vimeo-552620356.jpg)
- [Sample thumbnail](/media/thumbnails/sample-thumbnail.jpg)
- [Video placeholder](/media/video-placeholder.svg)

## Directory Structure (Correct)

The correct directory structure for VitePress public assets is:

```
docs/
  .vitepress/
    public/         <-- This is where static assets should go
      media/
        thumbnails/
          vimeo-123456789.jpg
          youtube-abcdefghi.jpg
        placeholder.jpg
      other-assets/
        file.pdf
```

## Technical Details

VitePress expects static assets to be in `.vitepress/public/` but our site had them in `docs/public/` instead.

When using static assets in your components, reference them with paths like:

```vue
<img src="/media/thumbnails/vimeo-123456789.jpg" alt="Thumbnail">
```

VitePress will correctly resolve these paths to the files in `.vitepress/public/`.


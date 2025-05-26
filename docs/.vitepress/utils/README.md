# VitePress Utils Directory

This directory contains **VitePress-specific utilities** that integrate with the build system and handle site content processing.

## Purpose

**VitePress Site Utilities** - Tools that are tightly integrated with the VitePress build process:
- Process site content, markdown files, and frontmatter
- Handle API connectors that fetch external data for the site
- Generate build-time assets, caches, and metadata
- Manage site-specific functionality and maintenance

## Organization

### API Connectors (`connectors/`)
External service integrations for fetching pins data:
- **`spotify.js`**, **`vimeo.js`**, **`youtube.js`** - Platform-specific connectors
- **`auth.js`**, **`verify.js`** - Unified authentication and verification
- **`index.js`** - Connector orchestration and management

### Content Processing
- **`improvedOGCache.js`** - Generate OpenGraph metadata cache for pins
- **`getPins.js`** - Extract and process pins data from markdown
- **`mediaUtils.js`** - Media file processing utilities

### Video Thumbnail Processing
- **`generateVimeoPinThumbnails.js`** - Vimeo thumbnail processing
- **`updateYouTubeThumbnails.js`** - YouTube thumbnail processing
- **`update-vimeo-pins.js`**, **`update-youtube-pins.js`** - Full workflow scripts

### Build Process
- **`generateFavicons.js`** - Generate site favicons and icons
- **`ensurePublicCache.js`** - Ensure cache directories exist
- **`verifyBuild.js`** - Verify build output and functionality

### Maintenance
- **`archiveSessionNotes.js`** - Archive old session notes
- **`fixVimeoDescriptions.js`** - HTML entity cleanup utility

## Usage

These utilities are called via npm scripts during the build process:

```bash
# Content updates
npm run update-pins              # Fetch all external content
npm run generate-og-cache        # Generate metadata cache

# Full workflows  
npm run update-vimeo-full        # Complete Vimeo update process
npm run update-youtube-full      # Complete YouTube update process

# Build preparation
npm run prebuild                 # Full pre-build process
```

## Relationship to `/scripts/`

**Key Distinction**:
- **`/scripts/`** = Standalone utilities that work independently
- **`/docs/.vitepress/utils/`** = VitePress-integrated utilities

For general-purpose utilities that don't need VitePress integration, use `/scripts/` instead.

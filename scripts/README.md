# Scripts Directory

This directory contains **standalone project utilities** that work independently of the VitePress build system.

## Purpose & Organization

### `/scripts/` - Standalone Project Utilities
**Purpose**: General-purpose tools that can be used independently
**Characteristics**:
- Work with external services (Cloudflare, APIs)
- Reusable across different projects  
- Not tied to VitePress build process

### `/docs/.vitepress/utils/` - VitePress Site Utilities
**Purpose**: VitePress-specific build and content processing
**Characteristics**:
- Integrated with VitePress build system
- Process site content, markdown, frontmatter
- Handle API connectors for site data
- Generate build-time assets and caches

## Contents

### Cloudflare Images Integration
- **`upload-media.js`** - Main upload utility for NAS → Cloudflare migration
- **`upload-media-enhanced.js`** - Enhanced version with additional features

### Video Thumbnail System  
- **`video-thumbnail-processor.js`** - Unified video thumbnail processing engine
- **`test-unified-thumbnails.js`** - Comprehensive test suite for video system

### Connectivity & Testing
- **`test-connectivity.js`** - Test Cloudflare API connection and configuration

### Migration Utilities
- **`cleanup-migrated-thumbnails.js`** - Clean up local files after Cloudflare migration

## Usage

All scripts are designed to be run via npm scripts:

```bash
# Cloudflare Images
npm run upload-media <directory>     # Upload media files
npm run test-connectivity           # Test Cloudflare connection

# Video Thumbnails  
npm run test-unified-thumbnails     # Test video thumbnail system

# Development utilities are called by other scripts
```

## Architecture

These scripts follow a **modular, reusable design**:
- **Self-contained**: Each script handles its own dependencies and configuration
- **CLI-friendly**: Proper argument parsing and help messages
- **Error handling**: Comprehensive error reporting and graceful failures
- **Dry-run support**: Most scripts support `--dry-run` for testing
- **Environment-based**: Use `.env` for configuration

## Related Documentation

- **NPM Scripts Guide**: `project/NPM_SCRIPTS.md` - Complete guide to all available scripts
- **Cloudflare Setup**: `project/CLOUDFLARE_IMAGES_SETUP.md` - Cloudflare Images configuration
- **VitePress Utils**: `docs/.vitepress/utils/` - Site-specific utilities and build tools

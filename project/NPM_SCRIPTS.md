# NPM Scripts Reference

This document explains the available npm scripts for developing and maintaining mattfisher.io.

## Development Scripts

### Core VitePress
- `npm run docs:dev` - Start development server
- `npm run docs:build` - Build for production
- `npm run docs:preview` - Preview production build
- `npm run rebuild` - Build and preview (quick rebuild)

### Testing
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:ui` - Open Vitest UI

## Content Management Scripts

### Pins (External Content)
- `npm run update-pins` - Update all pins from APIs
- `npm run update-pins:spotify` - Update Spotify pins only
- `npm run update-pins:vimeo` - Update Vimeo pins only  
- `npm run update-pins:youtube` - Update YouTube pins only

### Video Thumbnails (Unified System)
- `npm run update-vimeo-full` - Complete Vimeo workflow (pins + cache + thumbnails)
- `npm run update-youtube-full` - Complete YouTube workflow (pins + cache + thumbnails)
- `npm run update-vimeo-thumbnails` - Process Vimeo thumbnails only
- `npm run update-youtube-thumbnails` - Process YouTube thumbnails only

### Cache Management
- `npm run generate-og-cache` - Generate OpenGraph cache for all pins
- `npm run generate-og-cache:force` - Force regenerate all cache entries
- `npm run ensure-cache` - Ensure cache directories exist

## Media & Assets

### Cloudflare Images
- `npm run upload-media <directory>` - Upload media files to Cloudflare Images
- `npm run test-connectivity` - Test Cloudflare API connection
- `npm run test-unified-thumbnails` - Test unified video thumbnail system

### Build Assets
- `npm run generate-favicons` - Generate favicons and icons
- `npm run prebuild` - Full pre-build process (pins + cache + assets)
- `npm run prebuild:minimal` - Minimal pre-build (cache + assets only)

## Authentication & Verification

### Setup Authentication
- `npm run auth spotify` - Authenticate with Spotify API
- `npm run auth youtube` - Authenticate with YouTube API

### Verify Configuration
- `npm run verify spotify` - Verify Spotify API configuration
- `npm run verify vimeo` - Verify Vimeo API configuration
- `npm run verify youtube` - Verify YouTube API configuration
- `npm run verify all` - Verify all API configurations

## Maintenance Scripts

### Project Management
- `npm run archive-sessions` - Archive old session notes from PROJECT_SUMMARY.md
- `npm run verify-build` - Verify build output and functionality

## Typical Workflows

### Setting Up a New API Service
1. `npm run auth <service>` - Get authentication tokens
2. `npm run verify <service>` - Verify configuration
3. `npm run update-pins:<service>` - Test fetching data

### Content Update Workflow
1. `npm run update-pins` - Fetch latest external content
2. `npm run generate-og-cache` - Update metadata cache
3. `npm run update-vimeo-full` or `npm run update-youtube-full` - Process video thumbnails
4. `npm run docs:build` - Build site

### Pre-Deployment
1. `npm run prebuild` - Complete preparation
2. `npm run docs:build` - Final build
3. `npm run verify-build` - Verify everything works

### Development Workflow
1. `npm run docs:dev` - Start development server
2. Make changes
3. `npm test` - Run tests
4. `npm run rebuild` - Test production build

## Script Organization

### Directory Structure
The project uses a **two-folder approach** for script organization:

#### `/scripts/` - Standalone Project Utilities
**Purpose**: General-purpose tools that work independently of VitePress
**Examples**: `upload-media.js`, `video-thumbnail-processor.js`, `test-connectivity.js`
**Characteristics**:
- Work with external services (Cloudflare, APIs)
- Reusable across different projects
- Not tied to VitePress build process

#### `/docs/.vitepress/utils/` - VitePress Site Utilities  
**Purpose**: VitePress-specific build and content processing tools
**Examples**: `improvedOGCache.js`, `connectors/`, `generateFavicons.js`
**Characteristics**:
- Integrated with VitePress build system
- Process site content, markdown, frontmatter
- Handle API connectors for site data
- Generate build-time assets and caches

### Authentication
Authentication is consolidated into platform-agnostic scripts:
- `auth.js` handles multiple platforms
- `verify.js` can check individual or all platform configurations
- Original platform-specific scripts remain available as imports

### Removed Scripts
These scripts were removed during cleanup:
- `migrate-thumbnails` - One-time migration, no longer needed
- `fix-vimeo-descriptions` - Specific HTML entity fix, completed
- `rebuild` (old) - Referenced non-existent `enhanced-fix`
- Individual auth scripts - Consolidated into unified `auth` script
- Platform-specific cache scripts - YouTube/Vimeo full workflows handle caching internally
- `/docs/.vitepress/scripts/` directory - Contained duplicate and obsolete utilities

## Architecture Notes

### Video Thumbnails
The video thumbnail system is now fully unified using the `VideoThumbnailProcessor` class:
- All platforms (YouTube, Vimeo) use the same processing logic
- Automatic fallback to local thumbnails for migration
- Cloudflare Images integration for CDN delivery
- Comprehensive error handling and logging

# MattFisher.io Project Summary

## Project path: '~/Github/mattfisher.io/'

## Context Continuity

This document serves as a "crib note" for Claude in each new conversation. Due to conversation context limits, Claude cannot access previous conversations, so this document maintains continuity across sessions.

**Instructions for Claude:**
1. Always refer to this document at the beginning of a new conversation
2. Update memory with the project path and context
3. Update this document when approaching context limits
4. Alert Matt when context limits are about to be reached
5. Prioritize information in the "Current Task" section when resuming work
6. Do not suggest changes to the document structure or content
7. The Next task to work on is always the first item in the "Next Steps" section
8. Confirm that you understand the instructions and are ready to proceed

**Instructions for Matt:**
1. Share this document at the start of each new conversation
2. Ask Claude to update the "Current Task" and "Session Notes" sections when nearing context limits

## Current Task

**Working on:** Improve OG Data Caching
**Status:** Not Started
**Plan:**
- Implement incremental OG data updates for new pins
- Create a more robust error handling system for OG data fetching
- Consider implementing a local image cache for external thumbnails
- Add metadata to indicate when OG data was last refreshed

**Implementation Steps:**
1. Analyze current OG data caching implementation
2. Design an incremental update approach that only fetches data for new pins
3. Improve error handling to gracefully handle API failures
4. Create a metadata system to track freshness of cached data
5. Consider implementing a local thumbnail cache to reduce external dependencies

## Next Steps

### 2. Optimize Cache Directory Structure
- Establish clear standards for cache file organization
- Document cache structure and usage for future reference
- Implement automated cache cleanup for unused assets

### 3. Add Additional Monitoring
- Create diagnostic tools to verify asset rendering
- Implement checks to ensure layouts are loading correctly
- Add a basic status page for site operation
- Explore lazy-loading for large image galleries
- Add SSR optimizations for better performance
- Consider implementing content search feature using VitePress's built-in search
- Explore ways to minimize plugin duplication (videoThumbnails plugin runs twice)

## Session Notes

### May 15, 2025 - Session 30 Summary
- Successfully implemented Side-by-Side Filters UI for Types and Collections
- Created responsive layout with filters sidebar and content area
- Built TypeFilter component for filtering pins by content type
- Implemented CollectionsBrowser component with visual type distribution indicators
- Added ActiveFilters component to manage and display active filters
- Fixed data transformation to convert raw pins data to component-friendly format
- Resolved template rendering issues with improved error handling
- Added robust null checks and default values to prevent rendering errors
- Enhanced PinsLayout component to correctly apply full-width styles
- Implemented responsive mobile design with collapsible filters sidebar
- Verified functionality with real pins data from Spotify, Vimeo, etc.

### May 15, 2025 - Session 29 Summary
- Planned implementation of enhanced pins filtering UI
- Designed UI with dual facets: inferred content types and collections
- Selected Side-by-Side Filters layout approach (Option 1)
- Created detailed implementation plan for enhanced filtering experience
- Developed strategy for distinct visual language between types and collections
- Planned data processing enhancements for types and collections statistics
- Designed reactive filtering system to support both facets individually and combined

### May 15, 2025 - Session 26 Summary
- Fixed Vue rendering errors with custom layouts
- Resolved "Cannot read properties of null (reading 'ce')" errors in Layout component
- Fixed PinsLayout.vue to remove problematic slot rendering
- Updated Layout.vue to include proper slot handling
- Registered all custom layouts properly in theme/index.mts
- Imported additional layout components missing from the theme
- Ensured consistent pattern across all custom layouts
- Applied debugging approach to identify and resolve component slot issues
- Cleared VitePress cache to resolve stale component definitions

### May 14, 2025 - Session 21 Summary
- Designed architecture for automated pins updates via API connectors
- Created plan to fetch favorites from Spotify, Vimeo, and YouTube APIs
- Selected .env approach for securely managing API credentials
- Designed connector structure in .vitepress/utils/connectors/
- Planned for hybrid approach with both manual pins.md and auto-generated service files
- Added error handling and fallback strategies for API failures
- Documented implementation steps including:
  - Setting up dotenv for environment variables
  - Creating service-specific connector scripts
  - Implementing main connector orchestration script
  - Updating build process to run connectors before build
  - Adding service credentials setup documentation
- Updated PROJECT_SUMMARY.md with new implementation plan
- Prioritized API connectors as the next development task

### May 12, 2025 - Session 20 Summary
- Fixed VitePress rendering issues with custom layouts and thumbnails
- Fixed NoteLayout not rendering by properly registering custom layouts in theme/index.mts
- Created OG data cache generation script for pins thumbnails
- Added new npm script for generating OG cache (npm run generate-og-cache)
- Installed jsdom dependency for HTML parsing in OG cache generation
- Identified and fixed issues with missing cache files
- Ensured the cache and dist directories were properly cleaned before rebuilding
- Created a more resilient approach to theme layout registration

### May 12, 2025 - Session 19 Summary
- Fixed Vue component rendering errors
- Resolved "Cannot read properties of null (reading 'ce')" error in Layout.vue
- Updated Layout.vue to properly handle default slots vs named slots
- Fixed public directory asset path inconsistencies in WorkbookGallery
- Successfully built and deployed site with VitePress standard directory
- Updated PROJECT_SUMMARY.md with next steps for cleanup and optimization
- Standardized on docs/public as the canonical assets location

### May 12, 2025 - Session 18 Summary
- Analyzed VitePress documentation regarding public assets directory
- Discovered discrepancy between VitePress standards and our configuration
- Found that VitePress documentation specifies `docs/public/` as the standard, while our configuration uses `docs/.vitepress/public/`
- Updated config.mts to move cache directory outside of docs/ for cleaner structure
- Created a plan to test which public directory location VitePress actually uses
- Developed approach to standardize on VitePress conventions for better maintainability
- Next steps: Create test script to verify asset serving from both locations and adjust accordingly

### May 12, 2025 - Session 17 Summary
- Identified critical issue with VitePress public directory location
- Assets in `docs/public` instead of `.vitepress/public` causing 404 errors
- Created diagnostic script to analyze VitePress structure
- Developed fix script to copy assets to the correct location
- Created comprehensive guide for fixing the issue
- Fixed both directory structure and path reference issues
- Added verification steps to confirm the fix works

### May 12, 2025 - Session 16 Summary
- Identified specific path duplication bug in thumbnail URLs
- Created targeted fix focused on the actual issue
- Added cleanup script to remove duplicate thumbnail directory
- Created mock components to avoid path duplication in tests
- Implemented comprehensive fix process with `npm run fix-everything`
- Created focused PATH_DUPLICATION_FIX.md with specific instructions
- Ready for execution of the targeted fix process

### May 12, 2025 - Session 15 Summary
- Fixed issues with testing framework path resolution
- Addressed missing files in test environment
- Fixed Vue component testing with proper render methods
- Created directory setup utility to ensure consistent environment
- Added single-command solution with `npm run fix-all`
- Improved documentation with additional manual steps
- Ready for execution of the fix process

### May 12, 2025 - Session 14 Summary
- Implemented comprehensive testing framework for thumbnail issues
- Set up Vitest for unit testing components and utilities
- Configured Playwright for E2E testing across browsers
- Created detailed diagnostic tools for thumbnail path inconsistencies
- Developed automatic fix script to standardize paths
- Added CI/CD workflow with GitHub Actions
- Created detailed step-by-step guides for resolving thumbnail issues
- Ready for next phase: running diagnostics and applying the fix

### May 12, 2025 - Session 13 Summary
- Identified persistent thumbnail display issues in production and development environments
- Attempted to standardize thumbnail paths across components and plugins
- Refocused approach to implement testing frameworks for systematic issue identification
- Added testing recommendations to PROJECT_SUMMARY.md
- Selected Vitest for unit testing and Playwright for E2E testing
- Began test implementation to identify and fix thumbnail issues

### May 11, 2025 - Session 12 Summary
- Fixed the build error in Cloudflare's pipeline
- Modified videoThumbnails plugin to copy files instead of relying on symlinks
- Added code to create the public/media directory structure during build
- Ensured thumbnails are properly copied to both media/ and public/media/ locations
- Enhanced error handling in the plugin to avoid build failures

### May 11, 2025 - Session 11 Summary
- Renamed directory from 'media-' to 'media' for better naming convention
- Updated all code references to use the standard 'media' directory name
- Modified paths in WorkbookGallery.vue, config.mts, and plugin code
- Removed old symlinks and ensured new symlinks use the correct path
- Verified thumbnails display correctly with the new directory structure

### May 11, 2025 - Session 10 Summary
- Fixed issue with thumbnails not displaying by setting thumbnailUrl directly in config.mts
- Added extractVimeoId and extractYouTubeId functions to config.mts
- Added debug logging to track down thumbnail issues
- Updated WorkbookGallery.vue to prioritize thumbnailUrl from config
- Verified thumbnails now display correctly in both dev mode and production

### May 11, 2025 - Session 9 Summary
- Fixed thumbnail display issue by renaming _media to media- directory
- Updated all references to the new directory name in components and plugin code
- Fixed ES module compatibility issues in config.mts by replacing __dirname references
- Created symlink in public directory to ensure thumbnails are accessible
- Improved handling of thumbnails in development mode
- Verified thumbnails are now displaying correctly in the workbook gallery

### May 11, 2025 - Session 8 Summary
- Fixed issue with video thumbnails not appearing in the workbook gallery
- Created a public directory with a symlink to _media to ensure assets are included in the build
- Verified thumbnails now appear correctly in the workbook gallery
- Identified and documented VitePress asset handling behavior

### May 11, 2025 - Session 7 Summary
- Deleted obsolete _scripts directory
- Removed unused data files and caching mechanisms
- Removed enhancedMetadataExtractorPlugin from config
- Updated README.md with comprehensive build instructions
- Verified build process works correctly with new architecture
- Updated PROJECT_SUMMARY.md with completed tasks
- Proposed next steps for potential future optimizations

### May 11, 2025 - Session 6 Summary
- Completed the Video Thumbnails plugin update for VitePress-native data handling
- Rewrote videoThumbnails plugin to work with themeConfig data
- Fixed access to theme configuration by using buildStart hook instead of configResolved
- Updated fetchThumbnails.js to process workbookItems from themeConfig
- Enhanced mediaUtils.js to handle the new thumbnail URLs
- Updated WorkbookGallery.vue to support both direct thumbnailUrl and computed thumbnails
- Created implementation guide and architecture recommendations
- Added Spotify playlists to pins.md
- Ready to perform final cleanup of legacy code

### May 11, 2025 - Session 5 Summary
- Completed cleanup of pins migration
- Deleted old generatePinsData.js script
- Removed pins-related data file (pinsData.js)
- Verified build and development processes work without these files
- Ready to move on to updating the Video Thumbnails plugin

### May 11, 2025 - Session 4 Summary
- Successfully implemented VitePress-native pins section 
- Created `getPins()` utility function in .vitepress/utils
- Added pins data to themeConfig in config.mts
- Updated PinCollections.vue to use theme.value.pins
- Updated usePinsData.js to use VitePress's useData composable
- Updated pins/index.md to use VitePress's data flow
- Created implementation instructions with testing and cleanup steps
- Removed dependency on generatePinsData.js script

### May 11, 2025 - Session 3 Summary
- Analyzed VitePress native functionality
- Discovered createContentLoader() API for content processing
- Developed approach to leverage VitePress features where possible
- Created implementation plan for pins section migration
- Recommended progressive migration strategy
- Key recommendations:
  1. Use createContentLoader() for workbook/notes (file-based content)
  2. Keep custom processing for pins/log (aggregated content)
  3. Access all data via useData() composable
  4. Leverage VitePress's built-in lastUpdated

### May 11, 2025 - Session 2 Summary
- Successfully transitioned Workbook section to use native VitePress features
- Created getWorkbookItems() function in config.mts
- Added workbook items to theme configuration
- Updated workbook/index.md to use theme.value.workbookItems
- Temporarily disabled videoThumbnails plugin during the transition

### May 11, 2025 - Session 1 Summary
- Successfully transitioned Log section to use native VitePress features
- Modified config.mts to include logEntries in theme configuration
- Updated log/index.md to use theme.value.logEntries
- Removed dependency on generateLogEntries.js script
- Updated scripts in package.json to eliminate data generation dependency

### May 10, 2025 - Session 2 Summary
- Successfully transitioned Notes section to use native VitePress features
- Modified NotesIndex and NoteCard components to use lastUpdated
- Updated NoteLayout to use VitePress's $page.lastUpdated
- Eliminated need for manual date tracking in notes frontmatter
- Updated config.mts to include lastUpdated timestamp in notes data
- Updated documentation to reflect the changes

### May 10, 2025 - Session 1 Summary
- Renamed NotesGrid component to NotesIndex
- Discussed transitioning to native VitePress features
- Identified the need to replace generateNotesData.js
- Explored options for leveraging VitePress's $page.lastUpdated
- Developed approach for eliminating manual date tracking in notes frontmatter

## Testing Framework Recommendations

### 1. Unit Testing with Vitest

**Benefits of Vitest for This Project:**
- **Vue Ecosystem Alignment**: Created by the same team behind Vite and Vue
- **VitePress Compatibility**: Works seamlessly with VitePress's Vite-based setup
- **Fast Execution**: Uses Vite's dev server for extremely fast test runs
- **Vue Component Testing**: Native support for testing Vue components
- **Simple Configuration**: Minimal setup required since the project already uses Vite

**Recommended Test Coverage:**
- Utility functions (mediaUtils.js)
- Vue components with thumbnail rendering
- Data transformation functions
- Path generation and URL handling

### 2. E2E Testing with Playwright

**Benefits of Playwright for This Project:**
- **Cross-browser Support**: Tests Chrome, Firefox, Safari with the same code
- **Visual Testing**: Captures screenshots for visual regression testing
- **Component Testing**: Direct support for Vue component testing
- **Network Interception**: Can mock network requests for thumbnail fetching
- **Comprehensive Tracing**: Detailed debugging information

**Recommended Test Coverage:**
- Full page rendering and navigation
- Thumbnail loading in actual browser context
- Asset loading verification
- Visual regression for UI components
- Development and production build differences

### 3. Testing Implementation Strategy

**Phase 1: Setup & Basic Tests**
- Configure Vitest for unit testing
- Set up Playwright for E2E testing
- Create basic smoke tests for critical pages

**Phase 2: Thumbnail-Specific Tests**
- Test thumbnail URL generation
- Verify image loading in components
- Test fallback behavior when thumbnails are missing
- Compare paths between development and production

**Phase 3: Visual Testing**
- Implement visual comparison tests
- Verify thumbnail rendering across browsers
- Test responsive behavior of galleries

**Phase 4: CI Integration**
- Add GitHub Actions workflow for automated testing
- Run tests on pull requests
- Create test reports and artifact collection

## VitePress-Native Approach Recommendations

### Benefits of VitePress-Native Data Handling

1. **Better Performance**: VitePress's native data handling is optimized for performance and caching.

2. **Simplicity**: By leveraging VitePress features, we eliminate many custom scripts and simplify the codebase.

3. **Maintainability**: Fewer moving parts means less maintenance overhead and fewer potential points of failure.

4. **Future-Proofing**: Staying aligned with VitePress's design patterns ensures compatibility with future updates.

5. **Improved Developer Experience**: The development workflow is streamlined with fewer build steps.

### Key Changes in This Approach

1. **Content Loading**:
   - Use `createContentLoader()` for workbook and notes (file-based content)
   - Maintain custom processing only where necessary (pins, log)

2. **Data Organization**:
   - All data is now in themeConfig
   - Components access data through useData() composable
   - No more separate data files

3. **Last Updated Tracking**:
   - Leverage VitePress's built-in lastUpdated feature
   - Eliminate manual date tracking in frontmatter

### Implementation for Video Thumbnails Plugin

For the video thumbnails plugin specifically:

1. Modify the plugin to access workbook data from themeConfig
2. Update the plugin to be aware of the new data structure
3. Ensure thumbnails are still generated correctly for video items
4. Test with both new and existing workbook items


## Project Architecture

This is a personal website built with VitePress (Vue-based static site generator) with the following main sections:

1. **Workbook**: Portfolio of creative work, primarily video synth projects
2. **Notes**: Long-form content and documentation
3. **Pins**: Curated collection of links (bookmarks)
4. **Log**: Chronological feed combining updates and pins

The site uses a content generation pipeline with Node.js scripts that process Markdown files to generate data files used by Vue components.

## Content Type Differentiation

The project uses two distinct content approaches based on the type of content:

### 1. Low-Friction Content (Pins & Log Updates)
- **Priority**: Ease of data entry
- **Format**: Minimal structure, often just a single line
- **Implementation**:
  - **Pins**: Just URL with optional notes/hashtags below
  - **Log Updates**: Simple date-prefixed entries in consolidated file
- **Data Extraction**: Auto-extraction of metadata and tags from content

### 2. Rich Content (Workbook & Notes)
- **Priority**: Comprehensive metadata and structure
- **Format**: Enhanced frontmatter with nested objects
- **Implementation**:
  - **Workbook**: Full media object structure with type/provider/url
  - **Notes**: Metadata for relationships, timestamps, and categorization
- **Data Processing**: Preserves nested structure throughout the pipeline


## Project Structure

```
docs/
├── .vitepress/
│   ├── theme/
│   │   ├── components/
│   │   │   ├── common/      # Shared utility components
│   │   │   ├── log/         # Log-related components
│   │   │   ├── notes/       # Notes-related components
│   │   │   ├── pins/        # Pins-related components
│   │   │   └── workbook/    # Workbook-related components
│   │   ├── layouts/         # Page layouts extending VitePress
│   │   ├── composables/     # Shared logic hooks
│   │   └── styles/          # CSS styling
│   ├── utils/               # Utility functions for content processing
│   └── config.mts           # VitePress configuration
├── _media/                  # Media assets (images, videos, etc.)
├── log/                     # Log content files
├── notes/                   # Notes content files
├── pins/                    # Pins content files
└── workbook/                # Workbook content files
```

## Component Organization

The project has a clear separation between layouts and components:

- **Layouts**: (`/docs/.vitepress/theme/layouts/`) Control page-level structure and extend VitePress core layouts
  - `Layout.vue`: Main router layout that conditionally renders other layouts
  - `WorkbookItemLayout.vue`: Single workbook item page
  - `NoteLayout.vue`: Single note page
  - `PinsLayout.vue`: Pins collection page
  - etc.

- **Components**: (`/docs/.vitepress/theme/components/`) Provide UI elements and functionality
  - Organized by section: workbook, notes, pins, log, common
  - Each section contains components specific to that section
  - `/components/common/` contains utility components used across sections

## Design Patterns & Principles

- **Content as Data**: Raw content is stored in Markdown with frontmatter metadata
- **Content Transformation**: Scripts transform raw content into structured data
- **Component-Based Rendering**: Vue components consume structured data for display
- **Separation of Concerns**: 
  - Layouts handle page structure
  - Components handle individual UI elements
  - Composables handle shared logic
- **Progressive Enhancement**: Basic content works without JavaScript, enhanced with Vue when available

## Naming Conventions

- Components use PascalCase (e.g., `NoteCard.vue`)
- Files use kebab-case (e.g., `generate-notes-data.js`)
- Component names reflect their purpose/section (e.g., `WorkbookItem.vue`)
- Collection components use plural names (e.g., `NotesGrid`)
- Single item components use singular names (e.g., `NoteCard`)
- Common utility components may use descriptive names (e.g., `EnhancedMarkdown`)

## Content Structure

### Workbook Items
```
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
```

### Notes
```
---
title: Note Title
description: Brief description
tags: [tag1, tag2]
image: /_media/image.jpg
layout: note
---
```

Note: The last update time is automatically tracked by VitePress (via its native `lastUpdated` feature) based on file modification time or Git history.

### Pins
Simple markdown list in `pins.md` with links and optional notes, processed to extract rich metadata.

### Log
Combination of pins and updates, displayed in chronological order.

## Current Focus

1. Implementing robust OG data caching for pins
2. Optimizing cache directory structure
3. Adding monitoring tools for asset and layout verification
4. Improving performance with lazy-loading and SSR optimizations

## Implementation Notes

- The site now uses VitePress's native data handling for all content types
- All data is accessed through the useData() composable and themeConfig
- Media embedding is handled automatically based on frontmatter configuration
- Vue components have been updated to use the new data flow
- OG data is cached to improve performance and reduce API calls
- Media assets are organized in `_media/` directory for easy reference in content
- CSS and other assets are contained in the theme directory instead of using public folder
- Video thumbnails are now generated through the new VitePress-native plugin system
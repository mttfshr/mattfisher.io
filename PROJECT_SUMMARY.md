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

**Working on:** Completed Cleanup after VitePress-native data migration
**Status:** Completed
**Achievements:**
- Deleted obsolete _scripts directory 
- Removed unused data files and plugins
- Updated README.md with new build instructions
- Verified build process works with VitePress-native approach

## Next Steps

### 1. Consider Additional Optimizations
- Explore lazy-loading for large image galleries
- Add SSR optimizations for better performance
- Consider implementing content search feature using VitePress's built-in search
- Explore ways to minimize plugin duplication (videoThumbnails plugin runs twice)

## Session Notes

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

## VitePress Architecture Recommendations

The following recommendations have been added to help further enhance the architecture of the VitePress site:

### 1. Hooks & Composables Organization

**Recommendation: Centralize Composable Logic**

Create a standardized structure for composables to maintain consistency:

```
docs/.vitepress/theme/composables/
├── useWorkbookData.js    // Access workbook data with filtering, sorting, etc.
├── useNotesData.js       // Access notes data with search, filtering
├── usePinsData.js        // Access pins data
├── useLogData.js         // Access log data
└── index.js              // Export all composables
```

Each composable should:
- Use VitePress's `useData()` hook
- Provide computed values for filtered/sorted data
- Export utility functions for component use
- Support SSR (Server-Side Rendering)

### 2. Plugin Structure Enhancement

**Recommendation: Create a Unified Plugin System**

A more structured approach to plugins would be:

```
docs/.vitepress/plugins/
├── index.js                 // Main export of all plugins
├── videoThumbnails/         // Video thumbnails plugin
├── enhancedOgExtraction/    // OG data extraction
└── enhancedMetadataExtractor/ // Metadata extraction
```

Then in your config.mts:

```js
import { plugins } from './plugins'

export default defineConfig({
  // ...other config
  vite: {
    plugins: plugins()
  }
})
```

This approach allows for better plugin management.

### 3. Component Architecture

**Recommendation: Component Composition Pattern**

For complex components like `WorkbookGallery`, consider decomposing them:

```
components/workbook/
├── WorkbookGallery.vue        // Container component
├── WorkbookFilters.vue        // Filter controls
├── WorkbookGrid.vue           // Grid layout
└── WorkbookCard.vue           // Individual item card
```

Benefits:
- Easier testing and maintenance
- Better reusability (e.g., `WorkbookCard` could be used elsewhere)
- Clearer separation of concerns

### 4. Data Flow Architecture

**Recommendation: Unified Data Access Pattern**

Consider standardizing how components access data:

1. **Top-level component**: Fetch data using composables
2. **Child components**: Receive data via props
3. **Global state**: Use provide/inject for truly global state

This pattern ensures:
- Clear data flow through your application
- Components that are easier to test
- Better performance (computed refs are shared)

### 5. Build Performance Optimization

**Recommendation: Smart Caching Strategy**

For your VitePress site:

1. Implement intelligent caching for expensive operations:
   - OG data fetching (already implemented)
   - Thumbnail generation
   - External API calls

2. Consider using a persistent cache that survives between builds for further performance improvements

### 6. Documentation Strategy

**Recommendation: Component Documentation**

Consider adding a documentation section for your custom components:

```md
# Component Documentation

## WorkbookGallery

The WorkbookGallery component displays a grid of workbook items with filtering capabilities.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| items | Array | Yes | Array of workbook items |
```

This documentation will be valuable as your site grows more complex.

### 7. Progressive Enhancement Approach

**Recommendation: Core HTML + CSS Enhancement Strategy**

Structure your components with progressive enhancement in mind:

1. Start with semantic HTML that works without JavaScript
2. Add CSS for styling
3. Enhance with Vue behaviors

This ensures your site remains accessible and functional even if JavaScript fails to load.

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

1. Completing final cleanup after transitioning to VitePress-native data handling
2. Removing obsolete scripts and data files
3. Updating documentation to reflect the new architecture
4. Simplifying build process

## Implementation Notes

- The site now uses VitePress's native data handling for all content types
- All data is accessed through the useData() composable and themeConfig
- Media embedding is handled automatically based on frontmatter configuration
- Vue components have been updated to use the new data flow
- OG data is cached to improve performance and reduce API calls
- Media assets are organized in `_media/` directory for easy reference in content
- CSS and other assets are contained in the theme directory instead of using public folder
- Video thumbnails are now generated through the new VitePress-native plugin system
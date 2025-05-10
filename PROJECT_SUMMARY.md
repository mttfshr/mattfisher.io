# MattFisher.io Project Summary

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

## Technical Implementation

### For Low-Friction Content
- Keep extraction scripts focused on simplicity
- Use `enhancedOgExtraction.js` for rich metadata from simple URLs
- Maintain current approaches in `generatePinsData.js` and `generateLogEntries.js`
- Hashtags become the primary tagging mechanism

### For Rich Content
- Use full frontmatter capabilities with nested objects
- Pass complex structures directly through to components
- Handle transformations in component code, not data generation
- Support iterative content refinement

## Component Design Guidelines

### Collection Components
- Consistent filtering/sorting patterns across sections
- Shared utility functions where appropriate
- Common approach to tag filtering

### Item Display Components
- Transform data in components using computed properties
- Support both simple and complex data structures
- Keep display logic separate from data generation

## Data Flow

1. **Content Creation**: Match format to content type (simple/rich)
2. **Processing**: Extract or preserve structure based on content type
3. **Storage**: Consistent JSON structure in data files
4. **Rendering**: Components handle transformations as needed

## Future Enhancements

- **Search Implementation**: Add site-wide search using VitePress's built-in search or a custom solution
- **Performance Optimization**: Implement lazy loading for media and optimize data loading
- **Responsive Improvements**: Enhance mobile experience across all sections
- **Content Categories**: Add more sophisticated categorization and filtering
- **Dark/Light Mode**: Implement theme switching with persistent preferences
- **Analytics Integration**: Add privacy-focused analytics to track content engagement

## Data Flow Patterns

### Content Generation
1. **Content Creation**: Author writes Markdown with frontmatter in content directories
2. **Data Generation**: Node.js scripts transform Markdown into structured JSON
3. **Data Storage**: JSON stored in `.vitepress/data/` directory

### Content Rendering
1. **Data Import**: Vue components import JSON data (client-side)
2. **State Management**: Data stored in reactive state (ref/computed)
3. **UI Rendering**: Components render UI based on reactive state
4. **Interaction Handling**: Components handle user interactions (filtering, sorting, etc.)

### Media Handling
1. **Media References**: Content references media via frontmatter
2. **Path Resolution**: Components resolve media paths relative to `_media/` directory
3. **Media Embedding**: Components embed media appropriately based on type

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
│   ├── data/                # Generated JSON data
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
createdAt: YYYY-MM-DD
lastModified: YYYY-MM-DD
tags: [tag1, tag2]
image: /_media/image.jpg
layout: note
---
```

### Pins
Simple markdown list in `pins.md` with links and optional notes, processed to extract rich metadata.

### Log
Combination of pins and updates, displayed in chronological order.

## Status & Recent Updates

- The basic structure is in place for content generation
- Components have been organized by section for better maintainability
- Consistent naming conventions have been implemented
- Enhanced frontmatter is being used to simplify content management
- Content conversion and media handling are working

## Current Focus

1. Ensuring robust content generation pipeline
2. Improving Vue components for different content types
3. Optimizing site performance and organization

## Implementation Notes

- The site uses enhanced frontmatter to simplify content creation
- Media embedding is handled automatically based on frontmatter configuration
- Vue components are leveraged for consistent layout and styling
- Auto-generated data files reduce manual maintenance
- OG data is cached to improve performance and reduce API calls
- Media assets are organized in `_media/` directory for easy reference in content
- CSS and other assets are contained in the theme directory instead of using public folder
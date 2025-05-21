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

**Working on:** Media Storage Strategy Implementation
**Status:** Planning Phase
**Progress:**
- ✅ Analyzed current media handling approach
- ✅ Evaluated options for image and video storage
- ✅ Decided on Cloudflare Images for all static media
- ✅ Keeping Vimeo for video hosting
- ✅ Designed unified workflow for NAS-to-web publishing
- ✅ Created plan for video thumbnail automation

**Implementation Details:**
- Will use Cloudflare Images for all site images and video thumbnails
- Continuing to use Vimeo for video hosting with embeds
- Creating automation scripts for image uploading from NAS
- Implementing hybrid workflow for Obsidian-to-VitePress content creation
- Planning automatic thumbnail generation from Vimeo/YouTube videos

## Next Steps

### 1. Implement Media Storage Strategy
- Create Cloudflare Images account and configure API access
- Implement image upload utility for NAS to Cloudflare
- Create markdown processor to update local links to Cloudflare URLs
- Implement video thumbnail automation for Vimeo/YouTube embeds
- Update components to use Cloudflare Image URLs

### 2. Enhance Workbook & Collections Integration
- Add FeaturedCollectionsPreview component to the Items tab
- Implement localStorage-based tab state persistence
- Add transition effects between tabs using CSS animations
- Enhance collection filtering with more dynamic options
- Build a recommendation system for related collections

### 3. Improve Relationship Handling
- Implement enhanced related works functionality
- Create clearer relationship visualization
- Enable browsing by relationships between works

### 4. Enhance Workbook Components
- Update WorkbookViewer.vue to display structured tags
- Create new filtering components for tags and collections
- Improve visualization of work status and relationships

### 5. Maintain Project Documentation
- Create documentation for new metadata schema
- Update examples for workbook items with new frontmatter
- Document collections system for future reference
- Use new session archiving system for PROJECT_SUMMARY

## Session Notes

**Note**: Only the 5 most recent sessions are kept here. Older sessions are archived in `docs/log/entries.md`.

### May 20, 2025 - Session 40 Summary
- Enhanced log display with more accessible formatting and improved organization
- Separated log entries into two files:
  - entries.md: Regular updates in log format
  - sessions.md: Development session notes written by Claude
- Removed LogPin component as pins now have their own dedicated section
- Removed time display from log entries which showed incorrect 5:00am timestamps
- Created dedicated LogSession component to better style development session notes
- Added "Notes by Claude" indicator for session entries
- Added title display for entries to show text after colon in the first line
- Implemented deep linking capability to individual log entries via anchor links
- Added filtering system to show only updates, only sessions, or all entries
- Created type filters that can be combined with existing tag filters
- Added entry statistics (total entries, updates, sessions) to log page
- Improved mobile responsiveness of filter sections

### May 18, 2025 - Session 39 Summary
- Strategized media storage approach for the website
- Decided on Cloudflare Images for static images and video thumbnails
- Continuing with Vimeo for video hosting due to its social features and bandwidth advantages
- Designed hybrid workflow for Obsidian/NAS to web publishing:
  - Create content in Obsidian with local NAS image links
  - Process markdown files to upload images to Cloudflare when ready to publish
  - Automatically update links in markdown from local to Cloudflare URLs
- Developed plan for automating video thumbnail generation:
  - Extract video IDs from Vimeo/YouTube URLs
  - Fetch thumbnails from respective video platforms
  - Upload to Cloudflare Images
  - Create catalog for easy reference
- Planned to create scripts and utilities:
  - Markdown processor for handling image replacements
  - Image upload utility for NAS to Cloudflare
  - Video thumbnail automation
  - Vue components for consistent media display
- Emphasized maintaining a streamlined workflow between local content creation and web publishing

### May 18, 2025 - Session 38 Summary
- Integrated collections within the workbook section rather than as a separate top-level navigation item
- Created tab-based interface in the workbook section for navigating between "All Items" and "Collections"
- Implemented a full-width layout for workbook pages to better display visual content
- Created a dedicated WorkbookPage component to handle the tabbed interface
- Added URL fragment navigation for direct linking to tabs (#collections)
- Implemented breadcrumb navigation in collection pages for better orientation
- Added automatic collection file copying to ensure proper migration from old to new structure
- Fixed layout and rendering issues with Vue components
- Updated PROJECT_PATHS with ideas for future enhancements to the collections system
- Added new task section in PROJECT_SUMMARY for Workbook & Collections Integration enhancements

### May 18, 2025 - Session 37 Summary
- Designed comprehensive tag-driven collections system:
  - Created structured tag parsing with key:value format (type:video, tech:video-synth, etc.)
  - Developed automatic collection membership based on tag queries
  - Implemented grouping within collections (by project, type, medium, etc.)
  - Designed visualization for tag relationships and connections
- Created collection components:
  - StructuredTagsDisplay.vue for organized tag presentation
  - TagFilter.vue for advanced workbook filtering
  - CollectionsGallery.vue for browsing collections
  - TagVisualization.vue for tag relationship visualization
- Updated WorkbookViewer to incorporate structured tags
- Reimagined collections approach to focus on dynamic organization:
  - Collections defined by tag queries rather than manual item lists
  - Automatic grouping of items within collections
  - Visual relationship mapping between tags and collections
  - Enhanced discovery through detailed metadata
- Created implementation plan with component structure and data flow
- Created example collection definitions using tag queries
- Updated workbook items with structured tags in key:value format

### May 17, 2025 - Session 36 Summary
- Fixed issue with year metadata in workbook items:
  - Added the year property to getWorkbookItems function in config.mts
  - Updated WorkbookViewer component to display year metadata
  - Fixed infinite loop issue in WorkbookViewer by removing Content component
- Designed enhanced metadata system for workbook items:
  - Created structured tagging system with key:value pairs
  - Designed flexible schema for categorizing work by status
  - Created approach for organizing works into collections
- Developed collections system:
  - Designed separate collections markdown files approach
  - Created template for collection metadata and item relationships
  - Planned implementation of CollectionLayout component
  - Designed clean integration with existing workbook item structure
- Developed relationship visualization:
  - Designed system to represent different types of relationships
  - Created approach for bidirectional relationships between works
  - Planned UI for navigating related works
- Used software-specific metadata for video synth works:
  - Added Max/MSP and Vsynth tags for accurate process documentation
  - Revised technical details to match actual workflow
  - Created consistent terminology for digital video synthesis techniques

### May 17, 2025 - Session 35 Summary
- Renamed "Immersive Mode" to "Presentation Mode" for better user experience
  - Addressed potential confusion between immersive mode and Vimeo's fullscreen
  - Created more distinctive visual language for the feature
  - Positioned the button in top-left to avoid conflict with player controls
  - Updated all related components and documentation
- Implemented better component architecture
  - Created dedicated MediaContainer.vue component
  - Renamed ImmersiveViewer.vue to PresentationViewer.vue
  - Improved loading and error states for media content
  - Enhanced responsive design for mobile devices
- Added video playback enhancements
  - Implemented progress bar/scrubber with seeking functionality
  - Added time display showing current position and duration
  - Fixed volume slider functionality with embedded videos
  - Added volume initialization for Vimeo players
  - Enhanced volume control slider with improved visuals
  - Fixed default muted state issue with Vimeo videos
  - Fixed reference errors by properly accessing props
- Added casting to TV capability for Vimeo videos
  - Implemented Chromecast integration using Vimeo's API
  - Added postMessage fallbacks for when direct API isn't available
  - Created visual indicators for casting status
  - Added automatic detection of casting availability
- Simplified frontmatter schema for better usability
  - Changed "immersive" parameter to "enabled"
  - Made "blurred" the default background mode
  - Created minimal configuration option with sensible defaults
  - Added example with minimal frontmatter configuration
  - Updated documentation to explain default values
- Created comprehensive documentation in PRESENTATION_MODE_GUIDE.md
  - Updated instructions and screenshots
  - Clarified differences from native player controls
  - Documented keyboard shortcuts and URL parameters